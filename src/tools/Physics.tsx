import { useState } from 'react';
import { useI18n } from '../i18n';
import { Card, Field, Outcome, Segmented, Select, type Row } from '../components/ui';
import { FORMULAS, TOPICS, type TopicId } from '../data/physics';
import { parseNumber } from '../lib/parse';
import { substitute, symbolic } from '../lib/formula';

/** Pick a formula, choose the unknown, enter the rest in SI units. */
export default function Physics() {
  const { t, tr, fmt, lang } = useI18n();
  const [topic, setTopic] = useState<TopicId>('kin');
  const [id, setId] = useState(FORMULAS[0].id);
  const [want, setWant] = useState('s');
  // Shared across formulas (like the shapes tool): a typed mass stays when switching formulas.
  const [vals, setVals] = useState<Record<string, string>>({});

  const list = FORMULAS.filter((f) => f.topic === topic);
  const f = list.find((x) => x.id === id) ?? list[0];
  const unknowns = Object.keys(f.solve);
  const target = unknowns.includes(want) ? want : unknowns[0];
  const tv = f.vars.find((x) => x.key === target)!;
  const inputs = f.vars.filter((x) => x.key !== target);
  const text = (key: string) => vals[key] ?? f.vars.find((x) => x.key === key)!.def;
  const unit = (key: string) => {
    const u = tr(f.vars.find((x) => x.key === key)!.unit);
    return u === '—' ? '' : u;
  };

  const nums: Record<string, number> = {};
  let hint: string | null = null;
  let error: string | null = null;
  for (const x of inputs) {
    const n = parseNumber(text(x.key));
    if (n === null) hint = t('ui.fillAll');
    else if (x.pos && n <= 0) error = t('phys.errPositive', { v: x.sym });
    else nums[x.key] = n;
  }

  const rows: Row[] = [];
  const steps: string[] = [];
  if (!hint && !error) {
    const { tpl, fn } = f.solve[target];
    const res = fn(nums);
    if (!Number.isFinite(res)) error = t('phys.errNoSolution');
    else {
      const sym = Object.fromEntries(f.vars.map((x) => [x.key, x.sym]));
      const u = unit(target);
      const eq = Math.abs(res * 1e4 - Math.round(res * 1e4)) < 1e-9 ? '=' : '≈';
      const expr = `${tv.sym} = ${symbolic(tpl, sym)}`;
      steps.push(f.eq);
      // skip when the formula is already written for the unknown
      if (expr !== f.eq) steps.push(t('phys.express', { v: tv.sym, e: expr }));
      steps.push(`${tv.sym} = ${substitute(tpl, nums, lang)} ${eq} ${fmt(res)}${u ? ' ' + u : ''}`);
      rows.push({ label: `${tr(tv.name)} ${tv.sym}`, value: `${fmt(res)}${u ? ' ' + u : ''}`, main: true });
    }
  }

  const pickTopic = (tp: TopicId) => {
    setTopic(tp);
    setId(FORMULAS.find((x) => x.topic === tp)!.id);
  };

  return (
    <>
      <Card>
        <div className="row">
          <Select label={t('phys.topic')} value={topic} onChange={pickTopic} options={TOPICS.map((x) => ({ id: x.id, label: tr(x.name) }))} />
          <Select label={t('phys.formula')} value={f.id} onChange={setId} options={list.map((x) => ({ id: x.id, label: `${tr(x.name)}: ${x.eq}` }))} />
        </div>
        <p className="equation math">{f.eq}</p>
        <div className="field">
          <span className="label">{t('phys.find')}</span>
          <Segmented label={t('phys.find')} value={target} onChange={setWant} options={unknowns.map((k) => ({ id: k, label: f.vars.find((x) => x.key === k)!.sym }))} />
        </div>
        <div className="row">
          {inputs.map((x) => (
            <Field
              key={x.key}
              label={`${x.sym} — ${tr(x.name)}${x.konst ? ` (${t('phys.const')})` : ''}`}
              value={text(x.key)}
              onChange={(s) => setVals({ ...vals, [x.key]: s })}
              suffix={unit(x.key) || undefined}
            />
          ))}
        </div>
        <p className="hint">{t('phys.help')}</p>
      </Card>
      <Outcome error={error} hint={hint} rows={rows} steps={steps} />
    </>
  );
}
