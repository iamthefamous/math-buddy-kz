import { piForm, specialArgForm, type TrigFn } from './trig';

export interface TrigEqNames { tan: string; cot: string; arctan: string; arccot: string }
export interface TrigEqResult {
  /** General solution, e.g. "(−1)ᵏ·π/6 + πk"; null when no solutions. */
  general: string | null;
  /** Principal inverse value (radians) and its exact form if any. */
  principal?: { value: number; exact?: string; name: string };
  /** All solutions in [0, 2π), ascending. */
  inTurn: number[];
  /** Which textbook case applied. */
  special: boolean;
}

const TAU = 2 * Math.PI;
const n2pi = (x: number) => {
  const r = ((x % TAU) + TAU) % TAU;
  return TAU - r < 1e-12 ? 0 : r;
};
const uniq = (xs: number[]) =>
  xs.map(n2pi).sort((a, b) => a - b).filter((x, i, arr) => i === 0 || Math.abs(x - arr[i - 1]) > 1e-9);

/** Solve f(x) = a for f ∈ {sin, cos, tan, cot}. `fmtNum` formats a non-special argument. */
export function solveTrigEq(fn: TrigFn, a: number, names: TrigEqNames, fmtNum: (n: number) => string): TrigEqResult {
  const argStr = specialArgForm(a) ?? fmtNum(a);
  const arc = (name: string, v: number) => piForm(v) ?? `${name}(${argStr})`;
  const near = (v: number) => Math.abs(a - v) < 1e-12;

  if (fn === 'sin' || fn === 'cos') {
    if (Math.abs(a) > 1 + 1e-12) return { general: null, inTurn: [], special: false };
    const A = Math.max(-1, Math.min(1, a));
    if (fn === 'sin') {
      const p = Math.asin(A);
      const principal = { value: p, exact: piForm(p), name: 'arcsin' };
      const inTurn = uniq([p, Math.PI - p]);
      if (near(0)) return { general: 'πk', principal, inTurn, special: true };
      if (near(1)) return { general: 'π/2 + 2πk', principal, inTurn, special: true };
      if (near(-1)) return { general: '−π/2 + 2πk', principal, inTurn, special: true };
      const pe = piForm(p);
      const general = pe && p < 0
        ? `(−1)ᵏ⁺¹·${pe.slice(1)} + πk`
        : `(−1)ᵏ·${arc('arcsin', p)} + πk`;
      return { general, principal, inTurn, special: false };
    }
    const p = Math.acos(A);
    const principal = { value: p, exact: piForm(p), name: 'arccos' };
    const inTurn = uniq([p, -p]);
    if (near(0)) return { general: 'π/2 + πk', principal, inTurn, special: true };
    if (near(1)) return { general: '2πk', principal, inTurn, special: true };
    if (near(-1)) return { general: 'π + 2πk', principal, inTurn, special: true };
    return { general: `±${arc('arccos', p)} + 2πk`, principal, inTurn, special: false };
  }

  if (fn === 'tan') {
    const p = Math.atan(a);
    const principal = { value: p, exact: piForm(p), name: names.arctan };
    const inTurn = uniq([p, p + Math.PI]);
    if (near(0)) return { general: 'πk', principal, inTurn, special: true };
    return { general: `${arc(names.arctan, p)} + πk`, principal, inTurn, special: false };
  }

  const p = Math.PI / 2 - Math.atan(a); // arcctg ∈ (0, π)
  const principal = { value: p, exact: piForm(p), name: names.arccot };
  const inTurn = uniq([p, p + Math.PI]);
  if (near(0)) return { general: 'π/2 + πk', principal, inTurn, special: true };
  return { general: `${arc(names.arccot, p)} + πk`, principal, inTurn, special: false };
}
