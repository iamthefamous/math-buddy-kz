import { useI18n } from '../i18n';
import { Card, Field, Message, Results, Steps, useNum } from '../components/ui';
import { TriangleFigure } from '../components/TriangleFigure';
import { solveTriangle, type Tri } from '../lib/triangle';
import { DEG } from '../lib/trig';

const SN = ['a', 'b', 'c'];
const AN = ['α', 'β', 'γ'];

export default function Triangle() {
  const { t, fmt } = useI18n();
  const sides = [useNum('5'), useNum('7'), useNum('')];
  const angles = [useNum(''), useNum(''), useNum('60')];
  const f = (n: number) => fmt(n, 4);

  const invalid = [...sides, ...angles].some(([s, , v]) => s.trim() !== '' && v === null);
  const val = (x: [string, unknown, number | null]) => (x[0].trim() === '' ? undefined : (x[2] ?? undefined));
  const res = invalid ? null : solveTriangle(sides.map(val), angles.map(val), f);

  let body;
  if (invalid) body = <Message kind="error">{t('ui.badNumber')}</Message>;
  else if (res && 'error' in res) body = <Message kind="error">{t(res.error)}</Message>;
  else if (res) {
    body = (
      <>
        {res.length === 2 && <Message>{t('tri.twoSolutions')}</Message>}
        {res.map((tri, i) => <Solution key={i} tri={tri} n={res.length === 2 ? i + 1 : 0} />)}
      </>
    );
  }

  return (
    <>
      <Card>
        <p className="hint">{t('tri.anyHelp')}</p>
        <div className="row">
          {sides.map(([s, set], i) => <Field key={SN[i]} label={`${SN[i]} — ${t('tri.side')}`} value={s} onChange={set} />)}
        </div>
        <div className="row">
          {angles.map(([s, set], i) => <Field key={AN[i]} label={`${AN[i]}, °`} value={s} onChange={set} />)}
        </div>
      </Card>
      {body}
    </>
  );
}

function Solution({ tri, n }: { tri: Tri; n: number }) {
  const { t, fmt } = useI18n();
  const f = (x: number) => fmt(x, 4);
  const { s, A } = tri;
  const S = 0.5 * s[0] * s[1] * Math.sin(A[2] * DEG);
  const P = s[0] + s[1] + s[2];
  const R = s[0] / (2 * Math.sin(A[0] * DEG));
  const r = (2 * S) / P;
  const kind = A.some((x) => Math.abs(x - 90) < 1e-9) ? 'tri.kindRight' : A.some((x) => x > 90) ? 'tri.kindObtuse' : 'tri.kindAcute';
  return (
    <>
      {n > 0 && <h3 className="solution-title">{t('tri.solution', { n })}</h3>}
      <Results rows={[
        ...SN.map((x, i) => ({ label: x, value: f(s[i]), main: true })),
        ...AN.map((x, i) => ({ label: x, value: `${f(A[i])}°` })),
        { label: `${t('shape.area')} S = ½ab·sin γ`, value: f(S) },
        { label: `${t('shape.perimeter')} P`, value: f(P) },
        { label: `${t('tri.circumradius')} R = a/(2 sin α)`, value: f(R) },
        { label: `${t('tri.inradius')} r = 2S/P`, value: f(r) },
        { label: t('tri.kind'), value: t(kind) },
      ]} />
      <Card title={t('ui.figure')}><TriangleFigure s={s} A={A} right={kind === 'tri.kindRight' && Math.abs(A[2] - 90) < 1e-9} label={t('tool.triangle.name')} /></Card>
      <Steps steps={[
        ...tri.steps.map((st) => (st.label ? `${t(st.label)}: ${st.math}` : st.math)),
        `S = ½·a·b·sin γ = ½·${f(s[0])}·${f(s[1])}·sin ${f(A[2])}° = ${f(S)}`,
      ]} />
    </>
  );
}
