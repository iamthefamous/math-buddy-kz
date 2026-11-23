/**
 * Triangle solvers. Angles are in degrees. Side i is opposite angle i
 * (a ↔ α, b ↔ β, c ↔ γ). Steps are language-neutral math strings; the caller
 * supplies the number formatter and localized function names (tg vs tan).
 */
import type { Key } from '../i18n/en';
import { DEG } from './trig';

export type Fmt = (n: number) => string;
export interface FnNames { tan: string; arctan: string }
export interface Step { label?: Key; math: string }

const EPS = 1e-9;
const sinD = (d: number) => Math.sin(d * DEG);
const cosD = (d: number) => Math.cos(d * DEG);
const tanD = (d: number) => Math.tan(d * DEG);
const asinD = (v: number) => Math.asin(Math.max(-1, Math.min(1, v))) / DEG;
const acosD = (v: number) => Math.acos(Math.max(-1, Math.min(1, v))) / DEG;
const atanD = (v: number) => Math.atan(v) / DEG;

// ───────────────────────── right triangle ─────────────────────────

export interface RightKnown { a?: number; b?: number; c?: number; al?: number; be?: number }
export interface RightSolved { a: number; b: number; c: number; al: number; be: number; steps: Step[] }

export function solveRight(k: RightKnown, f: Fmt, fn: FnNames): RightSolved | { error: Key } {
  const given = (Object.keys(k) as (keyof RightKnown)[]).filter((x) => k[x] !== undefined);
  if (given.length !== 2) return { error: 'tri.needTwo' };
  for (const s of ['a', 'b', 'c'] as const) if (k[s] !== undefined && k[s]! <= 0) return { error: 'err.positive' };
  for (const s of ['al', 'be'] as const) if (k[s] !== undefined && (k[s]! <= 0 || k[s]! >= 90)) return { error: 'tri.errAcute' };
  if (k.c === undefined && k.a === undefined && k.b === undefined) return { error: 'tri.needSide' };
  if (k.c !== undefined && ((k.a !== undefined && k.a >= k.c) || (k.b !== undefined && k.b >= k.c))) return { error: 'tri.errHyp' };

  // Mirror so the known leg (if any) is "p" with opposite angle "P".
  const mirror = k.a === undefined && (k.b !== undefined || (k.c !== undefined && k.be !== undefined));
  const p0 = mirror ? k.b : k.a;
  const q0 = mirror ? k.a : k.b;
  const P0 = mirror ? k.be : k.al;
  const Q0 = mirror ? k.al : k.be;
  const n = mirror ? { p: 'b', q: 'a', P: 'β', Q: 'α' } : { p: 'a', q: 'b', P: 'α', Q: 'β' };
  const c0 = k.c;
  const steps: Step[] = [];
  let p: number, q: number, c: number, P: number, Q: number;

  if (p0 !== undefined && q0 !== undefined) {
    p = p0; q = q0;
    c = Math.hypot(p, q);
    steps.push({ label: 'tri.pythagoras', math: `c = √(${n.p}² + ${n.q}²) = √(${f(p)}² + ${f(q)}²) = ${f(c)}` });
    P = atanD(p / q);
    steps.push({ math: `${fn.tan} ${n.P} = ${n.p}/${n.q} = ${f(p)}/${f(q)} ⇒ ${n.P} = ${fn.arctan}(${f(p / q)}) ≈ ${f(P)}°` });
    Q = 90 - P;
    steps.push({ math: `${n.Q} = 90° − ${n.P} = ${f(Q)}°` });
  } else if (p0 !== undefined && c0 !== undefined) {
    p = p0; c = c0;
    q = Math.sqrt(c * c - p * p);
    steps.push({ label: 'tri.pythagoras', math: `${n.q} = √(c² − ${n.p}²) = √(${f(c)}² − ${f(p)}²) = ${f(q)}` });
    P = asinD(p / c);
    steps.push({ math: `sin ${n.P} = ${n.p}/c = ${f(p)}/${f(c)} ⇒ ${n.P} = arcsin(${f(p / c)}) ≈ ${f(P)}°` });
    Q = 90 - P;
    steps.push({ math: `${n.Q} = 90° − ${n.P} = ${f(Q)}°` });
  } else if (p0 !== undefined && P0 !== undefined) {
    p = p0; P = P0;
    Q = 90 - P;
    steps.push({ math: `${n.Q} = 90° − ${n.P} = ${f(Q)}°` });
    c = p / sinD(P);
    steps.push({ math: `c = ${n.p} / sin ${n.P} = ${f(p)} / sin ${f(P)}° = ${f(c)}` });
    q = p / tanD(P);
    steps.push({ math: `${n.q} = ${n.p} / ${fn.tan} ${n.P} = ${f(p)} / ${fn.tan} ${f(P)}° = ${f(q)}` });
  } else if (p0 !== undefined && Q0 !== undefined) {
    p = p0; Q = Q0;
    P = 90 - Q;
    steps.push({ math: `${n.P} = 90° − ${n.Q} = ${f(P)}°` });
    c = p / cosD(Q);
    steps.push({ math: `c = ${n.p} / cos ${n.Q} = ${f(p)} / cos ${f(Q)}° = ${f(c)}` });
    q = p * tanD(Q);
    steps.push({ math: `${n.q} = ${n.p} · ${fn.tan} ${n.Q} = ${f(p)} · ${fn.tan} ${f(Q)}° = ${f(q)}` });
  } else {
    // hypotenuse + one angle (mirrored so the angle is P)
    c = c0!; P = P0!;
    Q = 90 - P;
    steps.push({ math: `${n.Q} = 90° − ${n.P} = ${f(Q)}°` });
    p = c * sinD(P);
    steps.push({ math: `${n.p} = c · sin ${n.P} = ${f(c)} · sin ${f(P)}° = ${f(p)}` });
    q = c * cosD(P);
    steps.push({ math: `${n.q} = c · cos ${n.P} = ${f(c)} · cos ${f(P)}° = ${f(q)}` });
  }
  return mirror ? { a: q, b: p, c, al: Q, be: P, steps } : { a: p, b: q, c, al: P, be: Q, steps };
}

// ───────────────────────── any triangle ─────────────────────────

export interface Tri { s: number[]; A: number[]; steps: Step[] }
const SN = ['a', 'b', 'c'];
const AN = ['α', 'β', 'γ'];

/** sides/angles: arrays of 3 with undefined for unknowns. Returns 0–2 solutions or an error. */
export function solveTriangle(sides: (number | undefined)[], angles: (number | undefined)[], f: Fmt): Tri[] | { error: Key } {
  const ks = [0, 1, 2].filter((i) => sides[i] !== undefined);
  const ka = [0, 1, 2].filter((i) => angles[i] !== undefined);
  if (ks.length + ka.length !== 3) return { error: 'tri.needThree' };
  if (ks.length === 0) return { error: 'tri.needSide' };
  if (ks.some((i) => sides[i]! <= 0)) return { error: 'err.positive' };
  if (ka.some((i) => angles[i]! <= 0 || angles[i]! >= 180)) return { error: 'tri.errAngle' };
  if (ka.reduce((acc, i) => acc + angles[i]!, 0) >= 180 - EPS) return { error: 'tri.errSum' };

  const s = sides.slice() as number[];
  const A = angles.slice() as number[];
  const steps: Step[] = [];

  if (ks.length === 3) {
    const [a, b, c] = s;
    if (a >= b + c || b >= a + c || c >= a + b) return { error: 'tri.errInequality' };
    for (const i of [0, 1]) {
      const [j, k] = [(i + 1) % 3, (i + 2) % 3];
      const cosv = (s[j] ** 2 + s[k] ** 2 - s[i] ** 2) / (2 * s[j] * s[k]);
      A[i] = acosD(cosv);
      steps.push({
        label: i === 0 ? 'tri.lawCos' : undefined,
        math: `cos ${AN[i]} = (${SN[j]}² + ${SN[k]}² − ${SN[i]}²)/(2${SN[j]}${SN[k]}) = (${f(s[j])}² + ${f(s[k])}² − ${f(s[i])}²)/(2·${f(s[j])}·${f(s[k])}) = ${f(cosv)} ⇒ ${AN[i]} ≈ ${f(A[i])}°`,
      });
    }
    A[2] = 180 - A[0] - A[1];
    steps.push({ math: `γ = 180° − α − β = ${f(A[2])}°` });
    return [{ s, A, steps }];
  }

  if (ks.length === 2) {
    const m = ka[0];
    if (!ks.includes(m)) {
      // SAS: the known angle is between the two known sides
      const [i, j] = ks;
      s[m] = Math.sqrt(s[i] ** 2 + s[j] ** 2 - 2 * s[i] * s[j] * cosD(A[m]));
      steps.push({
        label: 'tri.lawCos',
        math: `${SN[m]} = √(${SN[i]}² + ${SN[j]}² − 2${SN[i]}${SN[j]}·cos ${AN[m]}) = √(${f(s[i])}² + ${f(s[j])}² − 2·${f(s[i])}·${f(s[j])}·cos ${f(A[m])}°) = ${f(s[m])}`,
      });
      const cosv = (s[j] ** 2 + s[m] ** 2 - s[i] ** 2) / (2 * s[j] * s[m]);
      A[i] = acosD(cosv);
      steps.push({ math: `cos ${AN[i]} = (${SN[j]}² + ${SN[m]}² − ${SN[i]}²)/(2${SN[j]}${SN[m]}) = ${f(cosv)} ⇒ ${AN[i]} ≈ ${f(A[i])}°` });
      A[j] = 180 - A[m] - A[i];
      steps.push({ math: `${AN[j]} = 180° − ${AN[m]} − ${AN[i]} = ${f(A[j])}°` });
      return [{ s, A, steps }];
    }
    // SSA: angle m is opposite known side m; o is the other known side
    const o = ks.find((i) => i !== m)!;
    const t = 3 - m - o;
    const sinO = (s[o] * sinD(A[m])) / s[m];
    steps.push({
      label: 'tri.lawSin',
      math: `sin ${AN[o]} = ${SN[o]}·sin ${AN[m]} / ${SN[m]} = ${f(s[o])}·sin ${f(A[m])}° / ${f(s[m])} = ${f(sinO)}`,
    });
    if (sinO > 1 + EPS) return { error: 'tri.errNoTriangle' };
    const cands = Math.abs(sinO - 1) <= EPS ? [90] : [asinD(sinO), 180 - asinD(sinO)];
    const out: Tri[] = [];
    for (const ao of cands) {
      if (A[m] + ao >= 180 - EPS) continue;
      const S = s.slice();
      const AA = A.slice();
      AA[o] = ao;
      AA[t] = 180 - A[m] - ao;
      S[t] = (s[m] * sinD(AA[t])) / sinD(A[m]);
      const st: Step[] = [...steps, { math: `${AN[o]} ≈ ${f(ao)}°` }];
      st.push({ math: `${AN[t]} = 180° − ${AN[m]} − ${AN[o]} = ${f(AA[t])}°` });
      st.push({ math: `${SN[t]} = ${SN[m]}·sin ${AN[t]} / sin ${AN[m]} = ${f(s[m])}·sin ${f(AA[t])}° / sin ${f(A[m])}° = ${f(S[t])}` });
      out.push({ s: S, A: AA, steps: st });
    }
    return out.length ? out : { error: 'tri.errNoTriangle' };
  }

  // one side + two angles (ASA / AAS)
  const k = ks[0];
  const missing = [0, 1, 2].find((i) => angles[i] === undefined)!;
  const [i, j] = ka;
  A[missing] = 180 - A[i] - A[j];
  steps.push({ math: `${AN[missing]} = 180° − ${AN[i]} − ${AN[j]} = ${f(A[missing])}°` });
  let first = true;
  for (const x of [0, 1, 2]) {
    if (x === k) continue;
    s[x] = (s[k] * sinD(A[x])) / sinD(A[k]);
    steps.push({
      label: first ? 'tri.lawSin' : undefined,
      math: `${SN[x]} = ${SN[k]}·sin ${AN[x]} / sin ${AN[k]} = ${f(s[k])}·sin ${f(A[x])}° / sin ${f(A[k])}° = ${f(s[x])}`,
    });
    first = false;
  }
  return [{ s, A, steps }];
}
