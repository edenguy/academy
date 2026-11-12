# Physics Academy

Playful, bilingual (Hebrew first, English second) interactive lessons. This subject covers
three kinematics lessons — position versus time, velocity as the slope of that curve, then
acceleration and displacement as the area under a velocity curve — each with a live,
draggable visualization and a short practice quiz. Published at
<https://edenguy.github.io/academy/subjects/physics/>.

No prior calculus is assumed. The lessons build "slope = rate of change" and "area =
accumulation" from the graph before naming them, and they use the same handle gesture as
Math Academy.

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
labels, nav, quiz UI copy, dashboard and achievement text) are kept separately in
`src/i18n/locales/{en,he}.json` — only lesson *content* is YAML.

There is one implicit topic, kinematics (no `topics.ts`). A lesson names its explorer with
a `kind` on the YAML config (`scrubber`, `secant`, `accelArea`); `KinematicsExplorer`
dispatches. The formulas are not in the YAML — they live in `src/physics/kinematics.ts`.

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
npm run export:md    # writes docs/review/math-lessons.{he,en}.md
npm run export:pdf    # same content as a printable PDF (needs Playwright's Chromium)
```

`scripts/export-lessons.mjs` and `scripts/export-pdf.mjs` still use Math's output filenames
(`math-lessons.{he,en}.md` / `.pdf` under `apps/physics/docs/review/`). The files are this
subject's lessons.

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
| Physics | `src/physics/kinematics.ts` | Pure functions only (scenario position and velocity, constant-acceleration helpers). Unit-tested against hand-derived and numerically differentiated values. `heroCurve.ts` and `lessonSignature.ts` draw the home-page graphs and are pure too. |
| Content | `src/content/lessons/*.yaml` + `schema.ts` + `index.ts` | YAML, Zod-validated at load. Never imports React. |
| Explorers | `src/components/KinematicsExplorer.tsx` | Dispatches by `explorers[].kind` to `MotionScrubber` (lesson 1, `scrubber`), `SlopeExplorer` (lesson 2, `secant`) and `AccelerationExplorer` (lesson 3, `accelArea`). Components draw; they do not contain formulas. |
| Progress | `src/progress/store.ts`, `selectors.ts` | Zustand store persisted with `idb-keyval` at `academy-physics:v1` (`lessonsCompleted`, `attempts`, `lastVisited`, `achievements`, `settings`). On a first load with an empty store, a legacy `academy-physics:completed` list in `localStorage` is copied in once. Locale and theme are mirrored to `localStorage` for the pre-paint script. No accounts, no backend. |
| Components | `src/components/` | `Quiz`, `HeroSignature`, `LessonSignature`, `FeedbackWidget`, and `ui/` primitives (`Card`, `Button`, `Icon`, `ProgressRing`, `Rich`). |
| Features | `src/features/<area>/` | Pages — `home/HomePage` (dashboard), `lesson/LessonPage`. Routing is `HashRouter` in `src/app/router.tsx`. |
| i18n | `src/i18n/locales/{en,he}.json` | UI chrome strings only — lesson text is in the YAML content, not here. |

Tailwind v4 with the shared "Bench" skin tokens in `src/styles.css` (Physics Academy's own
indigo `#3457d1` → cyan `#17a3e8` accent pair — distinct from Math Academy's violet→pink).
Use **logical** spacing/alignment classes (`ms-`, `me-`, `ps-`, `pe-`, `start-`, `end-`) so
layout mirrors correctly under RTL. The `.num`/`.sci`/`.readout` classes keep numbers and
formulas left-to-right even inside Hebrew prose — see `Rich.tsx`.

## Status

Three kinematics lessons, on the Bench skin. Home is a dashboard: a scrubbable hero graph,
a continue/start card, a course-progress ring, quiz accuracy (until the first answer the
line says to answer a question, not 0%), earned achievements, then the three lesson cards
with a completion state. Lessons are never locked.

1. `position-vs-time` — read a position graph (`MotionScrubber`)
2. `velocity-slope` — secant collapsing into instantaneous velocity (`SlopeExplorer`)
3. `acceleration-area` — acceleration as a slope, displacement as area (`AccelerationExplorer`)

Progress is IndexedDB (`academy-physics:v1`), not only the old completed-lesson list.
Achievements are `first-lesson`, `ten-correct`, and `kinematics-complete` (unlocked from the
lesson page once every lesson is done). No accounts, no backend, no PWA or offline support.

The feedback widget (`src/components/FeedbackWidget.tsx`) is inert until a real Web3Forms
access key replaces `REPLACE_WITH_WEB3FORMS_KEY_FOR_academy-physics`. Share-card images are
not generated yet (`public/social/` is empty; `scripts/render-og-cards.mjs` is present).
See the repo root `README.md` for how subjects fit together.
