import { useRef, useState, type PointerEvent as RPointerEvent } from 'react';
import { useI18n } from '../i18n';
import { Card, Field, Results, Segmented, Message, type Row } from '../components/ui';
import { hasExplicitAngleUnit, parseNumber } from '../lib/parse';
import { DEG, exactTrig, norm360, piForm, quadrant, referenceAngle, trigValue, type TrigFn } from '../lib/trig';

type Unit = 'deg' | 'rad';
const ROMAN = ['', 'I', 'II', 'III', 'IV'];
const MARKS = [0, 30, 45, 60, 90, 120, 135, 150, 180, 210, 225, 240, 270, 300, 315, 330];

export default function UnitCircle() {
  const { t, fmt } = useI18n();
  const [unit, setUnit] = useState<Unit>('deg');
  const [text, setText] = useState('150');

  const v = parseNumber(text);
  const explicit = hasExplicitAngleUnit(text);
  const rad = v === null ? null : explicit || unit === 'rad' ? v : v * DEG;
  const deg = rad === null ? null : rad / DEG;

  const setFromDeg = (d: number) => {
    if (unit === 'deg') setText(String(d));
    else setText(piForm(d * DEG) ?? fmt(d * DEG, 4).replace(',', '.'));
  };
  const switchUnit = (u: Unit) => {
    setUnit(u);
    if (deg === null || explicit) return;
    if (u === 'deg') setText(String(Math.round(deg * 1e6) / 1e6));
    else setText(piForm(rad!) ?? String(Math.round(rad! * 1e6) / 1e6));
  };

  const fnName = (f: TrigFn) => (f === 'tan' ? t('fn.tan') : f === 'cot' ? t('fn.cot') : f);
  const rows: Row[] = [];
  if (deg !== null && rad !== null) {
    const q = quadrant(deg);
    const n = norm360(deg);
    rows.push({ label: t('uc.degrees'), value: `${fmt(deg)}°`, main: true });
    const pf = piForm(rad);
    rows.push({ label: t('uc.radians'), value: pf && pf !== '0' ? `${pf} ≈ ${fmt(rad)}` : fmt(rad), main: true });
    for (const f of ['sin', 'cos', 'tan', 'cot'] as TrigFn[]) {
      const ex = exactTrig(f, deg);
      const num = trigValue(f, rad);
      const value = num === null ? t('uc.undefined') : ex && ex !== fmt(num) ? `${ex} ${ex.includes('√') ? '≈' : '='} ${fmt(num)}` : fmt(num);
      rows.push({ label: `${fnName(f)} θ`, value, main: true });
    }
    if (Math.abs(n - deg) > 1e-9) rows.push({ label: t('uc.normalized'), value: `${fmt(n)}°` });
    rows.push({ label: t('uc.quadrant'), value: q === 0 ? t('uc.onAxis') : ROMAN[q] });
    rows.push({ label: t('uc.reference'), value: `${fmt(referenceAngle(deg))}°` });
    rows.push({ label: t('uc.coterminal'), value: `${fmt(deg - 360)}°, ${fmt(deg + 360)}° (θ + 360°·k)` });
    rows.push({ label: t('uc.point'), value: `(${fmt(Math.cos(rad))}; ${fmt(Math.sin(rad))})` });
  }

  return (
    <>
      <Card>
        <div className="row">
          <Field label={t('uc.angle')} value={text} onChange={setText} placeholder="150, 5π/6, 30°" />
          <Segmented label={t('uc.unit')} value={unit} onChange={switchUnit} options={[{ id: 'deg', label: t('uc.deg') }, { id: 'rad', label: t('uc.rad') }]} />
        </div>
        <p className="hint">{t('uc.help')}</p>
      </Card>
      {deg === null ? (
        <Message>{t('uc.enter')}</Message>
      ) : (
        <>
          <Card title={t('tool.unitCircle.name')} className="uc-card">
            <div className="uc-wrap">
              <Circle deg={deg} unit={unit} onDrag={setFromDeg} label={t('uc.drag')} />
              <Wave deg={deg} unit={unit} />
            </div>
            <div className="legend">
              <span><i style={{ background: 'var(--c1)' }} />cos θ</span>
              <span><i style={{ background: 'var(--c2)' }} />sin θ</span>
            </div>
          </Card>
          <Results rows={rows} />
        </>
      )}
    </>
  );
}

function markLabel(d: number, unit: Unit) {
  return unit === 'deg' ? `${d}°` : piForm(d * DEG)!;
}

function Circle({ deg, unit, onDrag, label }: { deg: number; unit: Unit; onDrag: (d: number) => void; label: string }) {
  const ref = useRef<SVGSVGElement>(null);
  const dragging = useRef(false);
  const R = 1.45;
  const rad = deg * DEG;
  const x = Math.cos(rad);
  const y = -Math.sin(rad);
  const n = norm360(deg);
  const arcEnd = n * DEG;
  const arc = n === 0 ? '' : `M0.22,0 A0.22,0.22 0 ${n > 180 ? 1 : 0} 0 ${0.22 * Math.cos(arcEnd)},${-0.22 * Math.sin(arcEnd)}`;

  const pick = (e: RPointerEvent<SVGSVGElement>) => {
    const r = ref.current!.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * 2 * R - R;
    const py = -(((e.clientY - r.top) / r.height) * 2 * R - R);
    let d = norm360(Math.atan2(py, px) / DEG);
    const snap = Math.round(d / 15) * 15;
    d = Math.abs(d - snap) <= 2.5 ? snap % 360 : Math.round(d) % 360;
    onDrag(d);
  };

  return (
    <svg
      ref={ref}
      viewBox={`${-R} ${-R} ${2 * R} ${2 * R}`}
      className="uc-circle"
      role="img"
      aria-label={label}
      onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); dragging.current = true; pick(e); }}
      onPointerMove={(e) => dragging.current && pick(e)}
      onPointerUp={() => (dragging.current = false)}
      onPointerCancel={() => (dragging.current = false)}
    >
      <line x1={-1.25} x2={1.25} y1={0} y2={0} className="uc-axis" />
      <line y1={-1.25} y2={1.25} x1={0} x2={0} className="uc-axis" />
      <circle r={1} className="uc-ring" />
      {MARKS.map((m) => {
        const a = m * DEG;
        return (
          <g key={m}>
            <circle cx={Math.cos(a)} cy={-Math.sin(a)} r={0.018} className="uc-tick" />
            <text x={1.2 * Math.cos(a)} y={-1.2 * Math.sin(a) + 0.03} textAnchor="middle" className="uc-mark">{markLabel(m, unit)}</text>
          </g>
        );
      })}
      {arc && <path d={arc} className="uc-arc" />}
      <line x1={0} y1={0} x2={x} y2={0} className="uc-cos" />
      <line x1={x} y1={0} x2={x} y2={y} className="uc-sin" />
      <line x1={0} y1={0} x2={x} y2={y} className="uc-radius" />
      <circle cx={x} cy={y} r={0.06} className="uc-handle" />
    </svg>
  );
}

function Wave({ deg, unit }: { deg: number; unit: Unit }) {
  const W = 360;
  const H = 180;
  const sy = (v: number) => H / 2 - v * 70;
  const path = (f: (r: number) => number) =>
    Array.from({ length: 181 }, (_, i) => `${i ? 'L' : 'M'}${i * 2},${sy(f(i * 2 * DEG)).toFixed(2)}`).join('');
  const n = norm360(deg);
  const r = n * DEG;
  return (
    <svg viewBox={`-24 0 ${W + 34} ${H + 16}`} className="uc-wave" role="img" aria-label="sin, cos">
      <line x1={0} x2={W} y1={sy(0)} y2={sy(0)} className="uc-axis" />
      <line x1={0} x2={0} y1={sy(1.2)} y2={sy(-1.2)} className="uc-axis" />
      {[1, -1].map((v) => (
        <g key={v}>
          <line x1={0} x2={W} y1={sy(v)} y2={sy(v)} className="g-grid" />
          <text x={-6} y={sy(v) + 4} textAnchor="end" className="uc-mark-sm">{v === 1 ? '1' : '−1'}</text>
        </g>
      ))}
      {[90, 180, 270, 360].map((d) => (
        <text key={d} x={d} y={H + 12} textAnchor="middle" className="uc-mark-sm">{markLabel(d, unit)}</text>
      ))}
      <path d={path(Math.cos)} className="uc-cos-wave" />
      <path d={path(Math.sin)} className="uc-sin-wave" />
      <line x1={n} x2={n} y1={sy(1.2)} y2={sy(-1.2)} className="uc-marker" />
      <circle cx={n} cy={sy(Math.cos(r))} r={4} style={{ fill: 'var(--c1)' }} />
      <circle cx={n} cy={sy(Math.sin(r))} r={4} style={{ fill: 'var(--c2)' }} />
    </svg>
  );
}
