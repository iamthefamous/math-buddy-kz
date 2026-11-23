import type { L10n } from '../i18n/langs';

/** A unit is defined by its size in the quantity's base (SI) unit; temperature is handled separately. */
export interface Unit { id: string; sym: L10n; name: L10n; f: number }
export interface Quantity { id: string; name: L10n; units: Unit[] }

const L = (en: string, ru: string, kk: string): L10n => ({ en, ru, kk });
const u = (id: string, sym: L10n, name: L10n, f: number): Unit => ({ id, sym, name, f });
/** Same symbol in Russian and Kazakh. */
const S = (en: string, ru: string): L10n => ({ en, ru, kk: ru });

export const QUANTITIES: Quantity[] = [
  {
    id: 'length', name: L('Length', 'Длина', 'Ұзындық'),
    units: [
      u('mm', S('mm', 'мм'), L('millimetre', 'миллиметр', 'миллиметр'), 1e-3),
      u('cm', S('cm', 'см'), L('centimetre', 'сантиметр', 'сантиметр'), 1e-2),
      u('dm', S('dm', 'дм'), L('decimetre', 'дециметр', 'дециметр'), 1e-1),
      u('m', S('m', 'м'), L('metre', 'метр', 'метр'), 1),
      u('km', S('km', 'км'), L('kilometre', 'километр', 'километр'), 1e3),
    ],
  },
  {
    id: 'mass', name: L('Mass', 'Масса', 'Масса'),
    units: [
      u('mg', S('mg', 'мг'), L('milligram', 'миллиграмм', 'миллиграмм'), 1e-6),
      u('g', S('g', 'г'), L('gram', 'грамм', 'грамм'), 1e-3),
      u('kg', S('kg', 'кг'), L('kilogram', 'килограмм', 'килограмм'), 1),
      u('q', S('q', 'ц'), L('quintal (100 kg)', 'центнер', 'центнер'), 100),
      u('t', S('t', 'т'), L('tonne', 'тонна', 'тонна'), 1e3),
    ],
  },
  {
    id: 'time', name: L('Time', 'Время', 'Уақыт'),
    units: [
      u('s', S('s', 'с'), L('second', 'секунда', 'секунд'), 1),
      u('min', S('min', 'мин'), L('minute', 'минута', 'минут'), 60),
      u('h', L('h', 'ч', 'сағ'), L('hour', 'час', 'сағат'), 3600),
      u('day', L('day', 'сут', 'тәул'), L('day', 'сутки', 'тәулік'), 86400),
    ],
  },
  {
    id: 'area', name: L('Area', 'Площадь', 'Аудан'),
    units: [
      u('mm2', S('mm²', 'мм²'), L('square millimetre', 'квадратный миллиметр', 'шаршы миллиметр'), 1e-6),
      u('cm2', S('cm²', 'см²'), L('square centimetre', 'квадратный сантиметр', 'шаршы сантиметр'), 1e-4),
      u('dm2', S('dm²', 'дм²'), L('square decimetre', 'квадратный дециметр', 'шаршы дециметр'), 1e-2),
      u('m2', S('m²', 'м²'), L('square metre', 'квадратный метр', 'шаршы метр'), 1),
      u('a', S('a', 'а'), L('are (100 m²)', 'ар (сотка)', 'ар (сотық)'), 1e2),
      u('ha', S('ha', 'га'), L('hectare', 'гектар', 'гектар'), 1e4),
      u('km2', S('km²', 'км²'), L('square kilometre', 'квадратный километр', 'шаршы километр'), 1e6),
    ],
  },
  {
    id: 'volume', name: L('Volume', 'Объём', 'Көлем'),
    units: [
      u('mm3', S('mm³', 'мм³'), L('cubic millimetre', 'кубический миллиметр', 'текше миллиметр'), 1e-9),
      u('ml', S('ml (cm³)', 'мл (см³)'), L('millilitre', 'миллилитр', 'миллилитр'), 1e-6),
      u('l', S('l (dm³)', 'л (дм³)'), L('litre', 'литр', 'литр'), 1e-3),
      u('m3', S('m³', 'м³'), L('cubic metre', 'кубический метр', 'текше метр'), 1),
    ],
  },
  {
    id: 'speed', name: L('Speed', 'Скорость', 'Жылдамдық'),
    units: [
      u('cms', S('cm/s', 'см/с'), L('centimetre per second', 'сантиметр в секунду', 'секундына сантиметр'), 1e-2),
      u('ms', S('m/s', 'м/с'), L('metre per second', 'метр в секунду', 'секундына метр'), 1),
      u('kmh', L('km/h', 'км/ч', 'км/сағ'), L('kilometre per hour', 'километр в час', 'сағатына километр'), 1 / 3.6),
      u('kms', S('km/s', 'км/с'), L('kilometre per second', 'километр в секунду', 'секундына километр'), 1e3),
    ],
  },
  {
    id: 'pressure', name: L('Pressure', 'Давление', 'Қысым'),
    units: [
      u('pa', S('Pa', 'Па'), L('pascal', 'паскаль', 'паскаль'), 1),
      u('hpa', S('hPa', 'гПа'), L('hectopascal', 'гектопаскаль', 'гектопаскаль'), 1e2),
      u('kpa', S('kPa', 'кПа'), L('kilopascal', 'килопаскаль', 'килопаскаль'), 1e3),
      u('mpa', S('MPa', 'МПа'), L('megapascal', 'мегапаскаль', 'мегапаскаль'), 1e6),
      u('mmhg', L('mmHg', 'мм рт. ст.', 'мм сын. бағ.'), L('millimetre of mercury', 'миллиметр ртутного столба', 'сынап бағанасының миллиметрі'), 133.322),
      u('atm', S('atm', 'атм'), L('standard atmosphere', 'нормальная атмосфера', 'қалыпты атмосфера'), 101325),
    ],
  },
  {
    id: 'energy', name: L('Energy and work', 'Энергия и работа', 'Энергия және жұмыс'),
    units: [
      u('j', S('J', 'Дж'), L('joule', 'джоуль', 'джоуль'), 1),
      u('kj', S('kJ', 'кДж'), L('kilojoule', 'килоджоуль', 'килоджоуль'), 1e3),
      u('mj', S('MJ', 'МДж'), L('megajoule', 'мегаджоуль', 'мегаджоуль'), 1e6),
      u('kwh', L('kWh', 'кВт·ч', 'кВт·сағ'), L('kilowatt-hour', 'киловатт-час', 'киловатт-сағат'), 3.6e6),
    ],
  },
];

export type TempId = 'C' | 'K' | 'F';
export const TEMP_UNITS: { id: TempId; sym: string; name: L10n }[] = [
  { id: 'C', sym: '°C', name: L('degree Celsius', 'градус Цельсия', 'Цельсий градусы') },
  { id: 'K', sym: 'K', name: L('kelvin', 'кельвин', 'кельвин') },
  { id: 'F', sym: '°F', name: L('degree Fahrenheit', 'градус Фаренгейта', 'Фаренгейт градусы') },
];
export const toCelsius = (id: TempId, x: number) => (id === 'K' ? x - 273.15 : id === 'F' ? ((x - 32) * 5) / 9 : x);
export const fromCelsius = (id: TempId, c: number) => (id === 'K' ? c + 273.15 : id === 'F' ? (c * 9) / 5 + 32 : c);
