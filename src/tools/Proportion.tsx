import { useI18n } from '../i18n';
import { Card, Field, Outcome, useNum } from '../components/ui';
import { fmtSub } from '../lib/format';

/** a : b = c : d — leave exactly one field empty to solve for it. */
export default function Proportion() {
  const { t, fmt, lang } = useI18n();
  const fields = [useNum('3'), useNum('4'), useNum('9'), useNum('')];
  const names = ['a', 'b', 'c', 'd'];
  const vals = fields.map(([, , v]) => v);
  const empty = fields.map(([s]) => s.trim() === '');
  const invalid = fields.some(([s, , v]) => s.trim() !== '' && v === null);
  const s = (n: number) => fmtSub(n, lang, 6);

  let error: string | null = null;
  let hint: string | null = null;
  const steps: string[] = [];
  let answer: string | null = null;

  if (invalid || empty.filter(Boolean).length !== 1) hint = t('prop.help');
  else {
    const k = empty.indexOf(true);
    const v = vals as number[];
    steps.push(t('prop.rule'));
    // extremes: a, d; means: b, c → a·d = b·c
    const [p, q, r] = k === 0 ? [1, 2, 3] : k === 3 ? [1, 2, 0] : k === 1 ? [0, 3, 2] : [0, 3, 1];
    // unknown = v[p]·v[q] / v[r]
    if (v[r] === 0) error = t('err.divZero');
    else {
      const x = (v[p] * v[q]) / v[r];
      steps.push(`${names[k]} = ${names[p]} · ${names[q]} / ${names[r]} = ${s(v[p])} · ${s(v[q])} / ${s(v[r])} = ${fmt(x, 6)}`);
      answer = `${names[k]} = ${fmt(x, 6)}`;
      const full = v.map((n, i) => (i === k ? x : n));
      if (full[1] !== 0 && full[3] !== 0) steps.push(t('prop.check', { l: fmt(full[0] / full[1], 6), r: fmt(full[2] / full[3], 6) }));
    }
  }

  return (
    <>
      <Card>
        <div className="row proportion">
          <Field label="a" value={fields[0][0]} onChange={fields[0][1]} />
          <span className="op">:</span>
          <Field label="b" value={fields[1][0]} onChange={fields[1][1]} />
          <span className="op">=</span>
          <Field label="c" value={fields[2][0]} onChange={fields[2][1]} />
          <span className="op">:</span>
          <Field label="d" value={fields[3][0]} onChange={fields[3][1]} />
        </div>
        <p className="hint">{t('prop.help')}</p>
      </Card>
      <Outcome error={error} hint={hint} rows={answer ? [{ label: t('ui.answer'), value: answer, main: true }] : []} steps={steps} />
    </>
  );
}
