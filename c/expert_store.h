#ifndef SYNTARA_EXPERT_STORE_H
#define SYNTARA_EXPERT_STORE_H

#include <stddef.h>
#include <stdint.h>
#include <string.h>

#include "tensor.h"

#ifdef __cplusplus
extern "C" {
#endif

typedef struct SyntaraExpertStore SyntaraExpertStore;

typedef struct {
    int layer;
    int expert;
} SyntaraExpertKey;

typedef struct {
    SyntaraExpertKey key;
    SyntaraTensorView gate;
    SyntaraTensorView down;
    SyntaraTensorView up;
    void *lease;
} SyntaraExpertView;

typedef struct {
    uint64_t requests;
    uint64_t hits;
    uint64_t misses;
    uint64_t prefetched;
    uint64_t prefetch_hits;
    uint64_t bytes_read;
    uint64_t resident_bytes;
    uint64_t capacity_bytes;
} SyntaraExpertStoreStats;

/*
 * ExpertStore lease contract:
 *
 * - After a successful lookup(), the caller must call release() exactly once
 *   on the same view (same store). Do not copy SyntaraExpertView; the lease is
 *   not shareable. Do not pass a view that already holds an active lease to
 *   lookup().
 * - On lookup failure the view is cleared; the caller must not use it and
 *   must not call release().
 * - release() clears the entire view. release() on an already-cleared or
 *   zero-initialized view is a no-op.
 * - destroy() requires zero active leases (debug builds assert).
 * - Thread-safety is implementation-specific. Callers must not assume that
 *   lookup/release/prefetch/stats/destroy are safe to call concurrently on
 *   the same store unless the concrete store documents that guarantee.
 *   Views must not be used concurrently from multiple threads.
 * - prefetch() is advisory, holds no lease, and must not evict a slot that
 *   still has an active lease.
 */
typedef struct {
    /* Returns zero on success. The view remains valid until release(). */
    int (*lookup)(SyntaraExpertStore *store, SyntaraExpertKey key,
                  SyntaraExpertView *view);
    void (*release)(SyntaraExpertStore *store, SyntaraExpertView *view);
    /* Prefetch is advisory. Unsupported or rejected requests return zero. */
    int (*prefetch)(SyntaraExpertStore *store, const SyntaraExpertKey *keys,
                    size_t count);
    void (*stats)(const SyntaraExpertStore *store, SyntaraExpertStoreStats *stats);
    void (*destroy)(SyntaraExpertStore *store);
} SyntaraExpertStoreOps;

struct SyntaraExpertStore {
    const SyntaraExpertStoreOps *ops;
    void *state;
    /* Optional CUDA-tier mirror cache owned by the GPU translation unit
     * (deepseek_v4.c SYNTARA_V4_UNIT_GPU). NULL when the tier is inactive; the
     * CPU lease path ignores it entirely. */
    void *gpu;
};

static inline int syntara_expert_lookup(SyntaraExpertStore *store,
                                     SyntaraExpertKey key,
                                     SyntaraExpertView *view) {
    if (!store || !store->ops || !store->ops->lookup) {
        if (view) memset(view, 0, sizeof(*view));
        return -1;
    }
    int result = store->ops->lookup(store, key, view);
    if (result != 0 && view) memset(view, 0, sizeof(*view));
    return result;
}

static inline void syntara_expert_release(SyntaraExpertStore *store,
                                       SyntaraExpertView *view) {
    if (store && store->ops && store->ops->release)
        store->ops->release(store, view);
    if (view) memset(view, 0, sizeof(*view));
}

#ifdef __cplusplus
}
#endif

#endif
