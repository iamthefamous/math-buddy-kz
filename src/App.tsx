import { useEffect, useRef, useState } from 'react';
import { useI18n } from './i18n';
import { LANGS } from './i18n/langs';
import { useTheme } from './lib/useTheme';
import { Segmented } from './components/ui';
import { CATEGORIES, TOOLS, findTool, type ToolDef } from './tools';

/** Current route from the URL hash: "" for home, otherwise a tool id. */
function useRoute(): string {
  const read = () => decodeURIComponent(location.hash.replace(/^#\/?/, ''));
  const [route, setRoute] = useState(read);
  useEffect(() => {
    const on = () => setRoute(read());
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}

/** Selected grade (0 = all), remembered per browser. */
function useGrade(): [number, (g: number) => void] {
  const [grade, setGrade] = useState(() => {
    try { return Math.min(11, Math.max(0, Number(localStorage.getItem('grade')) || 0)); } catch { return 0; }
  });
  const set = (g: number) => {
    setGrade(g);
    try { localStorage.setItem('grade', String(g)); } catch { /* ignore */ }
  };
  return [grade, set];
}

const inGrade = (tool: ToolDef, g: number) => g === 0 || (g >= tool.grades[0] && g <= tool.grades[1]);

export default function App() {
  const { t, lang, setLang } = useI18n();
  const [theme, toggleTheme] = useTheme();
  const route = useRoute();
  const tool = findTool(route);

  useEffect(() => {
    document.title = tool ? `${t(`tool.${tool.id}.name`)} — Math Buddy KZ` : `Math Buddy KZ — ${t('app.tagline')}`;
  }, [tool, t]);

  return (
    <div className="app">
      <header className="top">
        <a href="#/" className="brand">
          <span className="logo" aria-hidden="true">π</span>
          <span className="brand-text">
            <b>Math Buddy KZ</b>
            <small>{t('app.tagline')}</small>
          </span>
        </a>
        <div className="top-ctrls">
          <Segmented
            label={t('app.language')}
            value={lang}
            onChange={setLang}
            options={LANGS.map((l) => ({ id: l.id, label: <span title={l.label} lang={l.id}>{l.short}</span> }))}
          />
          <button
            type="button"
            className="icon-btn"
            onClick={toggleTheme}
            aria-label={t(theme === 'dark' ? 'app.toLight' : 'app.toDark')}
            title={t(theme === 'dark' ? 'app.toLight' : 'app.toDark')}
          >
            {theme === 'dark' ? '☀' : '☾'}
          </button>
        </div>
      </header>
      {tool ? <ToolPage tool={tool} /> : <Home />}
      <footer className="foot">{t('app.footer')}</footer>
    </div>
  );
}

function GradeBadge({ g }: { g: readonly [number, number] }) {
  const { t } = useI18n();
  return <span className="grade-badge">{g[0] === g[1] ? t('app.gradeOne', { g: g[0] }) : t('app.gradeRange', { g: `${g[0]}–${g[1]}` })}</span>;
}

function Home() {
  const { t } = useI18n();
  const [grade, setGrade] = useGrade();
  const [q, setQ] = useState('');
  const query = q.trim().toLowerCase();
  const visible = (TOOLS as readonly ToolDef[]).filter((x) =>
    inGrade(x, grade) &&
    (query === '' || `${t(`tool.${x.id}.name`)} ${t(`tool.${x.id}.desc`)}`.toLowerCase().includes(query)));

  return (
    <main className="home">
      <section className="hero">
        <h1>{t('app.heroTitle')}</h1>
        <p>{t('app.heroText')}</p>
      </section>
      <div className="filters">
        <div className="grades" role="group" aria-label={t('app.grade')}>
          <span className="grades-label">{t('app.grade')}:</span>
          <button type="button" aria-pressed={grade === 0} onClick={() => setGrade(0)}>{t('app.allGrades')}</button>
          {Array.from({ length: 11 }, (_, i) => i + 1).map((g) => (
            <button key={g} type="button" aria-pressed={grade === g} onClick={() => setGrade(g)}>{g}</button>
          ))}
        </div>
        <input type="search" className="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('app.search')} aria-label={t('app.search')} />
      </div>
      {CATEGORIES.map((cat) => {
        const list = visible.filter((x) => x.cat === cat);
        if (list.length === 0) return null;
        return (
          <section key={cat} className="cat">
            <h2>{t(`cat.${cat}`)}</h2>
            <div className="tool-grid">
              {list.map((x) => (
                <a key={x.id} className="tool-card" href={`#/${x.id}`}>
                  <span className="tool-icon" aria-hidden="true">{x.icon}</span>
                  <span className="tool-text">
                    <b>{t(`tool.${x.id}.name`)}</b>
                    <span>{t(`tool.${x.id}.desc`)}</span>
                  </span>
                  <GradeBadge g={x.grades} />
                </a>
              ))}
            </div>
          </section>
        );
      })}
      {visible.length === 0 && <p className="empty">{t('app.nothing')}</p>}
    </main>
  );
}

function ToolPage({ tool }: { tool: ToolDef }) {
  const { t } = useI18n();
  const h1 = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    window.scrollTo(0, 0);
    h1.current?.focus({ preventScroll: true });
  }, [tool.id]);
  const { Component } = tool;

  return (
    <div className="tool-layout">
      <nav className="side" aria-label={t('app.allTools')}>
        {CATEGORIES.map((cat) => (
          <div key={cat}>
            <h2>{t(`cat.${cat}`)}</h2>
            {(TOOLS as readonly ToolDef[]).filter((x) => x.cat === cat).map((x) => (
              <a key={x.id} href={`#/${x.id}`} aria-current={x.id === tool.id ? 'page' : undefined}>{t(`tool.${x.id}.name`)}</a>
            ))}
          </div>
        ))}
      </nav>
      <main className="tool-page">
        <a href="#/" className="back">← {t('app.allTools')}</a>
        <header className="tool-head">
          <h1 ref={h1} tabIndex={-1}>{t(`tool.${tool.id}.name`)}</h1>
          <GradeBadge g={tool.grades} />
          <p>{t(`tool.${tool.id}.desc`)}</p>
        </header>
        <Component key={tool.id} />
      </main>
    </div>
  );
}
