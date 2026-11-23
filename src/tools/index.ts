import type { ComponentType } from 'react';
import Calculator from './Calculator';
import Column from './Column';
import Fractions from './Fractions';
import GcdLcm from './GcdLcm';
import Percent from './Percent';
import Proportion from './Proportion';
import Shapes from './Shapes';
import Units from './Units';
import Linear from './Linear';
import LinearSystem from './LinearSystem';
import Quadratic from './Quadratic';
import Progression from './Progression';
import Grapher from './Grapher';
import RightTriangle from './RightTriangle';
import Triangle from './Triangle';
import UnitCircle from './UnitCircle';
import TrigEquation from './TrigEquation';
import Sinusoid from './Sinusoid';
import Physics from './Physics';

export const CATEGORIES = ['arith', 'algebra', 'geometry', 'trig', 'physics'] as const;
export type Category = (typeof CATEGORIES)[number];

interface ToolSpec {
  cat: Category;
  /** School grades (1–11) the tool is meant for, inclusive. */
  grades: readonly [number, number];
  icon: string;
  Component: ComponentType;
}

export interface ToolDef extends ToolSpec { id: ToolId }

/** Display order within each category follows this list. */
export const TOOLS = [
  { id: 'calculator', cat: 'arith', grades: [1, 11], icon: '🧮', Component: Calculator },
  { id: 'column', cat: 'arith', grades: [1, 4], icon: '➕', Component: Column },
  { id: 'fractions', cat: 'arith', grades: [5, 6], icon: '½', Component: Fractions },
  { id: 'gcdLcm', cat: 'arith', grades: [5, 6], icon: '÷', Component: GcdLcm },
  { id: 'percent', cat: 'arith', grades: [5, 11], icon: '%', Component: Percent },
  { id: 'proportion', cat: 'arith', grades: [6, 6], icon: '∷', Component: Proportion },
  { id: 'linear', cat: 'algebra', grades: [6, 7], icon: 'x', Component: Linear },
  { id: 'linearSystem', cat: 'algebra', grades: [6, 8], icon: '{', Component: LinearSystem },
  { id: 'quadratic', cat: 'algebra', grades: [8, 9], icon: 'x²', Component: Quadratic },
  { id: 'progression', cat: 'algebra', grades: [9, 9], icon: 'aₙ', Component: Progression },
  { id: 'grapher', cat: 'algebra', grades: [7, 11], icon: '📈', Component: Grapher },
  { id: 'shapes', cat: 'geometry', grades: [2, 11], icon: '◼', Component: Shapes },
  { id: 'rightTriangle', cat: 'geometry', grades: [8, 9], icon: '◺', Component: RightTriangle },
  { id: 'triangle', cat: 'geometry', grades: [9, 11], icon: '△', Component: Triangle },
  { id: 'unitCircle', cat: 'trig', grades: [9, 11], icon: '◯', Component: UnitCircle },
  { id: 'trigEquation', cat: 'trig', grades: [10, 11], icon: 'sin', Component: TrigEquation },
  { id: 'sinusoid', cat: 'trig', grades: [10, 11], icon: '∿', Component: Sinusoid },
  { id: 'physics', cat: 'physics', grades: [7, 11], icon: 'F=ma', Component: Physics },
  { id: 'units', cat: 'physics', grades: [3, 11], icon: '⚖', Component: Units },
] as const satisfies readonly (ToolSpec & { id: string })[];

export type ToolId = (typeof TOOLS)[number]['id'];

export const findTool = (id: string): ToolDef | undefined => (TOOLS as readonly ToolDef[]).find((x) => x.id === id);
