import { describe, expect, it } from 'vitest';
import { solveRight, solveTriangle, type Tri } from './triangle';

const f = (n: number) => n.toFixed(4);
const fn = { tan: 'tg', arctan: 'arctg' };

describe('right triangle', () => {
  const cases: [Record<string, number>][] = [
    [{ a: 3, b: 4 }], [{ a: 3, c: 5 }], [{ b: 4, c: 5 }], [{ a: 3, al: 36.86989764584402 }],
    [{ a: 3, be: 53.13010235415598 }], [{ b: 4, be: 53.13010235415598 }], [{ b: 4, al: 36.86989764584402 }],
    [{ c: 5, al: 36.86989764584402 }], [{ c: 5, be: 53.13010235415598 }],
  ];
  it.each(cases)('solves %o to 3-4-5', (k) => {
    const r = solveRight(k, f, fn);
    if ('error' in r) throw new Error(r.error);
    expect(r.a).toBeCloseTo(3, 9);
    expect(r.b).toBeCloseTo(4, 9);
    expect(r.c).toBeCloseTo(5, 9);
    expect(r.al + r.be).toBeCloseTo(90, 9);
    expect(r.steps.length).toBeGreaterThan(0);
  });
  it('validates', () => {
    expect(solveRight({ al: 30, be: 60 }, f, fn)).toEqual({ error: 'tri.needSide' });
    expect(solveRight({ a: 5, c: 3 }, f, fn)).toEqual({ error: 'tri.errHyp' });
    expect(solveRight({ a: 5 }, f, fn)).toEqual({ error: 'tri.needTwo' });
    expect(solveRight({ a: 5, al: 90 }, f, fn)).toEqual({ error: 'tri.errAcute' });
  });
});

const sol = (r: Tri[] | { error: string }) => {
  if ('error' in r) throw new Error(r.error);
  return r;
};

describe('any triangle', () => {
  it('SSS', () => {
    const [t] = sol(solveTriangle([3, 4, 5], [undefined, undefined, undefined], f));
    expect(t.A[2]).toBeCloseTo(90, 9);
    expect(t.A[0] + t.A[1] + t.A[2]).toBeCloseTo(180, 9);
  });
  it('SAS', () => {
    const [t] = sol(solveTriangle([3, 4, undefined], [undefined, undefined, 90], f));
    expect(t.s[2]).toBeCloseTo(5, 9);
    expect(t.A[0]).toBeCloseTo(36.86989764584402, 9);
  });
  it('ASA', () => {
    const [t] = sol(solveTriangle([undefined, undefined, 10], [60, 60, undefined], f));
    expect(t.s[0]).toBeCloseTo(10, 9);
    expect(t.s[1]).toBeCloseTo(10, 9);
    expect(t.A[2]).toBeCloseTo(60, 9);
  });
  it('SSA ambiguous: two solutions', () => {
    const r = sol(solveTriangle([6, 8, undefined], [40, undefined, undefined], f));
    expect(r).toHaveLength(2);
    for (const t of r) {
      // law of sines must hold in each solution
      const k = t.s[0] / Math.sin((t.A[0] * Math.PI) / 180);
      expect(t.s[1] / Math.sin((t.A[1] * Math.PI) / 180)).toBeCloseTo(k, 9);
      expect(t.s[2] / Math.sin((t.A[2] * Math.PI) / 180)).toBeCloseTo(k, 9);
    }
  });
  it('SSA single and none', () => {
    expect(sol(solveTriangle([10, 8, undefined], [40, undefined, undefined], f))).toHaveLength(1);
    expect(solveTriangle([2, 8, undefined], [40, undefined, undefined], f)).toEqual({ error: 'tri.errNoTriangle' });
    expect(sol(solveTriangle([4, 8, undefined], [30, undefined, undefined], f))[0].A[1]).toBeCloseTo(90, 6);
  });
  it('validates', () => {
    expect(solveTriangle([1, 2, 5], [undefined, undefined, undefined], f)).toEqual({ error: 'tri.errInequality' });
    expect(solveTriangle([undefined, undefined, undefined], [60, 60, 60], f)).toEqual({ error: 'tri.needSide' });
    expect(solveTriangle([3, undefined, undefined], [100, 90, undefined], f)).toEqual({ error: 'tri.errSum' });
  });
});
