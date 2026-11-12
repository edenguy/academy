# Math Academy

Playful, bilingual (Hebrew first, English second) interactive lessons. Two topics, six
lessons: **Derivatives** (rate of change, derivative rules, extremum points; matches the
5-unit curriculum, grade י) and **Integrals** (area under a curve, Riemann sums, the
antiderivative; matches the 5-unit curriculum, grade י"א). Each lesson pairs a live
explorer — drag a handle, the idea responds — with a short practice quiz. Published at
<https://edenguy.github.io/academy/subjects/math/>.

Home is topic-first (Subject → Topic → Lesson). Grade and track are badges on the topic,
never a gate: every lesson is a plain link. The integral lessons assume only algebra with
powers and fractions. Derivatives start from average versus instantaneous rate of change.

## Commands

```bash
cd apps/math
npm install
npm run dev          # http://localhost:5173/academy/subjects/math/
npm run typecheck
npm test
npm run build        # writes ../../docs/subjects/math (commit it)
npm run check         # typecheck + test + build, in one shot
```

## Content model: everything is YAML

Lesson text — titles, narrative paragraphs, key points, quiz questions, answers and
explanations — lives in `src/content/lessons/*.yaml`, one file per lesson, never inline in
components. Each field is bilingual: `{ en: "...", he: "..." }`. UI chrome strings (button
labels, nav, quiz UI copy, dashboard and achievement text) are kept separately in
`src/i18n/locales/{en,he}.json` — only lesson *content* is YAML.

Each lesson has a `topic` (`derivatives` or `integrals`). Topic titles, descriptions and
curriculum badges live in `src/content/topics.ts` (`TOPICS`, `TOPIC_ORDER`: derivatives,
then integrals). A lesson names its explorer with a `kind` on the YAML config
(`integral`, `secant`, `powerRule`, `extremum`); `LessonExplorer` dispatches. The formulas
are not in the YAML — they live in `src/math/`.

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
| Math | `src/math/integral.ts`, `derivative.ts` | Pure functions only — no React. Integrals: Riemann sums and the power-rule antiderivative. Derivatives: closed-form f and f' for the secant, power-rule and extremum explorers. Unit-tested against hand-derived values. `heroCurve.ts` and `lessonSignature.ts` draw the home-page graphs and are pure too. |
| Content | `src/content/lessons/*.yaml`, `topics.ts`, `schema.ts`, `index.ts` | YAML, Zod-validated at load. Never imports React. |
| Explorers | `src/components/LessonExplorer.tsx` | Dispatches by `kind` to `IntegralExplorer`, `SecantExplorer`, `PowerRuleExplorer`, `ExtremumExplorer`. Components draw; they do not contain formulas. |
| Progress | `src/progress/` | Zustand store persisted with `idb-keyval` at `academy-math:v1` (`lessonsCompleted`, `attempts`, `lastVisited`, `achievements`, `settings`). `selectors.ts` and `achievements.ts` are pure and tested. `sanitize.ts` only adopts stored settings when the blob actually had them. Locale and theme are mirrored to `localStorage` for the pre-paint script. No accounts, no backend. |
| Components | `src/components/` | `Quiz`, `HeroSignature`, `LessonSignature`, `FeedbackWidget`, and `ui/` primitives (`Card`, `Button`, `Icon`, `ProgressRing`, `Rich`). |
| Features | `src/features/<area>/` | Pages — `home/HomePage` (dashboard), `lesson/LessonPage`. Routing is `HashRouter` in `src/app/router.tsx`. |
| i18n | `src/i18n/locales/{en,he}.json` | UI chrome strings only — lesson text is in the YAML content, not here. |

Tailwind v4 with the shared "Bench" skin tokens in `src/styles.css`. Math's palette is
violet `#6250d6` → pink `#e87ba4`. Use **logical** spacing/alignment classes
(`ms-`, `me-`, `ps-`, `pe-`, `start-`, `end-`) so layout mirrors correctly under RTL. The
`.num`/`.sci`/`.readout` classes keep numbers and formulas left-to-right even inside Hebrew
prose — see `Rich.tsx`.

## Status

Six lessons, two topics, on the Bench skin. Home is a dashboard: a scrubbable hero graph,
a continue/start card, a course-progress ring, quiz accuracy (the empty line is "no
questions answered yet", not 0%), earned achievements, then lesson cards grouped by topic
with a completion state. Lessons are never locked.

**Derivatives** (first in `TOPIC_ORDER`; badge `5 יח"ל · כיתה י`):

1. `rate-of-change` — secant collapsing into the tangent (`kind: secant`)
2. `derivative-rules` — the power rule (`kind: powerRule`)
3. `extremum-points` — sign of f′ and turning points (`kind: extremum`)

**Integrals** (badge `5 יח"ל · כיתה י"א`):

1. `area-under-curve` — rectangles against a known area (`kind: integral`)
2. `riemann-sums` — left, right and midpoint sums (`kind: integral`)
3. `antiderivative` — the power-rule shortcut (`kind: integral`)

Continue follows that topic order: an unfinished last-visited lesson is resumed; otherwise
the first incomplete lesson in `TOPIC_ORDER` (derivatives, then integrals). Finishing an
integrals lesson can point back at an unfinished derivatives lesson.

Progress is IndexedDB (`academy-math:v1`), not a flat completed-lesson list. Achievements
(`first-lesson`, `both-topics-started`, `derivatives-complete`, `integrals-complete`,
`ten-correct`, `all-complete`) are recomputed from completed lessons and quiz attempts.
No accounts, no backend, no PWA or offline support. The feedback widget posts to Web3Forms.
See the repo root `README.md` for how subjects fit together.
