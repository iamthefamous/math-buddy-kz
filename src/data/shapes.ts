import type { L10n } from '../i18n/langs';
import type { Key } from '../i18n/en';

export type Dim = 'len' | 'area' | 'vol';

export interface ShapeInput { key: string; name: L10n }
export interface ShapeOutput {
  key: string;
  sym: string;
  name: L10n;
  dim: Dim;
  /** Template over input keys and earlier output keys, e.g. "{a}·{b}". */
  tpl: string;
  fn: (v: Record<string, number>) => number;
}
export interface Shape {
  id: string;
  solid: boolean;
  name: L10n;
  inputs: ShapeInput[];
  outputs: ShapeOutput[];
  /** Extra consistency check; returns an error key. */
  check?: (v: Record<string, number>) => Key | null;
}

const L = (en: string, ru: string, kk: string): L10n => ({ en, ru, kk });
const side = (k: string) => ({ key: k, name: L(`side ${k}`, `сторона ${k}`, `${k} қабырғасы`) });
const height = { key: 'h', name: L('height h', 'высота h', 'биіктік h') };
const radius = { key: 'r', name: L('radius r', 'радиус r', 'радиус r') };
const AREA = L('area', 'площадь', 'аудан');
const PERIM = L('perimeter', 'периметр', 'периметр');
const DIAG = L('diagonal', 'диагональ', 'диагональ');
const VOL = L('volume', 'объём', 'көлем');
const SURF = L('total surface area', 'площадь полной поверхности', 'толық бетінің ауданы');
const LAT = L('lateral surface area', 'площадь боковой поверхности', 'бүйір бетінің ауданы');

export const SHAPES: Shape[] = [
  {
    id: 'square', solid: false, name: L('Square', 'Квадрат', 'Шаршы'), inputs: [side('a')],
    outputs: [
      { key: 'S', sym: 'S', name: AREA, dim: 'area', tpl: '{a}²', fn: (v) => v.a ** 2 },
      { key: 'P', sym: 'P', name: PERIM, dim: 'len', tpl: '4·{a}', fn: (v) => 4 * v.a },
      { key: 'd', sym: 'd', name: DIAG, dim: 'len', tpl: '{a}·√2', fn: (v) => v.a * Math.SQRT2 },
    ],
  },
  {
    id: 'rect', solid: false, name: L('Rectangle', 'Прямоугольник', 'Тіктөртбұрыш'), inputs: [side('a'), side('b')],
    outputs: [
      { key: 'S', sym: 'S', name: AREA, dim: 'area', tpl: '{a}·{b}', fn: (v) => v.a * v.b },
      { key: 'P', sym: 'P', name: PERIM, dim: 'len', tpl: '2·({a} + {b})', fn: (v) => 2 * (v.a + v.b) },
      { key: 'd', sym: 'd', name: DIAG, dim: 'len', tpl: '√({a}² + {b}²)', fn: (v) => Math.hypot(v.a, v.b) },
    ],
  },
  {
    id: 'triangle', solid: false, name: L('Triangle (base and height)', 'Треугольник (основание и высота)', 'Үшбұрыш (табаны және биіктігі)'),
    inputs: [{ key: 'a', name: L('base a', 'основание a', 'табаны a') }, height],
    outputs: [{ key: 'S', sym: 'S', name: AREA, dim: 'area', tpl: '{a}·{h}/2', fn: (v) => (v.a * v.h) / 2 }],
  },
  {
    id: 'circle', solid: false, name: L('Circle', 'Круг', 'Дөңгелек'), inputs: [radius],
    outputs: [
      { key: 'd', sym: 'd', name: L('diameter', 'диаметр', 'диаметр'), dim: 'len', tpl: '2·{r}', fn: (v) => 2 * v.r },
      { key: 'C', sym: 'C', name: L('circumference', 'длина окружности', 'шеңбер ұзындығы'), dim: 'len', tpl: '2·π·{r}', fn: (v) => 2 * Math.PI * v.r },
      { key: 'S', sym: 'S', name: AREA, dim: 'area', tpl: 'π·{r}²', fn: (v) => Math.PI * v.r ** 2 },
    ],
  },
  {
    id: 'parallelogram', solid: false, name: L('Parallelogram', 'Параллелограмм', 'Параллелограмм'),
    inputs: [side('a'), side('b'), { key: 'h', name: L('height h to side a', 'высота h к стороне a', 'a қабырғасына түсірілген биіктік h') }],
    outputs: [
      { key: 'S', sym: 'S', name: AREA, dim: 'area', tpl: '{a}·{h}', fn: (v) => v.a * v.h },
      { key: 'P', sym: 'P', name: PERIM, dim: 'len', tpl: '2·({a} + {b})', fn: (v) => 2 * (v.a + v.b) },
    ],
    check: (v) => (v.h > v.b ? 'shape.errHeight' : null),
  },
  {
    id: 'rhombus', solid: false, name: L('Rhombus', 'Ромб', 'Ромб'),
    inputs: [{ key: 'd1', name: L('diagonal d₁', 'диагональ d₁', 'диагональ d₁') }, { key: 'd2', name: L('diagonal d₂', 'диагональ d₂', 'диагональ d₂') }],
    outputs: [
      { key: 'S', sym: 'S', name: AREA, dim: 'area', tpl: '{d1}·{d2}/2', fn: (v) => (v.d1 * v.d2) / 2 },
      { key: 'a', sym: 'a', name: L('side', 'сторона', 'қабырғасы'), dim: 'len', tpl: '√(({d1}/2)² + ({d2}/2)²)', fn: (v) => Math.hypot(v.d1 / 2, v.d2 / 2) },
      { key: 'P', sym: 'P', name: PERIM, dim: 'len', tpl: '4·{a}', fn: (v) => 4 * v.a },
    ],
  },
  {
    id: 'trapezoid', solid: false, name: L('Trapezoid', 'Трапеция', 'Трапеция'),
    inputs: [{ key: 'a', name: L('base a', 'основание a', 'табаны a') }, { key: 'b', name: L('base b', 'основание b', 'табаны b') }, height],
    outputs: [
      { key: 'm', sym: 'm', name: L('midline', 'средняя линия', 'орта сызығы'), dim: 'len', tpl: '({a} + {b})/2', fn: (v) => (v.a + v.b) / 2 },
      { key: 'S', sym: 'S', name: AREA, dim: 'area', tpl: '({a} + {b})/2·{h}', fn: (v) => ((v.a + v.b) / 2) * v.h },
    ],
  },
  {
    id: 'cube', solid: true, name: L('Cube', 'Куб', 'Куб'), inputs: [{ key: 'a', name: L('edge a', 'ребро a', 'қыры a') }],
    outputs: [
      { key: 'V', sym: 'V', name: VOL, dim: 'vol', tpl: '{a}³', fn: (v) => v.a ** 3 },
      { key: 'S', sym: 'S', name: SURF, dim: 'area', tpl: '6·{a}²', fn: (v) => 6 * v.a ** 2 },
      { key: 'd', sym: 'd', name: DIAG, dim: 'len', tpl: '{a}·√3', fn: (v) => v.a * Math.sqrt(3) },
    ],
  },
  {
    id: 'box', solid: true, name: L('Rectangular box', 'Прямоугольный параллелепипед', 'Тікбұрышты параллелепипед'),
    inputs: ['a', 'b', 'c'].map((k) => ({ key: k, name: L(`edge ${k}`, `ребро ${k}`, `${k} қыры`) })),
    outputs: [
      { key: 'V', sym: 'V', name: VOL, dim: 'vol', tpl: '{a}·{b}·{c}', fn: (v) => v.a * v.b * v.c },
      { key: 'S', sym: 'S', name: SURF, dim: 'area', tpl: '2·({a}·{b} + {b}·{c} + {a}·{c})', fn: (v) => 2 * (v.a * v.b + v.b * v.c + v.a * v.c) },
      { key: 'd', sym: 'd', name: DIAG, dim: 'len', tpl: '√({a}² + {b}² + {c}²)', fn: (v) => Math.hypot(v.a, v.b, v.c) },
    ],
  },
  {
    id: 'cylinder', solid: true, name: L('Cylinder', 'Цилиндр', 'Цилиндр'), inputs: [radius, height],
    outputs: [
      { key: 'V', sym: 'V', name: VOL, dim: 'vol', tpl: 'π·{r}²·{h}', fn: (v) => Math.PI * v.r ** 2 * v.h },
      { key: 'Sl', sym: 'S₁', name: LAT, dim: 'area', tpl: '2·π·{r}·{h}', fn: (v) => 2 * Math.PI * v.r * v.h },
      { key: 'S', sym: 'S', name: SURF, dim: 'area', tpl: '2·π·{r}·({r} + {h})', fn: (v) => 2 * Math.PI * v.r * (v.r + v.h) },
    ],
  },
  {
    id: 'cone', solid: true, name: L('Cone', 'Конус', 'Конус'), inputs: [radius, height],
    outputs: [
      { key: 'l', sym: 'l', name: L('slant height', 'образующая', 'жасаушысы'), dim: 'len', tpl: '√({r}² + {h}²)', fn: (v) => Math.hypot(v.r, v.h) },
      { key: 'V', sym: 'V', name: VOL, dim: 'vol', tpl: 'π·{r}²·{h}/3', fn: (v) => (Math.PI * v.r ** 2 * v.h) / 3 },
      { key: 'Sl', sym: 'S₁', name: LAT, dim: 'area', tpl: 'π·{r}·{l}', fn: (v) => Math.PI * v.r * v.l },
      { key: 'S', sym: 'S', name: SURF, dim: 'area', tpl: 'π·{r}·({r} + {l})', fn: (v) => Math.PI * v.r * (v.r + v.l) },
    ],
  },
  {
    id: 'sphere', solid: true, name: L('Sphere (ball)', 'Шар', 'Шар'), inputs: [radius],
    outputs: [
      { key: 'V', sym: 'V', name: VOL, dim: 'vol', tpl: '4/3·π·{r}³', fn: (v) => (4 / 3) * Math.PI * v.r ** 3 },
      { key: 'S', sym: 'S', name: L('surface area', 'площадь поверхности (сферы)', 'сфера ауданы'), dim: 'area', tpl: '4·π·{r}²', fn: (v) => 4 * Math.PI * v.r ** 2 },
    ],
  },
];
