import { useState } from 'react';
import { useI18n } from '../i18n';
import { Card, Field, Outcome, Select, useNum, type Row } from '../components/ui';
import { QUANTITIES, TEMP_UNITS, fromCelsius, toCelsius, type TempId } from '../data/units';
import { fmtSub } from '../lib/format';

const TEMP = 'temp';

export default function Units() {
  const { t, tr, fmt, lang } = useI18n();
  const [qid, setQid] = useState('length');
  const [vs, setV, v] = useNum('2.5');
  const [from, setFrom] = useState('km');
  const [to, setTo] = useState('m');
  const f6 = (n: number) => fmt(n, 6);
  const s6 = (n: number) => fmtSub(n, lang, 6);

  const isTemp = qid === TEMP;
  const q = QUANTITIES.find((x) => x.id === qid);
  const options = isTemp
    ? TEMP_UNITS.map((x) => ({ id: x.id as string, label: `${x.sym} — ${tr(x.name)}` }))
    : q!.units.map((x) => ({ id: x.id, label: `${tr(x.sym)} — ${tr(x.name)}` }));
  const ids = options.map((o) => o.id);
  const a = ids.includes(from) ? from : ids[0];
  const b = ids.includes(to) ? to : ids[Math.min(1, ids.length - 1)];

  const pickQuantity = (id: string) => {
    setQid(id);
    const us = id === TEMP ? TEMP_UNITS.map((x) => x.id as string) : QUANTITIES.find((x) => x.id === id)!.units.map((x) => x.id);
    setFrom(us[0]);
    setTo(us[1]);
  };

  let error: string | null = null;
  const rows: Row[] = [];
  const steps: string[] = [];

  if (v !== null && isTemp) {
    const sym = (id: string) => TEMP_UNITS.find((x) => x.id === id)!.sym;
    const c = toCelsius(a as TempId, v);
    if (c < -273.15 - 1e-9) error = t('unit.belowZero');
    else {
      const r = fromCelsius(b as TempId, c);
      const k = fmt(273.15);
      if (a === 'K') steps.push(`t = T − ${k} = ${s6(v)} − ${k} = ${f6(c)} °C`);
      if (a === 'F') steps.push(`t = (F − 32)·5/9 = (${s6(v)} − 32)·5/9 = ${f6(c)} °C`);
      if (b === 'K') steps.push(`T = t + ${k} = ${s6(c)} + ${k} = ${f6(r)} K`);
      if (b === 'F') steps.push(`F = t·9/5 + 32 = ${s6(c)}·9/5 + 32 = ${f6(r)} °F`);
      if (a === b) steps.push(t('unit.same'));
      rows.push({ label: `${f6(v)} ${sym(a)}`, value: `${f6(r)} ${sym(b)}`, main: true });
      for (const x of TEMP_UNITS) if (x.id !== a && x.id !== b) rows.push({ label: tr(x.name), value: `${f6(fromCelsius(x.id, c))} ${x.sym}` });
    }
  } else if (v !== null && q) {
    const ua = q.units.find((x) => x.id === a)!;
    const ub = q.units.find((x) => x.id === b)!;
    const ratio = ua.f / ub.f;
    const r = v * ratio;
    const [sa, sb] = [tr(ua.sym), tr(ub.sym)];
    if (a === b) steps.push(t('unit.same'));
    else if (ratio >= 1) {
      steps.push(`1 ${sa} = ${f6(ratio)} ${sb}`);
      steps.push(t('unit.mul', { e: `${s6(v)} ${sa} = ${s6(v)}·${f6(ratio)} ${sb} = ${f6(r)} ${sb}` }));
    } else {
      steps.push(`1 ${sb} = ${f6(1 / ratio)} ${sa}`);
      steps.push(t('unit.div', { e: `${s6(v)} ${sa} = ${s6(v)} : ${f6(1 / ratio)} ${sb} = ${f6(r)} ${sb}` }));
    }
    rows.push({ label: `${f6(v)} ${sa}`, value: `${f6(r)} ${sb}`, main: true });
    for (const x of q.units) if (x.id !== a && x.id !== b) rows.push({ label: tr(x.name), value: `${f6((v * ua.f) / x.f)} ${tr(x.sym)}` });
  }

  return (
    <>
      <Card>
        <Select
          label={t('unit.quantity')}
          value={qid}
          onChange={pickQuantity}
          options={[...QUANTITIES.map((x) => ({ id: x.id, label: tr(x.name) })), { id: TEMP, label: t('unit.temperature') }]}
        />
        <div className="row">
          <Field label={t('unit.value')} value={vs} onChange={setV} />
          <Select label={t('unit.from')} value={a} onChange={setFrom} options={options} />
          <button type="button" className="swap" onClick={() => { setFrom(b); setTo(a); }} aria-label={t('unit.swap')} title={t('unit.swap')}>⇄</button>
          <Select label={t('unit.to')} value={b} onChange={setTo} options={options} />
        </div>
      </Card>
      <Outcome error={error} hint={v === null ? t('ui.fillAll') : null} rows={rows} steps={steps} />
    </>
  );
}
