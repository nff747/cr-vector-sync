import { describe, it, expect } from 'vitest';
import { quantizeInt8, dequantizeInt8 } from '../src/quant.js';

describe('Scalar Quantization', () => {
  it('quantizes and dequantizes vectors with low MSE', () => {
    const original = new Float32Array([0.1, -0.5, 0.9, 0.25]);
    const quantized = quantizeInt8(original);
    const reconstructed = dequantizeInt8(quantized);

    for (let i = 0; i < original.length; i++) {
      expect(reconstructed[i]).toBeCloseTo(original[i], 1);
    }
  });
});
