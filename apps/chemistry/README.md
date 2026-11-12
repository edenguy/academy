# Chemistry Academy — pilot

Playful, bilingual (Hebrew/English) interactive lessons. This pilot is one chapter,
structure and bonding: six lessons, each with something you drag. Published at
<https://edenguy.github.io/academy/subjects/chemistry/>.

The badge on the home page is the chapter name only. It does not say "5-unit" and it does
not name a grade. Schools split this chapter across different years, and no Ministry
chemistry document is cited in this repo. The six lessons follow an outline supplied for
that chapter. They are a study aid, not a certified course.

Later chapters, not built and not shown in the app: the atom and the periodic table,
stoichiometry, redox, acids and bases, energy and rate, food chemistry, and the inquiry lab.

## Commands

```bash
cd apps/chemistry
npm install
npm run dev          # http://localhost:5173/academy/subjects/chemistry/
npm run typecheck
npm test
npm run build        # writes ../../docs/subjects/chemistry (commit it)
npm run check        # typecheck + test + build, in one shot
```

## Content model: everything is YAML

Lesson text lives in `src/content/lessons/*.yaml`, one file per lesson. Each field is
bilingual: `{ en: "...", he: "..." }`. UI chrome is in `src/i18n/locales/{en,he}.json`.

YAML is validated by the Zod schema in `src/content/schema.ts` at load time. The chemistry
itself — charges, the dipole sum, whether a hydrogen bond is in range, the material-probe
table — lives in `src/chemistry/` and is unit-tested. Components do not contain those rules.

Inline lesson text supports `**bold**`, `_italic_`, `{{NaCl}}` (a formula, left-to-right),
and `[[180]]` (a number, same treatment). See `src/components/ui/Rich.tsx`.

## Content review workflow

```bash
npm run export:md    # writes docs/review/chemistry-lessons.{he,en}.md
npm run export:pdf   # same content as a printable PDF (needs Playwright's Chromium)
```

YAML stays the source of truth. The export is a one-way copy for a reader to mark up.

## Architecture

| Layer | Path | Rule |
|---|---|---|
| Chemistry | `src/chemistry/` | Pure functions only. Unit-tested. |
| Content | `src/content/lessons/*.yaml` + `schema.ts` + `topics.ts` | YAML, Zod-validated at load. Never imports React. |
| Components | `src/components/` | `ChemistryExplorer` dispatches on `explorers[].kind`. |
| Features | `src/features/` | `home/HomePage`, `lesson/LessonPage`. `HashRouter`. |
| Progress | `src/progress/` | IndexedDB key `academy-chemistry:v1` via idb-keyval. A visit is stored only after hydration, and `mergePersisted` keeps it. Copy both into the next subject or Your courses stays empty. |
| i18n | `src/i18n/locales/{en,he}.json` | UI chrome only. |

Palette: amber `#e0922a` → teal `#14998a` on the favicon. Text uses the darker amber
`#8a4e08`, because the bright amber fails as text on the paper. Tailwind v4, logical
spacing (`ms-`, `me-`, `ps-`, `pe-`). `.num` / `.sci` keep numbers and formulas
left-to-right inside Hebrew.

## Status

Pilot: 6 lessons, one topic. Progress is on this browser only. The feedback widget stays
inert until `REPLACE_WITH_WEB3FORMS_KEY_FOR_academy-chemistry` in
`src/components/FeedbackWidget.tsx` is a real Web3Forms key. No per-subject share card.
