import { useState } from 'react';
import { useI18n } from '../i18n';
import { Card, Field, Outcome, Select, useNum } from '../components/ui';
import { fmtSub } from '../lib/format';

type Mode = 'of' | 'whole' | 'ratio' | 'change' | 'apply';
const MODES: Mode[] = ['of', 'whole', 'ratio', 'change', 'apply'];

export default function Percent() {
  const { t, fmt, lang } = useI18n();
  const [mode, setMode] = useState<Mode>('of');
  const [as, setA, a] = useNum('15');
  const [bs, setB, b] = useNum('240');
  const s = (n: number) => fmtSub(n, lang, 6);

  let error: string | null = null;
  let answer: string | null = null;
  const steps: string[] = [];

  if (a !== null && b !== null) {
    switch (mode) {
      case 'of': { // a% of b
        const r = (b * a) / 100;
        steps.push(t('pct.ofStep', { p: s(a), n: s(b) }));
        steps.push(`${s(b)} · ${s(a)} / 100 = ${fmt(r, 6)}`);
        answer = fmt(r, 6);
        break;
      }
      case 'whole': { // a is b% of what
        if (b === 0) { error = t('err.divZero'); break; }
        const r = (a * 100) / b;
        steps.push(t('pct.wholeStep', { p: s(b) }));
        steps.push(`${s(a)} · 100 / ${s(b)} = ${fmt(r, 6)}`);
        answer = fmt(r, 6);
        break;
      }
      case 'ratio': { // a is what % of b
        if (b === 0) { error = t('err.divZero'); break; }
        const r = (a / b) * 100;
        steps.push(`${s(a)} / ${s(b)} · 100% = ${fmt(r, 6)}%`);
        answer = fmt(r, 6) + '%';
        break;
      }
      case 'change': { // from a to b
        if (a === 0) { error = t('err.divZero'); break; }
        const r = ((b - a) / Math.abs(a)) * 100;
        steps.push(`(${s(b)} − ${s(a)}) / ${fmt(Math.abs(a), 6)} · 100% = ${fmt(r, 6)}%`);
        steps.push(t(r > 0 ? 'pct.up' : r < 0 ? 'pct.down' : 'pct.same', { r: fmt(Math.abs(r), 6) }));
        answer = (r > 0 ? '+' : '') + fmt(r, 6) + '%';
        break;
      }
      case 'apply': { // a changed by b%
        const r = a * (1 + b / 100);
        steps.push(`${s(a)} · (1 + ${s(b)}/100) = ${s(a)} · ${fmt(1 + b / 100, 6)} = ${fmt(r, 6)}`);
        answer = fmt(r, 6);
        break;
      }
    }
  }

  return (
    <>
      <Card>
        <Select label={t('pct.mode')} value={mode} onChange={setMode} options={MODES.map((m) => ({ id: m, label: t(`pct.${m}`) }))} />
        <div className="row">
          <Field label={t(`pct.${mode}A`)} value={as} onChange={setA} />
          <Field label={t(`pct.${mode}B`)} value={bs} onChange={setB} />
        </div>
      </Card>
      <Outcome
        error={error}
        hint={a === null || b === null ? t('ui.fillAll') : null}
        rows={answer ? [{ label: t('ui.answer'), value: answer, main: true }] : []}
        steps={steps}
      />
    </>
  );
}
