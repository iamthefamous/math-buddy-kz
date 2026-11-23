import { useState } from 'react';
import { useI18n } from '../i18n';
import { Card, Field, Message, Results } from '../components/ui';
import { evaluate } from '../lib/parse';
import { toFrac, fracStr } from '../lib/numtheory';
import { piForm } from '../lib/trig';

const KEYS = ['7', '8', '9', '÷', '(', ')', '4', '5', '6', '×', '^', '√', '1', '2', '3', '−', 'π', '°', '0', ',', '+', 'sin(', 'cos(', 'tg('];

export default function Calculator() {
  const { t, fmt } = useI18n();
  const [expr, setExpr] = useState('2(3 + 4)^2 − √16');

  let result: number | null = null;
  let error = false;
  if (expr.trim()) {
    try {
      result = evaluate(expr);
      if (!Number.isFinite(result)) error = true;
    } catch {
      error = true;
    }
  }

  const f = result !== null && !error ? toFrac(result) : null;
  const pi = result !== null && !error ? piForm(result) : undefined;

  return (
    <>
      <Card>
        <Field label={t('calc.expr')} value={expr} onChange={setExpr} kind="text" wide invalid={error} placeholder="2 + 3·4" />
        <div className="keypad">
          {KEYS.map((k) => (
            <button key={k} type="button" onClick={() => setExpr(expr + k)}>{k}</button>
          ))}
          <button type="button" className="wide2" onClick={() => setExpr(expr.slice(0, -1))} aria-label={t('calc.back')}>⌫</button>
          <button type="button" className="wide2" onClick={() => setExpr('')}>{t('calc.clear')}</button>
        </div>
        <p className="hint">{t('calc.help')}</p>
      </Card>
      {error && <Message kind="error">{t('calc.error')}</Message>}
      {result !== null && !error && (
        <Results
          rows={[
            { label: t('ui.result'), value: fmt(result, 10), main: true },
            ...(f && f.d !== 1 ? [{ label: t('calc.fraction'), value: fracStr(f) }] : []),
            ...(pi && pi !== '0' && !f ? [{ label: t('calc.piForm'), value: pi }] : []),
          ]}
        />
      )}
    </>
  );
}
