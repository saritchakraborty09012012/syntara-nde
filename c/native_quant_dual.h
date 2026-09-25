#ifndef SYNTARA_NATIVE_QUANT_DUAL_H
#define SYNTARA_NATIVE_QUANT_DUAL_H

#include "tensor.h"

int syntara_fp4_dual_matvec_ref(float *output_a, float *output_b,
                             const SyntaraTensorView *weight_a,
                             const SyntaraTensorView *weight_b,
                             const float *input);
int syntara_fp8_dual_matvec_ref(float *output_a, float *output_b,
                             const SyntaraTensorView *weight_a,
                             const SyntaraTensorView *weight_b,
                             const float *input);

#endif
