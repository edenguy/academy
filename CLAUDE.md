# Academy — guidance for Claude

Read this before touching anything in this repo. It states the project's goal, how it's
organized, and the rules that are easy to get wrong — the kind of thing a new contributor
(human or Claude) would otherwise have to rediscover the hard way.

## What this is

A growing set of free, independent, playful lessons — one subject at a time — built because
someone wanted to truly understand a topic, not earn a certificate. Every lesson pairs a live
interactive simulation with the idea it teaches, instead of asking the learner to memorize it.
Bilingual (Hebrew first, English second) from day one, for every piece of learner-facing
content, in every subject — never an afterthought bolted on later. See `docs/index.html` for
the mission statement as actually shown to visitors.

First (and currently only) subject: **Math Academy** (`apps/math`), a pilot on the definite
integral — rectangles → Riemann sums → the power-rule shortcut.

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
│   ├── math/                    Math Academy's app (see apps/math/README.md)
│   └── <subject>/                future subjects follow the same shape
└── docs/                       SERVED by GitHub Pages — the entire public site lives here
    ├── index.html                landing page, lists every subject
    ├── favicon.svg, social/       the hub's own neutral "spark" logo + share cards
    ├── math/                      built output of apps/math, served at /academy/math/
    └── <subject>/                  built output of a future apps/<subject>
```

Each subject is a fully independent app — own `package.json`, own build, own content, own
`vite.config.ts` (`base: '/academy/<subject>/'`, `outDir: '../../docs/<subject>'`). A subject
never imports another subject's code. What's genuinely shared (a UI primitive, the
Riemann-sum-style visualization pattern, the YAML→Markdown/PDF review-export scripts) gets
pulled into a common package only once it's actually duplicated across two subjects — not
speculatively, before there's a second subject to prove it's really shared.

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
3. Update `vite.config.ts`: `base: '/academy/<subject>/'`,
   `outDir: '../../docs/<subject>'`.
4. Give it its own logo mark — subject-specific is correct here (unlike the hub page, which
   must stay neutral since it spans every subject; see `docs/index.html`'s "spark" mark vs.
   Math Academy's `∫`).
5. Add a card for it on `docs/index.html`, replacing its "coming soon" placeholder if one
   exists.
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
npm run build        # writes ../../docs/<subject> (commit it)
npm run check         # typecheck + test + build, in one shot
npm run export:md     # YAML -> bilingual Markdown, for specialist review
npm run export:pdf    # same content as a printable PDF
```

## Current status

- **Done:** Math Academy pilot — 3 lessons on the definite integral, each with a live
  `IntegralExplorer` (Riemann-sum visualization) and a short quiz, bilingual throughout. The
  Academy hub landing page (`docs/index.html`) with its own logo, mission statement, and
  WhatsApp/Open-Graph share cards (Hebrew live, English ready as an asset — see rule-adjacent
  note in `README.md` about why a static page can only carry one locale's meta tags).
- **Decided, not yet built:** the topic-first content structure described above, for whenever
  Math Academy (or a future subject) grows past one topic.
- **Not started:** a second subject (Physics Academy is a placeholder card on the hub page,
  no app yet).
