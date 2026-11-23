import { useId, useState, type ReactNode } from 'react';
import { useI18n } from '../i18n';
import { parseNumber } from '../lib/parse';

/** Text state + parsed numeric value (null when empty/invalid). */
export function useNum(initial = ''): [string, (s: string) => void, number | null] {
  const [text, setText] = useState(initial);
  return [text, setText, parseNumber(text)];
}

const PLAIN_NUMBER = /^\s*[-−]?\d*[.,]?\d+\s*$/;

interface FieldProps {
  label: ReactNode;
  value: string;
  onChange: (s: string) => void;
  placeholder?: string;
  suffix?: ReactNode;
  /** 'number' validates as a math expression; 'text' accepts anything. */
  kind?: 'number' | 'text';
  invalid?: boolean;
  wide?: boolean;
}

export function Field({ label, value, onChange, placeholder, suffix, kind = 'number', invalid, wide }: FieldProps) {
  const id = useId();
  const { t, fmt } = useI18n();
  const parsed = kind === 'number' ? parseNumber(value) : null;
  const bad = invalid ?? (kind === 'number' && value.trim() !== '' && parsed === null);
  const showPreview = kind === 'number' && parsed !== null && !PLAIN_NUMBER.test(value);
  return (
    <div className={'field' + (wide ? ' wide' : '')}>
      <label htmlFor={id}>{label}</label>
      <div className={'input-wrap' + (bad ? ' bad' : '')}>
        <input
          id={id}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          inputMode={kind === 'number' ? 'decimal' : 'text'}
          autoComplete="off"
          spellCheck={false}
          aria-invalid={bad || undefined}
        />
        {suffix && <span className="suffix">{suffix}</span>}
      </div>
      {bad && kind === 'number' && <span className="field-msg">{t('ui.badNumber')}</span>}
      {showPreview && <span className="field-msg muted">= {fmt(parsed, 6)}</span>}
    </div>
  );
}

export function Segmented<V extends string>({ options, value, onChange, label }: {
  options: { id: V; label: ReactNode }[];
  value: V;
  onChange: (v: V) => void;
  label?: string;
}) {
  return (
    <div className="segmented" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          role="radio"
          aria-checked={o.id === value}
          className={o.id === value ? 'on' : ''}
          onClick={() => onChange(o.id)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Select<V extends string>({ options, value, onChange, label }: {
  options: { id: V; label: string }[];
  value: V;
  onChange: (v: V) => void;
  label: ReactNode;
}) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value as V)}>
        {options.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
      </select>
    </div>
  );
}

export function Card({ title, children, className }: { title?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={'card' + (className ? ' ' + className : '')}>
      {title && <h3>{title}</h3>}
      {children}
    </section>
  );
}

export interface Row { label: ReactNode; value: ReactNode; main?: boolean }

export function Results({ rows }: { rows: Row[] }) {
  const { t } = useI18n();
  return (
    <Card title={t('ui.result')}>
      <dl className="results" aria-live="polite">
        {rows.map((r, i) => (
          <div key={i} className={r.main ? 'main' : ''}>
            <dt>{r.label}</dt>
            <dd className="math">{r.value}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}

export function Steps({ steps }: { steps: ReactNode[] }) {
  const { t } = useI18n();
  if (steps.length === 0) return null;
  return (
    <Card title={t('ui.steps')}>
      <ol className="steps">
        {steps.map((s, i) => <li key={i} className="math">{s}</li>)}
      </ol>
    </Card>
  );
}

export function Message({ children, kind = 'info' }: { children: ReactNode; kind?: 'info' | 'error' }) {
  return <div className={'message ' + kind} role={kind === 'error' ? 'alert' : 'status'}>{children}</div>;
}

/** Standard tool body: inputs on top, then result and steps (or a hint/error). */
export function Outcome({ error, hint, rows, steps, extra }: {
  error?: string | null;
  hint?: string | null;
  rows?: Row[];
  steps?: ReactNode[];
  extra?: ReactNode;
}) {
  if (error) return <Message kind="error">{error}</Message>;
  if (hint) return <Message>{hint}</Message>;
  return (
    <>
      {rows && rows.length > 0 && <Results rows={rows} />}
      {extra}
      {steps && <Steps steps={steps} />}
    </>
  );
}
