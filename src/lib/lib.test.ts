import { describe, expect, it } from 'vitest';
import { compile, evaluate, parseNumber, ParseError } from './parse';
import { fmt, fmtSub } from './format';
import { factorize, frac, add, div, mixedStr, parseFrac, simplifySqrt, toFrac, lcm } from './numtheory';
import { exactTrig, piForm, quadrant, referenceAngle, trigValue, DEG, specialArgForm } from './trig';

describe('parser', () => {
  it.each([
    ['2+3*4', 14], ['2^3^2', 512], ['-2^2', -4], ['2^-1', 0.5], ['(1+2)(3+4)', 21],
    ['√3/2', Math.sqrt(3) / 2], ['2√3', 2 * Math.sqrt(3)], ['5π/6', (5 * Math.PI) / 6], ['5pi/6', (5 * Math.PI) / 6],
    ['30°', Math.PI / 6], ['sin(30°)', 0.5], ['1,5', 1.5], ['6:2', 3], ['3²', 9], ['lg(1000)', 3], ['ln(e)', 1],
    ['(-8)^(1/3)', -2], ['2e', 2 * Math.E], ['1e3', 1000], ['arcsin(1)', Math.PI / 2], ['ctg(π/4)', 1], ['−4', -4],
  ])('%s', (src, v) => expect(evaluate(src)).toBeCloseTo(v as number, 10));

  it('rejects bad input', () => {
    for (const bad of ['', '2+', '(1', 'sin 30', 'foo', '2 3', 'x+1', '1.2.3']) {
      expect(() => evaluate(bad), bad).toThrow(ParseError);
    }
  });

  it('compiles functions of x', () => {
    const f = compile('2x^2 - 3x + 1');
    expect(f(2)).toBe(3);
    expect(compile('xsin(x)')(Math.PI / 2)).toBeCloseTo(Math.PI / 2);
    expect(compile('e^x')(1)).toBeCloseTo(Math.E);
  });

  it('parseNumber returns null for invalid or non-finite', () => {
    expect(parseNumber('1/0')).toBeNull();
    expect(parseNumber('abc')).toBeNull();
    expect(parseNumber(' ')).toBeNull();
    expect(parseNumber('0,25')).toBe(0.25);
  });
});

describe('format', () => {
  it('uses locale separators and unicode minus', () => {
    expect(fmt(1.5, 'en')).toBe('1.5');
    expect(fmt(1.5, 'ru')).toBe('1,5');
    expect(fmt(1.5, 'kk')).toBe('1,5');
    expect(fmt(-2, 'en')).toBe('−2');
    expect(fmt(1 / 3, 'en')).toBe('0.3333');
    expect(fmt(6.674e-11, 'en')).toBe('6.674·10⁻¹¹');
    expect(fmt(3e15, 'ru')).toBe('3·10¹⁵');
    expect(fmt(-1e-15, 'en')).toBe('0');
    expect(fmtSub(-3, 'en')).toBe('(−3)');
  });
});

describe('number theory', () => {
  it('factorizes', () => {
    expect(factorize(84)).toEqual([[2, 2], [3, 1], [7, 1]]);
    expect(factorize(97)).toEqual([[97, 1]]);
    expect(lcm(4, 6)).toBe(12);
  });
  it('fractions', () => {
    expect(add(frac(1, 2), frac(1, 3))).toEqual({ n: 5, d: 6 });
    expect(div(frac(1, 2), frac(-1, 4))).toEqual({ n: -2, d: 1 });
    expect(mixedStr(frac(-7, 3))).toBe('−2 1/3');
    expect(parseFrac('2 1/3')).toEqual({ n: 7, d: 3 });
    expect(parseFrac('-2 1/3')).toEqual({ n: -7, d: 3 });
    expect(parseFrac('−6/8')).toEqual({ n: -3, d: 4 });
    expect(parseFrac('5')).toEqual({ n: 5, d: 1 });
    expect(parseFrac('1/0')).toBeNull();
    expect(parseFrac('2 3')).toBeNull();
    expect(simplifySqrt(72)).toEqual([6, 2]);
    expect(toFrac(0.75)).toEqual({ n: 3, d: 4 });
    expect(toFrac(Math.PI)).toBeNull();
    expect(toFrac(1 / 3)).toEqual({ n: 1, d: 3 });
    expect(toFrac(-2.5)).toEqual({ n: -5, d: 2 });
    expect(toFrac(7)).toEqual({ n: 7, d: 1 });
    expect(toFrac(Math.SQRT2)).toBeNull();
  });
});

describe('trig', () => {
  it('exact values in all quadrants', () => {
    expect(exactTrig('sin', 150)).toBe('1/2');
    expect(exactTrig('cos', 150)).toBe('−√3/2');
    expect(exactTrig('tan', 150)).toBe('−√3/3');
    expect(exactTrig('tan', 90)).toBeNull();
    expect(exactTrig('cot', 270)).toBe('0');
    expect(exactTrig('sin', 270)).toBe('−1');
    expect(exactTrig('cos', 180)).toBe('−1');
    expect(exactTrig('sin', 180)).toBe('0');
    expect(exactTrig('tan', 105)).toBe('−(2 + √3)');
    expect(exactTrig('sin', 195)).toBe('−(√6 − √2)/4');
    expect(exactTrig('sin', -30)).toBe('−1/2');
    expect(exactTrig('sin', 20)).toBeUndefined();
  });
  it('exact strings agree with numeric values', () => {
    for (let d = -360; d <= 720; d += 15) {
      for (const fn of ['sin', 'cos', 'tan', 'cot'] as const) {
        const ex = exactTrig(fn, d);
        const num = trigValue(fn, d * DEG);
        if (ex === null) { expect(num, `${fn} ${d}`).toBeNull(); continue; }
        expect(evaluate(ex!), `${fn} ${d}`).toBeCloseTo(num!, 9);
      }
    }
  });
  it('quadrants and reference angles', () => {
    expect(quadrant(135)).toBe(2);
    expect(quadrant(-45)).toBe(4);
    expect(quadrant(180)).toBe(0);
    expect(referenceAngle(210)).toBe(30);
    expect(referenceAngle(-30)).toBe(30);
  });
  it('pi form', () => {
    expect(piForm((5 * Math.PI) / 6)).toBe('5π/6');
    expect(piForm(-Math.PI)).toBe('−π');
    expect(piForm(Math.PI / 4)).toBe('π/4');
    expect(piForm(0)).toBe('0');
    expect(piForm(1)).toBeUndefined();
    expect(specialArgForm(-Math.sqrt(3) / 2)).toBe('−√3/2');
  });
});

import { polyStr } from './format';
describe('polyStr', () => {
  it('formats polynomials', () => {
    expect(polyStr([2, -3, 1], 'en')).toBe('2x² − 3x + 1');
    expect(polyStr([-1, 0, 0], 'en')).toBe('−x²');
    expect(polyStr([0, 1, -0.5], 'ru')).toBe('x − 0,5');
    expect(polyStr([0, 0], 'en')).toBe('0');
    expect(polyStr([1, 2], 'en', 'y')).toBe('y + 2');
  });
});

import { exactQuadRoots, toIntegers } from './algebra';
describe('quadratic exact roots', () => {
  it('handles all cases', () => {
    expect(exactQuadRoots(1, -5, 6)).toEqual(['2', '3']);
    expect(exactQuadRoots(1, 2, 1)).toEqual(['−1']);
    expect(exactQuadRoots(1, 0, 1)).toEqual([]);
    expect(exactQuadRoots(1, -2, -1)).toEqual(['1 ± √2']);
    expect(exactQuadRoots(2, 3, -1)).toEqual(['(−3 ± √17)/4']);
    expect(exactQuadRoots(1, 0, -3)).toEqual(['±√3']);
    expect(exactQuadRoots(-1, 2, 1)).toEqual(['1 ± √2']);
    expect(exactQuadRoots(2, -1, -1)).toEqual(['−1/2', '1']);
    expect(exactQuadRoots(0.5, -1, -1)).toEqual(['1 ± √3']);
    expect(exactQuadRoots(4, 0, -3)).toEqual(['±√3/2']);
    expect(exactQuadRoots(1, Math.PI, 1)).toBeNull();
    expect(toIntegers([0.5, 1 / 3])).toEqual([3, 2]);
  });
});

import { solveTrigEq } from './trigeq';
describe('trig equations', () => {
  const N = { tan: 'tg', cot: 'ctg', arctan: 'arctg', arccot: 'arcctg' };
  const F = (n: number) => n.toFixed(4);
  it('general solutions', () => {
    expect(solveTrigEq('sin', 0.5, N, F).general).toBe('(−1)ᵏ·π/6 + πk');
    expect(solveTrigEq('sin', -Math.sqrt(2) / 2, N, F).general).toBe('(−1)ᵏ⁺¹·π/4 + πk');
    expect(solveTrigEq('sin', 1, N, F).general).toBe('π/2 + 2πk');
    expect(solveTrigEq('sin', 2, N, F).general).toBeNull();
    expect(solveTrigEq('cos', -0.5, N, F).general).toBe('±2π/3 + 2πk');
    expect(solveTrigEq('cos', 0.3, N, F).general).toBe('±arccos(0.3000) + 2πk');
    expect(solveTrigEq('tan', -Math.sqrt(3), N, F).general).toBe('−π/3 + πk');
    expect(solveTrigEq('cot', -1, N, F).general).toBe('3π/4 + πk');
    expect(solveTrigEq('cot', 0, N, F).general).toBe('π/2 + πk');
  });
  it('solutions in one turn satisfy the equation', () => {
    const fns = { sin: Math.sin, cos: Math.cos, tan: Math.tan, cot: (x: number) => 1 / Math.tan(x) };
    for (const fn of ['sin', 'cos', 'tan', 'cot'] as const) {
      for (const a of [-1, -0.7, -0.5, 0, 0.3, 0.5, 1, 2.5]) {
        const r = solveTrigEq(fn, a, N, F);
        for (const x of r.inTurn) {
          expect(x).toBeGreaterThanOrEqual(0);
          expect(x).toBeLessThan(2 * Math.PI);
          expect(fns[fn](x), `${fn} ${a} ${x}`).toBeCloseTo(a, 9);
        }
      }
    }
    expect(solveTrigEq('sin', 0.5, N, F).inTurn).toHaveLength(2);
    expect(solveTrigEq('sin', 1, N, F).inTurn).toHaveLength(1);
    expect(solveTrigEq('cos', 1, N, F).inTurn).toEqual([0]);
    expect(solveTrigEq('sin', 0, N, F).inTurn).toHaveLength(2);
  });
});
