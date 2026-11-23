import { useState } from 'react';
import { useI18n } from '../i18n';
import { Card, Field, Outcome, Segmented } from '../components/ui';
import { frac, fracStr, gcd, lcm, mixedStr, parseFrac, type Frac } from '../lib/numtheory';

type Op = '+' | '−' | '×' | ':';
const OPS: Op[] = ['+', '−', '×', ':'];

/** "n/d" without reducing; unicode minus. */
const raw = (n: number, d: number) => `${n < 0 ? '−' : ''}${Math.abs(n)}/${d}`;
const paren = (s: string) => (s.startsWith('−') ? `(${s})` : s);
const num = (n: number) => (n < 0 ? `(−${-n})` : String(n));

export default function Fractions() {
  const { t, fmt } = useI18n();
  const [s1, setS1] = useState('2 1/3');
  const [s2, setS2] = useState('3/4');
  const [op, setOp] = useState<Op>('+');

  const f1 = parseFrac(s1);
  const f2 = parseFrac(s2);
  const steps: string[] = [];
  let error: string | null = null;
  let result: Frac | null = null;

  if (f1 && f2) {
    // 1. mixed numbers → improper fractions
    for (const [src, f] of [[s1, f1], [s2, f2]] as const) {
      if (/\d\s+\d/.test(src)) steps.push(t('frac.toImproper', { m: src.trim().replace('-', '−'), f: fracStr(f) }));
    }
    const A = fracStr(f1).includes('/') ? fracStr(f1) : raw(f1.n, 1);
    const B = fracStr(f2).includes('/') ? fracStr(f2) : raw(f2.n, 1);
    let n = 0;
    let d = 1;
    if (op === '+' || op === '−') {
      const sgn = op === '+' ? 1 : -1;
      if (f1.d === f2.d) {
        n = f1.n + sgn * f2.n;
        d = f1.d;
        steps.push(t('frac.sameDen', { e: `${A} ${op} ${paren(B)} = ${raw(n, d)}` }));
      } else {
        const L = lcm(f1.d, f2.d);
        const k1 = L / f1.d;
        const k2 = L / f2.d;
        steps.push(t('frac.lcd', { d1: f1.d, d2: f2.d, L }));
        steps.push(t('frac.extend', { f: A, k: k1, r: raw(f1.n * k1, L) }));
        steps.push(t('frac.extend', { f: B, k: k2, r: raw(f2.n * k2, L) }));
        n = f1.n * k1 + sgn * f2.n * k2;
        d = L;
        steps.push(`${raw(f1.n * k1, L)} ${op} ${paren(raw(f2.n * k2, L))} = ${raw(n, d)}`);
      }
    } else if (op === '×') {
      n = f1.n * f2.n;
      d = f1.d * f2.d;
      steps.push(t('frac.mul', { e: `${A} · ${paren(B)} = (${num(f1.n)}·${num(f2.n)})/(${f1.d}·${f2.d}) = ${raw(n, d)}` }));
    } else if (f2.n === 0) {
      error = t('err.divZero');
    } else {
      const inv = frac(f2.d, f2.n);
      n = f1.n * inv.n;
      d = f1.d * inv.d;
      steps.push(t('frac.div', { e: `${A} : ${paren(B)} = ${A} · ${paren(fracStr(inv).includes('/') ? fracStr(inv) : raw(inv.n, 1))} = ${raw(n, d)}` }));
    }
    if (!error) {
      if (![n, d].every(Number.isSafeInteger)) error = t('err.tooBig');
      else {
        result = frac(n, d);
        const g = gcd(n, d);
        if (g > 1 && n !== 0) steps.push(t('frac.reduce', { g, f: raw(n, d), r: fracStr(result) }));
        if (Math.abs(result.n) > result.d && result.d !== 1) steps.push(t('frac.toMixed', { f: fracStr(result), m: mixedStr(result) }));
      }
    }
  }

  const bad = (s: string, f: Frac | null) => s.trim() !== '' && !f;
  return (
    <>
      <Card>
        <div className="row">
          <Field label={t('frac.first')} value={s1} onChange={setS1} kind="text" invalid={bad(s1, f1)} placeholder="2 1/3" />
          <Segmented label={t('ui.operation')} value={op} onChange={setOp} options={OPS.map((o) => ({ id: o, label: o }))} />
          <Field label={t('frac.second')} value={s2} onChange={setS2} kind="text" invalid={bad(s2, f2)} placeholder="3/4" />
        </div>
        <p className="hint">{t('frac.help')}</p>
      </Card>
      <Outcome
        error={error ?? (bad(s1, f1) || bad(s2, f2) ? t('frac.errFormat') : null)}
        hint={!f1 || !f2 ? t('ui.fillAll') : null}
        rows={result ? [
          { label: t('ui.answer'), value: fracStr(result), main: true },
          ...(mixedStr(result) !== fracStr(result) ? [{ label: t('frac.mixed'), value: mixedStr(result) }] : []),
          { label: t('frac.decimal'), value: (isExactAt6(result) ? '' : '≈ ') + fmt(result.n / result.d, 6) },
        ] : []}
        steps={steps}
      />
    </>
  );
}

/** True when the decimal expansion terminates within 6 digits (denominator divides 10⁶). */
function isExactAt6(f: Frac): boolean {
  return 1_000_000 % f.d === 0;
}
