import { gcd } from './numtheory';

export const DEG = Math.PI / 180;

/** Exact values for reference angles 0°, 15°, …, 90°. null = undefined. */
const EXACT: Record<number, { sin: string; cos: string; tan: string | null; cot: string | null }> = {
  0: { sin: '0', cos: '1', tan: '0', cot: null },
  15: { sin: '(√6 − √2)/4', cos: '(√6 + √2)/4', tan: '2 − √3', cot: '2 + √3' },
  30: { sin: '1/2', cos: '√3/2', tan: '√3/3', cot: '√3' },
  45: { sin: '√2/2', cos: '√2/2', tan: '1', cot: '1' },
  60: { sin: '√3/2', cos: '1/2', tan: '√3', cot: '√3/3' },
  75: { sin: '(√6 + √2)/4', cos: '(√6 − √2)/4', tan: '2 + √3', cot: '2 − √3' },
  90: { sin: '1', cos: '0', tan: null, cot: '0' },
};

export type TrigFn = 'sin' | 'cos' | 'tan' | 'cot';

/** Normalize degrees to [0, 360). */
export const norm360 = (d: number) => {
  const r = ((d % 360) + 360) % 360;
  return Math.abs(r - 360) < 1e-9 ? 0 : r;
};

/** Quadrant 1–4, or 0 when the angle lies on an axis. */
export function quadrant(deg: number): 0 | 1 | 2 | 3 | 4 {
  const d = norm360(deg);
  if (isMultiple(d, 90)) return 0;
  return (Math.floor(d / 90) + 1) as 1 | 2 | 3 | 4;
}

/** Reference angle in [0°, 90°]. */
export function referenceAngle(deg: number): number {
  const d = norm360(deg);
  if (d <= 90) return d;
  if (d <= 180) return 180 - d;
  if (d <= 270) return d - 180;
  return 360 - d;
}

const isMultiple = (v: number, step: number) => Math.abs(v / step - Math.round(v / step)) < 1e-9;

/** Exact value string for angles that are multiples of 15°; undefined when not exact; null when the function is undefined. */
export function exactTrig(fn: TrigFn, deg: number): string | null | undefined {
  if (!isMultiple(deg, 15)) return undefined;
  const d = Math.round(norm360(deg)) % 360;
  const ref = Math.round(referenceAngle(d));
  const sinNeg = d > 180;
  const cosNeg = d > 90 && d < 270;
  const base = EXACT[ref][fn];
  if (base === null) return null;
  if (base === '0') return '0';
  const neg = fn === 'sin' ? sinNeg : fn === 'cos' ? cosNeg : sinNeg !== cosNeg;
  if (!neg) return base;
  return base.includes(' ') && !base.startsWith('(') ? `−(${base})` : `−${base}`;
}

/** Numeric value; null where tan/cot are undefined. */
export function trigValue(fn: TrigFn, rad: number): number | null {
  const deg = rad / DEG;
  const s = Math.sin(rad);
  const c = Math.cos(rad);
  if (isMultiple(deg, 90)) {
    const k = ((Math.round(deg / 90) % 4) + 4) % 4; // 0:0°, 1:90°, 2:180°, 3:270°
    const sin = [0, 1, 0, -1][k];
    const cos = [1, 0, -1, 0][k];
    if (fn === 'sin') return sin;
    if (fn === 'cos') return cos;
    if (fn === 'tan') return cos === 0 ? null : sin / cos;
    return sin === 0 ? null : cos / sin;
  }
  if (fn === 'sin') return s;
  if (fn === 'cos') return c;
  if (fn === 'tan') return s / c;
  return c / s;
}

/**
 * Express an angle in radians as a multiple of π when it is a multiple of π/12
 * (or of π/8, π/9, π/10 — common textbook angles). Returns e.g. "5π/6", "−π", "0".
 */
export function piForm(rad: number): string | undefined {
  for (const den of [12, 8, 10, 9]) {
    const k = (rad / Math.PI) * den;
    if (Math.abs(k - Math.round(k)) > 1e-9) continue;
    const n0 = Math.round(k);
    if (n0 === 0) return '0';
    const g = gcd(n0, den);
    const n = n0 / g;
    const d = den / g;
    const sign = n < 0 ? '−' : '';
    const an = Math.abs(n);
    return `${sign}${an === 1 ? '' : an}π${d === 1 ? '' : '/' + d}`;
  }
  return undefined;
}

/** Exact inverse values for arcsin/arccos/arctan/arccot of special arguments. */
const SPECIAL_ARGS: [number, string][] = [
  [0, '0'], [0.5, '1/2'], [Math.SQRT2 / 2, '√2/2'], [Math.sqrt(3) / 2, '√3/2'], [1, '1'],
  [Math.sqrt(3) / 3, '√3/3'], [Math.sqrt(3), '√3'],
];

/** Pretty exact form of a special argument value such as −√3/2. */
export function specialArgForm(a: number): string | undefined {
  const hit = SPECIAL_ARGS.find(([v]) => Math.abs(Math.abs(a) - v) < 1e-9);
  if (!hit) return undefined;
  return a < 0 && hit[1] !== '0' ? `−${hit[1]}` : hit[1];
}
