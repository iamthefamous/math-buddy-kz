/** Integer helpers and exact fractions for school arithmetic. */

export function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a;
}

export function lcm(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return Math.abs((a / gcd(a, b)) * b);
}

/** Prime factorization of n ≥ 2 as [prime, exponent] pairs in ascending order. */
export function factorize(n: number): [number, number][] {
  const out: [number, number][] = [];
  for (let p = 2; p * p <= n; p += p === 2 ? 1 : 2) {
    let e = 0;
    while (n % p === 0) { n /= p; e++; }
    if (e) out.push([p, e]);
  }
  if (n > 1) out.push([n, 1]);
  return out;
}

/** Fraction in lowest terms with a positive denominator. */
export interface Frac { n: number; d: number }

export function frac(n: number, d: number): Frac {
  if (d === 0) throw new RangeError('zero denominator');
  const g = gcd(n, d) || 1;
  const s = d < 0 ? -1 : 1;
  return { n: (s * n) / g || 0, d: (s * d) / g };
}

export const add = (a: Frac, b: Frac) => frac(a.n * b.d + b.n * a.d, a.d * b.d);
export const sub = (a: Frac, b: Frac) => frac(a.n * b.d - b.n * a.d, a.d * b.d);
export const mul = (a: Frac, b: Frac) => frac(a.n * b.n, a.d * b.d);
export const div = (a: Frac, b: Frac) => frac(a.n * b.d, a.d * b.n);

/** "−7/3", "5", "0" (unicode minus). */
export function fracStr(f: Frac): string {
  const sign = f.n < 0 ? '−' : '';
  const n = Math.abs(f.n);
  return f.d === 1 ? `${sign}${n}` : `${sign}${n}/${f.d}`;
}

/** Mixed-number form: "−2 1/3"; plain fraction when |n| < d. */
export function mixedStr(f: Frac): string {
  const n = Math.abs(f.n);
  if (f.d === 1 || n < f.d) return fracStr(f);
  const sign = f.n < 0 ? '−' : '';
  const w = Math.floor(n / f.d);
  const r = n % f.d;
  return r === 0 ? `${sign}${w}` : `${sign}${w} ${r}/${f.d}`;
}

/**
 * Parse "3", "-7/4", "2 1/3", "−2 1/3" (mixed numbers allowed).
 * Returns null on invalid input or a zero denominator.
 */
export function parseFrac(src: string): Frac | null {
  const s = src.trim().replace(/[−–]/g, '-');
  const m = /^(-)?\s*(?:(\d+)\s+(?=\d+\s*\/))?(\d+)(?:\s*\/\s*(\d+))?$/.exec(s);
  if (!m) return null;
  const neg = m[1] === '-';
  const whole = m[2] ? Number(m[2]) : 0;
  const num = Number(m[3]);
  const den = m[4] ? Number(m[4]) : 1;
  if (den === 0) return null;
  if (![whole, num, den].every(Number.isSafeInteger)) return null;
  const n = whole * den + num;
  return frac(neg ? -n : n, den);
}

/**
 * Exact fraction for x when x equals p/q with q ≤ maxDen (continued fractions),
 * e.g. 0.75 → 3/4, 0.3333333333333333 → 1/3; null otherwise (π, √2, …).
 */
export function toFrac(x: number, maxDen = 1000): Frac | null {
  if (!Number.isFinite(x)) return null;
  const tol = 1e-12 * Math.max(1, Math.abs(x));
  let [h0, h1, k0, k1] = [0, 1, 1, 0];
  let r = x;
  for (let i = 0; i < 40; i++) {
    const a = Math.floor(r);
    [h0, h1] = [h1, a * h1 + h0];
    [k0, k1] = [k1, a * k1 + k0];
    if (k1 > maxDen || !Number.isSafeInteger(h1)) return null;
    if (Math.abs(h1 / k1 - x) <= tol) return frac(h1, k1);
    const rem = r - a;
    if (rem < 1e-15) return null;
    r = 1 / rem;
  }
  return null;
}

/** Simplify √n → [k, m] with √n = k√m (m square-free). */
export function simplifySqrt(n: number): [number, number] {
  let k = 1;
  let m = n;
  for (let p = 2; p * p <= m; p++) {
    while (m % (p * p) === 0) { m /= p * p; k *= p; }
  }
  return [k, m];
}
