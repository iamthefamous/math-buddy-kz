import { frac, fracStr, gcd, lcm, simplifySqrt, toFrac } from './numtheory';

/** Scale rational coefficients to integers, e.g. [0.5, -1, -1] → [1, -2, -2]; null if not rational with small denominators. */
export function toIntegers(coefs: number[]): number[] | null {
  const fs = coefs.map((c) => toFrac(c, 1000));
  if (fs.some((f) => f === null)) return null;
  const L = fs.reduce((acc, f) => lcm(acc, f!.d), 1);
  const ints = fs.map((f) => (f!.n * L) / f!.d);
  return ints.every(Number.isSafeInteger) ? ints : null;
}

/**
 * Exact real roots of ax² + bx + c = 0 as display strings, for rational coefficients.
 * Returns [] when D < 0, one string when D = 0, and either two rational roots
 * or a single "p ± q√m" style string when √D is irrational. null when not exact-capable.
 */
export function exactQuadRoots(a: number, b: number, c: number): string[] | null {
  const ints = toIntegers([a, b, c]);
  if (!ints) return null;
  const [A, B, C] = ints;
  const D = B * B - 4 * A * C;
  if (!Number.isSafeInteger(D)) return null;
  if (D < 0) return [];
  const r = Math.round(Math.sqrt(D));
  if (r * r === D) {
    const x1 = frac(-B - r, 2 * A);
    const x2 = frac(-B + r, 2 * A);
    const xs = [x1, x2].sort((u, v) => u.n / u.d - v.n / v.d).map(fracStr);
    return D === 0 ? [xs[0]] : xs;
  }
  const [k, m] = simplifySqrt(D);
  const g = gcd(gcd(Math.abs(B), k), Math.abs(2 * A));
  let p = -B / g;
  const q = k / g;
  let den = (2 * A) / g;
  if (den < 0) { p = -p; den = -den; }
  const rad = `${q === 1 ? '' : q}√${m}`;
  const ps = p < 0 ? `−${-p}` : String(p);
  if (den === 1) return [p === 0 ? `±${rad}` : `${ps} ± ${rad}`];
  return [p === 0 ? `±${rad}/${den}` : `(${ps} ± ${rad})/${den}`];
}
