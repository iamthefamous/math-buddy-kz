export type Lang = 'kk' | 'ru' | 'en';

export const LANGS: { id: Lang; label: string; short: string }[] = [
  { id: 'kk', label: 'Қазақша', short: 'ҚАЗ' },
  { id: 'ru', label: 'Русский', short: 'РУС' },
  { id: 'en', label: 'English', short: 'ENG' },
];

/** Inline translations for data catalogs (formulas, units, shapes). */
export type L10n = Record<Lang, string>;
