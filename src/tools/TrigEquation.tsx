import { useState } from 'react';
import { useI18n } from '../i18n';
import { Card, Field, Outcome, Segmented, useNum, type Row } from '../components/ui';
import { solveTrigEq } from '../lib/trigeq';
import { DEG, piForm, specialArgForm, type TrigFn } from '../lib/trig';

export default function TrigEquation() {
  const { t, fmt } = useI18n();
  const [fn, setFn] = useState<TrigFn>('sin');
  const [as, setA, a] = useNum('√3/2');
  const names = { tan: t('fn.tan'), cot: t('fn.cot'), arctan: t('fn.arctan'), arccot: t('fn.arccot') };
  const label = (f: TrigFn) => (f === 'tan' ? names.tan : f === 'cot' ? names.cot : f);

  const rows: Row[] = [];
  const steps: string[] = [];
  if (a !== null) {
    const r = solveTrigEq(fn, a, names, (n) => fmt(n, 4));
    const argStr = specialArgForm(a) ?? fmt(a, 6);
    steps.push(`${label(fn)} x = ${argStr}`);
    if (r.general === null) {
      steps.push(t('teq.noneStep', { a: argStr, f: label(fn) }));
      rows.push({ label: t('ui.answer'), value: t('teq.none'), main: true });
    } else {
      if (r.special) steps.push(t('teq.special'));
      else steps.push(t(`teq.formula.${fn}`, { at: names.arctan, act: names.arccot }));
      if (r.principal) {
        const p = r.principal;
        steps.push(`${p.name}(${argStr}) = ${p.exact ? `${p.exact} ≈ ` : '≈ '}${fmt(p.value, 4)} (${fmt(p.value / DEG, 4)}°)`);
      }
      steps.push(`x = ${r.general}, k ∈ ℤ`);
      rows.push({ label: t('teq.general'), value: `x = ${r.general}, k ∈ ℤ`, main: true });
      rows.push({
        label: t('teq.inTurn'),
        value: r.inTurn.map((x) => `${piForm(x) ?? fmt(x, 4)} (${fmt(x / DEG, 4)}°)`).join('; '),
      });
    }
  }

  return (
    <>
      <Card>
        <div className="row">
          <Segmented label={t('teq.function')} value={fn} onChange={setFn} options={(['sin', 'cos', 'tan', 'cot'] as TrigFn[]).map((f) => ({ id: f, label: `${label(f)} x` }))} />
          <Field label={`${label(fn)} x =`} value={as} onChange={setA} placeholder="1/2, √2/2, -√3/2" />
        </div>
        <p className="hint">{t('teq.help')}</p>
      </Card>
      <Outcome hint={a === null ? t('ui.fillAll') : null} rows={rows} steps={steps} />
    </>
  );
}
