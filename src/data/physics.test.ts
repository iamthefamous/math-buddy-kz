import { describe, expect, it } from 'vitest';
import { FORMULAS } from './physics';
import { evaluate, parseNumber } from '../lib/parse';

const close = (a: number, b: number) => expect(Math.abs(a - b)).toBeLessThanOrEqual(1e-9 * Math.max(1, Math.abs(b)));

describe('physics formulas', () => {
  it('have unique ids', () => {
    expect(new Set(FORMULAS.map((f) => f.id)).size).toBe(FORMULAS.length);
  });

  for (const f of FORMULAS) {
    describe(f.id, () => {
      const keys = f.vars.map((v) => v.key);
      const defaults = Object.fromEntries(f.vars.map((v) => [v.key, parseNumber(v.def)!]));
      // consistent data set: solve the first unknown from the defaults
      const first = Object.keys(f.solve)[0];
      const base = { ...defaults, [first]: f.solve[first].fn(defaults) };

      it('references only its own variables and never solves for a constant', () => {
        expect(new Set(keys).size).toBe(keys.length);
        for (const v of f.vars) expect(parseNumber(v.def), v.key).not.toBeNull();
        for (const [k, s] of Object.entries(f.solve)) {
          expect(keys).toContain(k);
          expect(f.vars.find((v) => v.key === k)!.konst).toBeFalsy();
          for (const [, ref] of s.tpl.matchAll(/\{(\w+)\}/g)) {
            expect(keys).toContain(ref);
            expect(ref).not.toBe(k);
          }
        }
      });

      it('templates compute the same value as their functions', () => {
        for (const s of Object.values(f.solve)) {
          const src = s.tpl.replace(/\{(\w+)\}/g, (_, k: string) => `(${base[k]})`);
          close(evaluate(src), s.fn(base));
        }
      });

      it('every rearrangement recovers the original value', () => {
        expect(Number.isFinite(base[first])).toBe(true);
        for (const [k, s] of Object.entries(f.solve)) close(s.fn(base), base[k]);
      });
    });
  }
});
