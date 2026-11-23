import { useState } from 'react';
import { useI18n } from '../i18n';
import { Card, Field, Outcome, Segmented, useNum, type Row } from '../components/ui';
import { fmtSub } from '../lib/format';

type Kind = 'arith' | 'geom';

export default function Progression() {
  const { t, fmt, lang } = useI18n();
  const [kind, setKind] = useState<Kind>('arith');
  const [fs, setF, first] = useNum('2');
  const [ks, setK, k] = useNum('3');
  const [ns, setN, n] = useNum('10');
  const s = (x: number) => fmtSub(x, lang, 6);
  const f6 = (x: number) => fmt(x, 6);
  const geo = kind === 'geom';
  const [a, sym] = geo ? ['b', 'q'] : ['a', 'd'];

  let error: string | null = null;
  const rows: Row[] = [];
  const steps: string[] = [];
  const ready = first !== null && k !== null && n !== null;

  if (ready) {
    if (!Number.isInteger(n) || n < 1 || n > 1e6) error = t('prog.errN');
    else if (geo && (first === 0 || k === 0)) error = t('prog.errGeom');
    else if (!geo) {
      const an = first + (n - 1) * k;
      const sn = ((first + an) / 2) * n;
      steps.push(`aₙ = a₁ + (n − 1)·d = ${s(first)} + (${n} − 1)·${s(k)} = ${f6(an)}`);
      steps.push(`Sₙ = (a₁ + aₙ)/2 · n = (${s(first)} + ${s(an)})/2 · ${n} = ${f6(sn)}`);
      rows.push({ label: `a${sub(n)}`, value: f6(an), main: true }, { label: `S${sub(n)}`, value: f6(sn), main: true });
    } else {
      const bn = first * Math.pow(k, n - 1);
      const sn = k === 1 ? n * first : (first * (Math.pow(k, n) - 1)) / (k - 1);
      steps.push(`bₙ = b₁·qⁿ⁻¹ = ${s(first)}·${s(k)}^${n - 1} = ${f6(bn)}`);
      steps.push(k === 1
        ? `q = 1 ⇒ Sₙ = n·b₁ = ${n}·${s(first)} = ${f6(sn)}`
        : `Sₙ = b₁(qⁿ − 1)/(q − 1) = ${s(first)}·(${s(k)}^${n} − 1)/(${s(k)} − 1) = ${f6(sn)}`);
      rows.push({ label: `b${sub(n)}`, value: f6(bn), main: true }, { label: `S${sub(n)}`, value: f6(sn), main: true });
      if (Math.abs(k) < 1) {
        const inf = first / (1 - k);
        steps.push(t('prog.infinite', { e: `S = b₁/(1 − q) = ${s(first)}/(1 − ${s(k)}) = ${f6(inf)}` }));
        rows.push({ label: t('prog.infSum'), value: f6(inf) });
      }
    }
    if (!error) {
      const terms = Array.from({ length: Math.min(n, 8) }, (_, i) => (geo ? first * Math.pow(k, i) : first + i * k));
      rows.push({ label: t('prog.terms'), value: terms.map(f6).join('; ') + (n > 8 ? '; …' : '') });
    }
  }

  return (
    <>
      <Card>
        <Segmented label={t('prog.kind')} value={kind} onChange={setKind} options={[{ id: 'arith', label: t('prog.arith') }, { id: 'geom', label: t('prog.geom') }]} />
        <div className="row">
          <Field label={`${a}₁ — ${t('prog.first')}`} value={fs} onChange={setF} />
          <Field label={`${sym} — ${t(geo ? 'prog.ratio' : 'prog.diff')}`} value={ks} onChange={setK} />
          <Field label={`n — ${t('prog.n')}`} value={ns} onChange={setN} />
        </div>
      </Card>
      <Outcome error={error} hint={ready ? null : t('ui.fillAll')} rows={rows} steps={steps} />
    </>
  );
}

const SUB = '₀₁₂₃₄₅₆₇₈₉';
const sub = (n: number) => String(n).split('').map((c) => SUB[Number(c)]).join('');
