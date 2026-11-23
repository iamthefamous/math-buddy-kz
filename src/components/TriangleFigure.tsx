import { DEG } from '../lib/trig';

/** Triangle drawn to scale: A at origin, B on the x-axis, side c = AB, b = AC, a = BC. */
export function TriangleFigure({ s, A, right, label }: { s: number[]; A: number[]; right?: boolean; label: string }) {
  const W = 320;
  const H = 210;
  const pad = 28;
  const [, b, c] = s;
  const pts = [[0, 0], [c, 0], [b * Math.cos(A[0] * DEG), b * Math.sin(A[0] * DEG)]];
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const minX = Math.min(...xs);
  const w = Math.max(...xs) - minX;
  const h = Math.max(...ys);
  const k = Math.min((W - 2 * pad) / w, (H - 2 * pad) / h);
  const ox = (W - w * k) / 2 - minX * k;
  const oy = (H + h * k) / 2;
  const P = pts.map(([x, y]) => [ox + x * k, oy - y * k]);
  const cx = (P[0][0] + P[1][0] + P[2][0]) / 3;
  const cy = (P[0][1] + P[1][1] + P[2][1]) / 3;
  // push a label away from the centroid
  const away = (x: number, y: number, d: number) => {
    const dx = x - cx;
    const dy = y - cy;
    const l = Math.hypot(dx, dy) || 1;
    return [x + (dx / l) * d, y + (dy / l) * d];
  };
  const mid = (i: number, j: number) => [(P[i][0] + P[j][0]) / 2, (P[i][1] + P[j][1]) / 2];
  const sideLabels: [string, number[]][] = [['a', mid(1, 2)], ['b', mid(0, 2)], ['c', mid(0, 1)]];
  const vertexNames = ['A', 'B', 'C'];
  const angleNames = ['α', 'β', 'γ'];

  let rightMark = null;
  if (right) {
    const [x, y] = P[2];
    const u = (i: number) => {
      const dx = P[i][0] - x;
      const dy = P[i][1] - y;
      const l = Math.hypot(dx, dy);
      return [(dx / l) * 12, (dy / l) * 12];
    };
    const [u0, u1] = [u(0), u(1)];
    rightMark = <path d={`M${x + u0[0]},${y + u0[1]} L${x + u0[0] + u1[0]},${y + u0[1] + u1[1]} L${x + u1[0]},${y + u1[1]}`} className="tri-mark" />;
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="tri-fig" role="img" aria-label={label}>
      <polygon points={P.map((p) => p.join(',')).join(' ')} className="tri-poly" />
      {rightMark}
      {P.map(([x, y], i) => {
        const [vx, vy] = away(x, y, 14);
        const [ax, ay] = away(x, y, -22);
        return (
          <g key={i}>
            <text x={vx} y={vy + 4} textAnchor="middle" className="tri-vertex">{vertexNames[i]}</text>
            {!(right && i === 2) && <text x={ax} y={ay + 4} textAnchor="middle" className="tri-angle">{angleNames[i]}</text>}
          </g>
        );
      })}
      {sideLabels.map(([n, [x, y]]) => {
        const [lx, ly] = away(x, y, 12);
        return <text key={n} x={lx} y={ly + 4} textAnchor="middle" className="tri-side">{n}</text>;
      })}
    </svg>
  );
}
