/**
 * Column ("long") arithmetic layouts for non-negative integers, as taught in grades 1–4.
 * Produces monospace text rows plus localizable step descriptions.
 */
import type { Key } from '../i18n/en';

export interface ColRow { text: string; cls?: 'carry' | 'line' }
export interface ColStep { key: Key; p: Record<string, string | number> }
export interface ColResult { rows: ColRow[]; steps: ColStep[]; answer: string }

const LINE = '─';

/** Place `s` so that its last character is at column `end` of a row `width` wide. */
function at(s: string, end: number, width: number, row = ' '.repeat(width)): string {
  const start = end - s.length + 1;
  return row.slice(0, start) + s + row.slice(start + s.length);
}

export function columnAdd(a: string, b: string): ColResult {
  const n = Math.max(a.length, b.length);
  const A = a.padStart(n, '0');
  const B = b.padStart(n, '0');
  const sum = (BigInt(a) + BigInt(b)).toString();
  const W = Math.max(sum.length, n) + 1;
  const carryRow = Array<string>(W).fill(' ');
  const steps: ColStep[] = [];
  let carry = 0;
  for (let i = n - 1; i >= 0; i--) {
    const s = Number(A[i]) + Number(B[i]) + carry;
    steps.push({
      key: s >= 10 ? 'col.addCarry' : 'col.add',
      p: { k: n - i, x: A[i], y: B[i], c: carry ? ' + ' + carry : '', s, d: s % 10, carry: Math.floor(s / 10) },
    });
    carry = Math.floor(s / 10);
    if (carry) carryRow[W - n + i - 1] = String(carry);
  }
  if (carry) steps.push({ key: 'col.addLast', p: { carry } });
  const rows: ColRow[] = [];
  if (carryRow.some((c) => c !== ' ')) rows.push({ text: carryRow.join(''), cls: 'carry' });
  rows.push({ text: at(a, W - 1, W) });
  rows.push({ text: at(b, W - 1, W, '+' + ' '.repeat(W - 1)) });
  rows.push({ text: LINE.repeat(W), cls: 'line' });
  rows.push({ text: at(sum, W - 1, W) });
  return { rows, steps, answer: sum };
}

/** Requires a ≥ b. */
export function columnSub(a: string, b: string): ColResult {
  const n = a.length;
  const B = b.padStart(n, '0');
  const diff = (BigInt(a) - BigInt(b)).toString();
  const W = n + 1;
  const marks = Array<string>(W).fill(' ');
  const steps: ColStep[] = [];
  let borrow = 0;
  for (let i = n - 1; i >= 0; i--) {
    const orig = Number(a[i]);
    let x = orig - borrow;
    const y = Number(B[i]);
    const p: Record<string, string | number> = { k: n - i, orig, x, y };
    if (borrow) steps.push({ key: 'col.afterBorrow', p });
    if (x < y) {
      x += 10;
      borrow = 1;
      marks[W - n + i - 1] = '·';
      steps.push({ key: 'col.subBorrow', p: { ...p, x, d: x - y } });
    } else {
      borrow = 0;
      steps.push({ key: 'col.sub', p: { ...p, x, d: x - y } });
    }
  }
  const rows: ColRow[] = [];
  if (marks.some((c) => c !== ' ')) rows.push({ text: marks.join(''), cls: 'carry' });
  rows.push({ text: at(a, W - 1, W) });
  rows.push({ text: at(b, W - 1, W, '-' + ' '.repeat(W - 1)) });
  rows.push({ text: LINE.repeat(W), cls: 'line' });
  rows.push({ text: at(diff, W - 1, W) });
  return { rows, steps, answer: diff };
}

export function columnMul(a: string, b: string): ColResult {
  const prod = (BigInt(a) * BigInt(b)).toString();
  const partials: { v: string; shift: number }[] = [];
  const steps: ColStep[] = [];
  for (let j = b.length - 1; j >= 0; j--) {
    const shift = b.length - 1 - j;
    const v = (BigInt(a) * BigInt(b[j])).toString();
    if (b[j] === '0' && b.length > 1) {
      steps.push({ key: 'col.mulZero', p: { a, d: b[j] } });
      continue;
    }
    partials.push({ v, shift });
    steps.push({ key: shift ? 'col.mulShift' : 'col.mul', p: { a, d: b[j], v, shift } });
  }
  const W = Math.max(prod.length, a.length, b.length, ...partials.map((p) => p.v.length + p.shift)) + 1;
  const rows: ColRow[] = [
    { text: at(a, W - 1, W) },
    { text: at(b, W - 1, W, '×' + ' '.repeat(W - 1)) },
    { text: LINE.repeat(W), cls: 'line' },
  ];
  if (b.length > 1 && partials.length > 0) {
    partials.forEach((p, i) => {
      const base = i === 1 ? '+' + ' '.repeat(W - 1) : undefined;
      rows.push({ text: at(p.v, W - 1 - p.shift, W, base) });
    });
    rows.push({ text: LINE.repeat(W), cls: 'line' });
    if (partials.length > 1) steps.push({ key: 'col.mulSum', p: { v: prod } });
  }
  rows.push({ text: at(prod, W - 1, W) });
  return { rows, steps, answer: prod };
}

/** Requires b > 0. Russian/Kazakh "corner" layout. */
export function columnDiv(a: string, b: string): ColResult & { q: string; r: string } {
  const A = BigInt(a);
  const Bn = BigInt(b);
  const q = (A / Bn).toString();
  const r = (A % Bn).toString();
  const steps: ColStep[] = [];
  if (A < Bn) {
    steps.push({ key: 'col.divSmall', p: { a, b } });
    return { rows: [{ text: `${a} │ ${b}` }], steps, answer: q, q, r };
  }
  const L = a.length + 1; // column 0 is reserved for the minus sign
  const left: ColRow[] = [{ text: at(a, L - 1, L) }];
  // first partial dividend: shortest prefix ≥ b
  let i = 0;
  let cur = BigInt(a[0]);
  while (cur < Bn) { i++; cur = cur * 10n + BigInt(a[i]); }
  steps.push({ key: 'col.divFirst', p: { cur: cur.toString(), b } });
  let first = true;
  for (;;) {
    const qd = cur / Bn;
    const prod = qd * Bn;
    const rem = cur - prod;
    const end = i + 1;
    if (qd > 0n || first) {
      if (!first) left.push({ text: at(cur.toString(), end, L) });
      const width = Math.max(cur.toString().length, prod.toString().length);
      const ps = prod.toString();
      let row = at(ps, end, L);
      row = at('-', end - width, L, row);
      left.push({ text: row });
      left.push({ text: at(LINE.repeat(width), end, L), cls: 'line' });
      steps.push({ key: 'col.divStep', p: { cur: cur.toString(), b, q: qd.toString(), prod: ps, rem: rem.toString() } });
    } else {
      steps.push({ key: 'col.divZero', p: { cur: cur.toString(), b } });
    }
    first = false;
    if (i + 1 >= a.length) {
      left.push({ text: at(rem.toString(), end, L) });
      break;
    }
    i++;
    cur = rem * 10n + BigInt(a[i]);
    steps.push({ key: 'col.divDown', p: { d: a[i], cur: cur.toString() } });
  }
  steps.push({ key: r === '0' ? 'col.divAnswer' : 'col.divAnswerRem', p: { q, r } });
  const qw = Math.max(q.length, b.length) + 1;
  const right = [`│ ${b}`, `├${LINE.repeat(qw)}`, `│ ${q}`];
  const rows = left.map((row, k) => (k < 3 ? { ...row, text: row.text.padEnd(L + 1) + right[k] } : row));
  // a single subtraction may give fewer than 3 left rows
  for (let k = left.length; k < 3; k++) rows.push({ text: ' '.repeat(L + 1) + right[k] });
  return { rows, steps, answer: q, q, r };
}
