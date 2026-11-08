# Physics Academy — pilot

Playful, bilingual (Hebrew/English) interactive lessons for middle/high-school students.
This pilot covers three lessons on kinematics — position → velocity (the slope of a curve) →
acceleration and displacement (the area under a curve) — each with a live, draggable
visualization and a short practice quiz. Published at
<https://edenguy.github.io/academy/subjects/physics/>.

No prior calculus is assumed — the lessons build the "slope = rate of change" and "area =
accumulation" ideas from scratch, graphically, before naming them.

## Commands

```bash
cd apps/physics
npm install
npm run dev          # http://localhost:5173/academy/subjects/physics/
npm run typecheck
npm test
npm run build        # writes ../../docs/subjects/physics (commit it)
npm run check         # typecheck + test + build, in one shot
```

## Content model: everything is YAML

Lesson text — titles, narrative paragraphs, key points, quiz questions, answers and
explanations — lives in `src/content/lessons/*.yaml`, one file per lesson, never inline in
components. Each field is bilingual: `{ en: "...", he: "..." }`. UI chrome strings (button
labels, nav, quiz UI copy) are kept separately in `src/i18n/locales/{en,he}.json` — only
lesson *content* is YAML.

YAML is parsed and validated against the Zod schema in `src/content/schema.ts` at load time
(`src/content/index.ts`), so an authoring mistake — a bad scenario id, a missing translation,
an MCQ's `correctIndex` pointing past the end of `choices` — fails loudly instead of breaking
silently for a learner.

Inline lesson text supports a tiny markup (see `src/components/ui/Rich.tsx`):
`**bold**`, `_italic_`, `{{v(t) = at}}` (a formula, rendered left-to-right in monospace even
inside Hebrew text), `[[18]]` (a standalone number, same LTR treatment).

## Content review workflow

Because the content is pure YAML, it can be exported as a clean document for someone who
isn't a developer — a physics teacher or subject specialist — to read and correct, with the
correction then fed back in:

```bash
npm run export:md    # writes docs/review/physics-lessons.{he,en}.md
npm run export:pdf    # same content as a printable PDF (needs Playwright's Chromium)
```

Each export bundles **every** lesson, in both languages, including the quiz's correct
answers and explanations (marked with ✅) — not just what a learner sees — so a reviewer can
check the physics itself, not only the prose.

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
| Physics | `src/physics/kinematics.ts` | Pure functions only (scenario position/velocity, constant-acceleration helpers). Unit-tested against hand-derived and numerically-differentiated values. |
| Content | `src/content/lessons/*.yaml` + `schema.ts` + `index.ts` | YAML, Zod-validated at load. Never imports React. |
| Components | `src/components/` | `KinematicsExplorer` dispatches to `MotionScrubber` (lesson 1), `SlopeExplorer` (lesson 2) and `AccelerationExplorer` (lesson 3) by the lesson's `explorers[].kind`; plus `Quiz` and `ui/` primitives. |
| Features | `src/features/<area>/` | Pages — `home/HomePage`, `lesson/LessonPage`. Routing is `HashRouter` in `src/app/router.tsx`. |
| i18n | `src/i18n/locales/{en,he}.json` | UI chrome strings only — lesson text is in the YAML content, not here. |

Tailwind v4 with design tokens in `src/styles.css` (Physics Academy's own indigo→cyan accent
pair — distinct from Math Academy's violet→pink and Nitrox Academy's teal, per the repo root
`CLAUDE.md`'s "give it its own logo mark" rule). Use **logical** spacing/alignment classes
(`ms-`, `me-`, `ps-`, `pe-`, `start-`, `end-`) so layout mirrors correctly under RTL. The
`.num`/`.sci`/`.readout` classes keep numbers and formulas left-to-right even inside Hebrew
prose — see `Rich.tsx`.

## Status

Pilot: 3 lessons on kinematics (position/velocity/acceleration), each deliberately
cross-referencing Math Academy's slope/area-under-a-curve language — "the handle" is the same
gesture across every subject (see the repo root `CLAUDE.md`). No persistence beyond a simple
"completed lessons" list in `localStorage` — no accounts, no backend, no PWA/offline support
yet. The feedback widget (`src/components/FeedbackWidget.tsx`) needs a real Web3Forms access
key before it's live — see the `REPLACE_WITH_WEB3FORMS_KEY_FOR_academy-physics` placeholder.
Share cards (`public/social/`, `scripts/render-og-cards.mjs`) haven't been generated for this
subject yet. See the repo root `README.md` for how subjects fit together.
