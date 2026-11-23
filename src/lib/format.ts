import type { Lang } from '../i18n/langs';

// Kazakh number style (decimal comma, space grouping) is identical to Russian, and some
// browsers ship without kk number data (Chromium formats 'kk-KZ' as 1,234.5), so reuse ru-RU.
const LOCALES: Record<Lang, string> = { en: 'en-US', ru: 'ru-RU', kk: 'ru-RU' };

const SUP: Record<string, string> = {
  '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '-': '⁻',
};

export const superscript = (n: number | string) => String(n).split('').map((c) => SUP[c] ?? c).join('');

const cache = new Map<string, Intl.NumberFormat>();
function nf(lang: Lang, digits: number): Intl.NumberFormat {
  const key = lang + digits;
  let f = cache.get(key);
  if (!f) {
    f = new Intl.NumberFormat(LOCALES[lang], { maximumFractionDigits: digits, useGrouping: true });
    cache.set(key, f);
  }
  return f;
}

/**
 * Format a number for display in the given language.
 * Uses the locale decimal separator, the real minus sign, and scientific
 * notation (3,2·10⁻⁵) for very large or very small magnitudes.
 */
export function fmt(n: number, lang: Lang, digits = 4): string {
  if (Number.isNaN(n)) return '—';
  if (!Number.isFinite(n)) return n > 0 ? '∞' : '−∞';
  if (Math.abs(n) < 1e-12) return '0';
  const abs = Math.abs(n);
  if (abs >= 1e12 || abs < Math.pow(10, -digits)) {
    let exp = Math.floor(Math.log10(abs));
    let mant = n / Math.pow(10, exp);
    // rounding can push the mantissa to 10 (e.g. 9.99996 → 10)
    if (Math.abs(Number(mant.toFixed(4))) >= 10) { exp += 1; mant /= 10; }
    return `${nf(lang, 4).format(mant).replace('-', '−')}·10${superscript(exp)}`;
  }
  const s = nf(lang, digits).format(n);
  return s === '-0' ? '0' : s.replace('-', '−');
}

/** Wrap negatives and scientific values in parentheses for substitution into formulas: 2·(−3), (6·10⁻¹¹)². */
export function fmtSub(n: number, lang: Lang, digits = 4): string {
  const s = fmt(n, lang, digits);
  return s.startsWith('−') || s.includes('·') ? `(${s})` : s;
}

/** Signed term for "ax + b" style output: " + 3", " − 3". */
export function signed(n: number, lang: Lang, digits = 4): string {
  return n < 0 ? ` − ${fmt(-n, lang, digits)}` : ` + ${fmt(n, lang, digits)}`;
}

/** Polynomial text from coefficients (highest degree first): [2, -3, 1] → "2x² − 3x + 1". */
export function polyStr(coefs: number[], lang: Lang, v = 'x', digits = 4): string {
  const deg = coefs.length - 1;
  let out = '';
  coefs.forEach((c, i) => {
    if (c === 0) return;
    const p = deg - i;
    const abs = Math.abs(c);
    const coef = p > 0 && abs === 1 ? '' : fmt(abs, lang, digits);
    const term = coef + (p > 0 ? v : '') + (p > 1 ? superscript(p) : '');
    out += out === '' ? (c < 0 ? '−' : '') + term : (c < 0 ? ' − ' : ' + ') + term;
  });
  return out || '0';
}
