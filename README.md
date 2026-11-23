# Math Buddy KZ

Step-by-step math and physics calculators for Kazakhstan school grades 1–11, in Kazakh, Russian and English, with light and dark themes. Everything runs in the browser; there is no backend.

## Tools

| Area | Tools |
| --- | --- |
| Arithmetic | Calculator, column arithmetic (add, subtract, multiply, long division), fractions, GCD and LCM, percentages, proportion |
| Algebra | Linear equation, system of two equations (Cramer's rule + graph), quadratic equation, progressions, function graphs |
| Geometry | Area and volume of figures and solids, right triangle, triangle solver (laws of sines and cosines, ambiguous case) |
| Trigonometry | Interactive unit circle with exact values, trigonometric equations, sinusoid analyzer |
| Physics | 34 school physics formulas (solve for any variable), unit converter |

Every answer comes with a step-by-step solution. Home-page cards can be filtered by grade.

## Development

Requires Node.js 18+.

```sh
npm install
npm run dev        # start the dev server
npm test           # run unit tests (vitest)
npm run build      # typecheck and build static files into dist/
```

The build uses relative paths, so `dist/` can be served from any folder or static host.

## Project layout

- `src/tools/` — one component per tool; `index.ts` registers each tool's category and grade range
- `src/lib/` — expression parser, number formatting, exact fractions, trig, triangle and equation solvers (unit-tested)
- `src/data/` — data catalogs: shapes, physics formulas, units
- `src/i18n/` — dictionaries; `en.ts` defines the keys, and `ru.ts` / `kk.ts` are type-checked against it
