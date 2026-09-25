#ifndef SYNTARA_EDGE_ADAPTERS_H
#define SYNTARA_EDGE_ADAPTERS_H

/* Explicit registration keeps the ordinary Syntara CLI initialization and
 * Windows/MSVC builds independent from the distributed Edge runtime. */

#ifdef __cplusplus
extern "C" {
#endif

int syntara_glm_edge_adapter_register(void);
int syntara_glm53_edge_adapter_register(void);
int syntara_inkling_edge_adapter_register(void);
int syntara_kimi_edge_adapter_register(void);
int syntara_olmoe_edge_adapter_register(void);
int syntara_qwen36_edge_adapter_register(void);
int syntara_qwen38_edge_adapter_register(void);
int syntara_deepseek_v4_edge_adapter_register(void);

#ifdef __cplusplus
}
#endif

#endif /* SYNTARA_EDGE_ADAPTERS_H */
