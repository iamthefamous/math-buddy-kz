import { useState } from 'react';
import { useI18n } from '../i18n';
import { Card, Field, Outcome, Segmented, Select } from '../components/ui';
import { SHAPES, type Dim } from '../data/shapes';
import { parseNumber } from '../lib/parse';
import { substitute, symbolic } from '../lib/formula';
import type { L10n } from '../i18n/langs';

type UnitId = 'none' | 'mm' | 'cm' | 'dm' | 'm' | 'km';
const UNITS: Record<UnitId, L10n> = {
  none: { en: '—', ru: '—', kk: '—' },
  mm: { en: 'mm', ru: 'мм', kk: 'мм' },
  cm: { en: 'cm', ru: 'см', kk: 'см' },
  dm: { en: 'dm', ru: 'дм', kk: 'дм' },
  m: { en: 'm', ru: 'м', kk: 'м' },
  km: { en: 'km', ru: 'км', kk: 'км' },
};
const POW: Record<Dim, string> = { len: '', area: '²', vol: '³' };
const pretty = (k: string) => k.replace('1', '₁').replace('2', '₂');

export default function Shapes() {
  const { t, tr, fmt, lang } = useI18n();
  const [solid, setSolid] = useState(false);
  const [id, setId] = useState('rect');
  const [unit, setUnit] = useState<UnitId>('cm');
  const [vals, setVals] = useState<Record<string, string>>({ a: '5', b: '3', c: '2', h: '4', r: '3', d1: '6', d2: '8' });

  const list = SHAPES.filter((s) => s.solid === solid);
  const shape = list.find((s) => s.id === id) ?? list[0];
  const u = (d: Dim) => (unit === 'none' ? '' : ` ${tr(UNITS[unit])}${POW[d]}`);

  const nums: Record<string, number> = {};
  let hint: string | null = null;
  let error: string | null = null;
  for (const inp of shape.inputs) {
    const v = parseNumber(vals[inp.key] ?? '');
    if (v === null) hint = t('ui.fillAll');
    else if (v <= 0) error = t('err.positive');
    else nums[inp.key] = v;
  }
  if (!hint && !error && shape.check) {
    const k = shape.check(nums);
    if (k) error = t(k);
  }

  const rows = [];
  const steps: string[] = [];
  if (!hint && !error) {
    const sym: Record<string, string> = {};
    shape.inputs.forEach((i) => (sym[i.key] = pretty(i.key)));
    shape.outputs.forEach((o) => (sym[o.key] = o.sym));
    const v = { ...nums };
    for (const o of shape.outputs) {
      v[o.key] = o.fn(v);
      const eq = isRound(v[o.key]) ? '=' : '≈';
      steps.push(`${o.sym} = ${symbolic(o.tpl, sym)} = ${substitute(o.tpl, v, lang)} ${eq} ${fmt(v[o.key])}${u(o.dim)}`);
      rows.push({ label: `${tr(o.name)} ${o.sym}`, value: fmt(v[o.key]) + u(o.dim), main: o.key === 'S' || o.key === 'V' });
    }
  }

  return (
    <>
      <Card>
        <Segmented
          label={t('shape.kind')}
          value={solid ? 'solid' : 'flat'}
          onChange={(k) => { const s = k === 'solid'; setSolid(s); setId(SHAPES.find((x) => x.solid === s)!.id); }}
          options={[{ id: 'flat', label: t('shape.flat') }, { id: 'solid', label: t('shape.solid') }]}
        />
        <div className="row">
          <Select label={t('shape.shape')} value={shape.id} onChange={setId} options={list.map((s) => ({ id: s.id, label: tr(s.name) }))} />
          <Select label={t('shape.unit')} value={unit} onChange={setUnit} options={(Object.keys(UNITS) as UnitId[]).map((k) => ({ id: k, label: tr(UNITS[k]) }))} />
        </div>
        <div className="row">
          {shape.inputs.map((i) => (
            <Field key={i.key} label={tr(i.name)} value={vals[i.key] ?? ''} onChange={(s) => setVals({ ...vals, [i.key]: s })} suffix={u('len').trim() || undefined} />
          ))}
        </div>
      </Card>
      <Outcome error={error} hint={hint} rows={rows} steps={steps} />
    </>
  );
}

/** Values that are displayed exactly (no rounding happened). */
const isRound = (x: number) => Math.abs(x * 1e4 - Math.round(x * 1e4)) < 1e-9;
