import { useI18n } from '../i18n';
import { Card, Field, Outcome, useNum, type Row } from '../components/ui';
import { TriangleFigure } from '../components/TriangleFigure';
import { solveRight, type RightKnown } from '../lib/triangle';

export default function RightTriangle() {
  const { t, fmt } = useI18n();
  const fields = {
    a: useNum('3'), b: useNum('4'), c: useNum(''), al: useNum(''), be: useNum(''),
  };
  const labels: Record<keyof typeof fields, string> = {
    a: `a — ${t('tri.legA')}`, b: `b — ${t('tri.legB')}`, c: `c — ${t('tri.hyp')}`, al: `α, °`, be: `β, °`,
  };

  const known: RightKnown = {};
  let invalid = false;
  for (const [k, [s, , v]] of Object.entries(fields) as [keyof RightKnown, [string, unknown, number | null]][]) {
    if (s.trim() === '') continue;
    if (v === null) invalid = true;
    else known[k] = v;
  }

  const f = (n: number) => fmt(n, 4);
  const res = invalid ? null : solveRight(known, f, { tan: t('fn.tan'), arctan: t('fn.arctan') });
  let rows: Row[] = [];
  let steps: string[] = [];
  let error: string | null = invalid ? t('ui.badNumber') : null;
  let figure = null;

  if (res && 'error' in res) error = t(res.error);
  else if (res) {
    const { a, b, c, al, be } = res;
    const S = (a * b) / 2;
    rows = [
      { label: 'a', value: f(a), main: true }, { label: 'b', value: f(b), main: true }, { label: 'c', value: f(c), main: true },
      { label: 'α', value: `${f(al)}°` }, { label: 'β', value: `${f(be)}°` }, { label: 'γ', value: '90°' },
      { label: `${t('shape.area')} S = ab/2`, value: f(S) },
      { label: `${t('shape.perimeter')} P`, value: f(a + b + c) },
      { label: `${t('tri.heightC')} h = ab/c`, value: f((a * b) / c) },
      { label: `${t('tri.inradius')} r = (a + b − c)/2`, value: f((a + b - c) / 2) },
      { label: `${t('tri.circumradius')} R = c/2`, value: f(c / 2) },
    ];
    steps = res.steps.map((s) => (s.label ? `${t(s.label)}: ${s.math}` : s.math));
    steps.push(`S = ab/2 = ${f(a)}·${f(b)}/2 = ${f(S)}`);
    figure = <TriangleFigure s={[a, b, c]} A={[al, be, 90]} right label={t('tool.rightTriangle.name')} />;
  }

  return (
    <>
      <Card>
        <p className="hint">{t('tri.rightHelp')}</p>
        <div className="row">
          {(Object.keys(fields) as (keyof typeof fields)[]).map((k) => (
            <Field key={k} label={labels[k]} value={fields[k][0]} onChange={fields[k][1]} />
          ))}
        </div>
      </Card>
      <Outcome error={error} rows={rows} steps={steps} extra={figure && <Card title={t('ui.figure')}>{figure}</Card>} />
    </>
  );
}
