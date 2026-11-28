# Code Graph Academy — pilot

Seven bilingual (Hebrew first, English second) lessons on how a coding agent finds its way around
code it cannot read in full: what a code graph is, the three kinds and their blind spots, whether
a standard exists, and what the topology looks like when an organization has hundreds of repos and
thousands of developers. Live at <https://edenguy.github.io/academy/subjects/codegraph/>.

**Unlisted, like Nitrox.** It is not a school subject, so the hub does not show it and no other
subject links to it. Its URL must keep working; do not add it to `docs/hub/hub.js` (`SOURCES`)
or to the hub's tiles unless Guy asks.

The course is **generic**. It describes no particular company, and the organization in the
examples (500 repos, 20,000 developers) is made up: every explorer that shows those numbers says so.
Every claim is on the verified-facts table in `CODEGRAPH_LLD.md` §2 (repo root); a claim that is not
on that table is not taught.

## Commands

```bash
cd apps/codegraph
npm install          # or `npm ci`
npm run dev          # http://localhost:5173/academy/subjects/codegraph/
npm run typecheck
npm test
npm run build        # writes ../../docs/subjects/codegraph (commit it)
npm run check        # typecheck + test + build
npm run export:md    # YAML -> bilingual Markdown for review (docs/review/, not committed)
npm run export:pdf
```

## Where things are

| Layer | Path | Notes |
|---|---|---|
| Lessons | `src/content/lessons/*.yaml` | Bilingual, Zod-validated at load (`src/content/schema.ts`). Identifiers go in `{{ }}`. |
| The toy shop | `src/graph/toy.ts` | 4 files, 28 lines, 11 nodes, 10 edges: the source of truth for lessons 1 to 3 and 5. |
| Pure functions | `src/graph/*.ts` | Search, graph walks, the four ways to answer, staleness, scale, cadence, topology, access, landscape. Every table in `CODEGRAPH_LLD.md` §4 is a vitest case. |
| Explorers | `src/components/explorers/` | Nine kinds. Components contain no formulas. The topology, graph and access diagrams have a wide and a narrow layout chosen by container width. |
| Strings | `src/i18n/locales/{en,he}.json` | UI chrome and explorer labels; lesson prose lives in the YAML. |
| Progress | `src/progress/` | IndexedDB key `academy-codegraph:v1`. The hub does not read it. |

## Open items

- The feedback form is inert until a real Web3Forms key replaces
  `REPLACE_WITH_WEB3FORMS_KEY_FOR_academy-codegraph` in `src/components/FeedbackWidget.tsx`
  (create it with `edenguy+academy-codegraph@gmail.com`).
- No share cards.
- The source links in the landscape lesson (`CODEGRAPH_LLD.md` §2) need a manual check once a year.
