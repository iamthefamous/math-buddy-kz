/**
 * Safe math expression parser (no eval).
 * Grammar:
 *   expr    := term (('+' | '-') term)*
 *   term    := unary (('*' | '/' | ':' | implicit) unary)*
 *   unary   := ('-' | '+') unary | power
 *   power   := postfix ('^' unary)?          (right-associative)
 *   postfix := primary ('°' | '²' | '³')*
 *   primary := number | constant | 'x' | func '(' expr ')' | '(' expr ')' | '√' primary
 * Trig functions work in radians; "30°" converts degrees to radians.
 * A comma is always a decimal separator (no multi-argument functions exist).
 */

export class ParseError extends Error {}

type Node =
  | { k: 'num'; v: number }
  | { k: 'x' }
  | { k: 'neg'; a: Node }
  | { k: 'bin'; op: '+' | '-' | '*' | '/' | '^'; a: Node; b: Node }
  | { k: 'fn'; f: (v: number) => number; a: Node };

const acot = (v: number) => Math.PI / 2 - Math.atan(v);

const FUNCS: Record<string, (v: number) => number> = {
  sin: Math.sin,
  cos: Math.cos,
  tan: Math.tan,
  tg: Math.tan,
  cot: (v) => 1 / Math.tan(v),
  ctg: (v) => 1 / Math.tan(v),
  arcsin: Math.asin,
  asin: Math.asin,
  arccos: Math.acos,
  acos: Math.acos,
  arctan: Math.atan,
  arctg: Math.atan,
  atan: Math.atan,
  arccot: acot,
  arcctg: acot,
  acot,
  sqrt: Math.sqrt,
  cbrt: Math.cbrt,
  abs: Math.abs,
  ln: Math.log,
  lg: Math.log10,
  log: Math.log10,
  exp: Math.exp,
};

const CONSTS: Record<string, number> = { pi: Math.PI, 'π': Math.PI, e: Math.E };

// Longest names first so "arcsin" wins over "sin", "exp" over "e".
const NAMES = [...Object.keys(FUNCS), ...Object.keys(CONSTS), 'x'].sort((a, b) => b.length - a.length);

type Tok = { t: 'num'; v: number } | { t: 'name'; v: string } | { t: 'op'; v: string };

const OPS: Record<string, string> = {
  '+': '+', '-': '-', '−': '-', '–': '-', '*': '*', '·': '*', '×': '*', '/': '/', ':': '/', '÷': '/',
  '^': '^', '(': '(', ')': ')', '√': '√', '°': '°', '²': '²', '³': '³',
};

function tokenize(src: string, allowX: boolean): Tok[] {
  const s = src.replace(/,/g, '.').toLowerCase();
  const out: Tok[] = [];
  let i = 0;
  while (i < s.length) {
    const ch = s[i];
    if (/\s/.test(ch)) { i++; continue; }
    if (/[0-9.]/.test(ch)) {
      const m = /^(\d+\.?\d*|\.\d+)(e[+-]?\d+)?/.exec(s.slice(i));
      if (!m) throw new ParseError('number');
      out.push({ t: 'num', v: parseFloat(m[0]) });
      i += m[0].length;
      continue;
    }
    if (OPS[ch]) { out.push({ t: 'op', v: OPS[ch] }); i++; continue; }
    if (/[a-zπ]/.test(ch)) {
      const name = NAMES.find((n) => s.startsWith(n, i));
      if (!name || (name === 'x' && !allowX)) throw new ParseError('name');
      out.push({ t: 'name', v: name });
      i += name.length;
      continue;
    }
    throw new ParseError('char');
  }
  return out;
}

class Parser {
  private i = 0;
  constructor(private toks: Tok[]) {}

  parse(): Node {
    if (this.toks.length === 0) throw new ParseError('empty');
    const n = this.expr();
    if (this.i < this.toks.length) throw new ParseError('trailing');
    return n;
  }

  private peek() { return this.toks[this.i]; }
  private isOp(v: string) { const t = this.peek(); return t !== undefined && t.t === 'op' && t.v === v; }
  private eat(v: string) {
    if (!this.isOp(v)) throw new ParseError('expected ' + v);
    this.i++;
  }

  private expr(): Node {
    let n = this.term();
    while (this.isOp('+') || this.isOp('-')) {
      const op = (this.toks[this.i++] as { v: '+' | '-' }).v;
      n = { k: 'bin', op, a: n, b: this.term() };
    }
    return n;
  }

  private startsPrimary(): boolean {
    const t = this.peek();
    if (!t) return false;
    return t.t === 'name' || (t.t === 'op' && (t.v === '(' || t.v === '√'));
  }

  private term(): Node {
    let n = this.unary();
    for (;;) {
      if (this.isOp('*') || this.isOp('/')) {
        const op = (this.toks[this.i++] as { v: '*' | '/' }).v;
        n = { k: 'bin', op, a: n, b: this.unary() };
      } else if (this.startsPrimary()) {
        // implicit multiplication: 2x, 3(x+1), 2π, x√2
        n = { k: 'bin', op: '*', a: n, b: this.power() };
      } else return n;
    }
  }

  private unary(): Node {
    if (this.isOp('-')) { this.i++; return { k: 'neg', a: this.unary() }; }
    if (this.isOp('+')) { this.i++; return this.unary(); }
    return this.power();
  }

  private power(): Node {
    const base = this.postfix();
    if (this.isOp('^')) { this.i++; return { k: 'bin', op: '^', a: base, b: this.unary() }; }
    return base;
  }

  private postfix(): Node {
    let n = this.primary();
    for (;;) {
      if (this.isOp('°')) { this.i++; n = { k: 'bin', op: '*', a: n, b: { k: 'num', v: Math.PI / 180 } }; }
      else if (this.isOp('²')) { this.i++; n = { k: 'bin', op: '^', a: n, b: { k: 'num', v: 2 } }; }
      else if (this.isOp('³')) { this.i++; n = { k: 'bin', op: '^', a: n, b: { k: 'num', v: 3 } }; }
      else return n;
    }
  }

  private primary(): Node {
    const t = this.peek();
    if (!t) throw new ParseError('end');
    if (t.t === 'num') { this.i++; return { k: 'num', v: t.v }; }
    if (t.t === 'name') {
      this.i++;
      if (t.v === 'x') return { k: 'x' };
      if (t.v in CONSTS) return { k: 'num', v: CONSTS[t.v] };
      if (!this.isOp('(')) throw new ParseError('parens');
      this.eat('(');
      const a = this.expr();
      this.eat(')');
      return { k: 'fn', f: FUNCS[t.v], a };
    }
    if (t.v === '(') {
      this.i++;
      const n = this.expr();
      this.eat(')');
      return n;
    }
    if (t.v === '√') {
      this.i++;
      return { k: 'fn', f: Math.sqrt, a: this.primary() };
    }
    throw new ParseError('unexpected');
  }
}

function evalNode(n: Node, x: number): number {
  switch (n.k) {
    case 'num': return n.v;
    case 'x': return x;
    case 'neg': return -evalNode(n.a, x);
    case 'fn': return n.f(evalNode(n.a, x));
    case 'bin': {
      const a = evalNode(n.a, x);
      const b = evalNode(n.b, x);
      switch (n.op) {
        case '+': return a + b;
        case '-': return a - b;
        case '*': return a * b;
        case '/': return a / b;
        case '^': return powReal(a, b);
      }
    }
  }
}

/** Real power: allows odd roots of negatives, e.g. (-8)^(1/3) = -2. */
function powReal(a: number, b: number): number {
  if (a >= 0 || Number.isInteger(b)) return Math.pow(a, b);
  const inv = 1 / b;
  if (Number.isInteger(Math.round(inv)) && Math.abs(inv - Math.round(inv)) < 1e-9 && Math.round(inv) % 2 !== 0) {
    return -Math.pow(-a, b);
  }
  return NaN;
}

/** Compile an expression in x into a function. Throws ParseError on bad syntax. */
export function compile(src: string): (x: number) => number {
  const ast = new Parser(tokenize(src, true)).parse();
  return (x: number) => evalNode(ast, x);
}

/** Evaluate a constant expression. Throws ParseError on bad syntax; may return NaN/Infinity. */
export function evaluate(src: string): number {
  return evalNode(new Parser(tokenize(src, false)).parse(), 0);
}

/** Parse a user-typed number; null when empty or invalid. */
export function parseNumber(src: string): number | null {
  if (src.trim() === '') return null;
  try {
    const v = evaluate(src);
    return Number.isFinite(v) ? v : null;
  } catch {
    return null;
  }
}

/** True when the input text explicitly states its angle unit (π or °). */
export function hasExplicitAngleUnit(src: string): boolean {
  return /π|pi|°/i.test(src);
}
