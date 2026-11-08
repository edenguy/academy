# Math Academy — pilot

Playful, bilingual (Hebrew/English) interactive lessons for middle/high-school students.
This pilot covers three lessons building up to the definite integral, each with a live
Riemann-sum visualization (drag a slider, watch rectangles converge on the true area) and a
short practice quiz. Published at <https://edenguy.github.io/academy/math/>.

No prior calculus is assumed — only algebra with powers and fractions.

## Commands

```bash
cd apps/math
npm install
npm run dev          # http://localhost:5173/academy/math/
npm run typecheck
npm test
npm run build        # writes ../../math at the repo root (commit it)
npm run check         # typecheck + test + build, in one shot
```

## Content model: everything is YAML

Lesson text — titles, narrative paragraphs, key points, quiz questions, answers and
explanations — lives in `src/content/lessons/*.yaml`, one file per lesson, never inline in
components. Each field is bilingual: `{ en: "...", he: "..." }`. UI chrome strings (button
labels, nav, quiz UI copy) are kept separately in `src/i18n/locales/{en,he}.json` — only
lesson *content* is YAML.

YAML is parsed and validated against the Zod schema in `src/content/schema.ts` at load time
(`src/content/index.ts`), so an authoring mistake — a bad function id, a missing translation,
an MCQ's `correctIndex` pointing past the end of `choices` — fails loudly instead of breaking
silently for a learner.

Inline lesson text supports a tiny markup (see `src/components/ui/Rich.tsx`):
`**bold**`, `_italic_`, `{{f(x) = x²}}` (a formula, rendered left-to-right in monospace even
inside Hebrew text), `[[18]]` (a standalone number, same LTR treatment).

## Content review workflow

Because the content is pure YAML, it can be exported as a clean document for someone who
isn't a developer — a math teacher or subject specialist — to read and correct, with the
correction then fed back in:

```bash
npm run export:md    # writes docs/review/math-lessons.{he,en}.md
npm run export:pdf    # same content as a printable PDF (needs Playwright's Chromium)
```

Each export bundles **every** lesson, in both languages, including the quiz's correct
answers and explanations (marked with ✅) — not just what a learner sees — so a reviewer can
check the math itself, not only the prose.

The round trip:
1. Run `npm run export:md` (or `export:pdf`) and send the file to the specialist.
2. They mark up corrections directly on the document (comments, edits, tracked changes —
   whatever's convenient).
3. Hand the marked-up document back to Claude. Claude maps each correction to the specific
   YAML field(s) it came from and edits `src/content/lessons/*.yaml` directly — the exported
   document itself is never hand-edited back into the app; it's a one-way export, YAML stays
   the single source of truth.
4. Re-run `npm run check` and commit.

## Architecture

| Layer | Path | Rule |
|---|---|---|
| Math | `src/math/integral.ts` | Pure functions only (Riemann sums, the power-rule antiderivative). Unit-tested against hand-derived values. |
| Content | `src/content/lessons/*.yaml` + `schema.ts` + `index.ts` | YAML, Zod-validated at load. Never imports React. |
| Components | `src/components/` | `IntegralExplorer` (the interactive visualization), `Quiz`, and `ui/` primitives. |
| Features | `src/features/<area>/` | Pages — `home/HomePage`, `lesson/LessonPage`. Routing is `HashRouter` in `src/app/router.tsx`. |
| i18n | `src/i18n/locales/{en,he}.json` | UI chrome strings only — lesson text is in the YAML content, not here. |

Tailwind v4 with design tokens in `src/styles.css`. Use **logical** spacing/alignment classes
(`ms-`, `me-`, `ps-`, `pe-`, `start-`, `end-`) so layout mirrors correctly under RTL. The
`.num`/`.sci`/`.readout` classes keep numbers and formulas left-to-right even inside Hebrew
prose — see `Rich.tsx`.

## Status

Pilot: 3 lessons on the definite integral (rectangles → Riemann sums → the power-rule
shortcut). No persistence beyond a simple "completed lessons" list in `localStorage` — no
accounts, no backend, no PWA/offline support yet. Extending to more lessons/topics, or adding
another subject (e.g. `apps/physics/`, published at `/academy/physics/`), is a matter of
adding more YAML files and, for a new subject, a new sibling app following the same shape.
See the repo root `README.md` for how subjects fit together.
