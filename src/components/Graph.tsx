import { useEffect, useMemo, useRef, useState, type PointerEvent as RPointerEvent } from 'react';
import { useI18n } from '../i18n';

export interface Plot { f: (x: number) => number; color: string; label?: string }
export interface Pt { x: number; y: number; label?: string; color?: string }
export interface View { x0: number; x1: number; y0: number; y1: number }

const W = 640;
const H = 400;

function niceStep(range: number): number {
  const raw = range / 8;
  const p = Math.pow(10, Math.floor(Math.log10(raw)));
  const m = raw / p;
  return (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * p;
}

/** View that fits the given points with padding (at least ±span around them). */
export function fitView(pts: { x: number; y: number }[], span = 5): View {
  const xs = pts.map((p) => p.x).filter(Number.isFinite);
  const ys = pts.map((p) => p.y).filter(Number.isFinite);
  const fit = (vs: number[]) => {
    const lo = Math.min(0, ...vs);
    const hi = Math.max(0, ...vs);
    const pad = Math.max((hi - lo) * 0.25, span);
    return [lo - pad, hi + pad];
  };
  const [x0, x1] = fit(xs);
  const [y0, y1] = fit(ys);
  return { x0, x1, y0, y1 };
}

function buildPath(f: (x: number) => number, v: View): string {
  const n = 800;
  const dx = (v.x1 - v.x0) / n;
  const hgt = v.y1 - v.y0;
  const lo = v.y0 - 4 * hgt;
  const hi = v.y1 + 4 * hgt;
  let d = '';
  let prev: number | null = null;
  for (let i = 0; i <= n; i++) {
    const x = v.x0 + i * dx;
    let y: number;
    try { y = f(x); } catch { y = NaN; }
    if (!Number.isFinite(y)) { prev = null; continue; }
    // break the line at vertical asymptotes (huge jump between neighbours)
    if (prev !== null && Math.abs(y - prev) > 2 * hgt && (y > v.y1 || y < v.y0 || prev > v.y1 || prev < v.y0)) prev = null;
    const yc = Math.max(lo, Math.min(hi, y));
    const px = ((x - v.x0) / (v.x1 - v.x0)) * W;
    const py = H - ((yc - v.y0) / hgt) * H;
    d += `${prev === null ? 'M' : 'L'}${px.toFixed(1)},${py.toFixed(1)}`;
    prev = y;
  }
  return d;
}

export function Graph({ plots, points = [], vlines = [], view, ariaLabel }: {
  plots: Plot[];
  points?: Pt[];
  /** Vertical lines x = const (cannot be drawn as functions of x). */
  vlines?: { x: number; color: string; label?: string }[];
  view: View;
  ariaLabel: string;
}) {
  const { t, fmt } = useI18n();
  const viewKey = JSON.stringify(view);
  const [v, setV] = useState(view);
  useEffect(() => setV(JSON.parse(viewKey) as View), [viewKey]);

  const svgRef = useRef<SVGSVGElement>(null);
  const drag = useRef<{ cx: number; cy: number; v: View } | null>(null);

  const zoom = (factor: number, fx = 0.5, fy = 0.5) =>
    setV((o) => {
      const cx = o.x0 + (o.x1 - o.x0) * fx;
      const cy = o.y1 - (o.y1 - o.y0) * fy;
      return { x0: cx - (cx - o.x0) * factor, x1: cx + (o.x1 - cx) * factor, y0: cy - (cy - o.y0) * factor, y1: cy + (o.y1 - cy) * factor };
    });

  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const r = el.getBoundingClientRect();
      zoom(e.deltaY > 0 ? 1.15 : 1 / 1.15, (e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  const onDown = (e: RPointerEvent<SVGSVGElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { cx: e.clientX, cy: e.clientY, v };
  };
  const onMove = (e: RPointerEvent<SVGSVGElement>) => {
    const d = drag.current;
    if (!d) return;
    const r = e.currentTarget.getBoundingClientRect();
    const ux = ((e.clientX - d.cx) / r.width) * (d.v.x1 - d.v.x0);
    const uy = ((e.clientY - d.cy) / r.height) * (d.v.y1 - d.v.y0);
    setV({ x0: d.v.x0 - ux, x1: d.v.x1 - ux, y0: d.v.y0 + uy, y1: d.v.y1 + uy });
  };
  const onUp = () => { drag.current = null; };

  const sx = (x: number) => ((x - v.x0) / (v.x1 - v.x0)) * W;
  const sy = (y: number) => H - ((y - v.y0) / (v.y1 - v.y0)) * H;

  const grid = useMemo(() => {
    const xs: number[] = [];
    const ys: number[] = [];
    const stx = niceStep(v.x1 - v.x0);
    const sty = niceStep(v.y1 - v.y0);
    for (let k = Math.ceil(v.x0 / stx); k * stx <= v.x1; k++) xs.push(k * stx);
    for (let k = Math.ceil(v.y0 / sty); k * sty <= v.y1; k++) ys.push(k * sty);
    return { xs, ys };
  }, [v]);

  const paths = useMemo(() => plots.map((p) => buildPath(p.f, v)), [plots, v]);

  const axX = Math.min(Math.max(sy(0), 0), H); // y-position of the x-axis (clamped to edge)
  const axY = Math.min(Math.max(sx(0), 0), W);

  return (
    <div className="graph">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={ariaLabel}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      >
        <rect width={W} height={H} className="g-bg" />
        {grid.xs.map((x) => <line key={'gx' + x} x1={sx(x)} x2={sx(x)} y1={0} y2={H} className="g-grid" />)}
        {grid.ys.map((y) => <line key={'gy' + y} y1={sy(y)} y2={sy(y)} x1={0} x2={W} className="g-grid" />)}
        <line x1={0} x2={W} y1={axX} y2={axX} className="g-axis" />
        <line y1={0} y2={H} x1={axY} x2={axY} className="g-axis" />
        {grid.xs.map((x) => Math.abs(x) > 1e-12 && (
          <text key={'lx' + x} x={sx(x)} y={Math.min(axX + 14, H - 4)} className="g-label" textAnchor="middle">{fmt(x, 4)}</text>
        ))}
        {grid.ys.map((y) => Math.abs(y) > 1e-12 && (
          <text key={'ly' + y} x={Math.min(Math.max(axY - 4, 30), W - 4)} y={sy(y) + 4} className="g-label" textAnchor="end">{fmt(y, 4)}</text>
        ))}
        {paths.map((d, i) => <path key={i} d={d} className="g-plot" style={{ stroke: plots[i].color }} />)}
        {vlines.map((l, i) => <line key={'v' + i} x1={sx(l.x)} x2={sx(l.x)} y1={0} y2={H} className="g-plot" style={{ stroke: l.color }} />)}
        {points.map((p, i) => Number.isFinite(p.x) && Number.isFinite(p.y) && (
          <g key={'p' + i}>
            <circle cx={sx(p.x)} cy={sy(p.y)} r={5} className="g-point" style={{ fill: p.color ?? 'var(--accent)' }} />
            {p.label && <text x={sx(p.x) + 8} y={sy(p.y) - 8} className="g-plabel">{p.label}</text>}
          </g>
        ))}
      </svg>
      <div className="graph-bar">
        <div className="legend">
          {[...plots, ...vlines].filter((p) => p.label).map((p, i) => (
            <span key={i} className="math"><i style={{ background: p.color }} />{p.label}</span>
          ))}
        </div>
        <div className="graph-btns">
          <button type="button" onClick={() => zoom(1 / 1.4)} aria-label={t('ui.zoomIn')} title={t('ui.zoomIn')}>+</button>
          <button type="button" onClick={() => zoom(1.4)} aria-label={t('ui.zoomOut')} title={t('ui.zoomOut')}>−</button>
          <button type="button" onClick={() => setV(view)} aria-label={t('ui.resetView')} title={t('ui.resetView')}>⟲</button>
        </div>
      </div>
    </div>
  );
}

export const COLORS = ['var(--c1)', 'var(--c2)', 'var(--c3)'];
