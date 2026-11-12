# Academy

Playful, bilingual (Hebrew/English) interactive lessons — one subject per app, published
together under <https://edenguy.github.io/academy/>.

## Structure

Each subject is an independent app with its own `package.json`, build, and content. Source
and the published site are kept fully separate: every app lives under `apps/`, and only
`docs/` — the landing page plus every subject's built output, grouped under `docs/subjects/`
— is ever served.

```
academy/                              (this repo)
├── apps/                              SOURCE — never served
│   ├── nitrox/                         source for Nitrox Academy (enriched-air diving theory)
│   ├── math/                           source for Math Academy
│   ├── physics/                        source for Physics Academy
│   └── chemistry/                      source for Chemistry Academy
└── docs/                              SERVED by GitHub Pages — the whole site lives here
    ├── index.html                      landing page, listing every subject
    ├── hub/                             the hub's OWN assets only (favicon.svg, social/) — nothing a subject owns
    └── subjects/
        ├── nitrox/                       built output of apps/nitrox, at /academy/subjects/nitrox/
        ├── math/                         built output of apps/math, at /academy/subjects/math/
        ├── physics/                      built output of apps/physics, at /academy/subjects/physics/
        └── chemistry/                    built output of apps/chemistry, at /academy/subjects/chemistry/
```

A subject never touches another subject's code; what's shared (a UI primitive, the
Riemann-sum-style visualization pattern, the review-export scripts) gets pulled into a common
package only once it's actually duplicated across two subjects, not before.

## GitHub Pages

This repo is a GitHub Pages *project* site (not `<user>.github.io`), so it needs Pages turned
on once, by hand, in the repo settings:

**Settings → Pages → Build and deployment → Source: "Deploy from a branch" → Branch: `main`,
folder: `/docs`.**

After that one-time step, `docs/index.html` is served at `https://edenguy.github.io/academy/`,
and each subject's build output (`docs/subjects/<name>/`) is served at
`https://edenguy.github.io/academy/subjects/<name>/` — no further config needed; every future
push to `main` just updates the live site. `apps/` is never published; nothing under it is
reachable at any URL.

## Adding a subject

1. `cp -r apps/math apps/<subject>` as a starting scaffold (or `apps/nitrox` if the new
   subject needs offline/PWA support), then rewrite its content.
2. Update its `vite.config.ts`: `base: '/academy/subjects/<subject>/'`,
   `outDir: '../../docs/subjects/<subject>'`.
3. Give it its own logo/icon (subject-specific is correct — only the hub page's mark must
   stay neutral) and add it to the hub in three places: a tile in the subjects grid on `docs/index.html`, a node
   + axis chip in the hero handle's markup there, and an entry in the `SUBJECTS` array and in
   `tileProgress()`'s `SOURCES` in `docs/hub/hub.js` (see `CLAUDE.md`, "How to add a new
   academy topic").
4. `cd apps/<subject> && npm install && npm run build` and commit the result.

See `apps/math/README.md` for the YAML content model (bilingual fields, Zod validation, the
Markdown/PDF specialist-review export) that a new subject should follow; `apps/nitrox` is an
older, larger app with its own established conventions (see `apps/nitrox/CLAUDE.md`) — treat
it as reference for what a mature subject looks like, not as the template to copy from.

## Retiring a URL (moving or removing a subject)

If a subject's app is ever moved or removed, don't just delete its `docs/subjects/<name>/`
output — if it registered a service worker (any PWA-enabled subject), a returning visitor's
browser is still actively serving the old app from its offline cache and will never even
attempt the network request that would show them something new. Replace the subject's `sw.js`
with one that unregisters itself first (see `apps/nitrox`'s migration commit for the pattern:
take over with `skipWaiting`, clear every cache on `activate`, unregister, then reload open
tabs) — only then does a plain redirect `index.html` actually reach anyone.
