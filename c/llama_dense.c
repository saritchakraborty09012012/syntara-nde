/* Llama dense (non-MoE) C engine: GQA + RoPE + SwiGLU, CPU-only.
 *
 * This is the ninth engine in the suite and the first pure-dense one since the
 * suite specialised into MoE and hybrid architectures: every layer is a
 * conventional key/value attention block over grouped-query heads plus a
 * gated MLP, which is the layout HF's LlamaForCausalLM (and every checkpoint
 * whose config.json says model_type "llama") ships. It exists so Syntara can
 * run the most common open-weight architecture end-to-end without a Python
 * runtime, and so the family-registry / gateway / planner pipeline has a dense
 * reference next to the MoE ones.
 *
 * Faithfulness over speed. The math mirrors HF transformers' LlamaModel
 * exactly, in float32, with no quantization and no fused kernels:
 *   - RoPE is the half-split rotation (rotate_half), not the interleaved
 *     variant: pair (j, j + head_dim/2) rotated by theta^(-2j/head_dim) at
 *     absolute position pos. This is what c/olmoe.c:822 rope_head already
 *     implements and what the tiny numpy oracle recomputes.
 *   - Attention is grouped-query: num_attention_heads query heads share
 *     num_key_value_heads key/value heads, group = H / HKV, exactly as HF's
 *     repeat_kv does (each kv head is repeated group times before the score).
 *   - q_norm / k_norm (Llama-3 style) are per-head RMS norms over head_dim,
 *     applied to q and k BEFORE RoPE, and are OPTIONAL: a Llama-2 checkpoint
 *     has no such tensors and must load.
 *   - The MLP is SwiGLU: down(silu(gate(x)) * up(x)), with no biases.
 *   - There is no qk-norm by default, no attention Softmax capping, no
 *     sliding window, no MTP head.
 *
 * The attention score buffer is malloc'd per row to the real context length
 * (no fixed 4096 cap like olmoe.c's sc[4096]): CTX can be up to the
 * checkpoint's max_position_embeddings and the buffer follows it.
 *
 * Wire protocol (SERVE=1) is byte-identical to olmoe.c / syntara.c: READY
 * sentinel + STAT, then SUBMIT/CANCEL on stdin, DATA/DONE/PROF on stdout,
 * HWINFO after READY for the dashboard. The gateway (openai_server.py)
 * drives this engine through render_chat_llama's Llama-3 chat template.
 *
 * ENV VARS:
 *   SNAP=<dir>   model directory (config.json + *.safetensors + tokenizer.json)
 *   SERVE=1      openai_server.py protocol over stdin/stdout
 *   CTX=<n>      context cap in tokens (default: the checkpoint's
 *                max_position_embeddings, clamped to 1..max_pos)
 *   CHAT=1       interactive REPL (Llama-3 chat template, tok.h tokenizer)
 *   SYNTARA_TEMP / TEMP / NUCLEUS   sampling overrides for CHAT mode
 *
 * REF harness (the default when neither SERVE nor CHAT is set):
 *   argv[1] = path to a ref.json {"ids": [...], "gen": n}. The engine prefills
 *   ids, prints the full prefill logits (REF_LOGITS, one line, %.9g per vocab
 *   entry), greedily generates n tokens (REF_GEN), and echoes the prompt ids
 *   (REF_IDS). c/tests/test_llama_dense_tiny.py compares all three against a
 *   float64 numpy oracle computed by tools/make_llama_dense_tiny.py.
 */
#define _GNU_SOURCE
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <math.h>
#include <time.h>
#include <stdint.h>
#if defined(__APPLE__) || defined(__linux__) || defined(__FreeBSD__)
#include <sys/resource.h>
#include <unistd.h>
#endif
#include "cli_args.h"
#include "st.h"
#ifdef _OPENMP
#include <omp.h>
#endif
#include "omp_tune.h"
#include "serve_codec.h"

/* ---------- config ---------- */
typedef struct {
    int hidden, n_layers, n_heads, n_kv_heads, head_dim;
    int inter, vocab;
    float theta, eps;
    int max_pos;
    int tie;            /* tie_word_embeddings: lm_head IS the embedding */
    int stop_ids[8], n_stop;   /* unused (no model-specific hardcoded stops); the
                                * stop set comes from the tokenizer's special
                                * flags via sample.h's stops_arm_tok */
} Cfg;

/* ---------- dense weights per-layer ---------- */
typedef struct {
    float *in_ln, *post_ln, *q, *k, *v, *o;
    float *qn, *kn;     /* optional per-head q/k norm (Llama-3); NULL if absent */
    float *gate, *up, *down;
} Layer;

typedef struct {
    Cfg c;
    shards S;
    float *embed, *lm_head, *final_norm;
    Layer *L;
    float **K, **V;     /* [n_layers][max_t * n_kv_heads * head_dim] */
    int kv_len, max_t;
    double dense_load_s;
} Model;

/* ---------- utility ---------- */
static double now_s(void) { struct timespec t; clock_gettime(CLOCK_MONOTONIC, &t); return t.tv_sec + t.tv_nsec*1e-9; }
#if defined(__APPLE__)
static double rss_gb(void) { struct rusage r; getrusage(RUSAGE_SELF, &r); return r.ru_maxrss / (1024.0*1024.0*1024.0); }  /* macOS: byte */
#else
static double rss_gb(void) { struct rusage r; getrusage(RUSAGE_SELF, &r); return r.ru_maxrss / (1024.0*1024.0); }        /* Linux: KB */
#endif
static float *falloc(int64_t n) { float *p = malloc(n*sizeof(float)); if(!p){fprintf(stderr,"OOM %ld\n",(long)n);exit(1);} return p; }

/* chat/serve sampling temperature + top-p, and the stop-set machinery.
 * g_temp<=0 -> greedy (sample.h's pick_tok). Declared before sample.h, which
 * references these by name along with Cfg and falloc above. */
static float g_temp = 0.7f;
static float g_nuc  = 0.95f;
#include "sample.h"

/* y[S,O] = x[S,I] @ W^T, W is [O,I] row-major. Same matmul olmoe.c:258 uses. */
static void matmul(float *y, const float *x, const float *W, int S, int I, int O) {
    #pragma omp parallel for schedule(static)
    for (int o = 0; o < O; o++) {
        const float *w = W + (int64_t)o * I;
        for (int s = 0; s < S; s++) {
            const float *xs = x + (int64_t)s * I;
            float acc = 0.f;
            #pragma omp simd reduction(+:acc)
            for (int i = 0; i < I; i++) acc += xs[i] * w[i];
            y[(int64_t)s * O + o] = acc;
        }
    }
}

/* RMS norm over a row of length D, in-place on out (out may == x). HF's
 * LlamaRMSNorm: x * rsqrt(mean(x^2) + eps) * weight. */
static void rmsnorm_row(float *out, const float *x, const float *w, int D, float eps) {
    double ms = 0; for (int i = 0; i < D; i++) ms += (double)x[i]*x[i];
    float r = 1.f / sqrtf((float)(ms / D) + eps);
    for (int i = 0; i < D; i++) out[i] = x[i] * r * w[i];
}

static void softmax_row(float *x, int n) {
    float m = -1e30f; for (int i = 0; i < n; i++) if (x[i] > m) m = x[i];
    float s = 0; for (int i = 0; i < n; i++) { x[i] = expf(x[i]-m); s += x[i]; }
    for (int i = 0; i < n; i++) x[i] /= s;
}

/* ---------- loading ---------- */
/* config.json arrives from an untrusted mirror: require each dimension present
 * and numeric (same contract as olmoe.c:402). */
static double req_num(jval *r, const char *k){
    jval *v=json_get(r,k);
    if(!v||v->t!=J_NUM){ fprintf(stderr,"config.json: missing or non-numeric \"%s\"\n",k); exit(1); }
    return v->num;
}
static void load_cfg(Cfg *c, const char *snap) {
    char path[2048]; snprintf(path, sizeof(path), "%s/config.json", snap);
    FILE *f = fopen(path, "rb"); if(!f){perror(path);exit(1);}
    fseek(f,0,SEEK_END); long n=ftell(f); fseek(f,0,SEEK_SET);
    if(n<0 || n>(256L<<20)){ fprintf(stderr,"%s: config.json missing or larger than 256 MB\n",path); exit(1); }
    char *buf = malloc((size_t)n+1); if(!buf){ fprintf(stderr,"OOM reading %s\n",path); exit(1); }
    if(fread(buf,1,(size_t)n,f)!=(size_t)n){ fprintf(stderr,"%s: short read\n",path); exit(1); } buf[n]=0; fclose(f);
    char *arena=NULL; jval *r = json_parse(buf, &arena);
    c->hidden    = (int)req_num(r,"hidden_size");
    c->n_layers  = (int)req_num(r,"num_hidden_layers");
    c->n_heads   = (int)req_num(r,"num_attention_heads");
    jval *nkv = json_get(r,"num_key_value_heads");
    /* GQA is optional in the config: a Llama-2 checkpoint omits it and every
     * head is its own kv head. Default to full MHA, matching HF. */
    c->n_kv_heads = (nkv && nkv->t==J_NUM) ? (int)nkv->num : c->n_heads;
    c->inter     = (int)req_num(r,"intermediate_size");
    c->vocab     = (int)req_num(r,"vocab_size");
    /* range-check so bad dims cannot drive a later malloc or a divide-by-zero */
    if(c->hidden<1||c->hidden>(1<<20) || c->n_heads<1||c->n_heads>(1<<16) ||
       c->inter<1||c->inter>(1<<24) || c->vocab<1||c->vocab>(1<<24) ||
       c->n_layers<1||c->n_layers>4096 ||
       c->n_kv_heads<1 || c->n_kv_heads>c->n_heads || c->n_heads % c->n_kv_heads != 0){
        fprintf(stderr,"config.json: dimension out of range\n"); exit(1); }
    jval *hd = json_get(r,"head_dim");
    c->head_dim = (hd && hd->t==J_NUM) ? (int)hd->num : c->hidden / c->n_heads;
    if(c->head_dim<1 || (hd && c->hidden != c->n_heads * c->head_dim && !hd)){
        fprintf(stderr,"config.json: hidden_size is not num_attention_heads * head_dim\n"); exit(1); }
    jval *th = json_get(r,"rope_theta");  c->theta = th ? (float)th->num : 10000.f;
    jval *ep = json_get(r,"rms_norm_eps"); c->eps   = ep ? (float)ep->num : 1e-5f;
    jval *mx = json_get(r,"max_position_embeddings");
    c->max_pos = (mx && mx->t==J_NUM && mx->num >= 1) ? (int)mx->num : 4096;
    jval *tie = json_get(r,"tie_word_embeddings");
    c->tie = (tie && tie->t==J_BOOL) ? tie->boolean : 0;
    free(buf); free(arena);
}

static float *load_t(Model *m, const char *name) {
    int64_t n = st_numel(&m->S, name);
    if (n < 0) { fprintf(stderr, "missing %s\n", name); exit(1); }
    float *p = falloc(n);
    st_read_f32(&m->S, name, p, 0);   /* dense: no DONTNEED, stays resident */
    return p;
}

static void model_init(Model *m, const char *snap) {
    memset(m, 0, sizeof(*m));
    load_cfg(&m->c, snap);
    st_init(&m->S, snap);
    Cfg *c = &m->c;
    double t0 = now_s();
    m->embed      = load_t(m, "model.embed_tokens.weight");
    m->final_norm = load_t(m, "model.norm.weight");
    if (c->tie) m->lm_head = m->embed;   /* tied embeddings share the buffer */
    else        m->lm_head = load_t(m, "lm_head.weight");
    m->L = calloc(c->n_layers, sizeof(Layer));
    char nm[256];
    for (int i = 0; i < c->n_layers; i++) {
        Layer *l = &m->L[i];
        #define LD(field, suffix) snprintf(nm,sizeof(nm),"model.layers.%d." suffix,i); l->field = load_t(m,nm)
        LD(in_ln,  "input_layernorm.weight");
        LD(post_ln,"post_attention_layernorm.weight");
        LD(q, "self_attn.q_proj.weight"); LD(k, "self_attn.k_proj.weight");
        LD(v, "self_attn.v_proj.weight"); LD(o, "self_attn.o_proj.weight");
        LD(gate, "mlp.gate_proj.weight");
        LD(up,   "mlp.up_proj.weight");
        LD(down, "mlp.down_proj.weight");
        #undef LD
        /* optional Llama-3 q/k norm: load only if the checkpoint has it, so a
         * Llama-2 container (no such tensors) loads unchanged */
        snprintf(nm,sizeof(nm),"model.layers.%d.self_attn.q_norm.weight",i);
        if (st_has(&m->S, nm)) l->qn = load_t(m, nm);
        snprintf(nm,sizeof(nm),"model.layers.%d.self_attn.k_norm.weight",i);
        if (st_has(&m->S, nm)) l->kn = load_t(m, nm);
    }
    m->dense_load_s = now_s() - t0;
}

/* ---------- RoPE, attention, MLP, forward ---------- */
/* Half-split RoPE on one head vector of length head_dim at absolute position
 * pos: pair (j, j + head_dim/2) rotated by theta^(-2j/head_dim). This is HF's
 * rotate_half + inv_freq, and c/olmoe.c:822's rope_head, verbatim. */
static void rope_head(float *x, int pos, const Cfg *c) {
    int h = c->head_dim / 2;
    for (int j = 0; j < h; j++) {
        float inv = powf(c->theta, -2.0f * j / c->head_dim);
        float ang = pos * inv, cs = cosf(ang), sn = sinf(ang);
        float a = x[j], b = x[j+h];
        x[j]   = a*cs - b*sn;
        x[j+h] = b*cs + a*sn;
    }
}

/* Grouped-query attention over S new tokens x[S,hidden]; pos_base is the
 * absolute position of the first new token. K/V rows are written into the
 * per-layer cache at those positions; scores are causal (t <= qpos). */
static void attention(Model *m, Layer *l, int layer, float *x, int S, int pos_base, float *out) {
    Cfg *c = &m->c;
    int H = c->n_heads, HKV = c->n_kv_heads, hd = c->head_dim, D = c->hidden;
    int G = H / HKV;                 /* query heads per kv head */
    int KVD = HKV * hd;              /* width of one token's k (or v) row */
    float *q  = falloc((int64_t)S * H * hd);
    float *k  = falloc((int64_t)S * KVD);
    float *vv = falloc((int64_t)S * KVD);
    matmul(q,  x, l->q, S, D, H * hd);
    matmul(k,  x, l->k, S, D, KVD);
    matmul(vv, x, l->v, S, D, KVD);
    /* optional per-head q/k norm (Llama-3) on the head_dim slice, BEFORE RoPE,
     * matching HF LlamaAttention: q_norm/k_norm are LlamaRMSNorm(head_dim) */
    for (int s = 0; s < S; s++) {
        int pos = pos_base + s;
        for (int hh = 0; hh < H; hh++) {
            float *qh = q + (int64_t)s * H * hd + hh * hd;
            if (l->qn) rmsnorm_row(qh, qh, l->qn, hd, c->eps);
            rope_head(qh, pos, c);
        }
        for (int kvh = 0; kvh < HKV; kvh++) {
            float *kh = k  + (int64_t)s * KVD + kvh * hd;
            float *vh = vv + (int64_t)s * KVD + kvh * hd;
            if (l->kn) rmsnorm_row(kh, kh, l->kn, hd, c->eps);
            rope_head(kh, pos, c);
            /* cache layout [max_t][HKV][hd]: row t is HKV*hd contiguous */
            memcpy(m->K[layer] + ((int64_t)pos * HKV + kvh) * hd, kh, hd*sizeof(float));
            memcpy(m->V[layer] + ((int64_t)pos * HKV + kvh) * hd, vh, hd*sizeof(float));
        }
    }
    float scale = 1.f / sqrtf((float)hd);
    float *ctx = falloc((int64_t)S * H * hd);
    #pragma omp parallel for collapse(2) schedule(static)
    for (int hh = 0; hh < H; hh++) {
        for (int s = 0; s < S; s++) {
            int qpos = pos_base + s;
            int kvh = hh / G;
            const float *qv = q + (int64_t)s * H * hd + hh * hd;
            /* score buffer sized to the REAL context, not a fixed 4096 cap:
             * CTX can reach the checkpoint's max_position_embeddings */
            float *sc = malloc((size_t)(qpos+1) * sizeof(float));
            if (!sc) { fprintf(stderr,"OOM attention scores\n"); exit(1); }
            for (int t = 0; t <= qpos; t++) {          /* causal: t <= qpos */
                const float *kv = m->K[layer] + ((int64_t)t * HKV + kvh) * hd;
                float acc = 0; for (int dd = 0; dd < hd; dd++) acc += qv[dd]*kv[dd];
                sc[t] = acc * scale;
            }
            softmax_row(sc, qpos+1);
            float *cx = ctx + (int64_t)s * H * hd + hh * hd;
            for (int dd = 0; dd < hd; dd++) cx[dd] = 0;
            for (int t = 0; t <= qpos; t++) {
                const float *vrow = m->V[layer] + ((int64_t)t * HKV + kvh) * hd;
                float a = sc[t];
                for (int dd = 0; dd < hd; dd++) cx[dd] += a * vrow[dd];
            }
            free(sc);
        }
    }
    matmul(out, ctx, l->o, S, H * hd, D);
    free(q); free(k); free(vv); free(ctx);
}

/* SwiGLU MLP over x[S,hidden]: down(silu(gate(x)) * up(x)). No biases, the
 * dense counterpart of olmoe.c:moe's expert block. */
static void mlp(Model *m, Layer *l, float *x, int S, float *out) {
    (void)m;
    Cfg *c = &m->c; int D = c->hidden, I = c->inter;
    float *g = falloc((int64_t)S*I), *u = falloc((int64_t)S*I);
    matmul(g, x, l->gate, S, D, I);
    matmul(u, x, l->up,   S, D, I);
    for (int64_t j = 0; j < (int64_t)S*I; j++) {
        float gv = g[j];
        g[j] = (gv / (1.f + expf(-gv))) * u[j];   /* silu(gate) * up */
    }
    matmul(out, g, l->down, S, I, D);
    free(g); free(u);
}

/* one forward over all layers; x[S,hidden] updated in place */
static void layers_forward(Model *m, float *x, int S, int pos_base) {
    Cfg *c = &m->c; int D = c->hidden;
    float *nrm = falloc((int64_t)S*D), *tmp = falloc((int64_t)S*D);
    for (int i = 0; i < c->n_layers; i++) {
        Layer *l = &m->L[i];
        for (int s = 0; s < S; s++) rmsnorm_row(nrm + (int64_t)s*D, x + (int64_t)s*D, l->in_ln, D, c->eps);
        attention(m, l, i, nrm, S, pos_base, tmp);
        for (int64_t j = 0; j < (int64_t)S*D; j++) x[j] += tmp[j];
        for (int s = 0; s < S; s++) rmsnorm_row(nrm + (int64_t)s*D, x + (int64_t)s*D, l->post_ln, D, c->eps);
        mlp(m, l, nrm, S, tmp);
        for (int64_t j = 0; j < (int64_t)S*D; j++) x[j] += tmp[j];
    }
    free(nrm); free(tmp);
}

/* embed ids, run the trunk, return the LAST position's logits (vocab,).
 * The KV cache rows for these tokens are written by attention() as a side
 * effect, so this is both prefill (S>1) and decode (S==1). */
static float *step(Model *m, const int *ids, int S, int pos_base) {
    Cfg *c = &m->c; int D = c->hidden;
    float *x = falloc((int64_t)S*D);
    for (int s = 0; s < S; s++) memcpy(x + (int64_t)s*D, m->embed + (int64_t)ids[s]*D, D*sizeof(float));
    layers_forward(m, x, S, pos_base);
    m->kv_len = pos_base + S;
    float *last = falloc(D);
    rmsnorm_row(last, x + (int64_t)(S-1)*D, m->final_norm, D, c->eps);
    float *logit = falloc(c->vocab);
    matmul(logit, last, m->lm_head, 1, D, c->vocab);
    free(x); free(last);
    return logit;
}

/* allocate the per-layer KV cache for a context of max_t tokens */
static void kv_alloc(Model *m, int max_t) {
    Cfg *c = &m->c;
    m->max_t = max_t;
    m->K = calloc(c->n_layers, sizeof(float*));
    m->V = calloc(c->n_layers, sizeof(float*));
    int64_t per = (int64_t)max_t * c->n_kv_heads * c->head_dim;
    for (int i = 0; i < c->n_layers; i++) {
        m->K[i] = falloc(per);
        m->V[i] = falloc(per);
    }
}

/* greedy generate n_new tokens after prefilling prompt[0..np). out[np..] is
 * filled with the generated ids. prefill_logit (caller-allocated, vocab
 * floats) receives the prefill's logits so the REF harness can print them. */
static void generate(Model *m, const int *prompt, int np, int n_new, int *out,
                     float *prefill_logit) {
    Cfg *c = &m->c;
    kv_alloc(m, np + n_new);
    for (int i = 0; i < np; i++) out[i] = prompt[i];
    float *logit = step(m, prompt, np, 0);          /* PREFILL */
    memcpy(prefill_logit, logit, (size_t)c->vocab * sizeof(float));
    int len = np;
    for (int s = 0; s < n_new; s++) {
        int best = argmax_v(logit, c->vocab);
        free(logit);
        out[len++] = best;
        if (s == n_new - 1) break;
        logit = step(m, &best, 1, len - 1);         /* DECODE */
    }
}

/* ---------- serve mode: openai_server.py engine protocol ----------
 * stdin:  SUBMIT <id> <slot> <len> <max_tokens> <temp> <top_p>\n<payload>\n
 *         CANCEL <id>\n
 * stdout: READY sentinel once loaded, then per request a stream of
 *         DATA <id> <size>\n<bytes>\n frames and a final
 *         DONE <id> STAT <tok> <tps> <hit%> <rss> <prompt_tok> <len_limited>\n
 * v1 scope, same as olmoe.c's first serve mode: one request in flight, full
 * re-prefill every turn, no cross-request KV reuse. The payload arrives
 * already rendered by openai_server.py's render_chat_llama. */
typedef struct { char id[64]; int max_tok; float temp, top_p; char *payload; int plen;
                 int logprobs; } SReq;

#define SRV_QMAX 16
static SReq g_q[SRV_QMAX]; static int g_qn = 0;
static const SyntaraServeWireProfile llama_wire = {
    .max_header_bytes = 511,
    .max_payload_bytes = 1u << 22,
    .max_tokens = 1 << 20,
    .require_exact_lf = 1,
    .require_finite_sampling = 0,
};

/* read one control line (+ payload for SUBMIT). cur_id: request in flight;
 * returns 1 if that request was cancelled, 0 otherwise, -1 on input EOF. */
static int serve_read_cmd(FILE *in, FILE *out, const char *cur_id) {
    SyntaraServeCommand command;
    SyntaraServeReadResult result = syntara_serve_read_command(in, &llama_wire, &command);
    if (result == SYNTARA_SERVE_READ_EOF || result == SYNTARA_SERVE_READ_BAD_FRAME) return -1;
    if (result == SYNTARA_SERVE_READ_NOMEM) {
        syntara_serve_write_error(out, command.id, "out of memory");
        return -1;
    }
    if (result == SYNTARA_SERVE_READ_BAD_REQUEST &&
        command.kind == SYNTARA_SERVE_COMMAND_SUBMIT) {
        syntara_serve_write_error(out, command.id, "bad submit header");
        return -1;
    }
    if (result != SYNTARA_SERVE_READ_OK) return 0;
    if (command.kind == SYNTARA_SERVE_COMMAND_CANCEL) {
        int cancelled = cur_id && !strcmp(command.id, cur_id);
        syntara_serve_command_dispose(&command);
        return cancelled;
    }
    if (command.kind == SYNTARA_SERVE_COMMAND_SUBMIT) {
        if (g_qn < SRV_QMAX) {
            SReq *q = &g_q[g_qn++];
            snprintf(q->id, sizeof(q->id), "%s", command.id);
            q->max_tok = command.max_tokens;
            q->logprobs = command.logprobs;
            q->temp = command.temperature;
            q->top_p = command.top_p;
            q->payload = (char *)syntara_serve_command_take_payload(&command);
            q->plen = (int)command.payload_bytes;
        } else {
            syntara_serve_write_error(out, command.id, "queue full");
        }
    }
    syntara_serve_command_dispose(&command);
    return 0;
}

static int serve_one(Model *m, Tok *T, SReq *q, int ctx_cap) {
    Cfg *c = &m->c;
    int cap = q->plen + 16;
    int *ids = malloc((size_t)cap * sizeof(int));
    int np = tok_encode(T, q->payload, q->plen, ids, cap);
    if (np <= 0) { syntara_serve_write_error(stdout, q->id, "empty prompt"); free(ids); return 0; }
    if (np + q->max_tok > ctx_cap) {
        char message[128];
        /* the frame the gateway turns into a 400 context_length_exceeded */
        snprintf(message, sizeof(message),
                 "CONTEXT_EXCEEDED prompt_tokens=%d requested=%d capacity=%d",
                 np, q->max_tok, ctx_cap);
        syntara_serve_write_error(stdout, q->id, message); free(ids); return 0;
    }
    g_temp = q->temp; g_nuc = q->top_p;
    double t0 = now_s();
    float *logit = step(m, ids, np, 0);   /* full re-prefill at pos 0 */
    int hist_len = np, gen = 0, limited = 1, cancelled = 0;
    char buf[512];
    for (int s = 0; s < q->max_tok && !cancelled; s++) {
        int nt = pick_tok(logit, c->vocab, -1);
        char lptail[1024]; lptail[0] = 0;
        if (q->logprobs > 0) syntara_logprob_tail(lptail, sizeof lptail, logit, c->vocab, nt, q->logprobs);
        free(logit); logit = NULL;
        if (is_stop(nt)) { limited = 0; break; }
        int nb = tok_decode(T, &nt, 1, buf, sizeof(buf)-1);
        if (q->logprobs > 0) syntara_serve_write_data_lp(stdout, q->id, buf, (size_t)nb, lptail);
        else syntara_serve_write_data(stdout, q->id, buf, (size_t)nb);
        gen++; hist_len++;
        while (syntara_stdin_readable()) {
            int r = serve_read_cmd(stdin, stdout, q->id);
            if (r < 0) { free(ids); return -1; }
            if (r > 0) { cancelled = 1; limited = 0; }
        }
        if (cancelled || s == q->max_tok - 1 || hist_len >= ctx_cap) break;
        logit = step(m, &nt, 1, hist_len - 1);
    }
    free(logit);
    double dt = now_s() - t0;
    SyntaraServeDone done = {
        .completion_tokens = gen,
        .tokens_per_second = dt > 0 ? gen/dt : 0.0,
        .cache_hit_percent = 0.0,          /* dense engine: no expert cache */
        .rss_gb = rss_gb(),
        .prompt_tokens = np,
        .length_limited = limited,
    };
    syntara_serve_write_done(stdout, q->id, &done);
    /* PROF: per-turn phase timings, field order the protocol's: disk, wait,
     * matmul, attention, lm_head, forwards. This engine has no disk phase and
     * no separate wait phase; matmul is the whole non-attention forward. */
    printf("PROF %.6f %d %d 0.0 0.0 0.0 0.0 0.0 %d\n", dt, np, gen, gen);
    fflush(stdout);
    free(ids);
    return 0;
}

/* dashboard HWINFO: same line the other serve-capable engines emit. This
 * engine is CPU-only, so the GPU fields are always 0. */
static void serve_hwinfo(void) {
    char cpu[256] = ""; int cores = 0; double rt = 0, ra = 0;
    FILE *ci = fopen("/proc/cpuinfo", "r");
    if (ci) { char ln[256];
        while (fgets(ln, sizeof(ln), ci)) if (!strncmp(ln, "model name", 10)) {
            char *p = strchr(ln, ':'); if (p) { p++; while (*p == ' ') p++;
            int n = (int)strlen(p); if (n > 0 && p[n-1] == '\n') p[--n] = 0;
            snprintf(cpu, sizeof(cpu), "%s", p); } break; }
        fclose(ci); }
#ifdef _SC_NPROCESSORS_ONLN
    cores = (int)sysconf(_SC_NPROCESSORS_ONLN);
#endif
    FILE *mi = fopen("/proc/meminfo", "r");
    if (mi) { char ln[256]; double v = 0;
        while (fgets(ln, sizeof(ln), mi)) {
            if (sscanf(ln, "MemTotal: %lf", &v) == 1) rt = v/1e6;
            if (sscanf(ln, "MemAvailable: %lf", &v) == 1) ra = v/1e6;
        } fclose(mi); }
    if (ra <= 0.0) ra = compat_mem_available_gb();   /* macOS, Windows: no /proc */
#ifdef _WIN32
    if (rt <= 0.0) { double a2 = 0.0; compat_meminfo(&rt, &a2); }
#elif defined(_SC_PHYS_PAGES) && defined(_SC_PAGESIZE)
    if (rt <= 0.0) { long pg = sysconf(_SC_PHYS_PAGES), ps = sysconf(_SC_PAGESIZE); if (pg > 0 && ps > 0) rt = (double)pg * ps / 1e9; }
#endif
    printf("HWINFO %d %.1f %.1f 0 0.0 %s|\n", cores, rt, ra, cpu[0] ? cpu : "unknown");
    fflush(stdout);
}

static void serve_loop(Model *m, Tok *T, int ctx_cap) {
    syntara_serve_stdio_init();
    /* Llama-3's end-of-text marker. In batched gateway mode (SERVE_BATCH=1)
     * stops_arm_tok keeps ONLY this token as an engine-side stop; the
     * gateway's StopFilter owns the <|eot_id|> turn boundary. */
    int tok_eos = tok_id_of(T, "<|end_of_text|>");
    stops_arm_tok(&m->c, tok_eos, T);
    syntara_serve_write_ready(stdout, rss_gb());
    serve_hwinfo();
    for (;;) {
        while (!g_qn) if (serve_read_cmd(stdin, stdout, NULL) < 0) return;
        SReq q = g_q[0];
        memmove(g_q, g_q + 1, (size_t)(--g_qn) * sizeof(SReq));
        int fatal = serve_one(m, T, &q, ctx_cap);
        free(q.payload);
        if (fatal < 0) return;
    }
}

/* ---------- interactive chat mode (CHAT=1) ----------
 * Llama-3's chat template, rendered here the same way render_chat_llama does
 * it for the gateway: system prompt (optional), user turns, assistant turns
 * closed by <|eot_id|>, generation prompt opens with assistant's header. */
static int fmt_chat_turn(char *out, int cap, const char *msg, int first_turn, const char *sys) {
    int n;
    if (first_turn)
        n = snprintf(out, cap,
                     "<|begin_of_text|><|start_header_id|>system<|end_header_id|>\n\n%s<|eot_id|>"
                     "<|start_header_id|>user<|end_header_id|>\n\n%s<|eot_id|>"
                     "<|start_header_id|>assistant<|end_header_id|>\n\n",
                     sys && sys[0] ? sys : "You are a helpful assistant.", msg);
    else
        n = snprintf(out, cap,
                     "<|start_header_id|>user<|end_header_id|>\n\n%s<|eot_id|>"
                     "<|start_header_id|>assistant<|end_header_id|>\n\n",
                     msg);
    return (n < 0 || n >= cap) ? -1 : n;
}

static void run_chat(Model *m, Tok *T, int ctx_cap) {
    Cfg *c = &m->c;
    kv_alloc(m, ctx_cap);
    int tok_eot = tok_id_of(T, "<|eot_id|>");
    int tok_eos = tok_id_of(T, "<|end_of_text|>");
    stops_arm_tok(&m->c, tok_eos, T);
    if (tok_eot >= 0 && !is_stop(tok_eot) && g_nstop < 64) g_stop[g_nstop++] = tok_eot;
    int max_new = getenv("MAX_NEW") ? atoi(getenv("MAX_NEW")) : 512;
    if (max_new < 1) max_new = 1;
    int *hist = malloc((size_t)ctx_cap * sizeof(int));
    int hist_len = 0, first_turn = 1;
    char *line = malloc(8192);
    char *turn = malloc(16384 + 64);
    int  *newids = malloc(16384 * sizeof(int));
    int  *gen = malloc((size_t)max_new * sizeof(int));
    char *outbuf = malloc(65536);
    fprintf(stderr, "llama chat — SNAP=%s, ctx=%d, TEMP=%.2f, NUCLEUS=%.2f\n"
                    "  type a message and press enter; /reset clears context; Ctrl-D exits\n",
            getenv("SNAP"), ctx_cap, g_temp, g_nuc);
    for (;;) {
        printf("\n> "); fflush(stdout);
        if (!fgets(line, 8192, stdin)) break;
        size_t L = strlen(line);
        while (L > 0 && (line[L-1] == '\n' || line[L-1] == '\r')) line[--L] = 0;
        if (L == 0) continue;
        if (!strcmp(line, "/reset")) { hist_len = 0; first_turn = 1; fprintf(stderr, "[chat] context reset\n"); continue; }
        int tn = fmt_chat_turn(turn, 16384 + 64, line, first_turn, NULL);
        if (tn < 0) { fprintf(stderr, "[chat] message too long, skipped\n"); continue; }
        first_turn = 0;
        int nn = tok_encode(T, turn, tn, newids, 16384);
        if (hist_len + nn + max_new > ctx_cap) {
            fprintf(stderr, "[chat] context window full (%d/%d tokens) — /reset to start over\n",
                    hist_len + nn, ctx_cap);
            continue;
        }
        float *logit = step(m, newids, nn, hist_len);
        hist_len += nn;
        int ngen = 0;
        for (int s = 0; s < max_new; s++) {
            int nt = pick_tok(logit, c->vocab, -1);
            free(logit); logit = NULL;
            if (is_stop(nt)) break;
            hist[hist_len] = nt; gen[ngen++] = nt; hist_len++;
            int room_left = (s < max_new - 1) && (hist_len < ctx_cap);
            logit = step(m, &nt, 1, hist_len - 1);
            if (!room_left) {
                if (hist_len >= ctx_cap) fprintf(stderr, "\n[chat] context window full mid-reply — /reset to start over\n");
                free(logit); logit = NULL;
                break;
            }
        }
        int outn = tok_decode(T, gen, ngen, outbuf, 65535);
        outbuf[outn] = 0;
        printf("%s\n", outbuf);
        fflush(stdout);
    }
    free(line); free(turn); free(newids); free(gen); free(outbuf); free(hist);
}

/* ---------- ref.json harness ---------- */
static int *read_int_array(jval *o, const char *key, int *n_out) {
    jval *a = json_get(o, key);
    if (!a || a->t != J_ARR || a->len < 1) { fprintf(stderr, "ref.json: missing or empty \"%s\"\n", key); exit(1); }
    int *r = malloc(a->len * sizeof(int));
    for (int i = 0; i < a->len; i++) r[i] = (int)a->kids[i]->num;
    *n_out = a->len; return r;
}

int main(int argc, char **argv) {
    syntara_omp_tune_threads("llama_dense");   /* pin to physical cores: omp_tune.h */
    const char *snap = getenv("SNAP");
    if (!snap) { syntara_print_launcher_help("Llama"); return 1; }

    /* SERVE=1: openai_server.py drives the engine over stdin/stdout */
    if (getenv("SERVE") && getenv("SERVE")[0] == '1') {
        static Model m; model_init(&m, snap);
        int ctx_cap = getenv("CTX") ? atoi(getenv("CTX")) : m.c.max_pos;
        if (ctx_cap < 1) ctx_cap = 1;
        if (ctx_cap > m.c.max_pos) ctx_cap = m.c.max_pos;
        kv_alloc(&m, ctx_cap);
        Tok T;
        char tokpath[2048]; snprintf(tokpath, sizeof(tokpath), "%s/tokenizer.json", snap);
        tok_load(&T, tokpath);
        serve_loop(&m, &T, ctx_cap);
        return 0;
    }

    if (getenv("CHAT")) {
        /* #509 convention: SYNTARA_TEMP is the primary channel; TEMP stays a
         * legacy alias ONLY when fully numeric (on Windows %TEMP% is a path). */
        if (getenv("SYNTARA_TEMP")) g_temp = (float)atof(getenv("SYNTARA_TEMP"));
        else if (getenv("TEMP") && *getenv("TEMP")) {
            char *tend; double tv = strtod(getenv("TEMP"), &tend);
            if (tend != getenv("TEMP") && *tend == '\0') g_temp = (float)tv;
        }
        g_nuc = getenv("NUCLEUS") ? (float)atof(getenv("NUCLEUS")) : g_nuc;
        static Model m; model_init(&m, snap);
        int ctx_cap = getenv("CTX") ? atoi(getenv("CTX")) : m.c.max_pos;
        if (ctx_cap < 1) ctx_cap = 1;
        if (ctx_cap > m.c.max_pos) ctx_cap = m.c.max_pos;
        printf("resident weights loaded in %.1fs | RSS after load: %.2f GB\n", m.dense_load_s, rss_gb());
        Tok T;
        char tokpath[2048]; snprintf(tokpath, sizeof(tokpath), "%s/tokenizer.json", snap);
        tok_load(&T, tokpath);
        run_chat(&m, &T, ctx_cap);
        return 0;
    }

    /* REF harness: argv[1] = ref.json path (default ./ref.json) */
    const char *refpath = argc > 1 ? argv[1] : "ref.json";
    FILE *f = fopen(refpath, "rb"); if (!f) { perror(refpath); return 1; }
    fseek(f,0,SEEK_END); long n=ftell(f); fseek(f,0,SEEK_SET);
    if (n < 0 || n > (256L<<20)) { fprintf(stderr, "%s: ref.json missing or too large\n", refpath); fclose(f); return 1; }
    char *buf=malloc((size_t)n+1); if (fread(buf,1,(size_t)n,f)!=(size_t)n) { fprintf(stderr, "%s: short read\n", refpath); fclose(f); return 1; } buf[n]=0; fclose(f);
    char *arena=NULL; jval *ref = json_parse(buf, &arena);
    if (!ref) { fprintf(stderr, "%s: invalid JSON\n", refpath); return 1; }
    int np, ngen;
    int *prompt = read_int_array(ref, "ids", &np);
    jval *ga = json_get(ref, "gen");
    if (!ga || ga->t != J_ARR) { fprintf(stderr, "ref.json: missing or non-array \"gen\"\n"); return 1; }
    ngen = ga->len;

    static Model m; model_init(&m, snap);
    int *out = malloc((np + ngen) * sizeof(int));
    float *prefill = falloc(m.c.vocab);
    generate(&m, prompt, np, ngen, out, prefill);

    printf("REF_IDS");
    for (int i = 0; i < np; i++) printf(" %d", prompt[i]);
    printf("\n");
    printf("REF_LOGITS");
    for (int v = 0; v < m.c.vocab; v++) printf(" %.9g", prefill[v]);
    printf("\n");
    printf("REF_GEN");
    for (int i = 0; i < ngen; i++) printf(" %d", out[np + i]);
    printf("\n");
    fflush(stdout);
    free(buf); free(arena); free(prompt); free(out); free(prefill);
    return 0;
}
