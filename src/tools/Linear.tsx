import { useI18n } from '../i18n';
import { Card, Field, Outcome, useNum } from '../components/ui';
import { fmtSub, polyStr } from '../lib/format';
import { fracStr, toFrac } from '../lib/numtheory';

/** Solves a·x + b = c·x + d. */
export default function Linear() {
  const { t, fmt, lang } = useI18n();
  const [as, setA, a] = useNum('3');
  const [bs, setB, b] = useNum('-5');
  const [cs, setC, c] = useNum('1');
  const [ds, setD, d] = useNum('7');

  const steps: string[] = [];
  const rows = [];
  let ok = false;
  if (a !== null && b !== null && c !== null && d !== null) {
    ok = true;
    const P = (k: number[]) => polyStr(k, lang, 'x', 6);
    const s = (n: number) => fmtSub(n, lang, 6);
    steps.push(`${P([a, b])} = ${P([c, d])}`);
    const z = (x: number) => (Math.abs(x) < 1e-12 ? 0 : x); // absorb float noise like 0.3 − 0.1 − 0.2
    const A = z(a - c);
    const B = z(d - b);
    steps.push(t('lin.move'));
    steps.push(`${s(a)}x − ${s(c)}x = ${s(d)} − ${s(b)}`);
    steps.push(`${P([A, 0]) === '0' ? '0·x' : P([A, 0])} = ${fmt(B, 6)}`);
    if (A === 0) {
      const any = B === 0;
      steps.push(t(any ? 'lin.infinite' : 'lin.none'));
      rows.push({ label: t('ui.answer'), value: t(any ? 'lin.anyX' : 'lin.noRoots'), main: true });
    } else {
      const x = B / A;
      const f = toFrac(x);
      const exact = f && f.d !== 1 ? fracStr(f) : null;
      steps.push(`x = ${s(B)} / ${s(A)} = ${exact ? exact + ' ≈ ' : ''}${fmt(x, 6)}`);
      steps.push(t('lin.check', { l: fmt(a * x + b, 6), r: fmt(c * x + d, 6) }));
      rows.push({ label: 'x', value: exact ? `${exact} ≈ ${fmt(x, 6)}` : fmt(x, 6), main: true });
    }
  }

  return (
    <>
      <Card>
        <p className="equation math">a·x + b = c·x + d</p>
        <div className="row">
          <Field label="a" value={as} onChange={setA} />
          <Field label="b" value={bs} onChange={setB} />
          <Field label="c" value={cs} onChange={setC} />
          <Field label="d" value={ds} onChange={setD} />
        </div>
        <p className="hint">{t('lin.help')}</p>
      </Card>
      <Outcome hint={ok ? null : t('ui.fillAll')} rows={rows} steps={steps} />
    </>
  );
}
