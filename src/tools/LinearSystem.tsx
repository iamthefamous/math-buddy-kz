import { useMemo } from 'react';
import { useI18n } from '../i18n';
import { Card, Field, Outcome, useNum, type Row } from '../components/ui';
import { Graph, fitView, COLORS, type Plot } from '../components/Graph';
import { fmtSub } from '../lib/format';
import { fracStr, toFrac } from '../lib/numtheory';

const z = (x: number) => (Math.abs(x) < 1e-12 ? 0 : x);

/** a₁x + b₁y = c₁, a₂x + b₂y = c₂ via Cramer's rule. */
export default function LinearSystem() {
  const { t, fmt, lang } = useI18n();
  const f = [useNum('2'), useNum('3'), useNum('12'), useNum('1'), useNum('-1'), useNum('1')];
  const [a1, b1, c1, a2, b2, c2] = f.map(([, , v]) => v);
  const ready = f.every(([, , v]) => v !== null);
  const s = (n: number) => fmtSub(n, lang, 6);
  const f6 = (n: number) => fmt(n, 6);
  const ex = (n: number) => {
    const q = toFrac(n);
    return q && q.d !== 1 ? `${fracStr(q)} ≈ ${f6(n)}` : f6(n);
  };

  const steps: string[] = [];
  const rows: Row[] = [];
  let point: { x: number; y: number } | null = null;

  if (ready) {
    const [A1, B1, C1, A2, B2, C2] = [a1!, b1!, c1!, a2!, b2!, c2!];
    const D = z(A1 * B2 - A2 * B1);
    const Dx = z(C1 * B2 - C2 * B1);
    const Dy = z(A1 * C2 - A2 * C1);
    steps.push(`Δ = a₁b₂ − a₂b₁ = ${s(A1)}·${s(B2)} − ${s(A2)}·${s(B1)} = ${f6(D)}`);
    const degenerate = (A1 === 0 && B1 === 0) || (A2 === 0 && B2 === 0);
    if (degenerate) {
      // an equation of the form 0 = c
      const bad = (A1 === 0 && B1 === 0 && C1 !== 0) || (A2 === 0 && B2 === 0 && C2 !== 0);
      steps.push(t(bad ? 'sys.degenerateNone' : 'sys.degenerateInf'));
      rows.push({ label: t('ui.answer'), value: t(bad ? 'sys.none' : 'sys.infinite'), main: true });
    } else if (D !== 0) {
      const x = Dx / D;
      const y = Dy / D;
      steps.push(`Δx = c₁b₂ − c₂b₁ = ${s(C1)}·${s(B2)} − ${s(C2)}·${s(B1)} = ${f6(Dx)}`);
      steps.push(`Δy = a₁c₂ − a₂c₁ = ${s(A1)}·${s(C2)} − ${s(A2)}·${s(C1)} = ${f6(Dy)}`);
      steps.push(`x = Δx / Δ = ${s(Dx)} / ${s(D)} = ${ex(x)}`);
      steps.push(`y = Δy / Δ = ${s(Dy)} / ${s(D)} = ${ex(y)}`);
      steps.push(t('sys.check', { e1: f6(A1 * x + B1 * y), c1: f6(C1), e2: f6(A2 * x + B2 * y), c2: f6(C2) }));
      rows.push({ label: 'x', value: ex(x), main: true }, { label: 'y', value: ex(y), main: true });
      rows.push({ label: t('sys.point'), value: `(${f6(x)}; ${f6(y)})` });
      point = { x, y };
    } else {
      const coincide = Dx === 0 && Dy === 0;
      steps.push(`Δx = ${f6(Dx)}, Δy = ${f6(Dy)}`);
      steps.push(t(coincide ? 'sys.sameLine' : 'sys.parallel'));
      rows.push({ label: t('ui.answer'), value: t(coincide ? 'sys.infinite' : 'sys.none'), main: true });
    }
  }

  const graph = useMemo(() => {
    if (!ready) return null;
    const plots: Plot[] = [];
    const vlines: { x: number; color: string; label: string }[] = [];
    const add = (a: number, b: number, c: number, i: number) => {
      const label = `${i === 0 ? '(1)' : '(2)'}`;
      if (b !== 0) plots.push({ f: (x) => (c - a * x) / b, color: COLORS[i], label });
      else if (a !== 0) vlines.push({ x: c / a, color: COLORS[i], label });
    };
    add(a1!, b1!, c1!, 0);
    add(a2!, b2!, c2!, 1);
    return { plots, vlines };
  }, [ready, a1, b1, c1, a2, b2, c2]);

  const label = (i: number) => (
    <div className="row system">
      <Field label={`a${i ? '₂' : '₁'}`} value={f[i * 3][0]} onChange={f[i * 3][1]} />
      <span className="op">x +</span>
      <Field label={`b${i ? '₂' : '₁'}`} value={f[i * 3 + 1][0]} onChange={f[i * 3 + 1][1]} />
      <span className="op">y =</span>
      <Field label={`c${i ? '₂' : '₁'}`} value={f[i * 3 + 2][0]} onChange={f[i * 3 + 2][1]} />
    </div>
  );

  return (
    <>
      <Card>
        <p className="equation math">{'{'} a₁x + b₁y = c₁ ; a₂x + b₂y = c₂</p>
        {label(0)}
        {label(1)}
      </Card>
      <Outcome
        hint={ready ? null : t('ui.fillAll')}
        rows={rows}
        steps={steps}
        extra={graph && (graph.plots.length + graph.vlines.length > 0) && (
          <Card title={t('ui.graph')}>
            <Graph
              plots={graph.plots}
              vlines={graph.vlines}
              points={point ? [{ ...point, label: `(${f6(point.x)}; ${f6(point.y)})` }] : []}
              view={fitView(point ? [point] : [], 5)}
              ariaLabel={t('ui.graph')}
            />
          </Card>
        )}
      />
    </>
  );
}
