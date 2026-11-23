import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { en, type Key } from './en';
import { ru } from './ru';
import { kk } from './kk';
import { LANGS, type L10n, type Lang } from './langs';
import { fmt as fmtNum } from '../lib/format';

const DICTS: Record<Lang, Record<Key, string>> = { en, ru, kk };

export type T = (key: Key, params?: Record<string, string | number>) => string;

interface I18n {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: T;
  /** Pick the current language from an inline translation. */
  tr: (l: L10n) => string;
  /** Format a number in the current locale. */
  fmt: (n: number, digits?: number) => string;
}

const Ctx = createContext<I18n | null>(null);

function initialLang(): Lang {
  try {
    const saved = localStorage.getItem('lang');
    if (LANGS.some((l) => l.id === saved)) return saved as Lang;
  } catch { /* storage unavailable */ }
  const nav = (navigator.language || '').slice(0, 2);
  return nav === 'ru' ? 'ru' : nav === 'en' ? 'en' : 'kk';
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try { localStorage.setItem('lang', l); } catch { /* ignore */ }
  }, []);

  useEffect(() => { document.documentElement.lang = lang; }, [lang]);

  const value = useMemo<I18n>(() => {
    const dict = DICTS[lang];
    const t: T = (key, params) => {
      const s = dict[key];
      return params ? s.replace(/\{(\w+)\}/g, (m, k: string) => (k in params ? String(params[k]) : m)) : s;
    };
    return { lang, setLang, t, tr: (l) => l[lang], fmt: (n, d) => fmtNum(n, lang, d) };
  }, [lang, setLang]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n(): I18n {
  const v = useContext(Ctx);
  if (!v) throw new Error('useI18n outside provider');
  return v;
}
