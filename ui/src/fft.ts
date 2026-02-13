/**
 * Minimal radix-2 FFT: real input -> magnitude spectrum (first N/2 bins).
 * In-place Cooley–Tukey; input is overwritten.
 */

function swapReIm(re: Float32Array, im: Float32Array, i: number, j: number) {
  let t = re[i]; re[i] = re[j]; re[j] = t
  t = im[i]; im[i] = im[j]; im[j] = t
}

/** Bit-reverse permutation for indices 0..n-1 (n must be power of 2). */
function bitReversePermute(re: Float32Array, im: Float32Array, n: number) {
  let j = 0
  for (let i = 0; i < n - 1; i++) {
    if (i < j) swapReIm(re, im, i, j)
    let k = n >> 1
    while (j >= k) {
      j -= k
      k >>= 1
    }
    j += k
  }
}

/**
 * In-place complex FFT (Cooley-Tukey). re and im are real and imaginary parts.
 * n must be a power of 2. Forward (sign = -1) or inverse (sign = 1).
 */
function fftCore(re: Float32Array, im: Float32Array, n: number, sign: number) {
  bitReversePermute(re, im, n)
  for (let len = 2; len <= n; len <<= 1) {
    const angle = (sign * 2 * Math.PI) / len
    const wlenRe = Math.cos(angle)
    const wlenIm = Math.sin(angle)
    for (let i = 0; i < n; i += len) {
      let wRe = 1
      let wIm = 0
      for (let j = 0; j < len / 2; j++) {
        const u = i + j
        const v = u + len / 2
        const tRe = wRe * re[v] - wIm * im[v]
        const tIm = wRe * im[v] + wIm * re[v]
        re[v] = re[u] - tRe
        im[v] = im[u] - tIm
        re[u] += tRe
        im[u] += tIm
        const nextWRe = wRe * wlenRe - wIm * wlenIm
        const nextWIm = wRe * wlenIm + wIm * wlenRe
        wRe = nextWRe
        wIm = nextWIm
      }
    }
  }
  if (sign === 1) {
    for (let i = 0; i < n; i++) {
      re[i] /= n
      im[i] /= n
    }
  }
}

/**
 * Real input -> magnitude spectrum for bins 0..fftSize/2.
 * data is fftSize real samples (will be copied and windowed; not mutated).
 * Returns Float32Array of length fftSize/2 + 1 (magnitudes).
 */
export function realFftMagnitude(data: Float32Array, fftSize: number): Float32Array {
  const n = fftSize
  const re = new Float32Array(n)
  const im = new Float32Array(n)
  // Hanning window
  for (let i = 0; i < n; i++) {
    const w = 0.5 * (1 - Math.cos((2 * Math.PI * i) / n))
    re[i] = data[i] * w
  }
  fftCore(re, im, n, -1)
  const out = new Float32Array(n / 2 + 1)
  for (let i = 0; i <= n / 2; i++) {
    out[i] = Math.sqrt(re[i] * re[i] + im[i] * im[i])
  }
  return out
}
