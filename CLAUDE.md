# Academy — guidance for Claude

Read this before touching anything in this repo. It states what we're building and why, how the
repo is organized, how we design and verify UX, and the rules and gotchas that are easy to get
wrong — the things a new contributor (human or Claude) would otherwise have to rediscover the
hard way. If something here is out of date, fix it in the same PR as the change that made it so.

## What this is

A growing set of independent, playful lessons — one subject at a time — built because someone
wanted to truly understand a topic, not earn a certificate. Every lesson pairs a live
interactive simulation with the idea it teaches, instead of asking the learner to memorize it.
Bilingual (Hebrew first, English second) from day one, for every piece of learner-facing
content, in every subject — never an afterthought bolted on later. See `docs/index.html` for
the mission statement as actually shown to visitors. Public site:
`https://edenguy.github.io/academy/`. Owner: Guy (`edenguy`).

**The one idea every lesson is built on:** you grab a handle and move it, and the idea
responds — a slider under a Riemann-sum curve, sliders over partial pressures in the Nitrox
lab, a scrubber over a motion graph in Physics. That's not a UI flourish, it's the actual
teaching method (simulate, don't memorize), and it's also why the hub's own logo and hero are
literally a handle on a curve (see "The hub" below and `HUB_LLD.md` §0). Every new subject
should have at least one interactive explorer the learner drags/scrubs, not just a quiz.

**Where it's heading:** (1) **grounded in what students actually study** — topics follow the
Israeli Ministry of Education curricula (e.g. the 5-unit Bagrut math track), so a lesson is
something a student can use next to their school material, not an abstract tour; (2) **an
inviting, app-like feel everywhere**, modelled on Nitrox Academy's "snug" UX (see "UX approach"
below) rather than a generic content site; (3) more subjects over time (Chemistry is a
placeholder on the hub, no app yet).

Currently free, as a pilot — that is not a permanent commitment. Don't state or imply
anywhere that it's free *forever*; tie "free" to the pilot phase wherever it's mentioned (see
`docs/index.html`'s own phrasing), and don't add a pricing/payment claim of any kind without
being asked. Nitrox in particular is a pilot with not every chapter written — say so, don't
overclaim.

## Subjects today

| Subject | Path | What it is |
|---|---|---|
| **Nitrox Academy** | `apps/nitrox` | Enriched-air diving theory. The original, most mature app (migrated in from its own repo): chapters, assessment engine, mastery/spaced review, achievements, installable PWA with offline support. Has its own conventions — **read `apps/nitrox/CLAUDE.md`**. The UX reference for everything else. 11 lessons (5 + 6 across two chapters; the roadmap is excluded from the count). **Unlisted:** live at `/academy/subjects/nitrox/` for anyone with the link, but deliberately *not* shown anywhere on the hub or linked from other subjects (see below). |
| **Math Academy** | `apps/math` | Two topics, 6 lessons: **Derivatives** (rate of change, derivative rules, extremum points; grade י, 5-unit) and **Integrals** (area under a curve, Riemann sums, antiderivative; grade י"א, 5-unit). Topic content follows the official Ministry 5-unit curriculum PDF. Treat Math as the template for a *new* subject. |
| **Physics Academy** | `apps/physics` | Kinematics, 3 lessons (position vs time, velocity as slope, acceleration as area). Scaffolded from Math. Its feedback form still needs a real Web3Forms key (see "Open items"). |
| Chemistry | — | Placeholder tile on the hub only ("coming soon", not clickable). No app. |

**Nitrox is unlisted, on purpose (Guy's decision).** It is unrelated to the school-subject
academies (Math, Physics, ...), so the hub — tiles, hero handle, demo, `/academy/subjects/`
page, share cards — does not mention it, and Math/Physics never link to it. But its URL is a
public, shared link and **must keep working exactly as it does today**: never delete or move
`apps/nitrox` or `docs/subjects/nitrox/`, never change its `base`, and don't add it back to the
hub (or to any cross-subject navigation) unless Guy asks. (Unlisted ≠ hidden from the internet:
the page is still public and crawlable; if that's ever wanted, that's a separate `noindex` change
inside the Nitrox app.)

Nitrox is the reference for what a subject looks like once it's grown large — not something to
imitate on day one. Math/Physics adopt Nitrox's *personal, progress-aware feel* (below), not its
full feature set (no spaced-repetition mastery, no bottom-nav, no PWA in Math/Physics).

## Non-negotiable rules

1. **Bilingual is mandatory, for every subject.** Every learner-facing string is `{ en: "...",
   he: "..." }` (see `LocalizedString` in each subject's `content/schema.ts`). This is a
   day-one requirement, not something added after a subject ships. A lesson, a quiz question,
   a UI label — if a learner can see it, it needs both languages before it ships. The hub does
   the same with `<span class="t-he">/<span class="t-en">` pairs.
2. **Lesson content is YAML, never hardcoded in components.** Titles, narrative paragraphs,
   quiz questions, answers and explanations live in `apps/<subject>/src/content/lessons/*.yaml`
   (or wherever that subject's content schema says), validated by Zod at load time. UI chrome
   strings (button labels, nav, generic quiz UI copy, dashboard/achievement text) are the only
   thing that belongs in `src/i18n/locales/{en,he}.json` instead.
3. **`main` is production.** GitHub Pages serves this repo directly from `main` (`docs/`
   folder), so a push to `main` goes live immediately. Default workflow: branch, open a PR,
   merge (see "Working with a collaborator"). Guy has, for rounds of UX fixes, explicitly
   allowed merging straight to `main` — that is *his* permission to give per session; a
   collaborator or agent shouldn't assume it.
4. **Build output is committed, under `docs/`.** Each subject's production build is committed
   alongside its source — run that subject's `npm run build` (or `npm run check`) and commit the
   result whenever its app changes. Never hand-edit anything under `docs/subjects/`; edit the
   source under `apps/<subject>/` and rebuild. (The hub's own files — `docs/index.html`,
   `docs/hub/*` — *are* hand-edited source; there is no build step for them.) `apps/` itself is
   never published.
5. **Git identity stays human.** Commits are authored by whichever of us (Guy or a
   collaborator) owns the work, never re-signed as a Claude/Anthropic identity. A
   `Co-Authored-By` trailer in the commit body is fine and expected; the author/committer
   identity itself is not negotiable. **Check `git config user.name user.email` before your
   first commit** — cloud/agent sandboxes often default to a Claude identity. *Known
   deviation:* much of the recent history (hub redesign rounds, Physics, Math derivatives, the
   progress dashboards) landed authored as `Claude <noreply@anthropic.com>`; it was not
   rewritten. Don't repeat it.
6. **Never invent a fact.** Any claim a lesson states as true (a formula, a historical note, a
   "this is how X is taught", a curriculum reference) needs to actually be correct — these are
   study tools people trust. When in doubt, say less rather than assert something unverified.
   Curriculum claims must come from the official source (for Math: the Ministry's 5-unit PDF,
   `https://meyda.education.gov.il/files/Mazkirut_Pedagogit/matematika/mat_5u.pdf`) and are
   phrased as "matches the curriculum", never "official" or "certified". Numbers shown in any
   demo are read from the subject's own source of truth, never retyped (see the hub rules).
7. **Never gate or lock a lesson.** Explore-anything is the product's spirit. Progress,
   "continue" and achievements decorate; every lesson is always a plain link.
8. **Numbers and formulas never mirror.** Inside RTL Hebrew text, every number, formula, unit
   and code is an LTR island (`.num` / `.sci` classes or `dir="ltr"` + `unicode-bidi: isolate`).

## Architecture

```
academy/                         (this repo)
├── CLAUDE.md                     this file
├── README.md                     setup, Pages config, "adding a subject" walkthrough
├── HUB_LLD.md                    hub design spec (incl. §11 "inviting landing", implemented)
├── SUBJECT_APP_SKIN_LLD.md       Math/Physics "Bench" skin spec (implemented)
├── scripts/                      hub-level tooling (render-og-cards.mjs, ...)
├── apps/                         SOURCE — never served, never deployed directly
│   ├── nitrox/                    see apps/nitrox/CLAUDE.md
│   ├── math/                      Math Academy
│   └── physics/                   Physics Academy
└── docs/                         SERVED by GitHub Pages — the entire public site
    ├── index.html                  hub landing page (hand-written, no build)
    ├── hub/                        the hub's OWN assets (hub.css, hub.js, logos, social/)
    └── subjects/
        ├── index.html              tiny redirect page → /academy/#subjects
        ├── nitrox/ math/ physics/  built output of the matching app
```

Each subject is a fully independent app — own `package.json`, own Vite+React+Tailwind v4+
Zod+i18next build, own content, own `vite.config.ts` (`base: '/academy/subjects/<subject>/'`,
`outDir: '../../docs/subjects/<subject>'`). **A subject never imports another subject's code.**
Math and Physics are deliberately near-duplicates of one scaffold; what's genuinely shared
(a UI primitive, the progress store, the review-export scripts) gets pulled into a common
package only once it's duplicated enough to prove it's really shared — not speculatively. When
you change a scaffold piece that exists in both (skin tokens, progress store, `Quiz`,
`ProgressRing`), apply it to both unless there's a reason not to, and say so in the PR.

**Retiring a subject's URL is not just deleting its folder.** If the subject registered a
service worker (Nitrox does, via `vite-plugin-pwa`), a returning visitor's browser may still be
serving it from an offline cache. See `README.md`'s "Retiring a URL" section for the
self-unregistering service worker pattern.

## Anatomy of a Math/Physics subject app

- **Content:** `src/content/lessons/NN-slug.yaml` (bilingual, Zod-validated at load) and, for
  Math, `src/content/topics.ts` — topic metadata (`TOPICS`, `TOPIC_ORDER`) including a
  `curriculumBadge` ("5 יח"ל · כיתה י"). Home is **topic-first**: Subject → Topic → Lesson;
  grade/track are badges and metadata, never a gate. (Integrals sit differently across the
  Israeli 3/4/5-unit tracks, and gating by grade would contradict explore-anything.)
- **Explorers:** the interactive widgets (`IntegralExplorer`, `SecantExplorer`,
  `PowerRuleExplorer`, `ExtremumExplorer`; Physics `MotionScrubber`, `SlopeExplorer`,
  `AccelerationExplorer`). A lesson's YAML names its explorer via a `kind`-discriminated config
  union in `content/schema.ts`; `LessonExplorer` dispatches. The math/physics itself lives in
  pure, tested functions (`src/math/*.ts`, `src/physics/*.ts`) — components never contain
  formulas. Add vitest tests for every new pure function and hand-check the numbers.
- **Progress system** (`src/progress/`): a Zustand store persisted with `idb-keyval`
  (IndexedDB), recording `lessonsCompleted` (id → timestamp), `attempts` (capped),
  `lastVisited` (a lesson id), `achievements`, and `settings.{locale,theme}`. Plus
  `selectors.ts` (`useCourseProgress`, `useQuizAccuracy`, `useNextLesson`, thin wrappers over
  pure `compute*` functions — test those), `achievements.ts` (pure `evaluateAchievements()`
  recomputed from state), `sanitize.ts` (defensive cleanup of whatever comes out of IndexedDB),
  `AchievementToast`, `ProgressRing`. The **home page is a dashboard**: scrubbable hero graph,
  continue/start CTA, course-progress ring, quiz accuracy (shows "–", not "0%", before the
  first answer), earned achievements, then lesson cards with completion state.
  Gotcha already hit: zustand `persist` calls `merge()` on *every* load, even a first visit
  with nothing stored — a naive `{...current, ...sanitise(persisted)}` overwrites the live
  first-paint settings with fallbacks. Math's `mergePersisted()` (in `sanitize.ts`) only adopts
  persisted `settings` if the stored blob actually had them; keep that behaviour.
- **The hub reads this storage.** Each app's record is `{state, version}` as a JSON string at
  an idb-keyval key in the default `keyval-store`/`keyval` store: `nitrox-academy:v1`,
  `academy-math:v1`, `academy-physics:v1`. The hub reads only `lessonsCompleted` and
  `lastVisited`, read-only. **If you rename a key or reshape those two fields, update
  `tileProgress()`'s `SOURCES` in `docs/hub/hub.js` in the same PR.**
- **Pre-paint script:** each app's `index.html` sets `lang`/`dir`/theme synchronously before
  React mounts (no flash of wrong direction or theme); the store mirrors settings back to
  `localStorage` so this keeps working. Don't break it when touching providers.
- **Skin:** the shared "Bench" skin (`src/styles.css`, `components/ui/*`) — layered surfaces
  (`elev-0/1/2`), per-subject palette on one shared system, Rubik type. Spec and rationale:
  `SUBJECT_APP_SKIN_LLD.md`. Math = violet `#6250d6` → pink `#e87ba4`; Physics = indigo
  `#3457d1` → cyan `#17a3e8`. Use the `--axis` token for chart axes (they were invisible once).
- **Feedback widget:** `components/FeedbackWidget.tsx` posts to Web3Forms with a per-subject
  public access key constant (not a secret). It auto-hides over anything marked
  `data-fab-avoid` — mark any new bottom-of-screen CTA with it.

## UX approach

**Goal: every page of every subject should feel like Nitrox Academy** — snug, personal, inviting
— not like a generic content site. Guy's words: Nitrox "has a snug look and it's more inviting";
the generic version "looks like really old cards that are not inviting". Concretely, "Nitrox-like"
means:

- **It knows you.** A continue/start CTA near the top, a progress ring, quiz accuracy,
  achievements, completion state on every lesson card — the home page is *your* dashboard, not a
  catalogue. (Nitrox: Zustand store, `ProgressRing`, mastery, toast; the others mirror the
  essentials.)
- **Show the product.** The first screen should show something you can drag. A static text hero
  with no graphics reads as "a PDF of notes".
- **Hierarchy, density and tint.** Not every surface is the same white card. Layered elevation,
  hue-tinted two-layer shadows or tinted surface + 1px edge, saturated icon badges, compact
  cards with content filling them. Look at `apps/nitrox/src/styles.css` and its dashboard.
- **One gesture.** Grab a handle, move it, watch the idea respond — on the hub's hero, in every
  lesson's explorer.
- **Hebrew-first, RTL-correct.** Not "mirrored"; check numbers (LTR islands), arrows, slider
  direction and fills in Hebrew specifically.
- **Calm, never pushy.** No streak-guilt, no locks, no countdowns, no "AI"/"smart" claims.

**How we design and ship a UX change** (this is the workflow that has worked here):

1. **Diagnose first, with evidence.** Screenshot the real thing at 390 px and 1440 px, HE and
   EN, light and dark, next to the reference (usually Nitrox). Say what is wrong in specific,
   measurable terms (e.g. "first subject card starts 1,800 px down on a phone"), not "make it
   nicer".
2. **Write a spec before code** for anything bigger than a tweak: exact HTML/CSS/copy/tokens, edge
   cases, a numbered acceptance checklist — in `HUB_LLD.md` (hub) or `SUBJECT_APP_SKIN_LLD.md`
   (subject apps), committed on its own branch. Update the spec in the same PR if the build
   deviates from it. When Claude is doing the work: use the strongest available model for
   design analysis/spec writing, a cheaper/faster one for implementing a finished spec.
3. **Implement on a branch**, small logical commits, only the files the spec names.
4. **Verify independently before merging** — don't trust "it built". See "Verification".
5. **Merge, then check the live site** (GitHub Pages takes a minute or two; returning visitors
   may see stale cached builds — Nitrox's service worker especially. Hard-refresh / private
   window).

**Verification checklist** (each is something that has bitten us):

- `cd apps/<subject> && npm run check` — typecheck + tests + build, must be clean.
- Browser pass (Playwright) at **390 and 1440 px × HE/EN × light/dark**: no console errors, no
  horizontal overflow (`scrollWidth === clientWidth`), no raw i18n keys, toggles work. Check the
  *interaction*, not just the render (drag the slider, answer a quiz, reload and confirm progress
  persisted).
- **Check in Hebrew specifically**: slider fill and thumb direction, chart orientation, numbers.
- Every `:hover` rule is inside `@media (hover: hover)` — sticky hover on touch caused a stuck
  glow on the hub. Verify programmatically that none are un-gated.
- Respect `prefers-reduced-motion`; motion easing `cubic-bezier(.2,.8,.2,1)`, 180–320 ms.
- Contrast: body text ≥ 4.5:1 on tinted surfaces.
- First-visit/empty states look sane (0 progress, no achievements, no stored data), and
  corrupted stored data degrades gracefully.

## The hub (`docs/index.html`, `docs/hub/hub.css`, `docs/hub/hub.js`)

Plain static HTML/CSS/vanilla JS (no framework, no build step) with a real language toggle —
never show both languages inline in the same block of text. Every bilingual string is two
elements, `<span class="t-he">...</span><span class="t-en">...</span>`, and CSS
(`[data-lang="he"] .t-en, [data-lang="en"] .t-he { display: none; }`) shows only one; a small
inline script flips `data-lang`/`dir`/`lang` on `<html>`, persists the choice to
`localStorage`, and runs once, synchronously, in `<head>` before first paint.

Layout, top to bottom: top bar → **hero** (the brand line "לא משננים. תופסים." / "Don't memorize it.
Grab it.", a draggable handle on a spectrum curve that scrubs between subjects, one-sentence lede)
→ **subject tiles** directly under it (one tinted, progress-aware tile per subject: badge,
promise, honest inline-SVG preview, real lesson count, Start/Continue/Review pill + ring; a
muted, non-clickable Chemistry strip) → **live demo** (Riemann rectangles — Math's own integral)
→ **"why not memorize" method strip** → footer. A floating feedback pill sits start-side.

The tiles read the apps' IndexedDB records **read-only** (see the progress system above) and
degrade to a first-visit state on anything unexpected — never write to, create, or upgrade
another app's storage (the read aborts inside `onupgradeneeded` so the hub can never create a
database). Full design spec, exact CSS, copy and acceptance checklist: `HUB_LLD.md` (kept outside
`docs/` so it's never served); the tiles restructure is its §11.

### Hub visual system

The hub is deliberately **typographically and tonally distinct from the subject apps**: hub =
the "OS" (system chrome), subjects = "apps" (their own personality). Don't blur that line — don't
bring Rubik onto the hub, don't paint hub chrome (top bar, controls, headings, method strip,
footer) in a subject's colours, and don't bring the hub's Plex/mono "instrument" look into a
subject app uninvited. Like a home screen, though, the OS *does* show each app in its own colours
where that app is represented: the subject tiles are tinted (≤ 8 % light / ≤ 14 % dark), carry a
saturated badge, and use a per-subject text-safe colour for status, ring and pill.

- **Register:** "futuristic hi-tech" means *a well-lit instrument*, not an "AI product" — no
  sparkles, neural-net dots, mesh-gradient blobs, gradient-filled headlines, emoji icons, or text
  claiming "AI"/"smart"/"adaptive". Dark-first (near-black indigo, one soft light at the top-start
  corner), light mode is "paper lab". Glow is reserved for things that are live or draggable —
  nothing static glows. Full ban list: `HUB_LLD.md` §7.
- **Typography:** IBM Plex Sans Hebrew (headings/body, both languages) + IBM Plex Mono
  (readouts, chips, numbers — tabular, uppercase-Latin-only, never on Hebrew). Subject apps keep
  Rubik; intentional, not inconsistency. Hebrew is never tracked or uppercased.
- **Color tokens** (`hub.css`): `--bg/--bg-2`, `--panel` (opaque-ish surface, hairline border,
  inset top-edge highlight, two-layer shadow), `--ink/--ink-2/--muted`, `--accent` (hub's own
  electric violet, not Math's violet→pink), `--teal/--violet/--pink/--amber/--blue` (the
  "spectrum" — the only multi-hue gradient on the page, for the logo and hero curve; never a
  background wash). A subject's `--c1/--c2` (favicon gradient) and `--ct` (text-safe, per theme)
  are declared on its `.tile[data-subject]` selector, never promoted to `:root`; on a tile, text
  is `--ink`/`--ink-2`/`--ct` only — never `--c2`, never `--muted` (both fail 4.5:1 on tints).
- **Never invent a number for a live demo.** A demo-displayed constant is read from and cited to
  the subject's own source of truth (a constant in its own code or content), never retyped or
  guessed. (This is how the hub's former Nitrox demo cited `DEFAULT_PLANNING_PPO2`; the same
  applies to any demo you add.)

## How to add a lesson or topic to an existing subject

1. Add `NN-slug.yaml` under `src/content/lessons/` (bilingual, Zod-valid; ids are stable — the
   id is stored in learners' progress, so don't rename an existing one). If it needs a new
   explorer, add its `kind` to the schema union, write the pure function + tests first, then the
   component, then register it in `LessonExplorer`.
2. New Math topic: add it to `topics.ts` (`TOPICS`, `TOPIC_ORDER`) with a sourced
   `curriculumBadge`. Update achievements and the "N lessons" totals that depend on the lesson
   count — including the hub's `SOURCES` total and tile copy (`docs/index.html`,
   `docs/hub/hub.js`).
3. UI strings go in both `locales/en.json` and `locales/he.json` (keep key parity).
4. `npm run check`, commit the rebuilt `docs/subjects/<subject>/`.
5. Content is reviewable by non-developers: `npm run export:md` / `export:pdf` produce a
   bilingual document with answers and explanations. Corrections come back as marked-up text and
   are mapped back to the specific YAML fields — the export is never edited back into the app.

## How to add a new academy subject

1. `cp -r apps/math apps/<subject>` (or `apps/physics`) as the scaffold. Fix the stale name in
   `package.json` *and* `package-lock.json`.
2. Rewrite content: new `src/content/lessons/*.yaml`, update `content/schema.ts` if you need
   different explorer shapes, update `src/i18n/locales/{en,he}.json` for the app's own copy.
   Rename the progress store key (`academy-<subject>:v1`) and the pre-paint script's
   localStorage keys; rewrite achievements for the subject. Never copy another subject's lesson
   text or facts.
3. `vite.config.ts`: `base: '/academy/subjects/<subject>/'`, `outDir: '../../docs/subjects/<subject>'`.
4. Give it its own logo mark and a subject palette (extend the Bench tokens; keep the system
   shared, the palette per subject).
5. Feedback widget: create a Web3Forms key for it at web3forms.com (enter
   `edenguy+academy-<subject>@gmail.com`; they email the key) and set the constant.
6. Add it in **three places** on the hub: a tile in the subjects grid (`docs/index.html`: Hebrew
   *and* English name — the app's `<title>` is the source — one-line promise, honest inline-SVG
   preview, real lesson count), a node `<g class="node">` + an `.axis-chip` in the hero handle,
   and an entry in `SUBJECTS` in `docs/hub/hub.js` (curve position, status, URL) — replacing the
   "coming soon" placeholder if one exists. Also add its record to `tileProgress()`'s `SOURCES`
   (idb key, lesson total, URL shapes). Update the count chip. See `HUB_LLD.md` §11.7.
7. `cd apps/<subject> && npm install && npm run build`, commit the result under `docs/`.
8. Share cards (`docs/hub/social/`, `scripts/render-og-cards.mjs`) are hub-level; per-subject
   share cards aren't done for Physics yet.

## How to support a new language

Today every subject supports exactly `en` and `he`. To add a third language (say `fr`):

1. In that subject's `content/schema.ts`, extend `LocalizedString` with the new field (e.g.
   `fr: z.string().optional()`) — keep `en` as the required fallback.
2. Add every missing translation to each `content/lessons/*.yaml` file. A field without the
   new language falls back to `en` at render time (`content/localize.ts`'s `pick()`), so this
   can be done incrementally without breaking the build.
3. Add `src/i18n/locales/fr.json` (UI chrome strings) and register it in `src/i18n/index.ts`
   (`resources`), plus a new entry in `LOCALES`.
4. If the new language is RTL, extend `localeDir()` in `i18n/index.ts` — the `dir`/`lang`
   attribute sync and the `.sci`/`.num` LTR-island classes already generalize.
5. Do this once per subject, and teach the hub separately — it has its own toggle.

## Working with a collaborator

`main` is production (rule 3), so the workflow is short-lived feature branches + PRs:

1. Branch off `main` per piece of work (e.g. `nadav/physics-subject`, `guy/share-cards`).
2. Push it, open a PR against `main`; fill in what changed, how you verified it (the checklist
   above), and anything you could not verify.
3. Merge once it looks right, delete the branch. Even an informal self-review beats none — a
   push to `main` is a push to the public site.

**If you are a Claude agent (or several in parallel):**

- Work on a branch in your **own git worktree** (`git worktree add`) — a shared checkout got its
  HEAD switched mid-task by a sibling session and uncommitted work from different tasks got mixed.
  Stage files **explicitly by name** (never `git add -A`); don't stash, reset or force-move
  branches you didn't create.
- **Local `origin/*` refs go stale.** Fetch with an explicit refspec
  (`git fetch origin '+refs/heads/main:refs/remotes/origin/main'`) or ask
  `git ls-remote origin refs/heads/main` before deciding what `main` is.
- Don't commit tool scaffolding (`.claude/`, scratch scripts, screenshots).
- Don't push to `main`, open PRs, or merge unless the person you work for said to; one approval
  doesn't cover later work.
- Verify independently — a sub-agent's "it passes" is a claim, not a result.

## Commands

Every subject follows the same scripts (run from `apps/<subject>/`):

```bash
npm install          # or `npm ci`
npm run dev          # local dev server, e.g. http://localhost:5173/academy/subjects/math/
npm run typecheck
npm test
npm run build        # writes ../../docs/subjects/<subject> (commit it)
npm run check        # typecheck + test + build, in one shot
npm run export:md    # YAML -> bilingual Markdown, for specialist review
npm run export:pdf   # same content as a printable PDF
```

The hub has no build: edit `docs/index.html` / `docs/hub/*` and serve `docs/` statically.
To preview it with the real `/academy/...` paths, serve a directory in which `academy` is a
symlink to `docs/` (`python3 -m http.server`).

**Browser testing with Playwright:** the package resolves from `apps/math/scripts/` after
`cd apps/math && npm ci`; in the Claude cloud sandbox use the preinstalled Chromium
(`chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })`). For **full-page
screenshots use `reducedMotion: 'reduce'`** — scroll-reveal content is blank otherwise. Fixed
elements (the feedback pill) are drawn at viewport height in a full-page shot; that's not a
layout bug. Don't commit temp scripts.

## Gotchas collected the hard way

- **Sliders under RTL:** a native `<input type="range">` inherits `direction`; numeric scales
  need `direction: ltr`, and the fill gradient must be `90deg` — an RTL override once painted the
  fill backwards in Hebrew.
- **Sticky `:hover` on touch** → gate every hover rule with `@media (hover: hover)`.
- **Quiz state leaks across lessons** if `<Quiz>` isn't keyed by lesson id (the route reuses the
  component) — keep `key={lesson.id}`.
- **Nitrox PWA** uses `registerType: 'prompt'` — returning visitors can be served old caches;
  that's a cache, not a failed deploy.
- **IBM Plex / Rubik** fonts only load online; tests offline show fallbacks.
- The hub **lang toggle indicator** is positioned per `data-lang`; if you restyle it, test both.
- Don't hand-pick colors on the hub tiles — use the per-subject tokens (contrast was computed).

## Current status

- **Live on `main`:** the hub with the inviting-landing restructure (tiles under the hero,
  progress-aware, tinted; live demo and method strip below; `/academy/subjects/` redirect page);
  Nitrox Academy (mature; **unlisted** — reachable by its direct link only, removed from the hub);
  Math Academy (Derivatives + Integrals, 6 lessons, topic-grouped
  dashboard home with progress, accuracy, achievements); Physics Academy (kinematics, 3 lessons,
  same dashboard); the "Bench" skin on both.
- **Open items:**
  - Physics feedback form is inert until a real Web3Forms key replaces
    `REPLACE_WITH_WEB3FORMS_KEY_FOR_academy-physics` in
    `apps/physics/src/components/FeedbackWidget.tsx` (Guy does the web3forms.com signup).
  - Physics has no share cards yet; the English hub share card exists as an asset but only the
    Hebrew one is wired (a static page carries one locale's meta tags).
  - Math's "next lesson" follows global topic order (Derivatives before Integrals), so finishing
    an Integrals lesson can point back to Derivatives — intentional (matches curriculum order),
    revisit if it feels wrong.
  - Known visual nits on the hub: the hub's top bar and hero are still plainer than the tinted
    tiles below; with only two subjects the tiles are a 2-column row plus the Chemistry strip.
  - `apps/math/README.md` / `apps/physics/README.md` "Status" sections and `README.md` are older
    than this file and may lag (e.g. Math's README still describes the integral-only pilot and an
    old `docs/math` build path) — this file wins; fix them when you touch those apps.
  - The recent history's Claude-authored commits (rule 5).
- **Not started:** Chemistry Academy; a shared package for Math/Physics scaffold code; Nitrox is
  unchanged by the Bench/dashboard work (it is the reference, by design).
