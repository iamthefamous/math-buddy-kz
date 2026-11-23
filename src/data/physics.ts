import type { L10n } from '../i18n/langs';

/**
 * School physics formulas (grades 7–11), SI units.
 * Each formula lists its variables and, for every variable it can be solved for,
 * a display template (rendered with lib/formula) plus the matching function.
 * Templates and functions are cross-checked in physics.test.ts.
 */

export interface PVar {
  key: string;
  sym: string;
  name: L10n;
  unit: L10n;
  /** Initial field value. */
  def: string;
  /** Physically must be > 0 (mass, time, resistance, …). */
  pos?: boolean;
  /** Physical constant: pre-filled and editable, never solved for. */
  konst?: boolean;
}

export interface PSolve { tpl: string; fn: (v: Record<string, number>) => number }

export type TopicId = 'kin' | 'dyn' | 'press' | 'energy' | 'heat' | 'elec' | 'osc';

export interface PFormula {
  id: string;
  topic: TopicId;
  name: L10n;
  eq: string;
  vars: PVar[];
  solve: Record<string, PSolve>;
}

const L = (en: string, ru: string, kk: string): L10n => ({ en, ru, kk });
/** Kazakh uses the same unit abbreviations as Russian. */
const U = (en: string, ru: string): L10n => ({ en, ru, kk: ru });
const V = (key: string, sym: string, name: L10n, unit: L10n, def: string, pos = false): PVar => ({ key, sym, name, unit, def, pos });

export const TOPICS: { id: TopicId; name: L10n }[] = [
  { id: 'kin', name: L('Kinematics', 'Кинематика', 'Кинематика') },
  { id: 'dyn', name: L('Dynamics and forces', 'Динамика и силы', 'Динамика және күштер') },
  { id: 'press', name: L('Density and pressure', 'Плотность и давление', 'Тығыздық және қысым') },
  { id: 'energy', name: L('Work, energy, momentum', 'Работа, энергия, импульс', 'Жұмыс, энергия, импульс') },
  { id: 'heat', name: L('Thermal phenomena', 'Тепловые явления', 'Жылу құбылыстары') },
  { id: 'elec', name: L('Electricity', 'Электричество', 'Электр') },
  { id: 'osc', name: L('Oscillations and waves', 'Колебания и волны', 'Тербелістер және толқындар') },
];

// ── units ──
const M = U('m', 'м');
const S_ = U('s', 'с');
const MS = U('m/s', 'м/с');
const MS2 = U('m/s²', 'м/с²');
const KG = U('kg', 'кг');
const NEWTON = U('N', 'Н');
const JOULE = U('J', 'Дж');
const PA = U('Pa', 'Па');

// ── shared variables ──
const s = V('s', 's', L('distance', 'путь', 'жол'), M, '100');
const v = V('v', 'v', L('speed', 'скорость', 'жылдамдық'), MS, '20');
const v0 = V('v0', 'v₀', L('initial speed', 'начальная скорость', 'бастапқы жылдамдық'), MS, '5');
const t = V('t', 't', L('time', 'время', 'уақыт'), S_, '5', true);
const a = V('a', 'a', L('acceleration', 'ускорение', 'үдеу'), MS2, '2');
const h = V('h', 'h', L('height', 'высота', 'биіктік'), M, '20', true);
const m = V('m', 'm', L('mass', 'масса', 'масса'), KG, '2', true);
const F = V('F', 'F', L('force', 'сила', 'күш'), NEWTON, '10');
const rho = V('rho', 'ρ', L('density', 'плотность', 'тығыздық'), U('kg/m³', 'кг/м³'), '1000', true);
const vol = V('V', 'V', L('volume', 'объём', 'көлем'), U('m³', 'м³'), '0.002', true);
const k = V('k', 'k', L('spring stiffness', 'жёсткость пружины', 'серіппенің қатаңдығы'), U('N/m', 'Н/м'), '200', true);
const Q = V('Q', 'Q', L('amount of heat', 'количество теплоты', 'жылу мөлшері'), JOULE, '42000');
const I = V('I', 'I', L('current', 'сила тока', 'ток күші'), U('A', 'А'), '2', true);
const R = V('R', 'R', L('resistance', 'сопротивление', 'кедергі'), U('Ω', 'Ом'), '10', true);
const U_ = V('U', 'U', L('voltage', 'напряжение', 'кернеу'), U('V', 'В'), '20');
const T = V('T', 'T', L('period', 'период', 'период'), S_, '2', true);
const nu = V('nu', 'ν', L('frequency', 'частота', 'жиілік'), U('Hz', 'Гц'), '0.5', true);
const r = V('r', 'r', L('distance between the bodies', 'расстояние между телами', 'денелердің арақашықтығы'), M, '10', true);

const konst = (key: string, sym: string, name: L10n, unit: L10n, def: string): PVar => ({ key, sym, name, unit, def, pos: true, konst: true });
const g = konst('g', 'g', L('free-fall acceleration', 'ускорение свободного падения', 'еркін түсу үдеуі'), MS2, '9.8');
const G = konst('G', 'G', L('gravitational constant', 'гравитационная постоянная', 'гравитациялық тұрақты'), U('N·m²/kg²', 'Н·м²/кг²'), '6.67·10^-11');
const kc = konst('kc', 'k', L('Coulomb constant', 'коэффициент пропорциональности', 'пропорционалдық коэффициенті'), U('N·m²/C²', 'Н·м²/Кл²'), '9·10^9');

const sqrt = Math.sqrt;
const PI = Math.PI;

export const FORMULAS: PFormula[] = [
  // ───────── kinematics ─────────
  {
    id: 'uniform', topic: 'kin', name: L('Uniform motion', 'Равномерное движение', 'Бірқалыпты қозғалыс'),
    eq: 's = v·t', vars: [s, v, t],
    solve: {
      s: { tpl: '{v}·{t}', fn: (x) => x.v * x.t },
      v: { tpl: '{s}/{t}', fn: (x) => x.s / x.t },
      t: { tpl: '{s}/{v}', fn: (x) => x.s / x.v },
    },
  },
  {
    id: 'velocity', topic: 'kin', name: L('Speed in uniformly accelerated motion', 'Скорость при равноускоренном движении', 'Бірқалыпты үдемелі қозғалыстағы жылдамдық'),
    eq: 'v = v₀ + a·t', vars: [v, v0, a, t],
    solve: {
      v: { tpl: '{v0} + {a}·{t}', fn: (x) => x.v0 + x.a * x.t },
      v0: { tpl: '{v} − {a}·{t}', fn: (x) => x.v - x.a * x.t },
      a: { tpl: '({v} − {v0})/{t}', fn: (x) => (x.v - x.v0) / x.t },
      t: { tpl: '({v} − {v0})/{a}', fn: (x) => (x.v - x.v0) / x.a },
    },
  },
  {
    id: 'displacement', topic: 'kin', name: L('Displacement in uniformly accelerated motion', 'Перемещение при равноускоренном движении', 'Бірқалыпты үдемелі қозғалыстағы орын ауыстыру'),
    eq: 's = v₀·t + a·t²/2', vars: [s, v0, a, t],
    solve: {
      s: { tpl: '{v0}·{t} + {a}·{t}²/2', fn: (x) => x.v0 * x.t + (x.a * x.t ** 2) / 2 },
      v0: { tpl: '({s} − {a}·{t}²/2)/{t}', fn: (x) => (x.s - (x.a * x.t ** 2) / 2) / x.t },
      a: { tpl: '2·({s} − {v0}·{t})/{t}²', fn: (x) => (2 * (x.s - x.v0 * x.t)) / x.t ** 2 },
    },
  },
  {
    id: 'timeless', topic: 'kin', name: L('Motion without time', 'Формула без времени', 'Уақытсыз формула'),
    eq: 'v² − v₀² = 2·a·s', vars: [v, v0, a, s],
    solve: {
      s: { tpl: '({v}² − {v0}²)/(2·{a})', fn: (x) => (x.v ** 2 - x.v0 ** 2) / (2 * x.a) },
      a: { tpl: '({v}² − {v0}²)/(2·{s})', fn: (x) => (x.v ** 2 - x.v0 ** 2) / (2 * x.s) },
      v: { tpl: '√({v0}² + 2·{a}·{s})', fn: (x) => sqrt(x.v0 ** 2 + 2 * x.a * x.s) },
      v0: { tpl: '√({v}² − 2·{a}·{s})', fn: (x) => sqrt(x.v ** 2 - 2 * x.a * x.s) },
    },
  },
  {
    id: 'freefall', topic: 'kin', name: L('Free fall from rest', 'Свободное падение без начальной скорости', 'Бастапқы жылдамдықсыз еркін түсу'),
    eq: 'h = g·t²/2', vars: [h, t, g],
    solve: {
      h: { tpl: '{g}·{t}²/2', fn: (x) => (x.g * x.t ** 2) / 2 },
      t: { tpl: '√(2·{h}/{g})', fn: (x) => sqrt((2 * x.h) / x.g) },
    },
  },
  {
    id: 'circular', topic: 'kin', name: L('Centripetal acceleration', 'Центростремительное ускорение', 'Центрге тартқыш үдеу'),
    eq: 'a = v²/R',
    vars: [
      V('ac', 'a', L('centripetal acceleration', 'центростремительное ускорение', 'центрге тартқыш үдеу'), MS2, '8'),
      v,
      V('Rc', 'R', L('circle radius', 'радиус окружности', 'шеңбер радиусы'), M, '50', true),
    ],
    solve: {
      ac: { tpl: '{v}²/{Rc}', fn: (x) => x.v ** 2 / x.Rc },
      v: { tpl: '√({ac}·{Rc})', fn: (x) => sqrt(x.ac * x.Rc) },
      Rc: { tpl: '{v}²/{ac}', fn: (x) => x.v ** 2 / x.ac },
    },
  },

  // ───────── dynamics ─────────
  {
    id: 'newton2', topic: 'dyn', name: L("Newton's second law", 'Второй закон Ньютона', 'Ньютонның екінші заңы'),
    eq: 'F = m·a', vars: [F, m, a],
    solve: {
      F: { tpl: '{m}·{a}', fn: (x) => x.m * x.a },
      m: { tpl: '{F}/{a}', fn: (x) => x.F / x.a },
      a: { tpl: '{F}/{m}', fn: (x) => x.F / x.m },
    },
  },
  {
    id: 'gravity', topic: 'dyn', name: L('Force of gravity', 'Сила тяжести', 'Ауырлық күші'),
    eq: 'F = m·g', vars: [F, m, g],
    solve: {
      F: { tpl: '{m}·{g}', fn: (x) => x.m * x.g },
      m: { tpl: '{F}/{g}', fn: (x) => x.F / x.g },
    },
  },
  {
    id: 'hooke', topic: 'dyn', name: L("Hooke's law", 'Закон Гука', 'Гук заңы'),
    eq: 'F = k·Δl',
    vars: [F, k, V('dl', 'Δl', L('elongation', 'удлинение', 'ұзаруы'), M, '0.05')],
    solve: {
      F: { tpl: '{k}·{dl}', fn: (x) => x.k * x.dl },
      k: { tpl: '{F}/{dl}', fn: (x) => x.F / x.dl },
      dl: { tpl: '{F}/{k}', fn: (x) => x.F / x.k },
    },
  },
  {
    id: 'friction', topic: 'dyn', name: L('Sliding friction', 'Сила трения скольжения', 'Сырғанау үйкеліс күші'),
    eq: 'F = μ·N',
    vars: [
      F,
      V('mu', 'μ', L('friction coefficient', 'коэффициент трения', 'үйкеліс коэффициенті'), U('—', '—'), '0.3', true),
      V('N', 'N', L('normal force', 'сила реакции опоры', 'тіректің реакция күші'), NEWTON, '50', true),
    ],
    solve: {
      F: { tpl: '{mu}·{N}', fn: (x) => x.mu * x.N },
      mu: { tpl: '{F}/{N}', fn: (x) => x.F / x.N },
      N: { tpl: '{F}/{mu}', fn: (x) => x.F / x.mu },
    },
  },
  {
    id: 'gravitation', topic: 'dyn', name: L('Law of universal gravitation', 'Закон всемирного тяготения', 'Бүкіләлемдік тартылыс заңы'),
    eq: 'F = G·m₁·m₂/r²',
    vars: [
      F,
      V('m1', 'm₁', L('mass of body 1', 'масса тела 1', '1-дененің массасы'), KG, '1000', true),
      V('m2', 'm₂', L('mass of body 2', 'масса тела 2', '2-дененің массасы'), KG, '1000', true),
      r, G,
    ],
    solve: {
      F: { tpl: '{G}·{m1}·{m2}/{r}²', fn: (x) => (x.G * x.m1 * x.m2) / x.r ** 2 },
      m1: { tpl: '{F}·{r}²/({G}·{m2})', fn: (x) => (x.F * x.r ** 2) / (x.G * x.m2) },
      m2: { tpl: '{F}·{r}²/({G}·{m1})', fn: (x) => (x.F * x.r ** 2) / (x.G * x.m1) },
      r: { tpl: '√({G}·{m1}·{m2}/{F})', fn: (x) => sqrt((x.G * x.m1 * x.m2) / x.F) },
    },
  },

  // ───────── density and pressure ─────────
  {
    id: 'density', topic: 'press', name: L('Density', 'Плотность вещества', 'Заттың тығыздығы'),
    eq: 'ρ = m/V', vars: [rho, m, vol],
    solve: {
      rho: { tpl: '{m}/{V}', fn: (x) => x.m / x.V },
      m: { tpl: '{rho}·{V}', fn: (x) => x.rho * x.V },
      V: { tpl: '{m}/{rho}', fn: (x) => x.m / x.rho },
    },
  },
  {
    id: 'pressure', topic: 'press', name: L('Pressure', 'Давление', 'Қысым'),
    eq: 'p = F/S',
    vars: [
      V('p', 'p', L('pressure', 'давление', 'қысым'), PA, '5000'),
      F,
      V('S', 'S', L('area', 'площадь', 'аудан'), U('m²', 'м²'), '0.5', true),
    ],
    solve: {
      p: { tpl: '{F}/{S}', fn: (x) => x.F / x.S },
      F: { tpl: '{p}·{S}', fn: (x) => x.p * x.S },
      S: { tpl: '{F}/{p}', fn: (x) => x.F / x.p },
    },
  },
  {
    id: 'hydrostatic', topic: 'press', name: L('Liquid pressure', 'Давление жидкости', 'Сұйықтың қысымы'),
    eq: 'p = ρ·g·h',
    vars: [V('p', 'p', L('pressure', 'давление', 'қысым'), PA, '5000'), rho, { ...h, name: L('depth', 'глубина', 'тереңдік') }, g],
    solve: {
      p: { tpl: '{rho}·{g}·{h}', fn: (x) => x.rho * x.g * x.h },
      rho: { tpl: '{p}/({g}·{h})', fn: (x) => x.p / (x.g * x.h) },
      h: { tpl: '{p}/({rho}·{g})', fn: (x) => x.p / (x.rho * x.g) },
    },
  },
  {
    id: 'archimedes', topic: 'press', name: L("Archimedes' principle", 'Закон Архимеда', 'Архимед заңы'),
    eq: 'F = ρ·g·V',
    vars: [
      { ...F, name: L('buoyant force', 'архимедова сила', 'Архимед күші') },
      { ...rho, name: L('liquid density', 'плотность жидкости', 'сұйықтың тығыздығы') },
      { ...vol, name: L('submerged volume', 'объём погружённой части', 'батқан бөлігінің көлемі') },
      g,
    ],
    solve: {
      F: { tpl: '{rho}·{g}·{V}', fn: (x) => x.rho * x.g * x.V },
      rho: { tpl: '{F}/({g}·{V})', fn: (x) => x.F / (x.g * x.V) },
      V: { tpl: '{F}/({rho}·{g})', fn: (x) => x.F / (x.rho * x.g) },
    },
  },

  // ───────── work, energy, momentum ─────────
  {
    id: 'work', topic: 'energy', name: L('Mechanical work', 'Механическая работа', 'Механикалық жұмыс'),
    eq: 'A = F·s',
    vars: [V('A', 'A', L('work', 'работа', 'жұмыс'), JOULE, '1000'), F, s],
    solve: {
      A: { tpl: '{F}·{s}', fn: (x) => x.F * x.s },
      F: { tpl: '{A}/{s}', fn: (x) => x.A / x.s },
      s: { tpl: '{A}/{F}', fn: (x) => x.A / x.F },
    },
  },
  {
    id: 'power', topic: 'energy', name: L('Power', 'Мощность', 'Қуат'),
    eq: 'N = A/t',
    vars: [V('Np', 'N', L('power', 'мощность', 'қуат'), U('W', 'Вт'), '200'), V('A', 'A', L('work', 'работа', 'жұмыс'), JOULE, '1000'), t],
    solve: {
      Np: { tpl: '{A}/{t}', fn: (x) => x.A / x.t },
      A: { tpl: '{Np}·{t}', fn: (x) => x.Np * x.t },
      t: { tpl: '{A}/{Np}', fn: (x) => x.A / x.Np },
    },
  },
  {
    id: 'kinetic', topic: 'energy', name: L('Kinetic energy', 'Кинетическая энергия', 'Кинетикалық энергия'),
    eq: 'Eₖ = m·v²/2',
    vars: [V('Ek', 'Eₖ', L('kinetic energy', 'кинетическая энергия', 'кинетикалық энергия'), JOULE, '400'), m, v],
    solve: {
      Ek: { tpl: '{m}·{v}²/2', fn: (x) => (x.m * x.v ** 2) / 2 },
      m: { tpl: '2·{Ek}/{v}²', fn: (x) => (2 * x.Ek) / x.v ** 2 },
      v: { tpl: '√(2·{Ek}/{m})', fn: (x) => sqrt((2 * x.Ek) / x.m) },
    },
  },
  {
    id: 'potential', topic: 'energy', name: L('Potential energy', 'Потенциальная энергия', 'Потенциалдық энергия'),
    eq: 'Eₚ = m·g·h',
    vars: [V('Ep', 'Eₚ', L('potential energy', 'потенциальная энергия', 'потенциалдық энергия'), JOULE, '392'), m, h, g],
    solve: {
      Ep: { tpl: '{m}·{g}·{h}', fn: (x) => x.m * x.g * x.h },
      m: { tpl: '{Ep}/({g}·{h})', fn: (x) => x.Ep / (x.g * x.h) },
      h: { tpl: '{Ep}/({m}·{g})', fn: (x) => x.Ep / (x.m * x.g) },
    },
  },
  {
    id: 'momentum', topic: 'energy', name: L('Momentum', 'Импульс тела', 'Дене импульсі'),
    eq: 'p = m·v',
    vars: [V('pm', 'p', L('momentum', 'импульс', 'импульс'), U('kg·m/s', 'кг·м/с'), '40'), m, v],
    solve: {
      pm: { tpl: '{m}·{v}', fn: (x) => x.m * x.v },
      m: { tpl: '{pm}/{v}', fn: (x) => x.pm / x.v },
      v: { tpl: '{pm}/{m}', fn: (x) => x.pm / x.m },
    },
  },
  {
    id: 'efficiency', topic: 'energy', name: L('Efficiency', 'Коэффициент полезного действия (КПД)', 'Пайдалы әрекет коэффициенті (ПӘК)'),
    eq: 'η = A₁/A₂·100%',
    vars: [
      V('eta', 'η', L('efficiency', 'КПД', 'ПӘК'), U('%', '%'), '80', true),
      V('Au', 'A₁', L('useful work', 'полезная работа', 'пайдалы жұмыс'), JOULE, '400', true),
      V('At', 'A₂', L('total work done', 'затраченная работа', 'жұмсалған жұмыс'), JOULE, '500', true),
    ],
    solve: {
      eta: { tpl: '{Au}/{At}·100', fn: (x) => (x.Au / x.At) * 100 },
      Au: { tpl: '{eta}·{At}/100', fn: (x) => (x.eta * x.At) / 100 },
      At: { tpl: '{Au}·100/{eta}', fn: (x) => (x.Au * 100) / x.eta },
    },
  },

  // ───────── heat ─────────
  {
    id: 'heating', topic: 'heat', name: L('Heating and cooling', 'Нагревание и охлаждение', 'Қыздыру және салқындату'),
    eq: 'Q = c·m·Δt',
    vars: [
      Q,
      V('c', 'c', L('specific heat capacity', 'удельная теплоёмкость', 'меншікті жылусыйымдылық'), U('J/(kg·°C)', 'Дж/(кг·°C)'), '4200', true),
      m,
      V('dt', 'Δt', L('temperature change', 'изменение температуры', 'температураның өзгерісі'), U('°C', '°C'), '5'),
    ],
    solve: {
      Q: { tpl: '{c}·{m}·{dt}', fn: (x) => x.c * x.m * x.dt },
      c: { tpl: '{Q}/({m}·{dt})', fn: (x) => x.Q / (x.m * x.dt) },
      m: { tpl: '{Q}/({c}·{dt})', fn: (x) => x.Q / (x.c * x.dt) },
      dt: { tpl: '{Q}/({c}·{m})', fn: (x) => x.Q / (x.c * x.m) },
    },
  },
  ...(
    [
      ['melting', 'Q = λ·m', 'lf', 'λ', L('Melting', 'Плавление', 'Балқу'), L('specific heat of fusion', 'удельная теплота плавления', 'меншікті балқу жылуы'), '340000'],
      ['boiling', 'Q = L·m', 'Lv', 'L', L('Vaporization', 'Парообразование', 'Булану'), L('specific heat of vaporization', 'удельная теплота парообразования', 'меншікті булану жылуы'), '2300000'],
      ['fuel', 'Q = q·m', 'qf', 'q', L('Fuel combustion', 'Сгорание топлива', 'Отынның жануы'), L('specific heat of combustion', 'удельная теплота сгорания', 'меншікті жану жылуы'), '46000000'],
    ] as const
  ).map(([id, eq, key, sym, name, cname, def]): PFormula => ({
    id, topic: 'heat', name, eq,
    vars: [Q, V(key, sym, cname, U('J/kg', 'Дж/кг'), def, true), m],
    solve: {
      Q: { tpl: `{${key}}·{m}`, fn: (x) => x[key] * x.m },
      [key]: { tpl: `{Q}/{m}`, fn: (x) => x.Q / x.m },
      m: { tpl: `{Q}/{${key}}`, fn: (x) => x.Q / x[key] },
    },
  })),

  // ───────── electricity ─────────
  {
    id: 'current', topic: 'elec', name: L('Electric current', 'Сила тока', 'Ток күші'),
    eq: 'I = q/t',
    vars: [I, V('q', 'q', L('charge', 'электрический заряд', 'электр заряды'), U('C', 'Кл'), '10'), t],
    solve: {
      I: { tpl: '{q}/{t}', fn: (x) => x.q / x.t },
      q: { tpl: '{I}·{t}', fn: (x) => x.I * x.t },
      t: { tpl: '{q}/{I}', fn: (x) => x.q / x.I },
    },
  },
  {
    id: 'ohm', topic: 'elec', name: L("Ohm's law for a circuit section", 'Закон Ома для участка цепи', 'Тізбек бөлігі үшін Ом заңы'),
    eq: 'I = U/R', vars: [I, U_, R],
    solve: {
      I: { tpl: '{U}/{R}', fn: (x) => x.U / x.R },
      U: { tpl: '{I}·{R}', fn: (x) => x.I * x.R },
      R: { tpl: '{U}/{I}', fn: (x) => x.U / x.I },
    },
  },
  {
    id: 'epower', topic: 'elec', name: L('Electric power', 'Мощность электрического тока', 'Электр тогының қуаты'),
    eq: 'P = U·I',
    vars: [V('P', 'P', L('power', 'мощность', 'қуат'), U('W', 'Вт'), '40'), U_, I],
    solve: {
      P: { tpl: '{U}·{I}', fn: (x) => x.U * x.I },
      U: { tpl: '{P}/{I}', fn: (x) => x.P / x.I },
      I: { tpl: '{P}/{U}', fn: (x) => x.P / x.U },
    },
  },
  {
    id: 'joule', topic: 'elec', name: L('Joule–Lenz law', 'Закон Джоуля — Ленца', 'Джоуль — Ленц заңы'),
    eq: 'Q = I²·R·t', vars: [Q, I, R, t],
    solve: {
      Q: { tpl: '{I}²·{R}·{t}', fn: (x) => x.I ** 2 * x.R * x.t },
      I: { tpl: '√({Q}/({R}·{t}))', fn: (x) => sqrt(x.Q / (x.R * x.t)) },
      R: { tpl: '{Q}/({I}²·{t})', fn: (x) => x.Q / (x.I ** 2 * x.t) },
      t: { tpl: '{Q}/({I}²·{R})', fn: (x) => x.Q / (x.I ** 2 * x.R) },
    },
  },
  {
    id: 'coulomb', topic: 'elec', name: L("Coulomb's law", 'Закон Кулона', 'Кулон заңы'),
    eq: 'F = k·|q₁|·|q₂|/r²',
    vars: [
      F,
      V('q1', '|q₁|', L('charge 1 (magnitude)', 'модуль заряда 1', '1-заряд модулі'), U('C', 'Кл'), '1·10^-6', true),
      V('q2', '|q₂|', L('charge 2 (magnitude)', 'модуль заряда 2', '2-заряд модулі'), U('C', 'Кл'), '2·10^-6', true),
      { ...r, name: L('distance between the charges', 'расстояние между зарядами', 'зарядтардың арақашықтығы'), def: '0.1' },
      kc,
    ],
    solve: {
      F: { tpl: '{kc}·{q1}·{q2}/{r}²', fn: (x) => (x.kc * x.q1 * x.q2) / x.r ** 2 },
      q1: { tpl: '{F}·{r}²/({kc}·{q2})', fn: (x) => (x.F * x.r ** 2) / (x.kc * x.q2) },
      q2: { tpl: '{F}·{r}²/({kc}·{q1})', fn: (x) => (x.F * x.r ** 2) / (x.kc * x.q1) },
      r: { tpl: '√({kc}·{q1}·{q2}/{F})', fn: (x) => sqrt((x.kc * x.q1 * x.q2) / x.F) },
    },
  },

  // ───────── oscillations and waves ─────────
  {
    id: 'frequency', topic: 'osc', name: L('Period and frequency', 'Период и частота', 'Период және жиілік'),
    eq: 'T = 1/ν', vars: [T, nu],
    solve: {
      T: { tpl: '1/{nu}', fn: (x) => 1 / x.nu },
      nu: { tpl: '1/{T}', fn: (x) => 1 / x.T },
    },
  },
  {
    id: 'wave', topic: 'osc', name: L('Wave speed', 'Скорость волны', 'Толқынның таралу жылдамдығы'),
    eq: 'v = λ·ν',
    vars: [{ ...v, name: L('wave speed', 'скорость волны', 'толқын жылдамдығы'), def: '340' }, V('lw', 'λ', L('wavelength', 'длина волны', 'толқын ұзындығы'), M, '0.5', true), { ...nu, def: '680' }],
    solve: {
      v: { tpl: '{lw}·{nu}', fn: (x) => x.lw * x.nu },
      lw: { tpl: '{v}/{nu}', fn: (x) => x.v / x.nu },
      nu: { tpl: '{v}/{lw}', fn: (x) => x.v / x.lw },
    },
  },
  {
    id: 'pendulum', topic: 'osc', name: L('Simple pendulum', 'Математический маятник', 'Математикалық маятник'),
    eq: 'T = 2π·√(l/g)',
    vars: [T, V('l', 'l', L('string length', 'длина нити', 'жіптің ұзындығы'), M, '1', true), g],
    solve: {
      T: { tpl: '2·π·√({l}/{g})', fn: (x) => 2 * PI * sqrt(x.l / x.g) },
      l: { tpl: '{g}·{T}²/(4·π²)', fn: (x) => (x.g * x.T ** 2) / (4 * PI ** 2) },
    },
  },
  {
    id: 'spring', topic: 'osc', name: L('Spring pendulum', 'Пружинный маятник', 'Серіппелі маятник'),
    eq: 'T = 2π·√(m/k)', vars: [T, m, k],
    solve: {
      T: { tpl: '2·π·√({m}/{k})', fn: (x) => 2 * PI * sqrt(x.m / x.k) },
      m: { tpl: '{k}·{T}²/(4·π²)', fn: (x) => (x.k * x.T ** 2) / (4 * PI ** 2) },
      k: { tpl: '4·π²·{m}/{T}²', fn: (x) => (4 * PI ** 2 * x.m) / x.T ** 2 },
    },
  },
];
