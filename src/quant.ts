export interface QuantizedVector {
  values: Int8Array;
  min: number;
  scale: number;
}

export function quantizeInt8(vec: Float32Array): QuantizedVector {
  let min = Infinity;
  let max = -Infinity;
  for (let i = 0; i < vec.length; i++) {
    if (vec[i] < min) min = vec[i];
    if (vec[i] > max) max = vec[i];
  }

  const range = max - min || 1;
  const scale = 255 / range;
  const values = new Int8Array(vec.length);

  for (let i = 0; i < vec.length; i++) {
    values[i] = Math.round((vec[i] - min) * scale) - 128;
  }

  return { values, min, scale };
}

export function dequantizeInt8(q: QuantizedVector): Float32Array {
  const out = new Float32Array(q.values.length);
  for (let i = 0; i < q.values.length; i++) {
    out[i] = (q.values[i] + 128) / q.scale + q.min;
  }
  return out;
}
