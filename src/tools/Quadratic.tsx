import { useMemo } from 'react';
import { useI18n } from '../i18n';
import { Card, Field, Outcome, useNum, type Row } from '../components/ui';
import { Graph, fitView, COLORS, type Pt } from '../components/Graph';
import { fmt, fmtSub, polyStr } from '../lib/format';
import type { Lang } from '../i18n/langs';
import { exactQuadRoots } from '../lib/algebra';

export default function Quadratic() {
  const { t, lang } = useI18n();
  const [as, setA, a] = useNum('1');
  const [bs, setB, b] = useNum('-2');
  const [cs, setC, c] = useNum('-3');
  const s = (n: number) => fmtSub(n, lang, 6);
  const f6 = (n: number) => fmt(n, lang, 6);

  const ready = a !== null && b !== null && c !== null;
  const steps: string[] = [];
  const rows: Row[] = [];
  const pts: Pt[] = [];
  let error: string | null = null;

  if (ready && a === 0) {
    error = t('quad.notQuadratic');
  } else if (ready) {
    const rawD = b * b - 4 * a * c;
    // absorb float noise (e.g. 0.1 coefficients) so a true zero discriminant is detected
    const D = Math.abs(rawD) < 1e-12 * Math.max(1, b * b, Math.abs(4 * a * c)) ? 0 : rawD;
    const ex = exactQuadRoots(a, b, c);
    const twoForms = ex !== null && (ex.length === 2 || (ex.length === 1 && ex[0].includes('±')));
    const exact = D > 0 ? (twoForms ? ex : null) : D === 0 && ex?.length === 1 && !twoForms ? ex : null;
    steps.push(`${polyStr([a, b, c], lang, 'x', 6)} = 0`);
    steps.push(`D = b² − 4ac = ${s(b)}² − 4·${s(a)}·${s(c)} = ${f6(D)}`);
    const x0 = -b / (2 * a);
    const y0 = a * x0 * x0 + b * x0 + c;
    if (D > 0) {
      const sq = Math.sqrt(D);
      const x1 = (-b - sq) / (2 * a);
      const x2 = (-b + sq) / (2 * a);
      const [lo, hi] = x1 < x2 ? [x1, x2] : [x2, x1];
      steps.push(t('quad.twoRoots'));
      steps.push(`x₁,₂ = (−b ± √D) / (2a) = (${f6(-b)} ± √${fmtSub(D, lang, 6)}) / ${fmtSub(2 * a, lang, 6)}`);
      if (exact) steps.push(exact.length === 2 ? `x₁ = ${exact[0]}, x₂ = ${exact[1]}` : `x₁,₂ = ${exact[0]}`);
      steps.push(`x₁ ≈ ${f6(lo)}, x₂ ≈ ${f6(hi)}`);
      steps.push(t('quad.vieta', { s: f6(lo + hi), p: f6(lo * hi), sb: f6(-b / a), pc: f6(c / a) }));
      rows.push({ label: 'x₁', value: exact?.length === 2 ? `${exact[0]}${approx(exact[0], lo)}` : f6(lo), main: true });
      rows.push({ label: 'x₂', value: exact?.length === 2 ? `${exact[1]}${approx(exact[1], hi)}` : f6(hi), main: true });
      if (exact?.length === 1) rows.push({ label: 'x₁,₂', value: exact[0] });
      rows.push({ label: t('quad.factored'), value: `${coef(a, lang)}(${lin(lo, lang)})(${lin(hi, lang)})` });
      pts.push({ x: lo, y: 0, label: 'x₁' }, { x: hi, y: 0, label: 'x₂' });
    } else if (D === 0) {
      steps.push(t('quad.oneRoot'));
      steps.push(`x = −b / (2a) = ${f6(-b)} / ${fmtSub(2 * a, lang, 6)} = ${exact ? exact[0] : f6(x0)}`);
      rows.push({ label: 'x', value: exact ? `${exact[0]}${approx(exact[0], x0)}` : f6(x0), main: true });
      rows.push({ label: t('quad.factored'), value: `${coef(a, lang)}(${lin(x0, lang)})²` });
      pts.push({ x: x0, y: 0, label: 'x₀' });
    } else {
      steps.push(t('quad.noRoots'));
      rows.push({ label: t('ui.answer'), value: t('quad.noRealRoots'), main: true });
    }
    rows.push({ label: 'D', value: f6(D) });
    rows.push({ label: t('quad.vertex'), value: `(${f6(x0)}; ${f6(y0)})` });
    rows.push({ label: t('quad.axis'), value: `x = ${f6(x0)}` });
    rows.push({ label: t('quad.branches'), value: t(a > 0 ? 'quad.up' : 'quad.down') });
    steps.push(t('quad.vertexStep', { x: f6(x0), y: f6(y0) }));
    pts.push({ x: x0, y: y0, label: t('quad.vertexShort'), color: 'var(--c2)' });
  }

  const plots = useMemo(
    () => (ready && a !== 0 ? [{ f: (x: number) => a * x * x + b * x + c, color: COLORS[0], label: `y = ${polyStr([a, b, c], lang, 'x', 4)}` }] : []),
    [ready, a, b, c, lang],
  );

  return (
    <>
      <Card>
        <p className="equation math">a·x² + b·x + c = 0</p>
        <div className="row">
          <Field label="a" value={as} onChange={setA} />
          <Field label="b" value={bs} onChange={setB} />
          <Field label="c" value={cs} onChange={setC} />
        </div>
      </Card>
      <Outcome
        error={error}
        hint={ready ? null : t('ui.fillAll')}
        rows={rows}
        steps={steps}
        extra={plots.length > 0 && (
          <Card title={t('ui.graph')}>
            <Graph plots={plots} points={pts} view={fitView([...pts, { x: 0, y: c ?? 0 }], 3)} ariaLabel={t('ui.graph')} />
          </Card>
        )}
      />
    </>
  );

  /** " ≈ 1,4142" suffix when the exact form is not a plain integer. */
  function approx(exactStr: string, v: number) {
    return /^[−-]?\d+$/.test(exactStr) ? '' : ` ≈ ${f6(v)}`;
  }
}

const coef = (a: number, lang: Lang) => (a === 1 ? '' : a === -1 ? '−' : fmt(a, lang, 6));
const lin = (r: number, lang: Lang) => (Math.abs(r) < 1e-12 ? 'x' : polyStr([1, -r], lang, 'x', 6));
