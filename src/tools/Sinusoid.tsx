import { useMemo, useState } from 'react';
import { useI18n } from '../i18n';
import { Card, Field, Outcome, Segmented, useNum, type Row } from '../components/ui';
import { Graph, fitView, COLORS, type Plot, type Pt } from '../components/Graph';
import { piForm } from '../lib/trig';

type Fn = 'sin' | 'cos';

/** y = A·sin(B(x − C)) + D (or cos): amplitude, period, shifts, range, key points. */
export default function Sinusoid() {
  const { t, fmt } = useI18n();
  const [fn, setFn] = useState<Fn>('sin');
  const [as, setA, A] = useNum('2');
  const [bs, setB, B] = useNum('2');
  const [cs, setC, C] = useNum('π/4');
  const [ds, setD, D] = useNum('1');
  const ready = A !== null && B !== null && C !== null && D !== null;
  const base = fn === 'sin' ? Math.sin : Math.cos;

  /** π-form when the value is a nice multiple of π, else a decimal. */
  const pf = (v: number) => piForm(v) ?? fmt(v);
  const pfApprox = (v: number) => {
    const p = piForm(v);
    return p && p !== '0' && !/^−?\d+$/.test(p) ? `${p} ≈ ${fmt(v)}` : fmt(v);
  };

  let error: string | null = null;
  const rows: Row[] = [];
  const steps: string[] = [];
  const pts: Pt[] = [];

  if (ready && A === 0) error = t('sin.errA');
  else if (ready && B === 0) error = t('sin.errB');
  else if (ready) {
    const amp = Math.abs(A);
    const T = (2 * Math.PI) / Math.abs(B);
    const f = (x: number) => A * base(B * (x - C)) + D;
    steps.push(`y = ${formula(fn, A, B, C, D, fmt, pf)}`);
    steps.push(t('sin.ampStep', { a: fmt(A), r: fmt(amp) }));
    steps.push(t('sin.periodStep', { b: fmt(Math.abs(B)), r: pfApprox(T) }));
    steps.push(t(C > 0 ? 'sin.shiftRight' : C < 0 ? 'sin.shiftLeft' : 'sin.noShift', { c: pf(Math.abs(C)) }));
    steps.push(t(D > 0 ? 'sin.up' : D < 0 ? 'sin.down' : 'sin.noVert', { d: fmt(Math.abs(D)) }));
    steps.push(t('sin.rangeStep', { lo: fmt(D - amp), hi: fmt(D + amp) }));
    for (let k = 0; k <= 4; k++) {
      const x = C + (k * T) / 4;
      pts.push({ x, y: f(x), label: `(${pf(x)}; ${fmt(f(x))})` });
    }
    steps.push(t('sin.keyStep', { x0: pf(C), x1: pf(C + T) }));

    rows.push(
      { label: t('sin.amp'), value: fmt(amp), main: true },
      { label: t('sin.period'), value: pfApprox(T), main: true },
      { label: t('sin.phase'), value: pf(C) },
      { label: t('sin.vert'), value: fmt(D) },
      { label: t('sin.range'), value: `[${fmt(D - amp)}; ${fmt(D + amp)}]` },
      { label: t('sin.freq'), value: fmt(Math.abs(B) / (2 * Math.PI)) },
      { label: t('sin.keyPoints'), value: pts.map((p) => p.label).join(' ') },
    );
  }

  const plots = useMemo<Plot[]>(() => {
    if (!ready || A === 0 || B === 0) return [];
    return [
      { f: (x) => A * base(B * (x - C)) + D, color: COLORS[0], label: `y = ${formula(fn, A, B, C, D, (v) => fmt(v), (v) => piForm(v) ?? fmt(v))}` },
      { f: base, color: COLORS[2], label: `y = ${fn} x` },
    ];
  }, [ready, A, B, C, D, fn, base, fmt]);

  return (
    <>
      <Card>
        <Segmented label={t('teq.function')} value={fn} onChange={setFn} options={[{ id: 'sin', label: 'sin' }, { id: 'cos', label: 'cos' }]} />
        <p className="equation math">y = A·{fn}(B(x − C)) + D</p>
        <div className="row">
          <Field label="A" value={as} onChange={setA} />
          <Field label="B" value={bs} onChange={setB} />
          <Field label="C" value={cs} onChange={setC} />
          <Field label="D" value={ds} onChange={setD} />
        </div>
        <p className="hint">{t('sin.help')}</p>
      </Card>
      <Outcome
        error={error}
        hint={ready ? null : t('ui.fillAll')}
        rows={rows}
        steps={steps}
        extra={plots.length > 0 && (
          <Card title={t('ui.graph')}>
            <Graph plots={plots} points={pts.map(({ x, y }) => ({ x, y }))} view={fitView(pts, 1.5)} ariaLabel={t('ui.graph')} />
          </Card>
        )}
      />
    </>
  );
}

/** "2·sin(2(x − π/4)) + 1" with 1/−1/0 coefficients simplified. */
function formula(fn: Fn, A: number, B: number, C: number, D: number, fmt: (n: number) => string, pf: (n: number) => string): string {
  const amp = A === 1 ? '' : A === -1 ? '−' : `${fmt(A)}·`;
  const inner = C === 0 ? 'x' : `x ${C > 0 ? '−' : '+'} ${pf(Math.abs(C))}`;
  const arg = B === 1 ? inner : `${B === -1 ? '−' : fmt(B)}${C === 0 ? 'x' : `(${inner})`}`;
  const tail = D === 0 ? '' : ` ${D > 0 ? '+' : '−'} ${fmt(Math.abs(D))}`;
  return `${amp}${fn}(${arg})${tail}`;
}
