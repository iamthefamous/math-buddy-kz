import type { Lang } from '../i18n/langs';
import { fmtSub } from './format';

/**
 * Formula templates use {key} placeholders, e.g. "{a}·{b}" or "({v}² − {v0}²)/(2·{a})".
 * The same template renders symbolically ("a·b") and with substituted values ("3·4").
 */
export function symbolic(tpl: string, sym: Record<string, string>): string {
  return tpl.replace(/\{(\w+)\}/g, (_, k: string) => sym[k] ?? k);
}

export function substitute(tpl: string, values: Record<string, number>, lang: Lang, digits = 4): string {
  return tpl.replace(/\{(\w+)\}/g, (_, k: string) => fmtSub(values[k], lang, digits));
}
