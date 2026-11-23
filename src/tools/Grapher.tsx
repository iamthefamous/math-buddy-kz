import { useMemo, useState } from 'react';
import { useI18n } from '../i18n';
import { Card, Field, Results, type Row } from '../components/ui';
import { Graph, COLORS, type Plot, type View } from '../components/Graph';
import { compile, parseNumber } from '../lib/parse';

// 640×400 canvas: x-range 20 ↔ y-range 12.5 keeps both axes at the same scale.
const VIEW: View = { x0: -10, x1: 10, y0: -6.25, y1: 6.25 };

/** Plot up to three functions y = f(x) and evaluate them at a chosen x. */
export default function Grapher() {
  const { t, fmt } = useI18n();
  const [srcs, setSrcs] = useState(['x^2 − 3', 'sin(x)', '']);
  const [xs, setXs] = useState('2');

  const fns = useMemo(
    () => srcs.map((s) => {
      if (s.trim() === '') return null;
      try { return compile(s); } catch { return 'bad' as const; }
    }),
    [srcs],
  );

  const plots = useMemo(() => {
    const out: Plot[] = [];
    fns.forEach((f, i) => { if (f && f !== 'bad') out.push({ f, color: COLORS[i], label: `y = ${srcs[i].trim()}` }); });
    return out;
  }, [fns, srcs]);

  const x = parseNumber(xs);
  const rows: Row[] = [];
  if (x !== null) {
    fns.forEach((f, i) => {
      if (!f || f === 'bad') return;
      const y = f(x);
      rows.push({ label: `f${i + 1}(${fmt(x)})`, value: Number.isFinite(y) ? fmt(y, 6) : t('graph.undefined') });
    });
  }

  return (
    <>
      <Card>
        {srcs.map((s, i) => (
          <Field
            key={i}
            wide
            kind="text"
            label={<><i className="swatch" style={{ background: COLORS[i] }} />{`f${i + 1}(x) =`}</>}
            value={s}
            onChange={(v) => setSrcs(srcs.map((o, j) => (j === i ? v : o)))}
            invalid={fns[i] === 'bad'}
            placeholder={['2x + 1', 'sin(x)', '1/x'][i]}
          />
        ))}
        {fns.some((f) => f === 'bad') && <p className="field-msg">{t('graph.bad')}</p>}
        <p className="hint">{t('graph.help')}</p>
      </Card>
      <Card title={t('ui.graph')}>
        <Graph plots={plots} view={VIEW} ariaLabel={t('ui.graph')} />
        <p className="hint">{t('graph.nav')}</p>
      </Card>
      <Card>
        <Field label={t('graph.at')} value={xs} onChange={setXs} />
      </Card>
      {rows.length > 0 && <Results rows={rows} />}
    </>
  );
}
