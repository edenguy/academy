# Academy

Playful, bilingual (Hebrew/English) interactive lessons — one subject per app, published
together under <https://edenguy.github.io/academy/>.

## Structure

Each subject is an independent app with its own `package.json`, build, and YAML content.
Source and the published site are kept fully separate: every app lives under `apps/`, and
only `docs/` — the landing page plus each subject's built output — is ever served.

```
academy/                       (this repo)
├── apps/                       SOURCE — never served
│   ├── math/                   source for Math Academy
│   └── <subject>/               future subjects follow the same shape
└── docs/                       SERVED by GitHub Pages — the whole site lives here
    ├── index.html               landing page, listing every subject
    ├── math/                     built output of apps/math, served at /academy/math/
    └── <subject>/                 built output of a future apps/<subject>
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
and each subject's build output (`docs/math/`, later `docs/<subject>/`) is served at
`https://edenguy.github.io/academy/<subject>/` — no further config needed; every future push
to `main` just updates the live site. `apps/` is never published; nothing under it is
reachable at any URL.

## Adding a subject

1. `cp -r apps/math apps/<subject>` as a starting scaffold, then rewrite its content.
2. Update its `vite.config.ts`: `base: '/academy/<subject>/'`, `outDir: '../../docs/<subject>'`.
3. Add a card for it on `docs/index.html`.
4. `cd apps/<subject> && npm install && npm run build` and commit the result.

See `apps/math/README.md` for the content model (YAML lessons, bilingual fields, the
Markdown/PDF specialist-review export) that every subject follows.
