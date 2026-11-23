import { describe, expect, it } from 'vitest';
import { en, type Key } from './en';
import { ru } from './ru';
import { kk } from './kk';

const params = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

describe('dictionaries', () => {
  for (const [name, dict] of [['ru', ru], ['kk', kk]] as const) {
    it(`${name} uses the same placeholders as en`, () => {
      for (const k of Object.keys(en) as Key[]) {
        expect(dict[k].trim(), `${name}:${k}`).not.toBe('');
        expect(params(dict[k]), `${name}:${k}`).toEqual(params(en[k]));
      }
    });
  }
});
