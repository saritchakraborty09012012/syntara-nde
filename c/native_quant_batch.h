#ifndef SYNTARA_NATIVE_QUANT_BATCH_H
#define SYNTARA_NATIVE_QUANT_BATCH_H

#include "tensor.h"

/* inputs and outputs are batch-major. Every batch element preserves the exact
 * scalar column accumulation order of the single-token reference kernels. */
int syntara_fp8_matmul_batch_ref(float *outputs, const SyntaraTensorView *weight,
                              const float *inputs, int batch);
int syntara_fp4_matmul_batch_ref(float *outputs, const SyntaraTensorView *weight,
                              const float *inputs, int batch);

/* Hoisted-qdq variant: `activations` were qdq'd once by the caller (batch-
 * major, same layout the _ref computes internally); `inputs` stays raw for
 * the GPU path, exactly as in _ref. Bit-identical to _ref. */
int syntara_fp8_matmul_batch_pre(float *outputs, const SyntaraTensorView *weight,
                              const float *inputs, const float *activations,
                              int batch);

#endif
