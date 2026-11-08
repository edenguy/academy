# Academy — guidance for Claude

Read this before touching anything in this repo. It states the project's goal, how it's
organized, and the rules that are easy to get wrong — the kind of thing a new contributor
(human or Claude) would otherwise have to rediscover the hard way.

## What this is

A growing set of independent, playful lessons — one subject at a time — built because someone
wanted to truly understand a topic, not earn a certificate. Every lesson pairs a live
interactive simulation with the idea it teaches, instead of asking the learner to memorize it.
Bilingual (Hebrew first, English second) from day one, for every piece of learner-facing
content, in every subject — never an afterthought bolted on later. See `docs/index.html` for
the mission statement as actually shown to visitors.

**The one idea every lesson is built on:** you grab a handle and move it, and the idea
responds — a slider under a Riemann-sum curve, sliders over partial pressures in the Nitrox
lab. That's not a UI flourish, it's the actual teaching method (simulate, don't memorize), and
it's also why the hub's own logo and hero are literally a handle on a curve (see "Visual
design system" below and `HUB_LLD.md` §0). Every new subject should have at least one
interactive explorer the learner drags/scrubs, not just a quiz.

Currently free, as a pilot — that is not a permanent commitment. Don't state or imply
anywhere that it's free *forever*; tie "free" to the pilot phase wherever it's mentioned (see
`docs/index.html`'s own phrasing), and don't add a pricing/payment claim of any kind without
being asked.

Current subjects: **Nitrox Academy** (`apps/nitrox`), enriched-air diving theory — the
original, most mature app, migrated in from its own repo, with real offline/PWA support and
an established set of conventions (see `apps/nitrox/CLAUDE.md`). **Math Academy** (`apps/math`),
a newer, leaner pilot on the definite integral — rectangles → Riemann sums → the power-rule
shortcut. Treat Math as the template for a *new* subject's content model (YAML + Zod); treat
Nitrox as the reference for what a subject looks like once it's grown large, not as something
to imitate on day one.

## Non-negotiable rules

1. **Bilingual is mandatory, for every subject.** Every learner-facing string is `{ en: "...",
   he: "..." }` (see `LocalizedString` in each subject's `content/schema.ts`). This is a
   day-one requirement, not something added after a subject ships. A lesson, a quiz question,
   a UI label — if a learner can see it, it needs both languages before it ships.
2. **Lesson content is YAML, never hardcoded in components.** Titles, narrative paragraphs,
   quiz questions, answers and explanations live in `apps/<subject>/src/content/lessons/*.yaml`
   (or wherever that subject's content schema says), validated by Zod at load time. UI chrome
   strings (button labels, nav, generic quiz UI copy) are the only thing that belongs in
   `src/i18n/locales/{en,he}.json` instead.
3. **`main` is production.** GitHub Pages serves this repo directly from `main` (`docs/`
   folder — see "Architecture" below), so a push to `main` goes live immediately. Don't push
   straight to `main` for anything beyond a trivial fix: branch, open a PR, merge. See
   "Working with a collaborator" below.
4. **Build output is committed, under `docs/`.** Each subject's production build is committed
   alongside its source — run that subject's `npm run build` and commit the result whenever
   its app changes. Never hand-edit anything under `docs/`; edit the source under
   `apps/<subject>/` and rebuild. `apps/` itself is never published — GitHub Pages only serves
   `docs/`.
5. **Git identity stays human.** Commits are authored by whichever of us (Guy or a
   collaborator) owns the work, never re-signed as a Claude/Anthropic identity. A
   `Co-Authored-By` trailer in the commit body is fine and expected; the author/committer
   identity itself is not negotiable.
6. **Never invent a fact.** Any claim a lesson states as true (a formula, a historical note, a
   "this is how X is taught") needs to actually be correct — these are study tools people
   trust. When in doubt, say less rather than assert something unverified.

## Architecture

```
academy/                       (this repo)
├── CLAUDE.md                   this file
├── README.md                   setup, Pages config, "adding a subject" walkthrough
├── apps/                       SOURCE — never served, never deployed directly
│   ├── nitrox/                  Nitrox Academy's app (see apps/nitrox/CLAUDE.md)
│   ├── math/                    Math Academy's app (see apps/math/README.md)
│   └── <subject>/                future subjects follow the same shape
└── docs/                       SERVED by GitHub Pages — the entire public site lives here
    ├── index.html                landing page, lists every subject
    ├── hub/                       the hub's OWN assets only (favicon.svg, social/) — nothing a subject owns
    └── subjects/
        ├── nitrox/                 built output of apps/nitrox, at /academy/subjects/nitrox/
        ├── math/                   built output of apps/math, at /academy/subjects/math/
        └── <subject>/               built output of a future apps/<subject>
```

Each subject is a fully independent app — own `package.json`, own build, own content, own
`vite.config.ts` (`base: '/academy/subjects/<subject>/'`, `outDir: '../../docs/subjects/<subject>'`).
A subject never imports another subject's code. What's genuinely shared (a UI primitive, the
Riemann-sum-style visualization pattern, the YAML→Markdown/PDF review-export scripts) gets
pulled into a common package only once it's actually duplicated across two subjects — not
speculatively, before there's a second subject to prove it's really shared.

**Retiring a subject's URL is not just deleting its folder.** If the subject registered a
service worker (any PWA-enabled app — Nitrox does, via `vite-plugin-pwa`), a returning
visitor's browser may still be actively serving it from an offline cache, which never even
attempts the network request that would show them something new. See `README.md`'s
"Retiring a URL" section for the self-unregistering service worker pattern this repo already
used once, migrating Nitrox Academy off `edenguy.github.io/nitrox-academy/`.

`scripts/` at the repo root holds hub-level tooling that isn't any one subject's (e.g.
`render-og-cards.mjs` for `docs/`'s own share card). It has no `package.json` of its own —
run it by temporarily borrowing a subject app's `node_modules` (see the comment at the top of
that script) rather than installing a parallel toolchain just for occasional asset generation.

## Content review round trip

Because lesson content is plain YAML, it can be exported as a document for a non-developer —
a subject-matter specialist — to read and correct, then fed back in. Each subject's
`npm run export:md` / `export:pdf` (see `apps/math/README.md` for the full workflow) produces
a bilingual document with every lesson, including quiz answers and explanations, not just what
a learner sees. A correction comes back as a marked-up document, which gets mapped back to the
specific YAML field(s) it came from and edited directly — the exported document is never
hand-edited back into the app; YAML stays the single source of truth.

## How to support a new language

Today every subject supports exactly `en` and `he`. To add a third language (say `fr`):

1. In that subject's `content/schema.ts`, extend `LocalizedString` with the new field (e.g.
   `fr: z.string().optional()`) — keep `en` as the required fallback.
2. Add every missing translation to each `content/lessons/*.yaml` file. A field without the
   new language falls back to `en` at render time (`content/localize.ts`'s `pick()`), so this
   can be done incrementally without breaking the build.
3. Add `src/i18n/locales/fr.json` (UI chrome strings) and register it in `src/i18n/index.ts`
   (`resources`), plus a new entry in `LOCALES`.
4. If the new language is RTL (Hebrew already exercises this path), extend `localeDir()` in
   `i18n/index.ts` — everything else (the `dir`/`lang` attribute sync, the `.sci`/`.num`
   LTR-island classes for formulas and numbers inside RTL prose) already generalizes.
5. Do this once per subject — there's no cross-subject language registry to update.

## How to add a new academy topic (subject)

1. `cp -r apps/math apps/<subject>` as a starting scaffold.
2. Rewrite its content: replace `src/content/lessons/*.yaml` with the new subject's lessons
   (same bilingual, Zod-validated shape — see rule 1 and 2 above), update `src/content/schema.ts`
   if the new subject needs a different interactive-explorer shape than Math's
   `IntegralExplorer`, and update `src/i18n/locales/{en,he}.json` for that subject's own UI
   copy (app name, etc.).
3. Update `vite.config.ts`: `base: '/academy/subjects/<subject>/'`,
   `outDir: '../../docs/subjects/<subject>'`.
4. Give it its own logo mark — subject-specific is correct here (unlike the hub page, which
   must stay neutral since it spans every subject; see `docs/hub/logo.svg`'s neutral "Handle"
   mark vs. Math Academy's `∫`).
5. Add it in **three places** on the hub: a card in the subjects grid (`docs/index.html`,
   with its Hebrew *and* English name — the apps' own `<title>`s are the source), a node
   `<g class="node">` + an `.axis-chip` button in the hero handle's SVG/axis (`docs/index.html`),
   and an entry in the `SUBJECTS` array in `docs/hub/hub.js` (position on the curve, status,
   URL) — replacing a "coming soon" placeholder if one exists. Also bump the count chip in the
   subjects header.
6. `cd apps/<subject> && npm install && npm run build` and commit the result under `docs/`.

**Content organization within a subject (decided, not yet built):** once a subject has more
than one topic, organize **topic-first**, with grade/track as metadata tags rather than a
gate: Subject area (e.g. "Calculus", "Algebra") → Topic (e.g. "Integrals") → Lesson, where
each lesson may carry optional `grades`/`track` tags for a filter or a "typically taught in"
badge — never to block access. This was chosen deliberately over a grade-first hierarchy:
a single topic legitimately spans multiple grades and curriculum tracks (e.g. integrals sit
differently across the Israeli 3/4/5-יחידות tracks), and gating by grade would contradict the
project's own explore-anything spirit. Math Academy's current schema is still flat (a single
implicit topic, "integrals") — this structure applies once there's a second topic to actually
navigate between; don't build the nested picker UI before that's true.

## The hub page (`docs/index.html`, `docs/hub/hub.css`, `docs/hub/hub.js`)

Plain static HTML/CSS/vanilla JS (no framework, no build step) with a real language toggle —
never show both languages inline in the same block of text. Every bilingual string is two
elements, `<span class="t-he">...</span><span class="t-en">...</span>`, and CSS
(`[data-lang="he"] .t-en, [data-lang="en"] .t-he { display: none; }`) shows only one; a small
inline script flips `data-lang`/`dir`/`lang` on `<html>`, persists the choice to
`localStorage`, and runs once, synchronously, in `<head>` before first paint (same pattern
each subject app's own pre-paint theme script uses) so there's no flash of the wrong language
or direction.

The hub keeps its own neutral "Handle" mark (`docs/hub/logo.svg` — a handle on a spectrum
curve, the one gesture every lesson shares) and a draggable hero handle that scrubs between
subjects on that same curve — subject-specific icon colors show up only on the subject cards
and inside the hero handle's nodes, never on the hub's own chrome (top bar, buttons, headings;
see "What this is" above on why the hub can't wear any one subject's icon). Full design spec:
`HUB_LLD.md` at the repo root (kept outside `docs/` so it never gets served).

## Visual design system (hub) and UX approach

The hub (`docs/hub/hub.css`) is deliberately **typographically and tonally distinct from the
subject apps**: hub = the "OS" (system chrome, neutral), subjects = "apps" (their own
personality). Don't blur that line — e.g. don't bring Rubik or a subject's violet→pink pair
onto the hub, and don't bring the hub's Plex/mono "instrument" look into a subject app
uninvited.

- **Register:** "futuristic hi-tech" here means *a well-lit instrument*, not an "AI product" —
  no sparkles, neural-net dots, mesh-gradient blobs, gradient-filled headlines, emoji icons, or
  text claiming "AI"/"smart"/"adaptive". Dark-first (near-black indigo, one soft light at the
  top-start corner), light mode is "paper lab". Glow is reserved for things that are live or
  draggable — nothing static glows. Full ban list: `HUB_LLD.md` §7.
- **Typography:** IBM Plex Sans Hebrew (headings/body, both languages) + IBM Plex Mono
  (readouts, chips, numbers — tabular, uppercase-Latin-only, never on Hebrew). Subject apps
  keep Rubik; this is intentional, not inconsistency.
- **Color tokens** (`:root` / `:root[data-theme="dark"]` in `hub.css`): `--bg/--bg-2`,
  `--panel` (glass: blur + hairline border + inset top-edge highlight), `--ink/--ink-2/--muted`,
  `--accent` (hub's own electric violet, *not* Math's violet→pink), `--teal/--violet/--pink/
  --amber/--blue` (the "spectrum" — the only multi-hue gradient on the page, used for the logo
  curve and the hero curve; never as a background wash). A subject's own `--c1/--c2` are set
  inline on its card, never promoted to hub tokens.
- **Numbers never mirror:** every number, formula, airport/mix code is an LTR island
  (`.num`/`dir="ltr"` + `unicode-bidi: isolate`) inside the RTL page — same rule the subject
  apps already follow. Hebrew text is never tracked or uppercased.
- **Motion:** `cubic-bezier(.2,.8,.2,1)`, 180–320 ms; the one idle animation (the logo
  "breathing") is 5 s and off under `prefers-reduced-motion`; no infinite float/bob/particles.
- **Never invent a number for a live demo.** A demo-displayed constant (e.g. the Nitrox demo's
  1.4 pO₂ limit) must be read from and cited to the subject's own source of truth
  (`apps/nitrox/src/science/limits.ts`'s `DEFAULT_PLANNING_PPO2`), never hardcoded — this is
  rule 6 ("never invent a fact") applied to the hub's own live infographics.

Full rationale, exact CSS, copy and acceptance checklist: `HUB_LLD.md`.

## Working with a collaborator

`main` is production (rule 3), so the workflow is short-lived feature branches + PRs, not a
long-lived personal branch merged into `main` occasionally:

1. Branch off `main` per piece of work (e.g. `nadav/physics-subject`, `guy/share-cards`).
2. Push it, open a PR against `main`.
3. Merge once it looks right, delete the branch.

This keeps `main` small, current, and always deployable, and gives a real checkpoint before
anything goes live — even an informal self-review beats none, given a push to `main` is a push
to the public site.

## Commands

Every subject follows the same scripts (run from `apps/<subject>/`):

```bash
npm install
npm run dev          # local dev server
npm run typecheck
npm test
npm run build        # writes ../../docs/subjects/<subject> (commit it)
npm run check         # typecheck + test + build, in one shot
npm run export:md     # YAML -> bilingual Markdown, for specialist review
npm run export:pdf    # same content as a printable PDF
```

## Current status

- **Done:** Nitrox Academy, migrated in whole from its own repo — the mature, full-featured
  subject (chapters, assessment engine, PWA/offline support). Math Academy pilot — 3 lessons
  on the definite integral, each with a live `IntegralExplorer` (Riemann-sum visualization)
  and a short quiz, bilingual throughout. The Academy hub landing page (`docs/index.html`,
  `docs/hub/`) — a "lit instrument" visual system built around the neutral "Handle" mark, a
  mission statement about the method (not a personal narrative — see "Visual design system"
  below), a real EN/HE toggle, a draggable hero handle that scrubs between subjects, two live
  mini-simulations (Riemann rectangles, Nitrox pO₂ vs depth), a memorize-vs-move infographic,
  and WhatsApp/Open-Graph share cards (Hebrew live, English ready as an asset — see "Content
  review round trip" above on why a static page can only carry one locale's meta tags at a
  time). Full spec: `HUB_LLD.md`.
- **Decided, not yet built:** the topic-first content structure described above, for whenever
  Math Academy (or a future subject) grows past one topic.
- **Not started:** a third subject (Physics Academy and Chemistry Academy are placeholder
  cards on the hub page, no app yet for either).
