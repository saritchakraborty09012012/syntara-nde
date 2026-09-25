#ifndef SYNTARA_TENSOR_H
#define SYNTARA_TENSOR_H

#include <stddef.h>
#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

/* Storage/execution formats understood by a model backend.  A view describes
 * bytes owned by a model or ExpertStore; it never owns or frees those bytes. */
typedef enum {
    SYNTARA_TENSOR_F32 = 0,
    SYNTARA_TENSOR_Q8_ROW,
    SYNTARA_TENSOR_Q4_ROW,
    SYNTARA_TENSOR_Q2_ROW,
    SYNTARA_TENSOR_FP8_E4M3_BLOCK,
    SYNTARA_TENSOR_FP4_NATIVE_BLOCK,
    SYNTARA_TENSOR_INT8_BLOCK,
    SYNTARA_TENSOR_INT4_BLOCK
} SyntaraTensorFormat;

typedef enum {
    SYNTARA_SCALE_NONE = 0,
    SYNTARA_SCALE_F32,
    SYNTARA_SCALE_UE8M0
} SyntaraScaleFormat;

typedef struct {
    SyntaraTensorFormat format;
    SyntaraScaleFormat scale_format;
    const void *data;
    const void *scales;
    size_t data_bytes;
    size_t scale_bytes;
    int64_t rows;
    int64_t columns;
    uint32_t block_rows;
    uint32_t block_columns;
    /* Optional backend-resident mirror of this weight (e.g. a Dsv4CudaTensor*).
     * NULL on the CPU-only paths; owned and freed by the backend tier, never by
     * the view. */
    void *gpu;
} SyntaraTensorView;

#ifdef __cplusplus
}
#endif

#endif
