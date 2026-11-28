# Code Graph Academy: low-level design (spec only, no code yet)

Status: spec. Nothing in `apps/` or `docs/` changes in this commit. An implementer builds
from this file; where the build must deviate, update this file in the same PR.

Read with: `CLAUDE.md` (rules 1 to 8, "How to add a new academy subject"),
`SUBJECT_APP_SKIN_LLD.md` (the Bench skin). This spec names every place it departs from them.

---

## 0. Decision summary

**What it is.** A seven-lesson course that explains, from zero, how a coding agent finds
its way around code it cannot read in full: what a code graph is, the three kinds and
their blind spots, whether a standard exists, and (the main part) what the topology
looks like when an organization has hundreds of repos and thousands of developers.

**The question it answers.** An academic one: "how does this work in a generic
organization with, say, 500 repos and 20,000 developers?" The course uses one
hypothetical organization throughout. Its two sizes are the learner's parameters, with
500 and 20,000 as defaults. They are not claims about any real company, and every
screen that shows them says so.

**Decisions (each can be overridden by Guy; see §7.2).**

| # | Decision | Why, in one line |
|---|---|---|
| D1 | New subject app `apps/codegraph`, URL `/academy/subjects/codegraph/`, key `academy-codegraph:v1`. | Same shape as every other subject; no shared code. |
| D2 | Scaffold by copying **`apps/chemistry`**, not `apps/math`. | Chemistry is the Math scaffold with one topic and no Paper layer or glass tokens, so there is nothing to strip. |
| D3 | **Unlisted**, like Nitrox: no hub tile, no hero node, no `SOURCES` entry, no link from other subjects. No `noindex`. | It is not a school subject; the hub is for those. `noindex` is Guy's call (§7.2). |
| D4 | Seven lessons, one topic. | The brief said five or six; the landscape lesson was added after, and merging two lessons would bury either the graph basics or the scale arithmetic. One topic keeps previous/next continuous across the arc. |
| D5 | One toy codebase (4 files, 2 repos, 2 languages, 8 functions, 1 endpoint, 2 fields) is the source of truth for every number in lessons 1, 2, 3 and 5. | Rule 6: numbers are computed from the subject's own data, never typed. |
| D6 | Scale numbers are arithmetic on learner-set parameters, labelled as such on screen. | No measurement exists that we may cite; arithmetic on stated assumptions is honest. |
| D7 | Topologies, access-check placement, the registry and the fall-back rule are taught as **generic patterns** ("one common way"), never as a standard or as any company's setup. | No standard covers them (§2). |
| D8 | All explorer labels are UI chrome in `locales/{he,en}.json`; lesson prose and quizzes are YAML. | Matches Math and Chemistry. |
| D9 | No Paper layer, no ambient audio button changes, no share cards. | Out of scope now. |
| D10 | Diagram geometry does not mirror in Hebrew; only the labels change language. | The flow is top to bottom, so direction is neutral, and one geometry halves the test matrix. |

**Out of scope, deliberately.**

- Anything about a specific company, its repos, tools, teams, or its MCP servers. No
  "ask your platform team" boxes and no "do I publish my own repos" framing (removed at
  Guy's request).
- Token counts or cost savings. One experiment's numbers are not a fact. The course
  counts hits, files, lines, queries, builds and commits, all computed.
- A tutorial for any product (no install steps for an indexer, no MCP server setup).
- Hub changes, Paper layer, PWA, spaced review, share cards, a third language.
- Running a real parser or indexer in the browser. The toy graphs are hand-authored data
  with consistency tests.

---

## 1. Placement and identity

### 1.1 Names and copy

| Item | Hebrew | English |
|---|---|---|
| App name (`<title>` is `אקדמיית גרף הקוד · Code Graph Academy`) | אקדמיית גרף הקוד | Code Graph Academy |
| Subtitle | איך סוכן קוד מוצא את דרכו בארגון שלם | How a coding agent finds its way around a whole organization |
| Topic id `code-graphs`, title | גרפים של קוד | Code graphs |
| Topic description | מהשאלה הבודדת ועד ארגון של אלפי מפתחים. | From one question to an organization of thousands of developers. |
| `curriculumBadge` (topic name only, no grade) | גרפים של קוד | Code graphs |
| `<meta name="description">` (Hebrew only, as in the other apps) | אקדמיית גרף הקוד: מהו גרף קוד, אילו סוגים יש, האם יש תקן, ואיך זה נראה בארגון גדול. שיעורים עם סימולציה חיה. כלי לימודי בלתי רשמי. | (none) |

`og:*` and `twitter:*` tags: keep `og:type`, `og:site_name`, `og:locale`, `og:url`
(`https://edenguy.github.io/academy/subjects/codegraph/`), `og:title`, `og:description`.
**Remove** every `og:image*` and `twitter:image` tag and the `twitter:card` tag: there is
no share card (§7.3, open item).

### 1.2 Progress and storage keys

- IndexedDB (idb-keyval default store) key: `academy-codegraph:v1`, same `{state, version}`
  shape as Chemistry. Keep the `hydrated`-before-`visitLesson` rule and `mergePersisted`
  exactly as copied.
- `localStorage`: `academy-codegraph:theme`, `academy-codegraph:locale`.
- The hub does **not** read this key. Do not add it to `SOURCES` in `docs/hub/hub.js`.

### 1.3 Palette

Hue gaps were checked against the existing subjects: Math violet 247° and pink 337°,
Physics indigo 227° and cyan 200°, Chemistry amber 34° and teal 173°, Nitrox teal 175° and
blue 221°, semantic green 157° and red 0°. Green and red are ruled out as subject hues
because this course's explorers use them for "right" and "wrong". The subject takes
**plum** (306°) with **lime** (79°) as the second hue: near-complementary, like a code
editor theme, and far from every other subject.

Favicon gradient: `#a3279a` → `#7fae1c`.

Contrast below was computed with the WCAG relative-luminance formula for this spec.

```css
:root {                                    /* light: plum-tinted paper */
  --bg: #f8eef6;          --bg-2: #f2e3ef;
  --surface: #ffffff;     --surface-2: #fcf5fb;   --surface-3: #f3e2f0;
  --line: rgba(150, 33, 138, 0.12);  --line-strong: rgba(150, 33, 138, 0.26);
  --axis: rgba(150, 33, 138, 0.45);
  --ink: #2a1027;  --ink-2: #4d3349;  --muted: #6f5a6c;      /* muted 5.53:1 on --bg */
  --accent: #96218a;      --accent-ink: #ffffff;              /* 6.44:1 on --bg, 7.29:1 on white */
  --accent-deep: #771a6e;
  --accent-soft: rgba(150, 33, 138, 0.12);
  --accent-2: #8fbf26;    --accent-2-soft: rgba(143, 191, 38, 0.20);
  --hue-shadow: rgba(150, 33, 138, 0.22);
  --glow: rgba(150, 33, 138, 0.30);
  --series-a: #96218a;    --series-a-soft: rgba(150, 33, 138, 0.16);
  --series-b: #4f7a0c;    --series-b-soft: rgba(79, 122, 12, 0.16);
  --highlight: #a15e0a;   --highlight-soft: rgba(161, 94, 10, 0.16);
  --good: #0b7a4f;  --good-fill: #0ca36b;  --good-soft: rgba(12, 163, 107, 0.14);
  --critical: #b93232;  --critical-fill: #d03b3b;  --critical-soft: rgba(208, 59, 59, 0.12);
  --grid: rgba(150, 33, 138, 0.07);
  color-scheme: light;
}
:root[data-theme='dark'] {                 /* dark: lit bench, plum */
  --bg: #160b15;          --bg-2: #1e101c;
  --surface: #281626;     --surface-2: #321c2f;   --surface-3: #3e2439;
  --line: rgba(229, 139, 219, 0.16);  --line-strong: rgba(229, 139, 219, 0.32);
  --axis: rgba(229, 139, 219, 0.50);
  --ink: #fbeef9;  --ink-2: #e3c9de;  --muted: #b49bb0;
  --accent: #e58bdb;      --accent-ink: #1e101c;
  --accent-deep: #cf6fc4;
  --accent-soft: rgba(229, 139, 219, 0.18);
  --accent-2: #b5e04a;    --accent-2-soft: rgba(181, 224, 74, 0.20);
  --hue-shadow: rgba(0, 0, 0, 0.55);
  --glow: rgba(229, 139, 219, 0.38);
  --series-a: #e58bdb;    --series-a-soft: rgba(229, 139, 219, 0.20);
  --series-b: #b5e04a;    --series-b-soft: rgba(181, 224, 74, 0.20);
  --highlight: #e0a830;   --highlight-soft: rgba(224, 168, 48, 0.20);
  --good: #2fd69a;  --good-fill: #2fd69a;  --good-soft: rgba(47, 214, 154, 0.18);
  --critical: #e66767;  --critical-fill: #e66767;  --critical-soft: rgba(230, 103, 103, 0.18);
  --grid: rgba(229, 139, 219, 0.08);
  color-scheme: dark;
}
```

Computed contrast (text colour on surface):

| Token | on `--bg` | on `--bg-2` | on `--surface` | on `--surface-2` | on `--surface-3` |
|---|---|---|---|---|---|
| light `--ink` `#2a1027` | 15.44 | 14.15 | 17.47 | 16.30 | 14.10 |
| light `--ink-2` `#4d3349` | 9.84 | 9.02 | 11.14 | 10.39 | 8.99 |
| light `--muted` `#6f5a6c` | 5.53 | 5.07 | 6.26 | 5.84 | 5.05 |
| light `--accent` `#96218a` (the text-safe colour) | 6.44 | 5.90 | 7.29 | 6.80 | 5.88 |
| light `--series-b` `#4f7a0c` | 4.50 | 4.13 | 5.10 | 4.75 | 4.11 |
| light `--good` / `--critical` | 4.74 / 5.20 | 4.35 / 4.77 | 5.37 / 5.89 | 5.01 / 5.50 | 4.33 / 4.75 |
| light `--accent-2` `#8fbf26` | 1.92 | 1.76 | 2.18 | 2.03 | 1.76 |
| dark `--muted` `#b49bb0` | 7.55 | 7.20 | 6.70 | 6.15 | 5.45 |
| dark `--accent` `#e58bdb` | 8.28 | 7.89 | 7.34 | 6.74 | 5.97 |
| dark `--accent-2` `#b5e04a` | 12.56 | 11.98 | 11.13 | 10.22 | 9.05 |
| dark `--critical` `#e66767` | 5.95 | 5.67 | 5.27 | 4.84 | 4.29 |

Other pairs: white on light `--accent` 7.29; light `--accent` on `--accent-soft` over
white 5.95; light `--accent` on `--accent-2-soft` over white 6.29; dark `--accent-ink` on
dark `--accent` 7.89; dark `--accent` on `--accent-soft` over `--surface` 5.24.

Rules that follow from the table:

1. Light `--accent-2` (lime) is **never text**. Fills, strokes, chip backgrounds, favicon.
2. Light `--series-b`, `--good` and `--critical` are text only on `--surface` and
   `--surface-2` (the wells and cards). Never on `--bg-2` or `--surface-3`.
3. Dark `--critical` is not text on `--surface-3`.
4. `<meta name="theme-color">`: `#160b15` dark, `#f8eef6` light.

### 1.4 Logo and favicon

`public/favicon.svg`, same 64×64 rounded tile as the other subjects:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#a3279a"/>
      <stop offset="1" stop-color="#7fae1c"/>
    </linearGradient>
  </defs>
  <rect width="64" height="64" rx="16" fill="url(#g)"/>
  <g fill="none" stroke="#ffffff" stroke-width="3.2" stroke-linecap="round">
    <path d="M20 44 L32 20 M32 20 L46 40 M20 44 L46 40"/>
  </g>
  <g fill="#ffffff">
    <circle cx="20" cy="44" r="6"/><circle cx="32" cy="20" r="6"/><circle cx="46" cy="40" r="6"/>
  </g>
</svg>
```

`components/Logo.tsx` draws the same three-node mark. The mark means "nodes and edges";
it is not a handle on a curve, which stays the hub's mark.

### 1.5 The illustrative-organization label

One sentence, shown as a small `--muted` line under every explorer that uses the org
parameters (`scale`, `topology`, `cadence`, `access`), and once on the home page under
the hero:

- he: `ארגון לדוגמה. המספרים הם פרמטרים שאפשר לשנות, ולא נתון על חברה אמיתית.`
- en: `An example organization. The numbers are parameters you can change, not data about a real company.`

Locale key: `org.illustrative`.

---

## 2. Verified facts (rule 6)

Every claim a lesson or explorer makes is on this table. Sources were fetched for this
spec on 2026-11-28. Labels: **VERIFIED** (the source says it), **GENERIC-PATTERN** (we
present it as one common way, in those words, never as a standard), **DROPPED** (not
taught).

Several documentation sites were unreachable from the authoring sandbox
(`modelcontextprotocol.io`, `tree-sitter.github.io`, `docs.github.com`,
`sourcegraph.com`, `engineering.fb.com`, `abseil.io`, `kythe.io`, `backstage.io`). For
those, the same text was read from the project's own public GitHub repository, and the
URL below is the one that was fetched. Where only the website would do, the row says so.

### 2.1 Parsers, indexes, formats

| # | Claim as the course states it | Label | Source fetched |
|---|---|---|---|
| F1 | tree-sitter is a parser generator and incremental parsing library that builds a concrete syntax tree for a source file, and aims to be robust enough to give useful results even when the file has syntax errors. | VERIFIED | `https://github.com/tree-sitter/tree-sitter` (README) |
| F2 | A navigation approach built on a parser alone finds definitions and references by **name**: GitHub describes its tree-sitter-based code navigation as one that "searches all definitions and references across a repository to find entities with a given name", and it needs no configuration in the repository. | VERIFIED | `https://raw.githubusercontent.com/github/docs/main/content/repositories/working-with-files/using-files/navigating-code-on-github.md` |
| F3 | SCIP is a language-agnostic protocol for indexing source code, defined as a Protobuf schema; an index holds documents, each with occurrences that tie a source range to a symbol and a role (definition, import, read, write and others). | VERIFIED | `https://github.com/sourcegraph/scip`, `https://raw.githubusercontent.com/sourcegraph/scip/main/scip.proto` |
| F4 | A SCIP symbol carries a package (manager, name, version), and an index can refer to symbols defined in another package's index. This is what lets references resolve across repos. For Java, cross-repo navigation needs extra dependency metadata from the build; without it indexing may succeed but cross-repo references may not resolve. | VERIFIED | `scip.proto` (messages `Symbol`, `Package`, field `external_symbols`); `https://raw.githubusercontent.com/sourcegraph/scip-java/main/docs/getting-started.md` |
| F5 | Compiler-based indexers need the project set up the way its compiler needs it. scip-java "is implemented as a Java compiler plugin that runs as part of your regular compilation in the build tool". scip-typescript is run in a project with `tsconfig.json` after installing dependencies. scip-clang is given a JSON compilation database. | VERIFIED | scip-java doc above; `https://raw.githubusercontent.com/sourcegraph/scip-typescript/main/README.md`; `https://raw.githubusercontent.com/sourcegraph/scip-clang/main/README.md` |
| F5a | Course wording that follows from F5: "a compiler-based index needs a project the compiler can process; if the build is broken, expect no index, or an incomplete one, for that commit". | VERIFIED for Java (plugin runs during compilation). **Soft for other languages**: the TypeScript README does not say what happens with type errors. The lesson text therefore says "usually" and names no language. | as F5 |
| F6 | SCIP indexers exist per language, and the list is finite (Java/Scala/Kotlin, TypeScript/JavaScript, Rust, C/C++, Ruby, Python, C#/Visual Basic, Dart, PHP at the time of writing). Course wording: "there is one indexer per language, and not every language has one". The list itself is not printed in the lesson. | VERIFIED | `https://github.com/sourcegraph/scip` |
| F7 | SCIP was designed by Sourcegraph partly to fix pain points with LSIF, and Sourcegraph has since removed LSIF support. SCIP is meant as a transmission format, not a storage format for querying. | VERIFIED | `https://raw.githubusercontent.com/sourcegraph/scip/main/docs/DESIGN.md` |
| F7a | "SCIP is the successor to LSIF" in those words. | DROPPED as a quote (the announcement post at `sourcegraph.com/blog/announcing-scip` could not be fetched). The course says F7 instead. | n/a |
| F8 | LSIF (Language Server Index Format) comes from the Language Server Protocol world: its goal is "to support rich code navigation in development tools or a Web UI without needing a local copy of the source code", and it reuses LSP data types. | VERIFIED | `https://raw.githubusercontent.com/microsoft/language-server-protocol/gh-pages/_overviews/lsif/overview.md` |
| F9 | Kythe is an open-source project from Google whose stated goal is "a standard, language-agnostic interchange mechanism" for tools that work on source code; it grew out of building a large semantic cross-reference index for Google's internal codebase. | VERIFIED | `https://raw.githubusercontent.com/kythe/kythe/master/kythe/docs/kythe-overview.txt` |
| F10 | Google's published account of its Code Search: a central index "means doing this work once, upfront"; the search index is "incrementally updated with every submitted change"; Kythe extraction and post-processing are each "roughly as expensive as a full build", and in the Chromium example the Kythe index "is computed only once per day"; an out-of-date index confuses the developers who just wrote or reviewed the change. | VERIFIED (a 2020 book; the course says "as Google described it in 2020" and makes no claim about today) | *Software Engineering at Google*, ch. 17 "Code Search": `https://raw.githubusercontent.com/abseil/abseil.github.io/master/resources/swe-book/html/ch17.html` (published at `https://abseil.io/resources/swe-book/html/ch17.html`) |
| F11 | Glean is an open-source system from Meta "for working with facts about source code", with a storage model for code information at scale and its own query language, Angle. It has its own indexers for some languages and also accepts SCIP or LSIF for others. | VERIFIED | `https://raw.githubusercontent.com/facebookincubator/Glean/main/README.md`, `.../glean/website/docs/introduction.md` |
| F11a | "Glean indexes incrementally." | VERIFIED only that the repository documents an incrementality implementation (`.../docs/implementation/incrementality.md`). How Meta runs it internally: **unknown**, not stated. The engineering post could not be fetched. The lesson does not mention incrementality. | as listed |
| F12 | CodeQL builds a database per codebase: it "extracts a single relational representation of each source file"; for compiled languages "extraction works by monitoring the normal build process"; multi-language codebases get one database per language. | VERIFIED | `https://raw.githubusercontent.com/github/codeql/main/docs/codeql/codeql-overview/about-codeql.rst` |
| F13 | Stack graphs (name resolution without build tools) as the basis of GitHub's precise navigation. | DROPPED. The public repository says it is no longer supported, and the GitHub doc fetched does not describe precise navigation. | `https://raw.githubusercontent.com/github/stack-graphs/main/README.md` |

### 2.2 Contracts and organization metadata

| # | Claim | Label | Source fetched |
|---|---|---|---|
| F14 | OpenAPI "defines a standard, language-agnostic interface to HTTP APIs" that lets people and programs understand a service "without access to source code". | VERIFIED | `https://raw.githubusercontent.com/OAI/OpenAPI-Specification/main/versions/3.1.0.md` |
| F15 | Protocol Buffers are a "language-neutral, platform-neutral, extensible mechanism for serializing structured data". | VERIFIED | `https://raw.githubusercontent.com/protocolbuffers/protobuf/main/README.md` |
| F16 | AsyncAPI describes message-driven APIs in a machine-readable, protocol-agnostic format. | VERIFIED | `https://raw.githubusercontent.com/asyncapi/spec/master/spec/asyncapi.md` |
| F17 | GraphQL "consists of a type system, query language and execution semantics"; a service's capabilities are described by its schema. | VERIFIED | `https://raw.githubusercontent.com/graphql/graphql-spec/main/README.md` |
| F18 | "Contract graph" is this course's name for a graph built from declared interfaces (API descriptions, schemas, event definitions) and the declared consumers of each. It is not a standard term or format. How consumers get linked (generated clients, typed queries, declared dependencies) differs per organization. | GENERIC-PATTERN | n/a |
| F19 | Backstage's software catalog models software as entities (Component, API, Resource, System, Domain, plus User and Group) with typed, directional relations, including `ownedBy`, `providesApi`, `consumesApi`, `dependsOn`. The source of truth for catalog entries is metadata YAML files kept in source control. | VERIFIED | `https://raw.githubusercontent.com/backstage/backstage/master/docs/features/software-catalog/system-model.md`, `.../well-known-relations.md`, `.../index.md` |
| F19a | "Backstage says the catalog is better treated as a cache." | DROPPED in those words (not found in the pages fetched). The course says the verified half: the files in source control are the source of truth. | n/a |
| F20 | SPDX is an open standard for representing software components as a Software Bill of Materials (SBOM). CycloneDX is a Bill of Materials standard published as ECMA-424. Both describe **which components and dependencies** a system contains, not who calls what. | VERIFIED (first two sentences); the last clause is our summary of their scope | `https://raw.githubusercontent.com/spdx/spdx-spec/develop/README.md`, `https://raw.githubusercontent.com/CycloneDX/specification/master/README.md` |

### 2.3 The serving layer (MCP)

The MCP specification changes between revisions. This course cites revision
**2025-06-18**. The authorization section's scope and requirements paragraphs read the
same in revision 2025-11-25 (also fetched); revision 2025-06-18 itself changed
authorization compared with 2025-03-26 (servers classified as OAuth resource servers,
RFC 8707 resource indicators required of clients). The lesson says "the specification
is revised from time to time; check the revision you use" and prints no revision-specific
detail beyond the rows below.

| # | Claim | Label | Source fetched |
|---|---|---|---|
| F21 | MCP follows a client-host-server architecture built on JSON-RPC. A host (the AI application) creates clients; each client has a 1:1 relationship with one server. Servers expose resources, tools and prompts, and "can be local processes or remote services". | VERIFIED | `https://raw.githubusercontent.com/modelcontextprotocol/modelcontextprotocol/main/docs/specification/2025-06-18/architecture/index.mdx` |
| F22 | Tools are identified by a name and described by a schema; the model can discover and invoke them. | VERIFIED | `.../2025-06-18/server/tools.mdx` |
| F23 | Two standard transports: stdio, where "the client launches the MCP server as a subprocess", and Streamable HTTP, where "the server operates as an independent process that can handle multiple client connections". | VERIFIED | `.../2025-06-18/basic/transports.mdx` |
| F24 | Authorization is optional in MCP. The specification "defines the authorization flow for HTTP-based transports", based on OAuth 2.1; stdio implementations should not follow it and instead take credentials from the environment. | VERIFIED | `.../2025-06-18/basic/authorization.mdx` (and `.../2025-11-25/...`), `.../2025-06-18/changelog.mdx` |
| F25 | MCP standardizes **how** an agent discovers and calls tools. It does not define what a code graph contains, how it is stored, or which repos a given caller may read: those are decided by whoever builds the server. | VERIFIED for the positive half (F21 to F24). The negative half is our reading of the specification's scope; the lesson words it as "the specification does not cover". | as above |

### 2.4 Patterns and arithmetic

| # | Claim | Label |
|---|---|---|
| P1 | The publish pipeline: repo → index step in CI on merge → snapshot stamped with its commit → registry → server → agent. | GENERIC-PATTERN. Supported in spirit by F8 (index without a local copy) and F10 (index once, centrally), but no standard defines the pipeline or the word "registry". |
| P2 | Four topologies: per-developer local, one central, hybrid, sharded/regional, and their trade-offs. | GENERIC-PATTERN. F21 and F23 verify only that local and remote servers both exist in MCP. |
| P3 | Snapshots should inherit the permissions of their repo; the check can live at the registry, the server, or both. | GENERIC-PATTERN. |
| P4 | Fall back to live search when the snapshot may be behind and the source is at hand; otherwise state the snapshot's commit with the answer. | GENERIC-PATTERN. |
| P5 | Ownership by pillar: repo owners own the index step's inputs, a platform team owns the pipeline, registry and servers, security/access owns the policy, developers consume. | GENERIC-PATTERN ("one common split"). |
| P6 | All scale numbers (`repos × developers`, builds per day, commits behind). | Arithmetic on the learner's parameters and on assumptions printed next to the result (§4.5, §4.7). Not a measurement. |
| P7 | "A coding agent can only use what is in its context, and a large codebase does not fit." | Taught without a number. General statement; no source needed beyond the definition of a context window, and no size is quoted. |

### 2.5 Dropped claims from the source material

| Claim | Why dropped |
|---|---|
| Any token count, any "N times fewer tokens", "1 tool call instead of many" as a general fact. | One run of one experiment. The course shows computed counts on the toy codebase instead. |
| "Fewer incidents." | Not verifiable. The course teaches blast radius as a question the graph can answer, with no outcome claim. |
| "A compiler index is precise across repos" without qualification. | Replaced by F4: possible, when package metadata is published. |
| "A syntax graph works even when code does not build." | Kept, but sourced to F1 (parsing tolerates syntax errors) and worded as "a parser does not need the build". |
| Which topology any company uses. | Unknown, and out of scope. Only F10 (Google, 2020, in its own words) is cited, as an example of the central choice. |

---

## 3. Course structure

### 3.1 The arc

| # | File | `id` (stable, stored in progress) | Hebrew title | English title | Explorer kinds |
|---|---|---|---|---|---|
| 1 | `01-agent-sees-what-it-opens.yaml` | `agent-sees-what-it-opens` | הסוכן רואה רק את מה שהוא פותח | The agent only sees what it opens | `searchCost` |
| 2 | `02-what-is-a-code-graph.yaml` | `what-is-a-code-graph` | מהו גרף קוד | What a code graph is | `graphView` |
| 3 | `03-three-graphs-three-questions.yaml` | `three-graphs-three-questions` | שלושה גרפים, שלוש שאלות | Three graphs, three questions | `askGraphs` |
| 4 | `04-is-there-a-standard.yaml` | `is-there-a-standard` | יש לזה תקן? | Is there a standard? | `landscape` |
| 5 | `05-build-once-read-many.yaml` | `build-once-read-many` | בונים פעם אחת, קוראים הרבה | Build once, read many times | `scale`, `staleness` |
| 6 | `06-the-topology.yaml` | `the-topology` | הטופולוגיה: מי מדבר עם מי | The topology: who talks to whom | `topology` |
| 7 | `07-scaling-to-an-organization.yaml` | `scaling-to-an-organization` | להגדיל את זה לארגון שלם | Scaling it to an organization | `cadence`, `access` |

File names carry the `NN-` prefix; the `id` field does not, as in Math (`02-riemann-sums.yaml`
has `id: riemann-sums`).

Why this order. Lessons 1 to 3 give the vocabulary on a codebase small enough to hold in
your head. Lesson 4 answers "is this a standard thing?" as soon as the learner knows
what the pieces are, and before the course starts proposing designs, so the designs in 5
to 7 are read as patterns. Lessons 5 to 7 are the main part: the arithmetic of scale,
the topology, then freshness, access and ownership at scale.

One-line promise and "aha" per lesson:

| # | Promise | The aha |
|---|---|---|
| 1 | See why searching is not the same as knowing. | Six hits, one answer, and a repo you do not have returns nothing at all. |
| 2 | Learn the three words: node, edge, snapshot. | Two functions with one name are two different nodes, and "what breaks?" is a walk along edges. |
| 3 | Pick the right graph for the question. | Each graph is blind exactly where another one sees. |
| 4 | Find out what is standard and what is not. | There is no one standard; there are layers, and a standard for calling tools is not a standard for the graph. |
| 5 | See why the index is built once per repo, and what that costs. | 500 builds instead of 10,000,000, paid for with a photo that ages. |
| 6 | See every box and every arrow, in four arrangements. | The same boxes, rearranged, trade freshness against reach against what fails together. |
| 7 | Stretch it to a whole organization. | Cadence decides how old the answer is; where the permission check lives decides who can see what. |

### 3.2 Authoring rules for the YAML below

- Markup is the existing `Rich` set: `**bold**`, `_italic_`, `{{code}}` (LTR monospace
  island), `[[number]]` (LTR number island).
- **Every identifier, file name, path and Latin acronym that contains `_` or sits inside
  Hebrew goes in `{{ }}`.** `Rich` treats `_x_` as italic, so a bare `format_price` next
  to another underscore would break. §6 has a test for this.
- `Quiz.tsx` must render `prompt`, every choice and `explanation` through `renderInline`.
  Check the copied component; if any of the three is plain text, route it through
  `renderInline`.
- Numbers in prose that the toy data or the pure functions produce are listed in §4 with
  the function that yields them. A content test (§6, T-4) recomputes each.
- Paste the blocks as they are. Do not "improve" the Hebrew by machine.

### 3.3 Lesson 1: `01-agent-sees-what-it-opens.yaml`

```yaml
id: agent-sees-what-it-opens
topic: code-graphs
order: 1

title:
  en: "The agent only sees what it opens"
  he: "הסוכן רואה רק את מה שהוא פותח"

subtitle:
  en: "Chapter 1 · the problem"
  he: "פרק 1 · הבעיה"

intro:
  - en: >-
      A **coding agent** is a program that reads code, runs searches and edits files for
      you. It has one hard limit: it knows only what it has opened in the current
      session. Any file it has not read does not exist for it yet.
    he: >-
      **סוכן קוד** הוא תוכנה שקוראת קוד, מריצה חיפושים ועורכת קבצים בשבילכם. יש לו מגבלה
      אחת קשיחה: הוא יודע רק את מה שפתח בשיחה הנוכחית. קובץ שלא קרא פשוט לא קיים מבחינתו,
      עד שיקרא אותו.
  - en: >-
      So how does it find anything? Mostly the way you would: a text search. Type a name,
      get the lines that contain it, open the files, read. Below is a toy shop: [[4]]
      files in [[2]] repos. The question is simple: who calls {{format_price}}, the one
      in {{money.py}}?
    he: >-
      אז איך הוא מוצא משהו? בעיקר כמו שאתם הייתם מוצאים: חיפוש טקסט. מקלידים שם, מקבלים את
      השורות שמכילות אותו, פותחים את הקבצים וקוראים. למטה יש חנות צעצוע: [[4]] קבצים
      ב-[[2]] מאגרי קוד. השאלה פשוטה: מי קורא ל-{{format_price}}, זו שנמצאת ב-{{money.py}}?
  - en: >-
      Drag the slider; each step is one action of the agent. The search comes back with
      [[6]] lines in [[4]] files: two definitions with the same name, an import, a call
      to the **other** function, a comment, and one line that is the answer. The search
      cannot tell them apart. To find out, the agent opens every file and reads [[28]]
      lines.
    he: >-
      גררו את המחוון. כל צעד הוא פעולה אחת של הסוכן. החיפוש חוזר עם [[6]] שורות ב-[[4]]
      קבצים: שתי הגדרות עם אותו שם, שורת ייבוא, קריאה לפונקציה **האחרת**, הערה, ושורה אחת
      שהיא התשובה. החיפוש לא יודע להבדיל ביניהן. כדי לדעת, הסוכן פותח את כל הקבצים וקורא
      [[28]] שורות.
  - en: >-
      Now switch off the second repo, as if it were not on your machine. Its hits vanish,
      and nothing tells the agent that something is missing. A search cannot find what is
      not there. In a real organization most of the code is not on your machine.
    he: >-
      עכשיו כבו את המאגר השני, כאילו הוא לא נמצא אצלכם על המחשב. התוצאות ממנו נעלמות, ושום
      דבר לא מספר לסוכן שמשהו חסר. חיפוש לא יכול למצוא את מה שאין. בארגון אמיתי, רוב הקוד
      לא נמצא אצלכם על המחשב.
  - en: >-
      The idea this course is about: work out the relations **ahead of time**. Who calls
      whom, who reads which field. Then the agent asks one question and gets one answer,
      instead of searching, opening and guessing. That map, computed in advance, is
      called a **code graph**.
    he: >-
      הרעיון שהקורס הזה עוסק בו: לחשב את הקשרים **מראש**. מי קורא למי, מי קורא איזה שדה.
      אז הסוכן שואל שאלה אחת ומקבל תשובה אחת, במקום לחפש, לפתוח ולנחש. למפה הזאת, שמחושבת
      מראש, קוראים **גרף קוד**.

explorers:
  - kind: searchCost
    term: format_price
    bothRepos: true
    caption:
      en: "Step through what the agent has to do to answer one question"
      he: "עברו צעד אחר צעד על מה שהסוכן צריך לעשות כדי לענות על שאלה אחת"

keyPoints:
  - en: A coding agent knows only the code it has opened in this session.
    he: סוכן קוד יודע רק את הקוד שפתח בשיחה הנוכחית.
  - en: A text search matches letters, not meaning. A definition, a comment and a call to a different function with the same name all look alike.
    he: חיפוש טקסט מתאים אותיות ולא משמעות. הגדרה, הערה וקריאה לפונקציה אחרת עם אותו שם נראות לו אותו דבר.
  - en: A search cannot find code that is not on the machine, and it does not say that anything is missing.
    he: חיפוש לא מוצא קוד שלא נמצא על המחשב, והוא גם לא אומר שמשהו חסר.

quiz:
  - type: numeric
    id: q1-hit-count
    prompt:
      en: "With both repos on the machine, how many lines does a search for {{format_price}} return in the toy shop?"
      he: "כששני המאגרים נמצאים על המחשב, כמה שורות מחזיר חיפוש של {{format_price}} בחנות הצעצוע?"
    correctValue: 6
    tolerance: 0
    explanation:
      en: "Six: two definitions, one import, two calls (one to each function) and one comment. Only one of the six answers the question."
      he: "שש: שתי הגדרות, שורת ייבוא אחת, שתי קריאות (אחת לכל פונקציה) והערה אחת. רק אחת מהשש עונה על השאלה."
  - type: mcq
    id: q2-hit-is-not-answer
    prompt:
      en: "Why is a search hit not yet an answer?"
      he: "למה תוצאת חיפוש היא עדיין לא תשובה?"
    choices:
      - en: Because searches are slow
        he: כי חיפוש הוא איטי
      - en: Because the search matches text, so it cannot tell a call from a definition, a comment, or a call to another function with the same name
        he: כי החיפוש מתאים טקסט, ולכן לא מבדיל בין קריאה לבין הגדרה, הערה או קריאה לפונקציה אחרת עם אותו שם
      - en: Because the agent forgets the results
        he: כי הסוכן שוכח את התוצאות
    correctIndex: 1
    explanation:
      en: Every hit has to be opened and read before you know what it is. That reading is the real cost.
      he: כל תוצאה צריך לפתוח ולקרוא לפני שיודעים מה היא. הקריאה הזאת היא המחיר האמיתי.
  - type: mcq
    id: q3-missing-repo
    prompt:
      en: "The {{web-shop}} repo is not on the machine. What does a search for {{total_price}} tell the agent about the code in it?"
      he: "המאגר {{web-shop}} לא נמצא על המחשב. מה חיפוש של {{total_price}} מספר לסוכן על הקוד שבו?"
    choices:
      - en: It lists the lines but marks them as remote
        he: הוא מציג את השורות ומסמן שהן מרוחקות
      - en: It warns that a repo is missing
        he: הוא מזהיר שחסר מאגר
      - en: Nothing, and it gives no sign that anything is missing
        he: כלום, והוא גם לא נותן שום סימן שמשהו חסר
    correctIndex: 2
    explanation:
      en: The search covers the files that are there. One hit comes back, from the service that writes the field, and the reader in the other repo stays invisible.
      he: החיפוש עובר על הקבצים שיש. חוזרת תוצאה אחת, מהשירות שכותב את השדה, ומי שקורא אותו במאגר האחר נשאר בלתי נראה.
```

### 3.4 Lesson 2: `02-what-is-a-code-graph.yaml`

```yaml
id: what-is-a-code-graph
topic: code-graphs
order: 2

title:
  en: "What a code graph is"
  he: "מהו גרף קוד"

subtitle:
  en: "Chapter 2 · nodes, edges, snapshot"
  he: "פרק 2 · צמתים, קשתות, תמונת מצב"

intro:
  - en: >-
      A graph is dots joined by lines. In a code graph each dot, a **node**, is a thing
      in the code: a function, an API endpoint, a field in a response. Each line, an
      **edge**, is a relation between two of them: "calls", "requests", "handled by",
      "reads", "part of".
    he: >-
      גרף הוא נקודות שמחוברות בקווים. בגרף קוד כל נקודה, **צומת**, היא דבר שקיים בקוד:
      פונקציה, נקודת קצה של {{API}}, שדה בתשובה. כל קו, **קשת**, הוא קשר בין שניים מהם:
      "קורא ל", "פונה אל", "מטופל על ידי", "קורא את", "חלק מ".
  - en: >-
      The toy shop from the last lesson has [[11]] nodes and [[10]] edges. Tap a node to
      see its edges. Look for {{format_price}}: it appears twice, because there are two
      different functions with that name. In text they are the same word. In a graph they
      are two separate nodes.
    he: >-
      בחנות הצעצוע מהשיעור הקודם יש [[11]] צמתים ו-[[10]] קשתות. הקישו על צומת כדי לראות
      את הקשתות שלו. חפשו את {{format_price}}: הוא מופיע פעמיים, כי יש שתי פונקציות שונות
      עם השם הזה. בטקסט זו אותה מילה. בגרף אלה שני צמתים נפרדים.
  - en: >-
      Now drag the handle. Start at {{format_price}} in {{money.py}} and ask: who depends
      on it? One step away: {{get_order}}. Two steps: the endpoint that {{get_order}}
      serves. Three steps: the endpoint's two fields and {{fetchOrder}}, in the other
      repo. Four: {{renderOrderCard}}. The count grows [[1]], [[2]], [[5]], [[6]]. This
      is the **blast radius**: what may be affected if you change one thing.
    he: >-
      עכשיו גררו את הידית. התחילו מ-{{format_price}} שב-{{money.py}} ושאלו: מי תלוי בה?
      במרחק צעד אחד: {{get_order}}. שני צעדים: נקודת הקצה ש-{{get_order}} משרתת. שלושה
      צעדים: שני השדות של נקודת הקצה ו-{{fetchOrder}}, שנמצאת במאגר האחר. ארבעה:
      {{renderOrderCard}}. המספר גדל [[1]], [[2]], [[5]], [[6]]. זה **רדיוס הפגיעה**: מה
      עלול להיות מושפע אם משנים דבר אחד.
  - en: >-
      One more word: **snapshot**. A graph is computed from the code as it was at one
      specific commit. It is a photograph, not a live broadcast. A graph should always
      say which commit it was taken at. Lesson 5 comes back to what happens when the code
      moves on and the photograph does not.
    he: >-
      ועוד מילה אחת: **תמונת מצב** ({{snapshot}}). גרף מחושב מהקוד כפי שהיה ב-{{commit}}
      מסוים אחד. זה תצלום, לא שידור חי. גרף תמיד צריך לומר מאיזה {{commit}} הוא צולם.
      בשיעור 5 נחזור למה שקורה כשהקוד ממשיך להשתנות והתצלום לא.
  - en: >-
      A graph does not replace reading code. It tells the agent **where** to read.
    he: >-
      גרף לא מחליף קריאה של קוד. הוא אומר לסוכן **איפה** לקרוא.

explorers:
  - kind: graphView
    start: money.format_price
    hops: 1
    caption:
      en: "Tap a node, then drag the handle to widen the blast radius"
      he: "הקישו על צומת, ואז גררו את הידית כדי להרחיב את רדיוס הפגיעה"

keyPoints:
  - en: A node is a thing in the code. An edge is a relation between two things.
    he: צומת הוא דבר שקיים בקוד. קשת היא קשר בין שני דברים.
  - en: Two functions with the same name are two different nodes.
    he: שתי פונקציות עם אותו שם הן שני צמתים שונים.
  - en: Blast radius is everything you reach by following "depends on" edges backwards from the thing you change.
    he: רדיוס הפגיעה הוא כל מה שמגיעים אליו כשהולכים אחורה על קשתות "תלוי ב" מהדבר שמשנים.
  - en: A graph is a snapshot of one commit, and should say which.
    he: גרף הוא תמונת מצב של commit אחד, והוא צריך לומר איזה.

quiz:
  - type: mcq
    id: q1-node-or-edge
    prompt:
      en: "\"{{get_order}} calls {{load_order}}\". In the graph, what is this sentence?"
      he: "\"{{get_order}} קוראת ל-{{load_order}}\". מה המשפט הזה בגרף?"
    choices:
      - en: A node
        he: צומת
      - en: An edge between two nodes
        he: קשת בין שני צמתים
      - en: A snapshot
        he: תמונת מצב
    correctIndex: 1
    explanation:
      en: The two functions are nodes. "Calls" is the edge that joins them.
      he: שתי הפונקציות הן צמתים. "קוראת ל" היא הקשת שמחברת ביניהן.
  - type: numeric
    id: q2-two-hops
    prompt:
      en: "Starting from {{format_price}} in {{money.py}}, how many nodes depend on it within two steps?"
      he: "כשמתחילים מ-{{format_price}} שב-{{money.py}}, כמה צמתים תלויים בה בטווח של שני צעדים?"
    correctValue: 2
    tolerance: 0
    explanation:
      en: "Two: {{get_order}} calls it (one step), and the endpoint is handled by {{get_order}} (two steps)."
      he: "שניים: {{get_order}} קוראת לה (צעד אחד), ונקודת הקצה מטופלת על ידי {{get_order}} (שני צעדים)."
  - type: mcq
    id: q3-snapshot
    prompt:
      en: "What does it mean that a graph is a snapshot?"
      he: "מה המשמעות של זה שגרף הוא תמונת מצב?"
    choices:
      - en: It updates by itself every time someone types
        he: הוא מתעדכן מעצמו בכל פעם שמישהו מקליד
      - en: It was computed from the code at one commit, and it is true for that commit
        he: הוא חושב מהקוד ב-commit אחד, והוא נכון ל-commit הזה
      - en: It contains only part of the files
        he: הוא מכיל רק חלק מהקבצים
    correctIndex: 1
    explanation:
      en: After that commit the code can change, and the graph will not know until it is computed again.
      he: אחרי ה-commit הזה הקוד יכול להשתנות, והגרף לא יֵדע על כך עד שיחשבו אותו מחדש.
  - type: mcq
    id: q4-same-name
    prompt:
      en: "The shop has two functions named {{format_price}}. How does the graph show them?"
      he: "בחנות יש שתי פונקציות בשם {{format_price}}. איך הגרף מציג אותן?"
    choices:
      - en: As one node with two files
        he: כצומת אחד עם שני קבצים
      - en: As two separate nodes, each with its own edges
        he: כשני צמתים נפרדים, לכל אחד הקשתות שלו
      - en: It shows only the newer one
        he: הוא מציג רק את החדשה יותר
    correctIndex: 1
    explanation:
      en: They are different functions with different callers. Keeping them apart is the point.
      he: אלה פונקציות שונות עם קוראים שונים. כל העניין הוא לא לערבב ביניהן.
```

### 3.5 Lesson 3: `03-three-graphs-three-questions.yaml`

```yaml
id: three-graphs-three-questions
topic: code-graphs
order: 3

title:
  en: "Three graphs, three questions"
  he: "שלושה גרפים, שלוש שאלות"

subtitle:
  en: "Chapter 3 · and each one's blind spot"
  he: "פרק 3 · והנקודה העיוורת של כל אחד"

intro:
  - en: >-
      There is no single "code graph". There are at least three kinds. They differ in
      **who builds them**, and that decides what each one knows. You choose by the
      question you are asking.
    he: >-
      אין "גרף קוד" אחד. יש לפחות שלושה סוגים. הם נבדלים בשאלה **מי בונה אותם**, וזה קובע
      מה כל אחד מהם יודע. בוחרים לפי השאלה ששואלים.
  - en: >-
      **Structure: "what does this code call?"** A **syntax graph** is built by a parser.
      A parser reads the text of one file and recognizes its shape: here a function
      starts, here is a call. It does not need the project to build, and a parser such as
      {{tree-sitter}} gives useful results even when the file has syntax errors. Its weak
      spot: it knows **names**, not identities. Given two functions called
      {{format_price}}, it cannot say which one a call means.
    he: >-
      **מבנה: "למה הקוד הזה קורא?"** **גרף תחבירי** נבנה על ידי {{parser}}, מנתח תחביר.
      הוא קורא את הטקסט של קובץ אחד ומזהה את הצורה שלו: כאן מתחילה פונקציה, כאן יש קריאה.
      הוא לא צריך שהפרויקט ייבנה, ומנתח כמו {{tree-sitter}} נותן תוצאות שימושיות גם כשיש
      בקובץ שגיאות תחביר. נקודת התורפה שלו: הוא מכיר **שמות**, לא זהויות. כשיש שתי
      פונקציות בשם {{format_price}}, הוא לא יודע לומר לאיזו מהן הקריאה מתכוונת.
  - en: >-
      **Identity: "which function is it, exactly?"** A **compiler index** is built by an
      indexer that uses the compiler, which has already resolved every name to one
      definition. {{SCIP}} is one open format for such an index: for each place in the
      code it records which symbol is there and whether it is a definition or a
      reference. Its weak spot: it needs a project the compiler can process, with its
      dependencies and build settings. If the build is broken, there is usually no index
      for that commit. And there is one indexer per language; not every language has one.
    he: >-
      **זהות: "איזו פונקציה זו בדיוק?"** **אינדקס מהדר** נבנה על ידי כלי שנעזר במהדר
      ({{compiler}}), שכבר פענח כל שם להגדרה אחת. {{SCIP}} הוא פורמט פתוח אחד לאינדקס
      כזה: לכל מקום בקוד הוא רושם איזה סמל נמצא שם, והאם זו הגדרה או הפניה. נקודת התורפה
      שלו: הוא צריך פרויקט שהמהדר מסוגל לעבד, עם התלויות והגדרות הבנייה שלו. אם הבנייה
      שבורה, בדרך כלל אין אינדקס ל-{{commit}} הזה. ויש כלי אינדוקס נפרד לכל שפה, ולא לכל
      שפה יש כזה.
  - en: >-
      **Interface: "who depends on this API or this event?"** A **contract graph** is
      built from declared interfaces: an {{OpenAPI}} document for an {{HTTP API}}, a
      {{protobuf}} or {{GraphQL}} schema, an event definition, and the list of who
      declared that they use each one. It crosses languages and repos, because a contract
      is not written in either side's language. Its weak spot: it knows nothing about
      what happens inside a service. ("Contract graph" is this course's name for the
      idea, not a standard term.)
    he: >-
      **ממשק: "מי תלוי ב-{{API}} הזה או באירוע הזה?"** **גרף חוזים** נבנה מממשקים מוצהרים:
      מסמך {{OpenAPI}} של {{HTTP API}}, סכמה של {{protobuf}} או {{GraphQL}}, הגדרה של
      אירוע, ורשימה של מי שהצהיר שהוא משתמש בכל אחד מהם. הוא חוצה שפות ומאגרים, כי חוזה
      לא כתוב בשפה של אף אחד מהצדדים. נקודת התורפה שלו: הוא לא יודע שום דבר על מה שקורה
      בתוך השירות. ("גרף חוזים" הוא השם שהקורס הזה נותן לרעיון, לא מונח תקני.)
  - en: >-
      Ask the three questions below and watch four columns answer: plain search and the
      three graphs. Then break the build and see who is still standing. Each graph is
      blind exactly where another one sees. You do not want "the code graph". You want
      the right one for the question.
    he: >-
      שאלו את שלוש השאלות למטה וראו ארבע עמודות עונות: חיפוש רגיל ושלושת הגרפים. אחר כך
      שברו את הבנייה וראו מי נשאר עומד. כל גרף עיוור בדיוק במקום שבו גרף אחר רואה. לא
      מחפשים את "גרף הקוד". מחפשים את הגרף הנכון לשאלה.

explorers:
  - kind: askGraphs
    question: callers
    caption:
      en: "Choose a question and compare four ways to answer it"
      he: "בחרו שאלה והשוו בין ארבע דרכים לענות עליה"

keyPoints:
  - en: "Structure: a syntax graph, built by a parser. It works without a build and knows names, not identities."
    he: "מבנה: גרף תחבירי, שנבנה על ידי מנתח תחביר. הוא עובד בלי בנייה ומכיר שמות, לא זהויות."
  - en: "Identity: a compiler index. It is exact, and it needs a project the compiler can process."
    he: "זהות: אינדקס מהדר. הוא מדויק, והוא צריך פרויקט שהמהדר מסוגל לעבד."
  - en: "Interface: a contract graph. It crosses languages and repos and sees only declared interfaces."
    he: "ממשק: גרף חוזים. הוא חוצה שפות ומאגרים ורואה רק ממשקים מוצהרים."
  - en: Each graph's blind spot is another graph's strength.
    he: הנקודה העיוורת של כל גרף היא החוזק של גרף אחר.

quiz:
  - type: mcq
    id: q1-identity
    prompt:
      en: "You need the callers of exactly the {{format_price}} in {{money.py}}, not the other one. Which graph?"
      he: "אתם צריכים את מי שקורא בדיוק ל-{{format_price}} שב-{{money.py}}, ולא לאחרת. איזה גרף?"
    choices:
      - en: The syntax graph
        he: הגרף התחבירי
      - en: The compiler index
        he: אינדקס המהדר
      - en: The contract graph
        he: גרף החוזים
    correctIndex: 1
    explanation:
      en: Only the compiler has resolved each call to one definition. The syntax graph returns both callers by name and cannot choose.
      he: רק המהדר פענח כל קריאה להגדרה אחת. הגרף התחבירי מחזיר את שני הקוראים לפי השם ולא יודע לבחור.
  - type: mcq
    id: q2-broken-build
    prompt:
      en: "The build is broken and you want a quick picture of what {{get_order}} calls. Which graph can still answer?"
      he: "הבנייה שבורה ואתם רוצים תמונה מהירה של מה ש-{{get_order}} קוראת לו. איזה גרף עדיין יכול לענות?"
    choices:
      - en: The syntax graph
        he: הגרף התחבירי
      - en: The compiler index
        he: אינדקס המהדר
      - en: Neither
        he: אף אחד מהם
    correctIndex: 0
    explanation:
      en: A parser reads the file's text and does not need the build. The compiler index usually has nothing for a commit that does not build.
      he: מנתח תחביר קורא את הטקסט של הקובץ ולא צריך את הבנייה. לאינדקס המהדר בדרך כלל אין מה להציע ל-commit שלא נבנה.
  - type: mcq
    id: q3-interface
    prompt:
      en: "You plan to rename the field {{total_price}} in the API response. Which graph tells you who will break in another repo, written in another language?"
      he: "אתם מתכננים לשנות את שם השדה {{total_price}} בתשובה של ה-API. איזה גרף אומר לכם מי יישבר במאגר אחר, שכתוב בשפה אחרת?"
    choices:
      - en: The syntax graph
        he: הגרף התחבירי
      - en: The compiler index
        he: אינדקס המהדר
      - en: The contract graph
        he: גרף החוזים
    correctIndex: 2
    explanation:
      en: The field is part of a declared interface. The other two graphs see a string on one side and a property on the other, with nothing joining them.
      he: השדה הוא חלק מממשק מוצהר. שני הגרפים האחרים רואים מחרוזת בצד אחד ותכונה בצד השני, ושום דבר לא מחבר ביניהן.
  - type: mcq
    id: q4-why-two
    prompt:
      en: "Asked who calls {{format_price}}, the syntax graph returns two candidates. Why?"
      he: "כששואלים מי קורא ל-{{format_price}}, הגרף התחבירי מחזיר שני מועמדים. למה?"
    choices:
      - en: It has a bug
        he: יש בו באג
      - en: It matches calls to definitions by name, and two definitions share this name
        he: הוא מתאים קריאות להגדרות לפי שם, ולשתי הגדרות יש אותו שם
      - en: It only reads one file
        he: הוא קורא רק קובץ אחד
    correctIndex: 1
    explanation:
      en: That is its blind spot, not a defect. Knowing which definition a name means is the compiler's job.
      he: זו הנקודה העיוורת שלו, לא תקלה. לדעת לאיזו הגדרה שם מתכוון זו העבודה של המהדר.
```

### 3.6 Lesson 4: `04-is-there-a-standard.yaml`

Every sentence here maps to a row in §2 (F3, F6 to F12, F14 to F25). Company names appear
only with what that company published.

```yaml
id: is-there-a-standard
topic: code-graphs
order: 4

title:
  en: "Is there a standard?"
  he: "יש לזה תקן?"

subtitle:
  en: "Chapter 4 · a map of what exists"
  he: "פרק 4 · מפה של מה שקיים"

intro:
  - en: >-
      The short answer: **no single standard**. There are several public pieces, they sit
      in different layers, and every organization puts its own combination together. The
      map below has five layers. Tap each one.
    he: >-
      התשובה הקצרה: **אין תקן אחד**. יש כמה חלקים ציבוריים, הם יושבים בשכבות שונות, וכל
      ארגון מרכיב מהם שילוב משלו. במפה למטה יש חמש שכבות. הקישו על כל אחת.
  - en: >-
      **The data format**: how an index is written to a file. {{LSIF}} came out of the
      world of editors and the Language Server Protocol; its goal was code navigation
      without a local copy of the source. {{SCIP}} was designed by Sourcegraph, partly to
      fix pain points it had with {{LSIF}}; it is an open {{protobuf}} schema. {{Kythe}},
      an open-source project from Google, defines its own graph schema and aims to be a
      language-agnostic way for tools to exchange facts about code. Three open formats,
      and none of them is "the" standard.
    he: >-
      **פורמט הנתונים**: איך כותבים אינדקס לקובץ. {{LSIF}} צמח מעולם עורכי הקוד ומהפרוטוקול
      {{Language Server Protocol}}, ומטרתו הייתה ניווט בקוד בלי עותק מקומי של המקור.
      {{SCIP}} תוכנן על ידי {{Sourcegraph}}, בין השאר כדי לפתור קשיים שהיו לה עם {{LSIF}},
      והוא סכמת {{protobuf}} פתוחה. {{Kythe}}, פרויקט קוד פתוח של {{Google}}, מגדיר סכמת
      גרף משלו, ומטרתו להיות דרך שאינה תלויה בשפה שבה כלים מחליפים ביניהם עובדות על קוד.
      שלושה פורמטים פתוחים, ואף אחד מהם אינו "התקן".
  - en: >-
      **The indexers**: the programs that produce the data, one per language. Parsers
      such as {{tree-sitter}}, compiler-based indexers, and tools such as {{CodeQL}},
      which builds its own database of a codebase for analysis. These are open-source
      projects, and how well a language is covered differs from one to the next.
    he: >-
      **כלי האינדוקס**: התוכנות שמייצרות את הנתונים, אחת לכל שפה. מנתחי תחביר כמו
      {{tree-sitter}}, כלי אינדוקס שנשענים על המהדר, וכלים כמו {{CodeQL}}, שבונה מסד
      נתונים משלו על בסיס הקוד לצורכי ניתוח. אלה פרויקטים של קוד פתוח, ורמת הכיסוי משתנה
      משפה לשפה.
  - en: >-
      **Storage, query and the registry**: where the facts are kept and how you ask.
      {{Glean}}, an open-source system from Meta, stores facts about code and has its own
      query language; it can also take in {{SCIP}} or {{LSIF}}. Google described in 2020
      one central index behind its Code Search, with the reasoning that a central index
      means doing the work once. What has no standard at all is the **registry**: the
      list that says which snapshot belongs to which repo and which commit. Each
      organization builds that part itself.
    he: >-
      **אחסון, שאילתות והמרשם**: איפה העובדות נשמרות ואיך שואלים. {{Glean}}, מערכת קוד
      פתוח של {{Meta}}, שומרת עובדות על קוד ויש לה שפת שאילתות משלה. היא יודעת לקלוט גם
      {{SCIP}} או {{LSIF}}. {{Google}} תיארה ב-[[2020]] אינדקס מרכזי אחד מאחורי
      {{Code Search}} שלה, עם הנימוק שאינדקס מרכזי פירושו לעשות את העבודה פעם אחת. מה
      שאין לו תקן בכלל הוא **המרשם** ({{registry}}): הרשימה שאומרת איזו תמונת מצב שייכת
      לאיזה מאגר ולאיזה {{commit}}. את החלק הזה כל ארגון בונה בעצמו.
  - en: >-
      **Serving**: how the agent asks. {{MCP}}, the Model Context Protocol, is an open
      specification for how an agent discovers and calls tools on a server. It
      standardizes the **call**. The specification does not cover what a code graph
      contains or how it is stored. **Organization metadata**: who owns what. A software
      catalog such as {{Backstage}} models components, APIs and teams with relations like
      {{ownedBy}} and {{consumesApi}}. {{SBOM}} formats, {{SPDX}} and {{CycloneDX}}, list
      the components a system is made of. Contract formats, {{OpenAPI}}, {{AsyncAPI}},
      {{protobuf}} and {{GraphQL}}, describe the interfaces.
    he: >-
      **הגשה**: איך הסוכן שואל. {{MCP}}, {{Model Context Protocol}}, הוא מפרט פתוח שמגדיר
      איך סוכן מגלה כלים בשרת וקורא להם. הוא קובע תקן ל**קריאה**. המפרט לא עוסק בשאלה מה
      גרף קוד מכיל או איך שומרים אותו. **מידע ארגוני**: מי אחראי על מה. קטלוג תוכנה כמו
      {{Backstage}} ממדל רכיבים, ממשקים וצוותים עם קשרים כמו {{ownedBy}} ו-{{consumesApi}}.
      פורמטים של {{SBOM}}, כמו {{SPDX}} ו-{{CycloneDX}}, מפרטים מאילו רכיבים מערכת
      מורכבת. פורמטים של חוזים, {{OpenAPI}}, {{AsyncAPI}}, {{protobuf}} ו-{{GraphQL}},
      מתארים את הממשקים.
  - en: >-
      So when someone says "we have a knowledge graph of our code", ask which layer they
      mean: which format, which indexer, where it is stored, how it is served. And about
      any particular company you know only what that company has published. The rest is
      unknown, and this course leaves it unknown.
    he: >-
      אז כשמישהו אומר "יש לנו גרף ידע של הקוד", שאלו לאיזו שכבה הוא מתכוון: איזה פורמט,
      איזה כלי אינדוקס, איפה זה שמור ואיך זה מוגש. ועל חברה מסוימת יודעים רק את מה שהיא
      עצמה פרסמה. כל השאר לא ידוע, והקורס הזה משאיר אותו לא ידוע.

explorers:
  - kind: landscape
    layer: format
    caption:
      en: "Tap a layer to see what exists in it and what is not standardized"
      he: "הקישו על שכבה כדי לראות מה קיים בה ומה לא מוסדר בתקן"

keyPoints:
  - en: There is no single standard for a code graph. There are open formats, open-source projects and patterns, in five layers.
    he: אין תקן אחד לגרף קוד. יש פורמטים פתוחים, פרויקטים של קוד פתוח ודפוסים, בחמש שכבות.
  - en: MCP standardizes how an agent calls tools. It does not define the graph.
    he: MCP קובע תקן לאופן שבו סוכן קורא לכלים. הוא לא מגדיר את הגרף.
  - en: The registry of snapshots and the way the layers are joined are built by each organization.
    he: את מרשם תמונות המצב ואת אופן החיבור בין השכבות כל ארגון בונה בעצמו.
  - en: About a specific company, only what it has published is known.
    he: על חברה מסוימת ידוע רק מה שהיא עצמה פרסמה.

quiz:
  - type: mcq
    id: q1-one-standard
    prompt:
      en: "Is there one standard that defines a code graph for an organization?"
      he: "האם יש תקן אחד שמגדיר גרף קוד לארגון?"
    choices:
      - en: Yes, SCIP
        he: כן, SCIP
      - en: Yes, MCP
        he: כן, MCP
      - en: No. There are several open formats and projects in different layers, and each organization combines them
        he: לא. יש כמה פורמטים ופרויקטים פתוחים בשכבות שונות, וכל ארגון משלב ביניהם
    correctIndex: 2
    explanation:
      en: SCIP is one open index format among several, and MCP is about calling tools. Neither is a standard for the whole thing.
      he: SCIP הוא פורמט אינדקס פתוח אחד מתוך כמה, ו-MCP עוסק בקריאה לכלים. אף אחד מהם אינו תקן לכל העניין.
  - type: mcq
    id: q2-mcp-scope
    prompt:
      en: "What does MCP standardize?"
      he: "למה MCP קובע תקן?"
    choices:
      - en: What a code graph contains
        he: למה שגרף קוד מכיל
      - en: How an agent discovers and calls tools on a server
        he: לאופן שבו סוכן מגלה כלים בשרת וקורא להם
      - en: How an index is stored on disk
        he: לאופן שבו אינדקס נשמר בדיסק
    correctIndex: 1
    explanation:
      en: Two servers can both speak MCP and serve completely different graphs. The protocol is the phone line, not the conversation.
      he: שני שרתים יכולים לדבר MCP ולהגיש גרפים שונים לגמרי. הפרוטוקול הוא קו הטלפון, לא השיחה.
  - type: mcq
    id: q3-ownership
    prompt:
      en: "Which piece is meant to tell you which team owns a service?"
      he: "איזה חלק נועד לומר לכם איזה צוות אחראי על שירות?"
    choices:
      - en: A compiler index
        he: אינדקס מהדר
      - en: A software catalog, with a relation such as {{ownedBy}}
        he: קטלוג תוכנה, עם קשר כמו {{ownedBy}}
      - en: A parser
        he: מנתח תחביר
    correctIndex: 1
    explanation:
      en: An index knows symbols and references. Ownership lives in the organization-metadata layer.
      he: אינדקס מכיר סמלים והפניות. הבעלות נמצאת בשכבת המידע הארגוני.
  - type: mcq
    id: q4-sbom
    prompt:
      en: "What does an SBOM format such as SPDX or CycloneDX describe?"
      he: "מה מתאר פורמט SBOM כמו SPDX או CycloneDX?"
    choices:
      - en: Which function calls which function
        he: איזו פונקציה קוראת לאיזו פונקציה
      - en: Which components and dependencies a system is made of
        he: מאילו רכיבים ותלויות מערכת מורכבת
      - en: Who may read which repo
        he: מי רשאי לקרוא איזה מאגר
    correctIndex: 1
    explanation:
      en: It is a bill of materials, a list of parts. Useful next to a code graph, and not a replacement for one.
      he: זו רשימת חלקים. היא שימושית לצד גרף קוד, ולא באה במקומו.
```

### 3.7 Lesson 5: `05-build-once-read-many.yaml`

Numbers: `10,000,000`, `60,000`, `500`, `0.6` come from `scale.ts` at the defaults
(§4.5). `8`, `2`, `3` come from `diffGraphs(graphAt(0), graphAt(3))` (§4.6).

```yaml
id: build-once-read-many
topic: code-graphs
order: 5

title:
  en: "Build once, read many times"
  he: "בונים פעם אחת, קוראים הרבה"

subtitle:
  en: "Chapter 5 · the arithmetic of scale, and its price"
  he: "פרק 5 · החשבון של קנה המידה, והמחיר שלו"

intro:
  - en: >-
      Meet the example organization used from here on: [[500]] repos, [[20,000]]
      developers, a few dozen teams. These numbers are an example. They describe no real
      company, and the sliders let you change them. Every developer has an agent, and
      every agent sometimes needs a fact about code in a repo its developer does not
      have.
    he: >-
      הכירו את הארגון לדוגמה שילווה אותנו מכאן: [[500]] מאגרי קוד, [[20,000]] מפתחים,
      כמה עשרות צוותים. המספרים האלה הם דוגמה. הם לא מתארים שום חברה אמיתית, והמחוונים
      מאפשרים לשנות אותם. לכל מפתח יש סוכן, וכל סוכן צריך מדי פעם עובדה על קוד שנמצא
      במאגר שאין למפתח שלו.
  - en: >-
      **Option one: every machine indexes everything.** That is [[500]] × [[20,000]] =
      [[10,000,000]] index builds, repeated as the code changes, and every machine needs
      the source and the build setup of every repo. This is arithmetic on the numbers
      above, not a measurement. The shape is clear enough.
    he: >-
      **אפשרות ראשונה: כל מחשב מאנדקס הכול.** אלה [[500]] × [[20,000]] = [[10,000,000]]
      בניות של אינדקס, שחוזרות על עצמן כשהקוד משתנה, וכל מחשב צריך את קוד המקור ואת
      סביבת הבנייה של כל מאגר. זה חשבון על המספרים שלמעלה, לא מדידה. הצורה ברורה מספיק.
  - en: >-
      **Option two: every machine indexes only what its developer works on.** Say [[3]]
      repos each: [[60,000]] builds. Far cheaper, and the agent now sees [[3]] of [[500]]
      repos, which is [[0.6%]]. Almost everything is still dark.
    he: >-
      **אפשרות שנייה: כל מחשב מאנדקס רק את מה שהמפתח שלו עובד עליו.** נניח [[3]] מאגרים
      לכל אחד: [[60,000]] בניות. זול בהרבה, והסוכן רואה עכשיו [[3]] מתוך [[500]] מאגרים,
      כלומר [[0.6%]]. כמעט הכול נשאר חשוך.
  - en: >-
      **Option three: index each repo once, in one place, and let everyone read the
      result.** That is [[500]] builds. One common way to do it: a change is merged, a
      {{CI}} job runs the indexer, the result is saved as a snapshot stamped with its
      commit, a **registry** records which snapshot belongs to which repo, and a server
      hands answers to agents. This pipeline is a pattern, not a standard. Google gave
      the same reasoning for its code search in 2020: a central index means doing the
      work once.
    he: >-
      **אפשרות שלישית: מאנדקסים כל מאגר פעם אחת, במקום אחד, וכולם קוראים את התוצאה.**
      אלה [[500]] בניות. דרך נפוצה אחת לעשות זאת: שינוי ממוזג, משימת {{CI}} מריצה את כלי
      האינדוקס, התוצאה נשמרת כתמונת מצב שמוטבע בה ה-{{commit}} שלה, **מרשם** רושם איזו
      תמונת מצב שייכת לאיזה מאגר, ושרת מגיש תשובות לסוכנים. התהליך הזה הוא דפוס, לא תקן.
      {{Google}} נתנה את אותו נימוק למנוע חיפוש הקוד שלה ב-[[2020]]: אינדקס מרכזי פירושו
      לעשות את העבודה פעם אחת.
  - en: >-
      The price: **the photograph ages**. In the second explorer the snapshot was taken
      at one commit and the code keeps moving. Drag the head forward [[3]] commits. Of
      the snapshot's [[10]] edges, [[8]] are still true, [[2]] describe code that is
      gone, and [[3]] new edges are missing from it. The missing ones are the dangerous
      kind: there is a new reader of {{total_price}} and the graph does not know.
    he: >-
      המחיר: **התצלום מתיישן**. בסימולציה השנייה תמונת המצב צולמה ב-{{commit}} אחד והקוד
      ממשיך לזוז. גררו את ראש הענף [[3]] צעדים קדימה. מתוך [[10]] הקשתות של תמונת המצב,
      [[8]] עדיין נכונות, [[2]] מתארות קוד שכבר לא קיים, ו-[[3]] קשתות חדשות חסרות בה.
      החסרות הן הסוג המסוכן: יש קורא חדש של {{total_price}}, והגרף לא יודע עליו.
  - en: >-
      What to do about it. Publish again on every change, so the gap stays small. And
      when the snapshot may be behind: if the source is at hand, check it live; if it is
      not, give the answer together with the commit it is true for.
    he: >-
      מה עושים עם זה. מפרסמים מחדש בכל שינוי, כדי שהפער יישאר קטן. וכשתמונת המצב עלולה
      להיות מאחור: אם קוד המקור בהישג יד, בודקים אותו ישירות. אם לא, נותנים את התשובה
      יחד עם ה-{{commit}} שהיא נכונה לו.

explorers:
  - kind: scale
    repos: 500
    developers: 20000
    reposPerDeveloper: 3
    caption:
      en: "Change the size of the organization and compare three ways to index it"
      he: "שנו את גודל הארגון והשוו בין שלוש דרכים לאנדקס אותו"
  - kind: staleness
    publishedAt: 0
    head: 0
    caption:
      en: "Drag the head forward and see where the snapshot starts to lie"
      he: "גררו את ראש הענף קדימה וראו איפה תמונת המצב מתחילה לשקר"

keyPoints:
  - en: Indexing everything on every machine costs repos × developers builds. Publishing costs one build per repo.
    he: לאנדקס הכול בכל מחשב עולה מאגרים × מפתחים בניות. פרסום עולה בנייה אחת לכל מאגר.
  - en: "One common pipeline: merge, index in CI, snapshot stamped with its commit, registry, server."
    he: "תהליך נפוץ אחד: מיזוג, אינדוקס ב-CI, תמונת מצב שמוטבע בה ה-commit שלה, מרשם, שרת."
  - en: A snapshot ages. It can describe code that is gone, and it can miss code that is new.
    he: תמונת מצב מתיישנת. היא יכולה לתאר קוד שכבר לא קיים, והיא יכולה לפספס קוד חדש.
  - en: When the snapshot may be behind, check live if you can, and otherwise say which commit the answer is for.
    he: כשתמונת המצב עלולה להיות מאחור, בודקים ישירות אם אפשר, ואם לא, אומרים לאיזה commit התשובה נכונה.

quiz:
  - type: numeric
    id: q1-everything-everywhere
    prompt:
      en: "An organization has 200 repos and 1,000 developers. Every machine indexes every repo once. How many index builds is that?"
      he: "בארגון יש 200 מאגרים ו-1,000 מפתחים. כל מחשב מאנדקס כל מאגר פעם אחת. כמה בניות של אינדקס אלה?"
    correctValue: 200000
    tolerance: 0
    explanation:
      en: "200 × 1,000 = 200,000. Every repo is built again on every machine."
      he: "200 × 1,000 = 200,000. כל מאגר נבנה מחדש בכל מחשב."
  - type: numeric
    id: q2-publish-once
    prompt:
      en: "The same organization indexes each repo once, centrally, and publishes the result. How many index builds?"
      he: "אותו ארגון מאנדקס כל מאגר פעם אחת, במקום מרכזי, ומפרסם את התוצאה. כמה בניות של אינדקס?"
    correctValue: 200
    tolerance: 0
    explanation:
      en: "One per repo: 200. The number of developers no longer multiplies the work."
      he: "אחת לכל מאגר: 200. מספר המפתחים כבר לא מכפיל את העבודה."
  - type: mcq
    id: q3-missing-edge
    prompt:
      en: "The snapshot says one function reads {{total_price}}. The code today has two. What kind of error is this?"
      he: "תמונת המצב אומרת שפונקציה אחת קוראת את {{total_price}}. בקוד של היום יש שתיים. איזה סוג של טעות זה?"
    choices:
      - en: An edge that is still true
        he: קשת שעדיין נכונה
      - en: A phantom edge, describing code that is gone
        he: קשת רפאים, שמתארת קוד שכבר לא קיים
      - en: A missing edge, for code added after the snapshot
        he: קשת חסרה, של קוד שנוסף אחרי תמונת המצב
    correctIndex: 2
    explanation:
      en: The new reader was added after the snapshot was taken. Anyone who trusts the graph for "what breaks?" will miss it.
      he: הקורא החדש נוסף אחרי שתמונת המצב צולמה. מי שסומך על הגרף בשאלה "מה יישבר?" יפספס אותו.
  - type: mcq
    id: q4-no-source
    prompt:
      en: "The snapshot of another team's repo may be behind, and you do not have that repo's source. What is the honest answer?"
      he: "תמונת המצב של מאגר של צוות אחר עלולה להיות מאחור, ואין לכם את קוד המקור של המאגר הזה. מהי התשובה ההוגנת?"
    choices:
      - en: The graph's answer, stated as current
        he: התשובה של הגרף, כאילו היא עדכנית
      - en: The graph's answer, together with the commit it is true for
        he: התשובה של הגרף, יחד עם ה-commit שהיא נכונה לו
      - en: No answer at all
        he: שום תשובה
    correctIndex: 1
    explanation:
      en: An old answer with its date is useful. An old answer presented as current is how surprises happen.
      he: תשובה ישנה עם התאריך שלה היא שימושית. תשובה ישנה שמוצגת כעדכנית היא הדרך שבה נוצרות הפתעות.
```

### 3.8 Lesson 6: `06-the-topology.yaml`

Numbers: `3 of 500`, `20,000`, `4`, `5,000` come from `topologyMetrics` at the defaults
(§4.8).

```yaml
id: the-topology
topic: code-graphs
order: 6

title:
  en: "The topology: who talks to whom"
  he: "הטופולוגיה: מי מדבר עם מי"

subtitle:
  en: "Chapter 6 · the boxes, the arrows, four arrangements"
  he: "פרק 6 · התיבות, החצים, ארבעה סידורים"

intro:
  - en: >-
      The boxes first. A **developer machine** runs the agent, and inside the agent sits
      an {{MCP}} client. **Repos** are owned by teams. A **{{CI}}** job builds the index
      and publishes it. A **registry** lists the snapshots. An **{{MCP}} server** answers
      questions. Two facts from the {{MCP}} specification make everything below possible:
      a server can be a local process or a remote service, and there are two standard
      ways to connect. In one the client launches the server as a subprocess on the same
      machine. In the other the server is an independent process, reached over {{HTTP}},
      that serves many clients.
    he: >-
      קודם התיבות. **מחשב של מפתח** מריץ את הסוכן, ובתוך הסוכן יושב לקוח {{MCP}}.
      **מאגרי הקוד** שייכים לצוותים. משימת **{{CI}}** בונה את האינדקס ומפרסמת אותו.
      **מרשם** מפרט את תמונות המצב. **שרת {{MCP}}** עונה על שאלות. שתי עובדות מהמפרט של
      {{MCP}} מאפשרות את כל מה שיבוא: שרת יכול להיות תהליך מקומי או שירות מרוחק, ויש שתי
      דרכים תקניות להתחבר. באחת הלקוח מפעיל את השרת כתת-תהליך על אותו מחשב. בשנייה השרת
      הוא תהליך עצמאי, שפונים אליו ב-{{HTTP}}, והוא משרת לקוחות רבים.
  - en: >-
      **Local.** Every machine runs its own server over graphs it built from the repos it
      has. It is as fresh as it gets, down to changes you have not committed, and it
      needs no shared infrastructure. Its reach is what is checked out: [[3]] of [[500]]
      repos.
    he: >-
      **מקומי.** כל מחשב מריץ שרת משלו מעל גרפים שבנה מהמאגרים שיש עליו. אין טרי מזה,
      כולל שינויים שעוד לא נכנסו ל-{{commit}}, ולא צריך שום תשתית משותפת. הטווח שלו הוא
      מה שהורד למחשב: [[3]] מתוך [[500]] מאגרים.
  - en: >-
      **Central.** One server over the registry of published snapshots. Its reach is
      every repo, subject to permissions. It sees only what was published, never the
      change on your machine. And when it fails, all [[20,000]] developers lose it
      together.
    he: >-
      **מרכזי.** שרת אחד מעל המרשם של תמונות המצב שפורסמו. הטווח שלו הוא כל המאגרים,
      בכפוף להרשאות. הוא רואה רק מה שפורסם, ואף פעם לא את השינוי שעל המחשב שלכם. וכשהוא
      נופל, כל [[20,000]] המפתחים מאבדים אותו יחד.
  - en: >-
      **Hybrid.** Local for your own working copy, central for everyone else's code. It
      has the most reach and the freshest view of your own work. It also has the most
      parts to run, and the agent has to know which of the two to ask.
    he: >-
      **משולב.** מקומי בשביל עותק העבודה שלכם, מרכזי בשביל הקוד של כל השאר. יש לו הטווח
      הרחב ביותר והתמונה הטרייה ביותר של העבודה שלכם. יש לו גם הכי הרבה חלקים לתפעל,
      והסוכן צריך לדעת את מי מהשניים לשאול.
  - en: >-
      **Sharded.** Several central servers, say [[4]], each serving a part of the
      developers, for example by region. The load on each server is smaller and so is a
      failure: [[5,000]] developers instead of [[20,000]]. The cost is more to operate,
      and every shard has to serve the same snapshots.
    he: >-
      **מפוצל.** כמה שרתים מרכזיים, נניח [[4]], שכל אחד משרת חלק מהמפתחים, למשל לפי
      אזור. העומס על כל שרת קטן יותר, וגם תקלה קטנה יותר: [[5,000]] מפתחים במקום
      [[20,000]]. המחיר הוא יותר תפעול, וכל השרתים צריכים להגיש את אותן תמונות מצב.
  - en: >-
      The diagram is drawn in lanes, one per part of the organization, in one common
      split of responsibility: product teams own the repos, a platform team owns the
      pipeline, the registry and the servers, a security and access function owns the
      rule of who may read what, and developers consume. Follow a question through it,
      then follow a publish. None of the four arrangements is "the correct one", and no
      standard chooses between them. Each trades freshness, reach, effort and what fails
      together.
    he: >-
      התרשים מצויר במסלולים, מסלול לכל זרוע בארגון, לפי חלוקת אחריות נפוצה אחת: צוותי
      המוצר אחראים על המאגרים, צוות פלטפורמה אחראי על תהליך הפרסום, על המרשם ועל השרתים,
      גורם אבטחה והרשאות אחראי על הכלל שקובע מי רשאי לקרוא מה, והמפתחים הם הצרכנים. עקבו
      בתרשים אחרי שאלה, ואחר כך אחרי פרסום. אף אחד מארבעת הסידורים אינו "הנכון", ושום תקן
      לא בוחר ביניהם. כל אחד מחליף בין טריות, טווח, מאמץ ומה שנופל יחד.

explorers:
  - kind: topology
    topology: central
    repos: 500
    developers: 20000
    reposPerDeveloper: 3
    shards: 4
    caption:
      en: "Switch between four arrangements, tap a box, and follow a request"
      he: "עברו בין ארבעה סידורים, הקישו על תיבה, ועקבו אחרי בקשה"

keyPoints:
  - en: "The boxes: developer machines with an agent and an MCP client, repos, CI, a registry of snapshots, MCP servers."
    he: "התיבות: מחשבי מפתחים עם סוכן ולקוח MCP, מאגרי קוד, CI, מרשם של תמונות מצב, שרתי MCP."
  - en: "Local is freshest and sees least. Central sees most and fails for everyone at once."
    he: "מקומי הוא הטרי ביותר ורואה הכי פחות. מרכזי רואה הכי הרבה ונופל לכולם בבת אחת."
  - en: "Hybrid combines the two and has the most parts. Sharding shrinks the load and the failure."
    he: "משולב מחבר בין השניים ויש לו הכי הרבה חלקים. פיצול מקטין את העומס ואת התקלה."
  - en: These are patterns with trade-offs. No standard picks one.
    he: אלה דפוסים עם יתרונות ומחירים. שום תקן לא בוחר אחד מהם.

quiz:
  - type: mcq
    id: q1-uncommitted
    prompt:
      en: "In which arrangements can the agent's graph include a change you have not committed yet?"
      he: "באילו סידורים הגרף של הסוכן יכול לכלול שינוי שעוד לא הכנסתם ל-commit?"
    choices:
      - en: Central only
        he: מרכזי בלבד
      - en: Local and hybrid
        he: מקומי ומשולב
      - en: Sharded only
        he: מפוצל בלבד
    correctIndex: 1
    explanation:
      en: Only a graph built on your machine can see your working copy. A central server knows what was published.
      he: רק גרף שנבנה על המחשב שלכם יכול לראות את עותק העבודה שלכם. שרת מרכזי יודע רק מה שפורסם.
  - type: numeric
    id: q2-shard-failure
    prompt:
      en: "20,000 developers are split evenly over 4 servers, with no failover. One server fails. How many developers lose it?"
      he: "20,000 מפתחים מחולקים שווה בשווה בין 4 שרתים, בלי גיבוי. שרת אחד נופל. כמה מפתחים מאבדים אותו?"
    correctValue: 5000
    tolerance: 0
    explanation:
      en: "20,000 ÷ 4 = 5,000. With one central server the same failure reaches all 20,000."
      he: "20,000 ÷ 4 = 5,000. עם שרת מרכזי אחד, אותה תקלה מגיעה לכל ה-20,000."
  - type: mcq
    id: q3-local-reach
    prompt:
      en: "Local only, with 3 of 500 repos checked out. What can the agent's graph say about the other 497?"
      he: "מקומי בלבד, עם 3 מתוך 500 מאגרים על המחשב. מה הגרף של הסוכן יכול לומר על 497 האחרים?"
    choices:
      - en: Everything, a little slower
        he: הכול, רק קצת יותר לאט
      - en: Nothing
        he: כלום
      - en: Only their names
        he: רק את השמות שלהם
    correctIndex: 1
    explanation:
      en: A local graph is built from what is on the machine. This is the same blind spot as the search in lesson 1.
      he: גרף מקומי נבנה ממה שיש על המחשב. זו אותה נקודה עיוורת של החיפוש משיעור 1.
  - type: mcq
    id: q4-stdio
    prompt:
      en: "In MCP's stdio transport the client launches the server as a subprocess on the same machine. Which arrangement does that fit?"
      he: "בתעבורת stdio של MCP הלקוח מפעיל את השרת כתת-תהליך על אותו מחשב. לאיזה סידור זה מתאים?"
    choices:
      - en: Local
        he: מקומי
      - en: Central
        he: מרכזי
      - en: Sharded
        he: מפוצל
    correctIndex: 0
    explanation:
      en: A subprocess lives and dies with the agent on that machine. A server shared by many machines is reached over HTTP.
      he: תת-תהליך חי ומת יחד עם הסוכן על אותו מחשב. לשרת שמשותף למחשבים רבים פונים ב-HTTP.
```

### 3.9 Lesson 7: `07-scaling-to-an-organization.yaml`

Numbers: `10`, `5,000`, `500` come from `maxCommitsBehind` and `orgPublishesPerDay` at
the defaults (§4.7); `300` and `200` from `readableRepos` (§4.9).

```yaml
id: scaling-to-an-organization
topic: code-graphs
order: 7

title:
  en: "Scaling it to an organization"
  he: "להגדיל את זה לארגון שלם"

subtitle:
  en: "Chapter 7 · freshness, access, ownership"
  he: "פרק 7 · טריות, הרשאות, אחריות"

intro:
  - en: >-
      At the size of a whole organization three questions are left. How old is the
      answer? Who is allowed to see it? And who is responsible for each part?
    he: >-
      בגודל של ארגון שלם נשארות שלוש שאלות. בת כמה התשובה? מי רשאי לראות אותה? ומי אחראי
      על כל חלק?
  - en: >-
      **Freshness.** Set how many commits a repo gets per day; that number is yours, the
      course does not claim one. With [[10]] a day and a snapshot published once a
      night, an answer can be up to [[10]] commits behind. Published every hour: less
      than one. Published on every merge: only as long as the pipeline takes. The price
      is builds. On every merge, [[500]] repos at [[10]] commits a day are [[5,000]]
      publishes a day; nightly it is [[500]]. The arithmetic assumes commits are spread
      evenly over the day. Real systems do live with a gap: Google wrote in 2020 that
      one of its semantic indexes was computed once a day, because building it cost
      about as much as a full build.
    he: >-
      **טריות.** קבעו כמה פעולות {{commit}} מאגר מקבל ביום. המספר הזה שלכם, והקורס לא
      טוען שיש מספר נכון. עם [[10]] ביום ותמונת מצב שמתפרסמת פעם בלילה, תשובה יכולה
      להיות עד [[10]] צעדים מאחור. בפרסום כל שעה: פחות מצעד אחד. בפרסום בכל מיזוג: רק
      הזמן שהתהליך לוקח. המחיר הוא בניות. בכל מיזוג, [[500]] מאגרים עם [[10]] שינויים
      ביום הם [[5,000]] פרסומים ביום. פעם בלילה אלה [[500]]. החשבון מניח שהשינויים
      מתפזרים באופן אחיד על פני היום. מערכות אמיתיות כן חיות עם פער: {{Google}} כתבה
      ב-[[2020]] שאחד האינדקסים הסמנטיים שלה חושב פעם ביום, כי לבנות אותו עלה בערך כמו
      בנייה מלאה.
  - en: >-
      A gap is not a fault as long as it is stated. The rule from lesson 5 becomes
      policy: the snapshot is at the head, trust it; it is behind and the source is at
      hand, check live; it is behind and there is no source, give the answer with its
      commit.
    he: >-
      פער הוא לא תקלה כל עוד מצהירים עליו. הכלל משיעור 5 הופך למדיניות: תמונת המצב
      מעודכנת לראש הענף, סומכים עליה. היא מאחור וקוד המקור בהישג יד, בודקים ישירות. היא
      מאחור ואין קוד מקור, נותנים את התשובה יחד עם ה-{{commit}} שלה.
  - en: >-
      **Access.** Not every developer may read every repo. A repo's graph gives away its
      structure: names, who calls what, which APIs exist. So a snapshot should inherit
      the permissions of its repo. If a developer may read [[60%]] of the repos, that is
      [[300]] of [[500]], and a central server that does not filter would show the
      other [[200]] as well.
    he: >-
      **הרשאות.** לא כל מפתח רשאי לקרוא כל מאגר. גרף של מאגר חושף את המבנה שלו: שמות, מי
      קורא למה, אילו ממשקים קיימים. לכן תמונת מצב צריכה לרשת את ההרשאות של המאגר שלה. אם
      מפתח רשאי לקרוא [[60%]] מהמאגרים, אלה [[300]] מתוך [[500]], ושרת מרכזי שלא מסנן
      יציג לו גם את [[200]] האחרים.
  - en: >-
      Where does the check live? At the server, which filters each answer by who is
      asking. At the registry, which refuses to hand over a snapshot. Or at both. Try
      the cases in the explorer: someone fetches from the registry directly and skips
      the server, or the server reads the registry with one account that may read
      everything. Only "both" blocks every case. What {{MCP}} contributes here is
      narrow: its specification defines an optional authorization flow for {{HTTP}}
      connections, based on {{OAuth 2.1}}, which is how a caller proves who it is to a
      server. Which repos that caller may read is not covered by the specification. The
      people who build the server and the registry decide it.
    he: >-
      איפה הבדיקה יושבת? בשרת, שמסנן כל תשובה לפי מי ששואל. במרשם, שמסרב למסור תמונת
      מצב. או בשניהם. נסו את המקרים בסימולציה: מישהו פונה ישר למרשם ועוקף את השרת, או
      שהשרת קורא מהמרשם עם חשבון אחד שמותר לו לקרוא הכול. רק "שניהם" חוסם את כל המקרים.
      התרומה של {{MCP}} כאן מצומצמת: המפרט שלו מגדיר תהליך הרשאה, שאינו חובה, לחיבורי
      {{HTTP}}, על בסיס {{OAuth 2.1}}, וזו הדרך שבה מי שפונה מוכיח לשרת מי הוא. אילו
      מאגרים מותר לו לקרוא, בזה המפרט לא עוסק. את זה קובע מי שבונה את השרת ואת המרשם.
  - en: >-
      **Ownership**, in one common split. Repo owners keep their repo indexable: a build
      that works and interfaces that are declared. A platform team runs the pipeline,
      the registry and the servers. A security and access function owns the rule that a
      snapshot inherits its repo's permissions. Developers consume, and know to ask
      "as of which commit?". That is the whole picture: precomputed relations, the right
      graph for the question, published once per repo, served with a date and a
      permission check.
    he: >-
      **אחריות**, לפי חלוקה נפוצה אחת. בעלי המאגר שומרים שהמאגר שלהם יהיה ניתן לאינדוקס:
      בנייה שעובדת וממשקים מוצהרים. צוות פלטפורמה מפעיל את תהליך הפרסום, את המרשם ואת
      השרתים. גורם אבטחה והרשאות אחראי על הכלל שלפיו תמונת מצב יורשת את ההרשאות של המאגר
      שלה. המפתחים הם הצרכנים, והם יודעים לשאול "נכון לאיזה {{commit}}?". זו כל התמונה:
      קשרים שחושבו מראש, הגרף הנכון לשאלה, פרסום פעם אחת לכל מאגר, והגשה עם תאריך ועם
      בדיקת הרשאות.

explorers:
  - kind: cadence
    repos: 500
    commitsPerDay: 10
    cadence: nightly
    caption:
      en: "Set your own commit rate and choose how often snapshots are published"
      he: "קבעו קצב שינויים משלכם ובחרו כל כמה זמן מתפרסמות תמונות מצב"
  - kind: access
    repos: 500
    readableShare: 60
    checkAt: server
    caption:
      en: "Move the permission check and see which paths it blocks"
      he: "הזיזו את בדיקת ההרשאות וראו אילו מסלולים היא חוסמת"

keyPoints:
  - en: How often snapshots are published decides how old an answer can be. More often costs more builds.
    he: התדירות שבה מתפרסמות תמונות מצב קובעת עד כמה תשובה יכולה להיות ישנה. תדירות גבוהה יותר עולה יותר בניות.
  - en: An answer should carry the commit it is true for.
    he: תשובה צריכה לשאת את ה-commit שהיא נכונה לו.
  - en: A snapshot should inherit the permissions of its repo. A check at both the registry and the server blocks every path in this model.
    he: תמונת מצב צריכה לרשת את ההרשאות של המאגר שלה. בדיקה גם במרשם וגם בשרת חוסמת את כל המסלולים במודל הזה.
  - en: MCP defines how a caller proves who it is over HTTP. What that caller may read is decided by whoever builds the server.
    he: MCP מגדיר איך מי שפונה מוכיח מי הוא ב-HTTP. מה מותר לו לקרוא קובע מי שבונה את השרת.

quiz:
  - type: numeric
    id: q1-commits-behind
    prompt:
      en: "A repo gets 12 commits a day, spread evenly, and its snapshot is published every 6 hours. Up to how many commits behind can an answer be?"
      he: "מאגר מקבל 12 שינויים ביום, בפיזור אחיד, ותמונת המצב שלו מתפרסמת כל 6 שעות. עד כמה צעדים מאחור תשובה יכולה להיות?"
    correctValue: 3
    tolerance: 0
    explanation:
      en: "12 a day is one every 2 hours. In 6 hours, 3 commits pile up before the next publish."
      he: "12 ביום הם אחד כל שעתיים. ב-6 שעות מצטברים 3 שינויים לפני הפרסום הבא."
  - type: numeric
    id: q2-nightly-publishes
    prompt:
      en: "500 repos, each changing every day, publish a snapshot once a night. How many publishes a day across the organization?"
      he: "500 מאגרים, שכל אחד מהם משתנה כל יום, מפרסמים תמונת מצב פעם בלילה. כמה פרסומים ביום יש בכל הארגון?"
    correctValue: 500
    tolerance: 0
    explanation:
      en: "One per repo per night: 500, however many commits each repo had that day."
      he: "אחד לכל מאגר בכל לילה: 500, בלי קשר למספר השינויים שהיו בכל מאגר באותו יום."
  - type: mcq
    id: q3-server-only
    prompt:
      en: "The permission check lives only at the server. Someone downloads a snapshot straight from the registry. What happens?"
      he: "בדיקת ההרשאות יושבת רק בשרת. מישהו מוריד תמונת מצב ישר מהמרשם. מה קורה?"
    choices:
      - en: The server blocks it
        he: השרת חוסם את זה
      - en: Nothing stops it, because the request never passes through the server
        he: שום דבר לא עוצר את זה, כי הבקשה בכלל לא עוברת דרך השרת
      - en: MCP blocks it
        he: MCP חוסם את זה
    correctIndex: 1
    explanation:
      en: A check protects only the path that goes through it. That is the argument for checking at the registry as well.
      he: בדיקה מגינה רק על המסלול שעובר דרכה. זה הנימוק לבדוק גם במרשם.
  - type: mcq
    id: q4-mcp-auth
    prompt:
      en: "What does the MCP specification say about authorization?"
      he: "מה המפרט של MCP אומר על הרשאות?"
    choices:
      - en: It lists which repos each developer may read
        he: הוא מפרט אילו מאגרים כל מפתח רשאי לקרוא
      - en: It defines an optional flow, based on OAuth 2.1, for HTTP connections; what a caller may read is left to the server
        he: הוא מגדיר תהליך שאינו חובה, על בסיס OAuth 2.1, לחיבורי HTTP. מה מותר לפונה לקרוא נשאר בידי השרת
      - en: It forbids central servers
        he: הוא אוסר על שרתים מרכזיים
    correctIndex: 1
    explanation:
      en: The specification covers how a client gets and presents a token. The rule that a snapshot inherits its repo's permissions has to be built by the organization.
      he: המפרט עוסק באופן שבו לקוח מקבל אסימון ומציג אותו. את הכלל שלפיו תמונת מצב יורשת את ההרשאות של המאגר שלה הארגון צריך לבנות בעצמו.
```

**Lessons with an "ask your org" box: none.** The boxes were removed at Guy's request
(§0). If Guy later wants a private overlay with a real organization's values, the places
it would attach are lesson 6 (which topology) and lesson 7 (cadence, where the check
lives, who owns what). See §7.2, Q4.

---

## 4. Explorers

Nine explorer kinds. All arithmetic and all graph logic live in pure functions under
`src/graph/` with vitest tests; components contain no formulas and no counts. Every
number a component shows is a function result.

### 4.0 Rules for every explorer and diagram

1. **Bench anatomy** as in `SUBJECT_APP_SKIN_LLD.md` §5.5: `Card variant="bench"`,
   caption with the `handle` icon, readout tiles, segmented controls, plot well.
2. **Tokens only.** No hex values in components. Node fill `--surface`, node stroke
   `--line-strong`, active stroke `--accent` 2.5 px, text `--ink`, secondary text
   `--ink-2`, lane fill `--surface-2`, lane label `--ink-2`.
3. **Never colour alone.** Each meaning has a second channel:

   | Meaning | Colour | Second channel |
   |---|---|---|
   | Edge kind `calls` | `--series-a` | solid line, label on tap |
   | Edge kinds `requests`, `handledBy`, `reads`, `partOf` (the contract edges) | `--series-b` | dashed `6 4` |
   | Topology edge `publish` | `--series-a` | solid |
   | Topology edge `query` | `--series-b` | solid, arrowheads at both ends |
   | Topology edge `policy` | `--ink-2` | dotted `2 5` |
   | Topology edge `clone` | `--ink-2` | dashed `8 5` |
   | Verdict right | `--good` on `--good-soft` | check icon and the word |
   | Verdict imprecise | `--highlight` on `--highlight-soft` | "≈" icon and the word |
   | Verdict blind | `--muted` on `--surface-3` border only | empty-circle icon and the word |
   | Verdict unavailable | `--critical` on `--critical-soft` | pause icon and the word |
   | Edge still true / phantom / missing | `--good` / `--critical` / `--highlight` | solid / struck through with a cross marker at mid-edge / dashed with a "+" marker |
   | Node not used in this topology | 0.35 opacity | dashed outline, and "not used" in the text alternative |
   | Active step | `--accent` stroke | numbered badge on the node |

   Verdict words sit on `--surface` or `--surface-2` only (§1.3 rule 2). The `--highlight`
   and `--muted` words are 5.10 and 6.26 on white.
4. **Text alternative.** Every SVG is inside a `<figure>`. The `<svg>` gets `aria-labelledby` pointing at a `<figcaption>` (visible, 13 px
   `--muted`, in the current language) and `aria-describedby` pointing at a visually
   hidden `<ol>` generated from the same data by a pure `describe*()` function (one
   `<li>` per node and per edge, in the current language). Tests assert the list length.
5. **LTR islands.** Code, identifiers, counts, commit ids and formulas are `.sci` or
   `.num`. Every SVG has `direction: ltr`; Hebrew labels inside it use
   `direction: rtl; unicode-bidi: isolate` on the `<text>` and `text-anchor: middle`.
   Diagram geometry does not mirror (D10).
6. **Sliders** are `input.slider` with `direction: ltr`, the `--p` fill variable and the
   `90deg` gradient. Do not copy an RTL `270deg` override for these: every slider in
   this app is a numeric scale that grows to the right in both languages. (This follows
   CLAUDE.md's gotcha; if the copied `styles.css` carries the `[dir='rtl']` `270deg`
   rule, delete it and note the deviation from the skin spec in the PR.)
7. **Keyboard.** Every node and layer that reacts to a tap is a `<g role="button"
   tabindex="0">` with an `aria-label` and `aria-pressed`; Enter and Space activate;
   focus ring is a 3 px `--accent` outline offset 2 px. Sliders use native keys.
   Segmented controls are `role="group"` with `aria-pressed` buttons.
8. **Touch.** Tap targets ≥ 44 × 44 CSS px (pad small SVG nodes with a transparent hit
   rect). No hover-only information. Every `:hover` rule inside `@media (hover: hover)`.
9. **Motion.** Transitions 180 to 320 ms, `cubic-bezier(.2,.8,.2,1)`. Under
   `prefers-reduced-motion: reduce` there is no travelling dot, no draw-in and no
   auto-advance: steps change instantly on the Next button. Nothing loops, ever.
10. **Minimum text size.** Every `<text>` renders at ≥ 12 CSS px at both test widths.
    Diagrams switch to their narrow layout when the **container** is narrower than
    720 px (use a `ResizeObserver` hook `useNarrow(ref, 720)`, not a media query).
11. **No explorer state is persisted.** Initial state comes from the YAML config.

### 4.1 The toy codebase: `src/graph/toy.ts`

The single source of truth for lessons 1, 2, 3 and 5. Code lines are data, in English,
and are never translated.

```ts
export type RepoId = 'orders-service' | 'web-shop';
export interface ToyFile { id: string; repo: RepoId; path: string; lang: 'python' | 'typescript'; lines: string[] }
export type NodeKind = 'function' | 'endpoint' | 'field';
export interface ToyNode { id: string; kind: NodeKind; name: string; repo: RepoId; file?: string; line?: number }
export type EdgeKind = 'calls' | 'requests' | 'handledBy' | 'reads' | 'partOf';
export interface ToyEdge { from: string; kind: EdgeKind; to: string }   // "from depends on to"
export interface Graph { nodes: ToyNode[]; edges: ToyEdge[] }
export type OccurrenceRole = 'definition' | 'call' | 'import' | 'comment' | 'fieldWrite' | 'fieldRead';
export interface Occurrence { file: string; line: number; name: string; role: OccurrenceRole; target: string | null }
```

Files (exact lines; blank lines are empty strings and count as lines):

`money` = `orders-service` / `orders/money.py`, python, 5 lines

```
def format_price(amount):
    return f"{round_cents(amount):.2f}"

def round_cents(amount):
    return round(amount, 2)
```

`legacy` = `orders-service` / `orders/legacy.py`, python, 5 lines

```
def format_price(amount):
    return str(amount)

def export_csv(orders):
    return [format_price(o.total) for o in orders]
```

`api` = `orders-service` / `orders/api.py`, python, 9 lines

```
from orders.money import format_price

# GET /orders/{id}
def get_order(order_id):
    order = load_order(order_id)
    return {"id": order.id, "total_price": format_price(order.total)}

def load_order(order_id):
    return db.find(order_id)
```

`orderCard` = `web-shop` / `web/orderCard.ts`, typescript, 9 lines

```
// shows the price; format_price is done by the server
export async function renderOrderCard(id: string) {
  const order = await fetchOrder(id);
  return `<b>${order.total_price}</b>`;
}

async function fetchOrder(id: string) {
  return (await fetch(`/orders/${id}`)).json();
}
```

Nodes (11): functions `money.format_price` (money:1), `money.round_cents` (money:4),
`legacy.format_price` (legacy:1), `legacy.export_csv` (legacy:4), `api.get_order` (api:4),
`api.load_order` (api:8), `web.renderOrderCard` (orderCard:2), `web.fetchOrder`
(orderCard:7); endpoint `endpoint.getOrder` (name `GET /orders/{id}`, repo
`orders-service`); fields `field.id`, `field.total_price` (repo `orders-service`).
A node's `name` is the part after the dot, except the endpoint.

Edges (10), `BASE_EDGES`:

| from | kind | to |
|---|---|---|
| `api.get_order` | calls | `money.format_price` |
| `api.get_order` | calls | `api.load_order` |
| `money.format_price` | calls | `money.round_cents` |
| `legacy.export_csv` | calls | `legacy.format_price` |
| `web.renderOrderCard` | calls | `web.fetchOrder` |
| `web.fetchOrder` | requests | `endpoint.getOrder` |
| `endpoint.getOrder` | handledBy | `api.get_order` |
| `web.renderOrderCard` | reads | `field.total_price` |
| `field.total_price` | partOf | `endpoint.getOrder` |
| `field.id` | partOf | `endpoint.getOrder` |

Occurrences (9), `OCCURRENCES`, the ground truth for what each search hit really is:

| file:line | name | role | target |
|---|---|---|---|
| money:1 | `format_price` | definition | `money.format_price` |
| legacy:1 | `format_price` | definition | `legacy.format_price` |
| legacy:5 | `format_price` | call | `legacy.format_price` |
| api:1 | `format_price` | import | `money.format_price` |
| api:6 | `format_price` | call | `money.format_price` |
| orderCard:1 | `format_price` | comment | null |
| api:4 | `get_order` | definition | `api.get_order` |
| api:6 | `total_price` | fieldWrite | `field.total_price` |
| orderCard:4 | `total_price` | fieldRead | `field.total_price` |

Searchable terms are exactly `format_price`, `get_order`, `total_price`.

Consistency tests (`toy.test.ts`): 4 files, 28 lines in total (5, 5, 9, 9); 11 nodes;
10 edges; every edge endpoint is a node id; every function node's `file:line` contains
`def <name>` or `function <name>`; for each searchable term, the set of `file:line` from
`searchText` over both repos equals the set in `OCCURRENCES` for that name.

### 4.2 `searchCost` (lesson 1): the agent's steps

`src/graph/search.ts`

```ts
export interface Hit { file: string; line: number; text: string }
export function searchText(files: ToyFile[], term: string, visible: RepoId[]): Hit[];
// case-sensitive substring match per line; files in array order, lines ascending
export function searchCost(files: ToyFile[], term: string, visible: RepoId[]):
  { hits: number; files: number; linesToRead: number };
// linesToRead = sum of lines.length over the distinct files that have a hit
export function classifyHit(hit: Hit, term: string): Occurrence;      // lookup in OCCURRENCES
export type QuestionId = 'callers' | 'callees' | 'fieldReaders';
export function relevantHits(q: QuestionId, hits: Hit[]): Hit[];
export interface AgentStep { kind: 'ask' | 'search' | 'open'; file?: string; hitsSoFar: number; filesOpened: number; linesRead: number }
export function agentSteps(files: ToyFile[], term: string, visible: RepoId[]): AgentStep[];
// step 0 'ask'; step 1 'search'; then one 'open' per distinct file with a hit, in file order
```

The term maps to the question: `format_price` → `callers`, `get_order` → `callees`,
`total_price` → `fieldReaders`. `relevantHits`: `callers` keeps hits whose occurrence is
`role: 'call', target: 'money.format_price'`; `callees` keeps none (the definition line
is not the answer; the answer is in the body); `fieldReaders` keeps
`role: 'fieldRead', target: 'field.total_price'`.

Hand-checked test cases:

| term | visible | hits | files | linesToRead | relevantHits | steps |
|---|---|---|---|---|---|---|
| `format_price` | both | 6 | 4 | 28 | 1 (api:6) | 6 (ask, search, 4 opens: 5, 10, 19, 28 lines read) |
| `format_price` | `orders-service` | 5 | 3 | 19 | 1 | 5 |
| `get_order` | both | 1 | 1 | 9 | 0 | 3 |
| `total_price` | both | 2 | 2 | 18 | 1 (orderCard:4) | 4 |
| `total_price` | `orders-service` | 1 | 1 | 9 | 0 | 3 |

Config: `{ kind: 'searchCost', term: 'format_price' | 'get_order' | 'total_price', bothRepos: boolean, caption? }`.

Component `SearchCostExplorer`:

- Top row: the question as a sentence (locale key per question), a segmented control of
  the three terms (each a `.sci` chip), and a switch "`web-shop` is on my machine"
  (`role="switch"`).
- **The handle:** a slider, `min 0`, `max steps.length − 1`, step 1, labelled "Agent
  step". Changing the term or the switch resets it to 0.
- Readout tiles: "Search hits", "Files opened", "Lines read", "Lines that answer"
  (`relevantHits.length`, shown from step 1 on). Before step 1 the tiles show "–".
- Well: the four files as code panels (`.sci` monospace, `direction: ltr`, 13 px, line
  numbers in `--muted`). A file not yet opened shows only its path and its hit lines
  (from step 1), the rest collapsed to a "… n lines" row. An opened file shows all
  lines. Hit lines have a `--highlight-soft` background and, once the file is opened, a
  chip naming the hit's role (locale `explorer.role.*`). A relevant hit also gets a
  `--good` check chip. A repo that is not on the machine is drawn as a dashed empty
  panel labelled "not on this machine"; its files are not rendered.
- Bottom line, always visible, the comparison: "With a graph: 1 query →" followed by the
  `index` answer from §4.4 for the same question, as `.sci` chips.
- At 390 px the code panels stack; long lines scroll horizontally **inside** the panel
  (`overflow-x: auto` on the panel, never on the page).

### 4.3 `graphView` (lesson 2): nodes, edges, blast radius

`src/graph/graph.ts`

```ts
export function dependents(g: Graph, start: string, hops: number): string[];
// reverse breadth-first over edges (X is a dependent of Y when an edge X→Y exists),
// up to `hops` steps, excluding `start`, sorted by id
export function dependencies(g: Graph, start: string, hops: number): string[];   // forward
export function hopOf(g: Graph, start: string, target: string): number | null;    // reverse distance
export function countNodesByKind(g: Graph): Record<NodeKind, number>;
export function countEdgesByKind(g: Graph): Record<EdgeKind, number>;
export function edgesOf(g: Graph, id: string): { out: ToyEdge[]; in: ToyEdge[] };
export function describeGraph(g: Graph, t: (key: string, o?: object) => string): string[];
```

Tests on the base graph: `countNodesByKind` = function 8, endpoint 1, field 2;
`countEdgesByKind` = calls 5, requests 1, handledBy 1, reads 1, partOf 2.
`dependents('money.format_price', h).length` for h = 0..5 is `0, 1, 2, 5, 6, 6`, with
members h1 `[api.get_order]`, h2 adds `endpoint.getOrder`, h3 adds `field.id`,
`field.total_price`, `web.fetchOrder`, h4 adds `web.renderOrderCard`.
`dependents('field.total_price', h).length` = `0, 1, 1, 1, 1`.
`dependents('money.round_cents', h).length` = `0, 1, 2, 3, 6`.
`dependents('endpoint.getOrder', h).length` = `0, 3, 4, 4, 4`.
`describeGraph` returns 21 strings (11 nodes + 10 edges).

Config: `{ kind: 'graphView', start: <node id>, hops: 0..4, caption? }`.

Component `GraphViewExplorer`:

- Readouts: "Nodes" 11, "Edges" 10, "Start" (selected node name, `.sci`), "Affected"
  (`dependents(start, hops).length`).
- **The handle:** slider "Steps away", 0 to 4. Tapping a node makes it the start.
- Edge-kind chips (toggle, all on by default) filter which edges are drawn; they do not
  change the count (the readout always uses the whole graph), and a `--muted` line says
  so when any chip is off.
- Start node: `--accent` fill, `--accent-ink` text. Nodes within the radius: `--accent`
  stroke 2.5 px plus a small badge with their hop number (`.num`). Others: default.
- Below the well: the selected node's edges as two lists, "depends on" and "is depended
  on by", each row `from` · kind · `to` in `.sci`.
- Two same-named nodes are labelled `format_price` with the file name under it
  (`money.py`, `legacy.py`) in `--muted`, so they are told apart without colour.

Layout, wide (`viewBox="0 0 720 420"`). Node pill 150 × 36, label 14 px mono. Group boxes
are `--surface-2` rounded rects with a 13 px label at the top start corner.

| Group box (x1, y1, x2, y2) | Node | Centre (x, y) |
|---|---|---|
| repo `orders-service` (10, 8, 470, 412) | | |
| `orders/money.py` (24, 30, 196, 150) | `money.format_price` | (110, 68) |
| | `money.round_cents` | (110, 118) |
| `orders/legacy.py` (24, 262, 196, 400) | `legacy.format_price` | (110, 308) |
| | `legacy.export_csv` | (110, 360) |
| `orders/api.py` (264, 30, 456, 150) | `api.get_order` | (360, 68) |
| | `api.load_order` | (360, 118) |
| API contract (264, 190, 456, 400) | `endpoint.getOrder` | (360, 236) |
| | `field.id` | (360, 304) |
| | `field.total_price` | (360, 356) |
| repo `web-shop` (490, 8, 710, 412) | | |
| `web/orderCard.ts` (504, 190, 696, 400) | `web.fetchOrder` | (600, 236) |
| | `web.renderOrderCard` | (600, 356) |

Layout, narrow (`viewBox="0 0 360 440"`). Node pill 152 × 34, label 13 px mono.

| Group box | Node | Centre |
|---|---|---|
| `orders/money.py` (8, 8, 176, 118) | `money.format_price` | (92, 52) |
| | `money.round_cents` | (92, 94) |
| `orders/api.py` (184, 8, 352, 118) | `api.get_order` | (268, 52) |
| | `api.load_order` | (268, 94) |
| `orders/legacy.py` (8, 130, 176, 240) | `legacy.format_price` | (92, 174) |
| | `legacy.export_csv` | (92, 216) |
| API contract (184, 130, 352, 290) | `endpoint.getOrder` | (268, 174) |
| | `field.id` | (268, 216) |
| | `field.total_price` | (268, 258) |
| `web/orderCard.ts` (96, 310, 264, 430) | `web.fetchOrder` | (180, 354) |
| | `web.renderOrderCard` | (180, 398) |

In the narrow layout the repo is shown by a chip in each group box label instead of an
outer box. Edges are straight lines between pill borders with an arrowhead at the `to`
end; where a straight line would cross another pill, use a quadratic curve bowed 28 px
away from it. A unit test asserts no two pills overlap in either layout.

### 4.4 `askGraphs` (lesson 3): four ways to answer

`src/graph/answers.ts`

```ts
export type GraphKind = 'syntax' | 'index' | 'contract';
export type Verdict = 'right' | 'imprecise' | 'blind' | 'unavailable';
export interface Answer { verdict: Verdict; items: string[] }      // node ids, or bare names for syntax callees
export function truth(q: QuestionId, g: Graph): string[];
export function answer(q: QuestionId, kind: GraphKind, g: Graph, opts: { buildBroken: boolean }): Answer;
export function definitionsNamed(g: Graph, name: string): string[];
```

The three questions, fixed: `callers` = "who calls `format_price` in `money.py`?";
`callees` = "what does `get_order` call?"; `fieldReaders` = "who reads the field
`total_price`?".

Rules (the model of each graph, stated in the UI as a one-line "how it was built"):

- `truth`: `callers` = sources of `calls` edges into `money.format_price`; `callees` =
  targets of `calls` edges out of `api.get_order`; `fieldReaders` = sources of `reads`
  edges into `field.total_price`.
- `syntax` sees only `calls` edges and only the **name** of the target.
  `callers`: every source of a `calls` edge whose target is named `format_price`;
  verdict `imprecise` when `definitionsNamed(g, 'format_price').length > 1`, else `right`.
  `callees`: the names called by `api.get_order`; verdict `right`.
  `fieldReaders`: `blind`, no items. `buildBroken` has no effect.
- `index` sees `calls` edges with exact targets. `callers` and `callees` equal `truth`,
  verdict `right`. `fieldReaders`: `blind`. When `buildBroken`, every question is
  `unavailable` with no items.
- `contract` sees `requests`, `handledBy`, `reads`, `partOf`. `fieldReaders` equals
  `truth`, verdict `right`. The other two: `blind`. `buildBroken` has no effect.

Hand-checked on the base graph:

| question | truth | syntax | index | contract |
|---|---|---|---|---|
| `callers` | `[api.get_order]` | imprecise `[api.get_order, legacy.export_csv]` | right `[api.get_order]` | blind |
| `callees` | `[api.load_order, money.format_price]` | right `[format_price, load_order]` | right (as truth) | blind |
| `fieldReaders` | `[web.renderOrderCard]` | blind | blind | right `[web.renderOrderCard]` |

With `buildBroken: true` the `index` column is `unavailable` three times and the other
columns are unchanged. On `graphAt(2)` (§4.6, `legacy.py` deleted) `answer('callers',
'syntax')` is `right` with `[api.get_order]`.

Config: `{ kind: 'askGraphs', question: 'callers' | 'callees' | 'fieldReaders', caption? }`.

Component `AskGraphsExplorer`:

- Segmented control with the three questions (labels: "Structure", "Identity",
  "Interface" plus the question sentence below). Order in the control: `callees`
  (Structure), `callers` (Identity), `fieldReaders` (Interface).
- Two switches: "The build is broken" and "`web-shop` is on my machine" (affects only
  the search column; the three graphs are treated as published for both repos, and a
  `--muted` note says so).
- Four answer cards in a grid (4 columns ≥ 720 px container, 2 × 2 below, 1 column below
  420 px): **Text search**, **Syntax graph**, **Compiler index**, **Contract graph**.
  Each card: title, the "how it was built" line, the verdict chip (graphs only), the
  items as `.sci` chips, and one explanatory sentence chosen by `(question, kind,
  verdict)` from the locale table in §5.4.
  The search card shows `searchCost` and `relevantHits` instead of a verdict:
  "`{{relevant}}` of `{{hits}}` hits answer the question · `{{files}}` files to open".
- A "truth" row under the grid lists `truth(q)` so the learner can compare.
- No slider here: the handle of this lesson is the question itself. This is the one
  explorer without a drag gesture; it has two switches and a three-way control.

### 4.5 `scale` (lesson 5): why not index everything everywhere

`src/graph/scale.ts`

```ts
export interface Org { repos: number; developers: number }
export const DEFAULT_ORG: Org = { repos: 500, developers: 20000 };       // the example parameters
export const REPO_STEPS = [10, 50, 100, 200, 500, 1000, 2000, 5000];
export const DEVELOPER_STEPS = [10, 100, 500, 1000, 5000, 10000, 20000, 50000, 100000];
export type IndexStrategy = 'everyMachineEverything' | 'everyMachineOwn' | 'publishOnce';
export function indexBuilds(org: Org, s: IndexStrategy, reposPerDeveloper: number): number;
// everyMachineEverything: repos × developers
// everyMachineOwn:        developers × min(reposPerDeveloper, repos)
// publishOnce:            repos
export function reposInReach(org: Org, s: IndexStrategy, reposPerDeveloper: number): number;
// everyMachineOwn: min(reposPerDeveloper, repos); the other two: repos
export function reachShare(org: Org, s: IndexStrategy, reposPerDeveloper: number): number;  // reposInReach / repos
export function rebuildsPerMerge(org: Org, s: IndexStrategy, reposPerDeveloper: number): number;
// rebuilds needed to bring every copy up to date after one merge to one repo:
// everyMachineEverything: developers; publishOnce: 1;
// everyMachineOwn: developers × min(reposPerDeveloper, repos) / repos  (the average number of machines holding that repo)
```

Hand-checked at `{500, 20000}`, `reposPerDeveloper = 3`:

| strategy | indexBuilds | reposInReach | reachShare | rebuildsPerMerge |
|---|---|---|---|---|
| everyMachineEverything | 10,000,000 | 500 | 1 | 20,000 |
| everyMachineOwn | 60,000 | 3 | 0.006 | 120 |
| publishOnce | 500 | 500 | 1 | 1 |

Also test `{200, 1000}`: 200,000 / 3,000 / 200 (quiz q1, q2), and `{10, 10}` with
`reposPerDeveloper = 20`: `everyMachineOwn` = 100 builds, reach 10 (the `min`).

Config: `{ kind: 'scale', repos: one of REPO_STEPS, developers: one of DEVELOPER_STEPS, reposPerDeveloper: 1..20, caption? }`.

Component `ScaleExplorer`:

- **Handles:** three sliders. "Repos" and "Developers" are index sliders over the step
  arrays (the label shows the value, `.num`, `toLocaleString('en-US')`); "Repos each
  developer works on" is 1 to 20.
- Three result rows, one per strategy, each a card: name, the formula in `.sci`
  (`500 × 20,000`), the result as a large `.readout`, a horizontal bar, "repos the agent
  can see: 3 of 500 (0.6%)", and "rebuilds after one merge".
- Bars use a **log scale**, because the values differ by four orders of magnitude:
  `width% = log10(value) / log10(max of the three) × 100`, minimum 2%. The words "log
  scale" appear under the bars. The bar is decoration; the number is the content.
  Bars grow from the start edge (use logical `inset-inline-start`), so they grow from
  the right in Hebrew, which is correct for a bar that is not an axis.
- Under the rows, always visible: `org.illustrative` (§1.5) and "This is arithmetic on
  the numbers above, not a measurement." (`explorer.scale.arithmetic`).
- Percent formatting: `reachShare × 100`, up to one decimal, trailing `.0` dropped.

### 4.6 `staleness` (lesson 5): the photograph ages

`src/graph/staleness.ts`

```ts
export interface Commit { id: 'c0' | 'c1' | 'c2' | 'c3' | 'c4'; summaryKey: string; apply: (g: Graph) => Graph }
export const COMMITS: Commit[];                       // c0 is the base graph
export function graphAt(index: number): Graph;        // fold COMMITS[1..index] over the base graph
export function diffGraphs(snapshot: Graph, live: Graph): { stillTrue: ToyEdge[]; phantom: ToyEdge[]; missing: ToyEdge[] };
// edges compared by (from, kind, to). stillTrue = in both; phantom = only in snapshot; missing = only in live
export type FreshnessDecision = 'trust' | 'verifyLive' | 'answerAsOf';
export function freshnessDecision(i: { behind: number; hasSource: boolean }): FreshnessDecision;
// behind === 0 → 'trust'; else hasSource → 'verifyLive'; else → 'answerAsOf'
```

Commits (each a pure graph patch; none edits the file text shown in lesson 1):

| id | Change | Graph effect |
|---|---|---|
| c1 | `round_cents` is renamed `round_money` | node `money.round_cents` becomes `money.round_money`; its edge follows |
| c2 | `orders/legacy.py` is deleted | nodes `legacy.format_price`, `legacy.export_csv` and their edge are removed |
| c3 | `web-shop` adds `renderReceipt`, which also shows the price | new node `web.renderReceipt`; new edges `web.renderReceipt calls web.fetchOrder`, `web.renderReceipt reads field.total_price` |
| c4 | a comment is edited | none |

Hand-checked `diffGraphs(graphAt(p), graphAt(h))` as stillTrue / phantom / missing:

| published p \ head h | 0 | 1 | 2 | 3 | 4 |
|---|---|---|---|---|---|
| 0 | 10/0/0 | 9/1/1 | 8/2/1 | 8/2/3 | 8/2/3 |
| 1 | | 10/0/0 | 9/1/0 | 9/1/2 | 9/1/2 |
| 2 | | | 9/0/0 | 9/0/2 | 9/0/2 |
| 3 | | | | 11/0/0 | 11/0/0 |
| 4 | | | | | 11/0/0 |

Also: `truth('fieldReaders', graphAt(0))` has 1 item and `truth('fieldReaders',
graphAt(3))` has 2. `freshnessDecision`: `{0, any}` → trust; `{2, true}` → verifyLive;
`{2, false}` → answerAsOf.

Config: `{ kind: 'staleness', publishedAt: 0..4, head: 0..4 (≥ publishedAt), caption? }`.

Component `StalenessExplorer`:

- **Two handles on one track:** a commit timeline `c0 … c4` drawn in SVG (ticks with
  `.sci` labels, LTR in both languages: time runs left to right, like the plots).
  Handle "Head" (`--accent`, circle) and handle "Last publish" (`--series-b`, a square
  marker, so the two differ by shape). Constraint `publishedAt ≤ head`: dragging one
  past the other pushes the other along. Each handle is also a native range input
  beneath the track for keyboard and screen-reader use (two labelled sliders, 0 to 4).
- A "Publish now" button sets `publishedAt = head` (marked `data-fab-avoid` only if it
  ends up at the bottom of the bench on a phone).
- Readouts: "Commits behind" (`head − publishedAt`), "Still true", "Describe code that
  is gone" (phantom), "Missing from the snapshot".
- Commit list: the summary of each commit between the two handles (locale
  `explorer.staleness.commit.c1` … `c4`).
- Well: the lesson-2 graph layout, drawing the union of snapshot and live edges with the
  three encodings from §4.0 rule 3. Nodes that exist only in the snapshot are dashed;
  nodes that exist only live have a "+" badge. `web.renderReceipt` is placed at
  (600, 296) wide. In the narrow layout the `web/orderCard.ts` box widens to
  (8, 310, 352, 430), `web.renderOrderCard` moves to (88, 398) and `web.renderReceipt`
  sits at (272, 398).
- A question strip: "Who reads `total_price`?" with two answers side by side, "the
  snapshot says" (`truth` on the snapshot graph) and "the code says" (`truth` on the
  live graph), and a "does not match" chip when they differ.
- Decision row: a switch "I have this repo's source" and the result of
  `freshnessDecision` as a sentence (`explorer.staleness.decision.*`).

### 4.7 `cadence` (lesson 7): freshness at scale

`src/graph/cadence.ts`

```ts
export type Cadence = 'everyMerge' | 'hourly' | 'nightly' | 'weekly';
export function intervalHours(c: Cadence, pipelineMinutes: number): number;
// everyMerge: pipelineMinutes / 60; hourly: 1; nightly: 24; weekly: 168
export function maxCommitsBehind(commitsPerDay: number, c: Cadence, pipelineMinutes: number): number;
// commitsPerDay × intervalHours / 24   (assumes commits evenly spread over 24 h)
export function publishesPerRepoPerDay(commitsPerDay: number, c: Cadence): number;
// everyMerge: commitsPerDay; otherwise min(commitsPerDay, 24 / intervalHours)
// (a scheduled publish is skipped when nothing changed)
export function orgPublishesPerDay(repos: number, commitsPerDay: number, c: Cadence): number;
```

Hand-checked (pipeline 10 minutes, 500 repos):

| commitsPerDay | cadence | maxCommitsBehind | orgPublishesPerDay |
|---|---|---|---|
| 10 | nightly | 10 | 500 |
| 10 | hourly | 0.4167 | 5,000 |
| 10 | weekly | 70 | 71.43 |
| 10 | everyMerge | 0.0694 | 5,000 |
| 12 | interval of 6 h (call `commitsPerDay × 6 / 24` directly in the test) | 3 | n/a |
| 30 | nightly | 30 | 500 |
| 0 | any | 0 | 0 |

Config: `{ kind: 'cadence', repos: one of REPO_STEPS, commitsPerDay: 0..50, cadence: Cadence, caption? }`.

Component `CadenceExplorer`:

- **Handles:** slider "Commits per repo per day" 0 to 50 (label under it: "Your number.
  An example, not a statistic." `explorer.cadence.yourNumber`); slider "Pipeline
  duration (minutes)" 1 to 60, initial 10, shown only for `everyMerge`; segmented
  control for the four cadences.
- Readouts: "Answer can be up to … commits behind" and "Publishes a day across
  `{{repos}}` repos". Display rule for "behind": values below 1 show `< 1`; otherwise
  rounded up to a whole number. Publishes: rounded to a whole number.
- A strip chart in the well: one day as a 0 to 24 h axis (LTR), commit ticks evenly
  spaced, publish markers at the cadence's times, and the gap between the last publish
  and "now" (fixed at 24 h) shaded `--highlight-soft`. For `weekly` the axis is 7 days.
  Ticks are capped at 50; publish markers at 24.
- Decision row: the same `freshnessDecision` sentence, with `behind =
  ceil(maxCommitsBehind)` and the "I have this repo's source" switch.
- Under it: `org.illustrative` and "Assumes commits are spread evenly over the day."

### 4.8 `topology` (lesson 6): the diagram

`src/graph/topology.ts`

```ts
export type Topology = 'local' | 'central' | 'hybrid' | 'sharded';
export type Lane = 'product' | 'platform' | 'security' | 'developers';
export type TNodeKind = 'repo' | 'ci' | 'registry' | 'server' | 'policy' | 'machine';
export interface TNode { id: string; kind: TNodeKind; lane: Lane; wide: Box; narrow: Box | null }   // Box = { x, y, w, h }, x/y = centre
export type TEdgeKind = 'publish' | 'query' | 'policy' | 'clone';
export interface TEdge { id: string; from: string; to: string; kind: TEdgeKind; in: Topology[]; wide?: Point[]; narrow?: Point[] }
export function nodesFor(t: Topology): { id: string; used: boolean }[];
export function edgesFor(t: Topology): TEdge[];
export function route(a: Box, b: Box): Point[];
export type Track = 'question' | 'publish';
export interface Step { id: string; nodes: string[]; edges: string[]; textKey: string }
export function stepsFor(t: Topology, track: Track): Step[];
export interface TopologyMetrics {
  serverProcesses: number; indexBuilds: number; reposInReach: number;
  developersPerServer: number; developersAffectedIfOneServerFails: number;
  seesUncommittedWork: boolean; ownWorkSurvivesCentralFailure: boolean;
}
export function topologyMetrics(org: Org, t: Topology, p: { reposPerDeveloper: number; shards: number }): TopologyMetrics;
export function describeTopology(t: Topology, tr: (key: string, o?: object) => string): string[];
```

`topologyMetrics` rules (`k = min(reposPerDeveloper, repos)`, `D = developers`,
`R = repos`, `S = shards`):

| | local | central | hybrid | sharded |
|---|---|---|---|---|
| serverProcesses | D | 1 | D + 1 | S |
| indexBuilds | D × k | R | R + D × k | R |
| reposInReach | k | R | R | R |
| developersPerServer | 1 | D | D (the central one) | D / S |
| developersAffectedIfOneServerFails | 1 | D | D | D / S |
| seesUncommittedWork | true | false | true | false |
| ownWorkSurvivesCentralFailure | true | false | true | false |

Assumptions printed under the readouts (`explorer.topology.assumptions`): developers are
split evenly between shards, there is no failover, and "affected" for hybrid means the
developers lose answers about other repos and keep their own working copy.

Hand-checked at `{500, 20000}`, `reposPerDeveloper 3`, `shards 4`:

| | local | central | hybrid | sharded |
|---|---|---|---|---|
| serverProcesses | 20,000 | 1 | 20,001 | 4 |
| indexBuilds | 60,000 | 500 | 60,500 | 500 |
| reposInReach | 3 | 500 | 500 | 500 |
| developersPerServer | 1 | 20,000 | 20,000 | 5,000 |
| developersAffectedIfOneServerFails | 1 | 20,000 | 20,000 | 5,000 |

**Nodes.** Stand-ins: three repos, three machines, up to three servers, each group with
a count badge (`×500`, `×20,000`, `×4`) built from the config, `.num`.

Wide layout, `viewBox="0 0 1000 560"`. Lanes are full-width bands (x 8 to 992) with the
lane label in a 132 px column at the left (x 8 to 140), 16 px 600 `--ink-2`, wrapped to
two lines, centred at x = 74.

| Lane | Band y1 to y2 |
|---|---|
| `product` (Product teams, repo owners) | 8 to 138 |
| `platform` (Platform team) | 146 to 276 |
| `security` (Security and access) | 284 to 384 |
| `developers` (Developers) | 392 to 552 |

| Node id | Kind | Centre (x, y) | w × h |
|---|---|---|---|
| `repo-a` | repo | (250, 73) | 120 × 60 |
| `repo-b` | repo | (390, 73) | 120 × 60 |
| `repo-c` | repo | (530, 73) | 120 × 60 |
| `ci` | ci | (850, 73) | 170 × 64 |
| `server-1` | server | central and hybrid: (460, 211), 180 × 64; sharded: (300, 211), 140 × 64 |
| `server-2` | server | sharded only: (460, 211) | 140 × 64 |
| `server-3` | server | sharded only: (620, 211) | 140 × 64 |
| `registry` | registry | (850, 211) | 170 × 64 |
| `policy` | policy | (850, 334) | 200 × 56 |
| `machine-1` | machine | (300, 472) | 140 × 132 |
| `machine-2` | machine | (460, 472) | 140 × 132 |
| `machine-3` | machine | (620, 472) | 140 × 132 |

Narrow layout, `viewBox="0 0 360 850"` (`machine-1` and `machine-2` are 150 wide at x 21 to 171 and 189 to 339), rendered at the container width up to a maximum
of 420 px, centred. Lanes are stacked full-width bands (x 8 to 352), each with its label
as a header line inside the band (14 px 600, 18 px below the band top, at the start
side). `repo-c`, `machine-3` are not drawn (`narrow: null`); the count badges carry the
"many".

| Lane | Band y1 to y2 |
|---|---|
| `product` | 8 to 190 |
| `platform` | 198 to 388 |
| `security` | 396 to 486 |
| `developers` | 494 to 842 |

| Node id | Centre (x, y) | w × h |
|---|---|---|
| `repo-a` | (96, 80) | 150 × 46 |
| `repo-b` | (264, 80) | 150 × 46 |
| `ci` | (180, 152) | 300 × 46 |
| `registry` | (180, 262) | 300 × 46 |
| `server-1` | central and hybrid: (180, 344), 300 × 46; sharded: (66, 344), 104 × 46 |
| `server-2` | sharded: (180, 344) | 104 × 46 |
| `server-3` | sharded: (294, 344) | 104 × 46 |
| `policy` | (270, 448) | 150 × 46 |
| `machine-1` | (96, 690) | 150 × 270 |
| `machine-2` | (264, 690) | 150 × 270 |

Text sizes: wide node label 18 px 600, sub-label 17 px 400; narrow 14 px 600 and 14 px
400. At the 720 px switch point the wide layout scales to 0.72, so 17 px renders at
12.2 px; the narrow layout at a 326 px container scales to 0.91, so 14 px renders at
12.7 px. A label that does not fit its box in either language wraps to two lines; it is
never shrunk or truncated.

Node anatomy: rounded rect (`rx 12`), a 20 px kind icon at the start-top corner (new
`Icon` glyphs: `repo`, `gear` for CI, `stack` for registry, `server`, `shield` for
policy, `laptop`), label centred. A **machine** is a container with up to three rows
inside: "Agent" (plain text), a chip "MCP client", and, in `local` and `hybrid` only, a
chip "Local graph + local MCP server". Count badge: a pill centred on the top end corner
of the last drawn stand-in of its group, clamped 8 px inside the viewBox; the server
badge (sharded only) sits on the bottom end corner instead, to stay clear of the bus
line. "End" here is geometric right, since the diagram does not mirror.

**Edges.**

| id | from → to | kind | In topologies | Label key |
|---|---|---|---|---|
| `merge` | `repo-c` → `ci` (narrow: `repo-b` → `ci`) | publish | central, hybrid, sharded | `edge.merge` |
| `snapshot` | `ci` → `registry` | publish | central, hybrid, sharded | `edge.snapshot` |
| `load-1` | `registry` → `server-1` | publish | central, hybrid, sharded | `edge.load` |
| `load-2`, `load-3` | `registry` → `server-2`, `server-3` | publish | sharded | `edge.load` |
| `ask-1`, `ask-2`, `ask-3` | `machine-n` → `server-1` (sharded: `machine-n` → `server-n`) | query | central, hybrid, sharded | `edge.ask` |
| `policy-registry` | `policy` → `registry` | policy | central, hybrid, sharded | `edge.policy` |
| `policy-server` | `policy` → each drawn server | policy | central, hybrid, sharded | `edge.policy` |
| `clone` | `repo-a` → `machine-1` | clone | local, hybrid | `edge.clone` |

In `local`, the nodes `ci`, `registry`, every `server-*` and `policy` are drawn as "not
used" (§4.0 rule 3) and have no edges. `policy` keeps its role text, which says that in
this arrangement the only check is whether the developer could clone the repo.

`route(a, b)`, the default path: if `|a.y − b.y| ≤ 4`, one horizontal segment between
the facing sides. Otherwise leave `a` at the centre of the side facing `b` (top or
bottom), go vertically to the midpoint y between the two facing sides, horizontally to
`b.x`, then vertically into `b`. Corners rounded 8 px. Explicit waypoints override it:

| Edge | Layout | Waypoints |
|---|---|---|
| `clone` | wide | (190, 73) → (166, 73) → (166, 472) → (230, 472) |
| `clone` | narrow | (21, 80) → (14, 80) → (14, 690) → (21, 690) |
| `ask-n` (central, hybrid) | wide | machine top centre → (machine.x, 300) → (460, 300) → (460, 243) |
| `ask-n` (sharded) | wide | straight vertical, machine top centre to server bottom centre |
| `load-n` (sharded) | wide | (765, 211) → (745, 211) → (745, 160) → (server.x, 160) → (server.x, 179) |
| `policy-server` | wide | (750, 334) → (server.x + 40, 334) → (server.x + 40, 243) |
| `ask-n` (central, hybrid) | narrow | machine top centre → (machine.x, 520) → (150, 520) → (150, 367); passes the security band to the left of `policy` |
| `ask-n` (sharded) | narrow | machine top centre → (machine.x, 520) → (server.x, 520) → server bottom centre (`machine-1` → `server-1`, `machine-2` → `server-2`) |
| `load-n` (sharded) | narrow | (180, 285) → (180, 304) → (server.x, 304) → (server.x, 321) |
| `policy-registry` | narrow | (345, 448) → (350, 448) → (350, 262) → (330, 262) |
| `policy-server` | narrow | central and hybrid: (270, 425) → (270, 367). Sharded: (270, 425) → (270, 367) into `server-3`, and a bus at y = 396 from x = 270 to x = 200 and x = 86, each rising to y = 367 (`server-2`, `server-1`) |

These are starting values. The implementer may move a waypoint by up to 12 px to clear a
label, and records the change here. Unit tests: no two node boxes overlap, every node
box and every waypoint is inside its viewBox, in both layouts and all four topologies.
Edge labels are not drawn on the diagram (they would collide at 390 px); the label
appears in the step text and in the selected-node panel.

**Steps** (`stepsFor`). Text keys are `explorer.topology.step.<id>`; full strings in §5.4.

| Topology | Track | Steps (id: active nodes; active edges) |
|---|---|---|
| central, sharded | question | `q1`: machine-1 · `q2`: machine-1, server-1; ask-1 · `q3`: server-1, policy; policy-server · `q4`: server-1, registry; load-1 · `q5`: server-1, machine-1; ask-1 |
| hybrid | question | `h1`: machine-1 · `h2`: machine-1 (local chip highlighted) · `h3`: machine-1, server-1; ask-1 · `h4`: server-1, policy, registry; policy-server, load-1 · `h5`: server-1, machine-1; ask-1 |
| local | question | `l1`: machine-1 · `l2`: machine-1 (local chip highlighted) · `l3`: machine-1, repo-a; clone · `l4`: repo-b, repo-c (drawn as out of reach) |
| central, hybrid, sharded | publish | `p1`: repo-c · `p2`: repo-c, ci; merge · `p3`: ci, registry; snapshot · `p4`: registry, all drawn servers; every `load-*` |
| local | publish | `n1`: machine-1 (one step: nothing is published in this arrangement) |

`stepsFor` lengths, tested: question 5 / 5 / 5 / 4 for central / sharded / hybrid /
local; publish 4 / 4 / 4 / 1.

Config: `{ kind: 'topology', topology: Topology, repos, developers, reposPerDeveloper: 1..20, shards: 2..8, caption? }`.

Component `TopologyExplorer`:

- Segmented control: Local, Central, Hybrid, Sharded. Changing it resets the step to 0
  and keeps the selected node if it is still used.
- Readout tiles from `topologyMetrics`: "Servers running", "Index builds", "Repos the
  agent can reach" (`3 of 500`), "Developers who lose it if one server fails", and two
  yes/no tiles (icon plus word): "Sees uncommitted work", "Own work survives a central
  failure". Under the tiles: the assumptions line and `org.illustrative`.
- **The handles:** sliders "Repos", "Developers" (step arrays from §4.5) and, in
  `sharded` only, "Servers" 2 to 8. They change the badges and the tiles. They sit in a
  collapsible "Change the organization" group, open by default at ≥ 720 px, closed on a
  phone so the diagram is on the first screen.
- The diagram (§ above). Tapping a node selects it and opens the **role panel** under
  the diagram (not a popover: a popover would cover the diagram on a phone): node name,
  "Owned by" (lane name), "What it does" and "In this arrangement" (three locale
  strings per node kind and topology, §5.4).
- **Follow a request:** a two-way control "A question" / "A publish", then a stepper:
  Back, "Step 2 of 5", Next (`data-fab-avoid` on the row), plus a slider under it with
  the same range, so the steps can also be scrubbed. The current step's sentence shows
  under the stepper with `aria-live="polite"`. Active nodes and edges get the active
  style and a numbered badge. With motion allowed, a 6 px `--accent` dot travels once
  along each newly active edge in 320 ms. With reduced motion there is no dot.
- Text alternative from `describeTopology`: one item per lane ("Platform team: registry,
  MCP server"), one per used edge ("CI publishes a snapshot to the registry"), and one
  for each unused node. Tested lengths: 4 lanes + used edges + unused nodes; for
  `central` that is 4 + 8 + 0 = 12 (edges: merge, snapshot, load-1, ask-1, ask-2, ask-3,
  policy-registry, policy-server), for `local` 4 + 1 + 4 = 9 (`ci`, `registry`,
  `server-1`, `policy` unused).

### 4.9 `access` (lesson 7): where the permission check lives

`src/graph/access.ts`

```ts
export type CheckAt = 'none' | 'server' | 'registry' | 'both';
export type Path = 'viaServer' | 'directToRegistry';
export type ServerReadsAs = 'caller' | 'serviceAccount';
export function readableRepos(repos: number, sharePercent: number): number;   // Math.round(repos × share / 100)
export function isBlocked(c: CheckAt, p: Path, s: ServerReadsAs): boolean;
// viaServer:        blocked when the server checks, or when the registry checks and the server reads as the caller
// directToRegistry: blocked when the registry checks
export function exposedRepos(repos: number, sharePercent: number, c: CheckAt, p: Path, s: ServerReadsAs): number;
// blocked → 0; otherwise repos − readableRepos
```

`isBlocked`, all 16 cases (tested as a table):

| checkAt | viaServer, caller | viaServer, serviceAccount | directToRegistry (either) |
|---|---|---|---|
| none | no | no | no |
| server | yes | yes | no |
| registry | yes | no | yes |
| both | yes | yes | yes |

`readableRepos(500, 60)` = 300; `exposedRepos(500, 60, 'none', 'viaServer', 'caller')` =
200; `exposedRepos(500, 60, 'both', …)` = 0; `readableRepos(500, 0)` = 0;
`readableRepos(500, 100)` = 500 and exposed is then 0 in every case.

Config: `{ kind: 'access', repos: one of REPO_STEPS, readableShare: 0..100 step 10, checkAt: CheckAt, caption? }`.

Component `AccessExplorer`:

- **Handle:** slider "Share of repos this developer may read", 0 to 100% in steps of 10
  (label: "An example, not a statistic.").
- Segmented control "Where is the check?": None, Server, Registry, Both.
- Two switches: "The request skips the server and goes straight to the registry" and
  "The server reads the registry with one account that may read everything".
- A small three-box diagram in the well, reusing the node style of §4.8: developer →
  server → registry, or developer → registry when the request skips the server. A
  shield icon sits on each box that checks. The path is drawn `--good` with a "blocked"
  bar across it at the first box that stops it, or `--critical` end to end with the word
  "exposed". Wide `viewBox="0 0 720 160"`: boxes 160 × 64 at (110, 80), (360, 80),
  (610, 80); the direct path arcs over the server box through (360, 20). Narrow
  `viewBox="0 0 360 300"`: boxes 240 × 52 at (180, 40), (180, 150), (180, 260); the
  direct path runs down the end side at x = 330.
- Readouts: "May read" (`300 of 500`), "Should not see" (200), "Exposed in this case"
  (`exposedRepos`), and a verdict chip, blocked or exposed (icon plus word).
- Under it: `org.illustrative`, and "A model of one common design, not a description of
  a product." (`explorer.access.modelNote`).

### 4.10 `landscape` (lesson 4): the layered map

`src/graph/landscape.ts`

```ts
export type LayerId = 'format' | 'indexer' | 'storage' | 'serving' | 'org';
export type PieceStatus = 'spec' | 'project' | 'pattern';
// spec = an openly published specification or format; project = an open-source project;
// pattern = something each organization assembles itself
export interface Piece { id: string; layer: LayerId; name: string; status: PieceStatus; source: string | null }
export const LAYERS: LayerId[];          // in this order, drawn top to bottom
export const PIECES: Piece[];
export function piecesIn(layer: LayerId): Piece[];
export function countByStatus(layer: LayerId): Record<PieceStatus, number>;
```

`PIECES` (names are proper nouns in Latin, never translated; `source` is the URL from §2
and is rendered as an external link, `rel="noopener noreferrer"`, opening in a new tab):

| Layer | id | name | status | §2 row |
|---|---|---|---|---|
| format | `lsif` | LSIF | spec | F8 |
| format | `scip` | SCIP | spec | F3, F7 |
| format | `kythe-schema` | Kythe graph schema | spec | F9 |
| indexer | `tree-sitter` | tree-sitter | project | F1 |
| indexer | `scip-indexers` | SCIP indexers (one per language) | project | F5, F6 |
| indexer | `kythe-indexers` | Kythe indexers | project | F9 |
| indexer | `codeql` | CodeQL extractors and databases | project | F12 |
| storage | `glean` | Glean | project | F11 |
| storage | `central-index` | One central index | pattern | F10 |
| storage | `registry` | Registry of snapshots, by repo and commit | pattern | P1 |
| serving | `mcp` | Model Context Protocol (MCP) | spec | F21 to F25 |
| serving | `lsp` | Language Server Protocol (LSP) | spec | F8 |
| serving | `graph-tools` | Which tools a graph server offers | pattern | F25 |
| org | `backstage` | Backstage software catalog | project | F19 |
| org | `openapi` | OpenAPI | spec | F14 |
| org | `asyncapi` | AsyncAPI | spec | F16 |
| org | `protobuf` | Protocol Buffers | spec | F15 |
| org | `graphql` | GraphQL | spec | F17 |
| org | `spdx` | SPDX | spec | F20 |
| org | `cyclonedx` | CycloneDX | spec | F20 |
| org | `joining` | Joining code, contracts and ownership into one graph | pattern | F18 |

Tests: 21 pieces; `countByStatus` per layer = format 3/0/0, indexer 0/4/0, storage 0/1/2,
serving 2/0/1, org 6/1/1 (spec/project/pattern); every non-pattern piece has a `source`
that starts with `https://`; every pattern piece has `source: null` except
`central-index`, whose source is the F10 URL.

`status` is deliberately coarse. `spec` does not mean "ratified by a standards body":
the status legend says "published openly" and the only body named anywhere is ECMA for
CycloneDX, inside that piece's description.

Config: `{ kind: 'landscape', layer: LayerId, caption? }`.

Component `LandscapeExplorer`:

- The map: five full-width layer bands stacked top to bottom in `LAYERS` order, each a
  `<button>` (not SVG; plain HTML so text wraps and scales): layer name, a one-line
  question the layer answers, and three count chips with icon and word ("3 open specs",
  "0 projects", "0 patterns"). The selected band has the `--accent` stroke and
  `aria-pressed="true"`. The same layout serves 390 px and 1440 px; from 720 px the
  detail panel sits beside the bands (two columns), below that it sits under the
  selected band.
- Arrow keys move between bands (roving `tabindex`); this is the "handle" of the lesson.
- Detail panel for the selected layer: its pieces as rows: name (`.sci`-free, plain
  Latin, `dir="ltr"`), a status chip (icon plus word: document icon "open spec", cube
  icon "open-source project", puzzle icon "each organization's own"), one descriptive
  sentence (`explorer.landscape.piece.<id>`), and a "source" link when there is one.
- Then two fixed paragraphs per layer: "What is standardized here"
  (`explorer.landscape.layer.<id>.standard`) and "What is not"
  (`explorer.landscape.layer.<id>.notStandard`).
- Footer line of the bench: "A company's internal setup is known only from what it has
  published. Everything else is unknown." (`explorer.landscape.unknown`).

### 4.11 Hero and lesson-card signatures

- **Home hero** reuses `HeroSignature` unchanged with
  `src/graph/heroCurve.ts`:

  ```ts
  export const HERO_CURVE: HeroCurveConfig = {
    domain: [0, 4],
    fn: (x) => dependents(BASE_GRAPH, 'money.format_price', Math.round(x)).length,
    tagText: (x) => {
      const h = Math.round(x);
      return `steps = ${h} · affected = ${dependents(BASE_GRAPH, 'money.format_price', h).length}`;
    },
  };
  ```

  The curve is a staircase (0, 1, 2, 5, 6): blast radius against steps. It is honest (a
  function result at every sample) and it is a handle on a curve. `hero.signatureHint`:
  he `גררו כדי להרחיב את רדיוס הפגיעה`, en `Drag to widen the blast radius`.
- **Lesson cards** use `lessonSignature(lesson)` in `src/graph/lessonSignature.ts`,
  switching on `explorers[0].kind`, 200 × 48 viewBox, built from the same functions:

  | kind | Drawing |
  |---|---|
  | `searchCost` | six short horizontal ticks (one per hit of `format_price`, count from `searchCost`), the relevant one in `--good`, handle path a straight line under them |
  | `graphView` | the staircase of `dependents(...).length` for hops 0 to 4, `--accent` |
  | `askGraphs` | three dots joined by two lines, one line solid `--series-a`, one dashed `--series-b` |
  | `landscape` | five stacked horizontal bars of equal width, `--accent` to `--accent-2` |
  | `scale` | two bars on a log scale: `publishOnce` and `everyMachineEverything` at the config's values |
  | `topology` | three small squares in a row above one wide rectangle, joined by lines |
  | `cadence` | evenly spaced ticks with one publish marker; count = min(commitsPerDay, 12) |

  `staleness` and `access` are never first in a lesson; the switch still handles them by
  returning the `scale` and `cadence` drawings respectively, so it stays exhaustive.

---

## 5. Schema, files, strings

### 5.1 `src/content/schema.ts`

Copy Chemistry's file. Keep `LocalizedString`, `McqQuestion`, `NumericQuestion`,
`Question`, `Lesson` unchanged. Replace the topic enum and every explorer config:

```ts
export const TopicId = z.enum(['code-graphs']);

const caption = LocalizedString.optional();
export const SearchTerm = z.enum(['format_price', 'get_order', 'total_price']);
export const QuestionId = z.enum(['callers', 'callees', 'fieldReaders']);
export const ToyNodeId = z.enum([
  'money.format_price', 'money.round_cents', 'legacy.format_price', 'legacy.export_csv',
  'api.get_order', 'api.load_order', 'web.renderOrderCard', 'web.fetchOrder',
  'endpoint.getOrder', 'field.id', 'field.total_price',
]);
export const LayerId = z.enum(['format', 'indexer', 'storage', 'serving', 'org']);
export const TopologyId = z.enum(['local', 'central', 'hybrid', 'sharded']);
export const CadenceId = z.enum(['everyMerge', 'hourly', 'nightly', 'weekly']);
export const CheckAt = z.enum(['none', 'server', 'registry', 'both']);
const Repos = z.union([z.literal(10), z.literal(50), z.literal(100), z.literal(200), z.literal(500), z.literal(1000), z.literal(2000), z.literal(5000)]);
const Developers = z.union([z.literal(10), z.literal(100), z.literal(500), z.literal(1000), z.literal(5000), z.literal(10000), z.literal(20000), z.literal(50000), z.literal(100000)]);

export const SearchCostConfig = z.object({ kind: z.literal('searchCost'), term: SearchTerm, bothRepos: z.boolean(), caption }).strict();
export const GraphViewConfig = z.object({ kind: z.literal('graphView'), start: ToyNodeId, hops: z.number().int().min(0).max(4), caption }).strict();
export const AskGraphsConfig = z.object({ kind: z.literal('askGraphs'), question: QuestionId, caption }).strict();
export const LandscapeConfig = z.object({ kind: z.literal('landscape'), layer: LayerId, caption }).strict();
export const ScaleConfig = z.object({ kind: z.literal('scale'), repos: Repos, developers: Developers, reposPerDeveloper: z.number().int().min(1).max(20), caption }).strict();
export const StalenessConfig = z
  .object({ kind: z.literal('staleness'), publishedAt: z.number().int().min(0).max(4), head: z.number().int().min(0).max(4), caption })
  .strict()
  .refine((c) => c.publishedAt <= c.head, { message: 'publishedAt must not be after head', path: ['publishedAt'] });
export const TopologyConfig = z.object({
  kind: z.literal('topology'), topology: TopologyId, repos: Repos, developers: Developers,
  reposPerDeveloper: z.number().int().min(1).max(20), shards: z.number().int().min(2).max(8), caption,
}).strict();
export const CadenceConfig = z.object({ kind: z.literal('cadence'), repos: Repos, commitsPerDay: z.number().int().min(0).max(50), cadence: CadenceId, caption }).strict();
export const AccessConfig = z.object({ kind: z.literal('access'), repos: Repos, readableShare: z.number().int().min(0).max(100).multipleOf(10), checkAt: CheckAt, caption }).strict();

export const ExplorerConfig = z.discriminatedUnion('kind', [
  SearchCostConfig, GraphViewConfig, AskGraphsConfig, LandscapeConfig, ScaleConfig,
  StalenessConfig, TopologyConfig, CadenceConfig, AccessConfig,
]);
```

If Zod's `discriminatedUnion` rejects the refined `StalenessConfig`, do what Math does
with its refined configs (Math's `IntegralExplorerConfig` is refined and sits in the
same kind of union); do not drop the refinement.

The enums in `schema.ts` and the types in `src/graph/*.ts` must agree; a test asserts
`ToyNodeId.options` equals the base graph's node ids, and likewise for `LayerId`,
`REPO_STEPS`, `DEVELOPER_STEPS`.

### 5.2 Files

Start: `cp -r apps/chemistry apps/codegraph`, then remove `node_modules`, `docs/review/*`
and `src/chemistry/`.

| Path under `apps/codegraph/` | Action |
|---|---|
| `package.json`, `package-lock.json` | name `academy-codegraph` (two places in the lock file); description "Playful, bilingual (Hebrew/English) interactive lessons on code graphs for coding agents: Code Graph Academy pilot." |
| `vite.config.ts` | base `/academy/subjects/codegraph/`, outDir `../../docs/subjects/codegraph`, env names `ACADEMY_CODEGRAPH_BASE`, `ACADEMY_CODEGRAPH_OUT_DIR`, comment URL |
| `index.html` | §1.1 titles and meta, §1.3 theme-color, pre-paint keys `academy-codegraph:theme` / `:locale`, remove image meta tags |
| `public/favicon.svg` | §1.4 |
| `README.md` | rewrite: what it is, unlisted, commands, the facts table lives in `CODEGRAPH_LLD.md` §2, open items |
| `src/styles.css` | replace the PALETTE block with §1.3 and its header comment; SKIN BASE unchanged except §4.0 rule 6; add the small classes this spec needs (`.lane`, `.tnode`, `.verdict-*`, `.code-panel`) below SKIN BASE under a `/* === CODEGRAPH === */` banner |
| `src/app/providers.tsx`, `src/progress/store.ts`, `src/i18n/index.ts` | rename every `academy-chemistry` to `academy-codegraph` (theme key, locale key, persist name) |
| `src/progress/achievements.ts` + its test | §5.5 |
| `src/progress/sanitize.ts`, `selectors.ts`, `AchievementToast`, `ProgressRing`, `Quiz.tsx`, `Shell.tsx`, `router.tsx`, `ui/*`, `content/index.ts`, `content/localize.ts`, `audio/*` | copy unchanged (check `Quiz.tsx` per §3.2) |
| `src/components/ui/Icon.tsx` | add glyphs: `repo`, `gear`, `stack`, `server`, `shield`, `laptop`, `doc`, `cube`, `puzzle`, `approx`, `emptyCircle`, `pause` (24 × 24, 1.6 px stroke, same style as the existing set) |
| `src/components/Logo.tsx` | §1.4 mark |
| `src/components/FeedbackWidget.tsx` | constant `WEB3FORMS_ACCESS_KEY = 'REPLACE_WITH_WEB3FORMS_KEY_FOR_academy-codegraph'`; comment: Guy creates the key with `edenguy+academy-codegraph@gmail.com`. Do not invent a key. |
| `src/components/ChemistryExplorer.tsx` | delete |
| `src/components/LessonExplorer.tsx` | rewrite: a `switch (config.kind)` over the nine kinds |
| `src/components/explorers/` (new) | `SearchCostExplorer.tsx`, `GraphViewExplorer.tsx`, `AskGraphsExplorer.tsx`, `LandscapeExplorer.tsx`, `ScaleExplorer.tsx`, `StalenessExplorer.tsx`, `TopologyExplorer.tsx`, `CadenceExplorer.tsx`, `AccessExplorer.tsx`, plus shared `ToyGraphSvg.tsx` (used by `graphView` and `staleness`), `FigureAlt.tsx` (figure, caption, hidden list), `useNarrow.ts`, `OrgNote.tsx` |
| `src/graph/` (new) | `toy.ts`, `search.ts`, `graph.ts`, `answers.ts`, `staleness.ts`, `scale.ts`, `cadence.ts`, `topology.ts`, `access.ts`, `landscape.ts`, `heroCurve.ts`, `lessonSignature.ts`, and one `*.test.ts` per module with the hand-checked tables of §4 |
| `src/content/schema.ts` | §5.1 |
| `src/content/topics.ts` | one topic, §1.1 |
| `src/content/lessons/*.yaml` | delete the six chemistry files; add the seven of §3 |
| `src/content/content.test.ts` (new) | tests T-1 to T-5 of §6 |
| `src/features/home/HomePage.tsx`, `src/features/lesson/LessonPage.tsx` | change the two imports from `@/chemistry/*` to `@/graph/heroCurve` and `@/graph/lessonSignature`; add the `org.illustrative` line under the hero; nothing else |
| `src/i18n/locales/en.json`, `he.json` | §5.4 |
| `scripts/export-lessons.mjs`, `export-pdf.mjs`, `lib/lessons.mjs` | output names `codegraph-lessons.<locale>.md/.pdf`; titles `Code Graph Academy (review copy)` / `אקדמיית גרף הקוד (עותק לבדיקה)` |
| `scripts/render-og-cards.mjs`, `scripts/og-card.html` | delete (no share cards) |
| `docs/subjects/codegraph/` (repo root) | build output, committed |

### 5.3 Home page copy

The home page is Chemistry's dashboard, unchanged in structure.

| Key | he | en |
|---|---|---|
| `app.name` | אקדמיית גרף הקוד | Code Graph Academy |
| `app.unofficial` | כלי לימוד עצמאי ובלתי רשמי | An independent, unofficial study tool |
| `home.eyebrowNew` | פיילוט חדש | New pilot |
| `home.heroTitle` | בואו לראות | Come see |
| `home.heroTitle2` | איך סוכן קוד מוצא את הדרך | how a coding agent finds its way |
| `home.heroBody` | שבעה שיעורים עם סימולציה חיה: מהו גרף קוד, אילו סוגים יש, האם יש תקן, ואיך כל זה נראה בארגון של מאות מאגרים ואלפי מפתחים. בלי ידע מוקדם. | Seven lessons with a live simulation: what a code graph is, which kinds exist, whether there is a standard, and what it all looks like in an organization of hundreds of repos and thousands of developers. No prior knowledge needed. |
| `home.curriculumNote` | הקורס מלמד רעיונות כלליים. הוא לא מתאר שום חברה מסוימת, והארגון שבדוגמאות הוא בדוי. | The course teaches general ideas. It describes no particular company, and the organization in the examples is made up. |
| `hero.signatureHint` | גררו כדי להרחיב את רדיוס הפגיעה | Drag to widen the blast radius |
| `org.illustrative` | ארגון לדוגמה. המספרים הם פרמטרים שאפשר לשנות, ולא נתון על חברה אמיתית. | An example organization. The numbers are parameters you can change, not data about a real company. |
| `dashboard.startBody` | בחרו שיעור למטה, או קפצו ישר לראשון. | Pick a lesson below, or jump straight into the first one. |
| `footer.disclaimer` | אקדמיית גרף הקוד היא כלי לימוד עצמאי ובלתי רשמי. היא אינה קשורה לאף אחד מהפרויקטים או מהחברות שנזכרים בה, והדוגמאות בה בדויות. | Code Graph Academy is an independent, unofficial study tool. It is not affiliated with any project or company it mentions, and its examples are made up. |
| `footer.credit` | נוצר על ידי גיא עדן | Created by Guy Eden |

All other `home.*`, `dashboard.*`, `quiz.*`, `feedback.*`, `settings.*`, `nav.*`,
`common.*` keys: copy from Chemistry unchanged. The "free" wording does not appear
anywhere in this app.

### 5.4 Explorer strings (`lesson.*` and `explorer.*`)

Delete every Chemistry-specific key under `lesson` (`states`, `arrangements`,
`materials`, `probes` and the explorer labels). Keep `lesson.backHome`,
`lesson.keyPointsTitle`, `lesson.quizTitle`, `lesson.prevLesson`, `lesson.nextLesson`,
`lesson.backToLessons`. Set `lesson.explorerIntro` to he `נסו בעצמכם` / en `Try it
yourself`. Add the `explorer` section below. Keys are listed as `key: he | en`.
Interpolation uses i18next `{{name}}`; counts are passed already formatted.

```
explorer.common.steps:            צעד {{current}} מתוך {{total}} | Step {{current}} of {{total}}
explorer.common.next:             הבא | Next
explorer.common.back:             הקודם | Back
explorer.common.yes:              כן | Yes
explorer.common.no:               לא | No
explorer.common.of:               {{a}} מתוך {{b}} | {{a}} of {{b}}
explorer.common.source:           מקור | Source
explorer.common.notOnMachine:     לא נמצא על המחשב הזה | Not on this machine
explorer.common.haveSource:       קוד המקור של המאגר הזה נמצא אצלי | I have this repo's source
explorer.common.webShopHere:      המאגר web-shop נמצא על המחשב שלי | The web-shop repo is on my machine

explorer.question.callers:        מי קורא ל-format_price שב-money.py? | Who calls format_price in money.py?
explorer.question.callees:        למה get_order קוראת? | What does get_order call?
explorer.question.fieldReaders:   מי קורא את השדה total_price? | Who reads the field total_price?

explorer.search.step:             צעד של הסוכן | Agent step
explorer.search.hits:             תוצאות חיפוש | Search hits
explorer.search.filesOpened:      קבצים שנפתחו | Files opened
explorer.search.linesRead:        שורות שנקראו | Lines read
explorer.search.linesAnswer:      שורות שעונות על השאלה | Lines that answer
explorer.search.stepAsk:          הסוכן מקבל את השאלה. עוד לא פתח שום דבר. | The agent gets the question. It has opened nothing yet.
explorer.search.stepSearch:       הסוכן מחפש את המילה. חוזרות {{hits}} שורות ב-{{files}} קבצים. | The agent searches for the word. {{hits}} lines come back, in {{files}} files.
explorer.search.stepOpen:         הסוכן פותח את {{file}} וקורא אותו. עד עכשיו קרא {{lines}} שורות. | The agent opens {{file}} and reads it. {{lines}} lines read so far.
explorer.search.collapsed:        עוד {{n}} שורות | {{n}} more lines
explorer.search.withGraph:        עם גרף: שאילתה אחת ← | With a graph: 1 query →
explorer.role.definition:         הגדרה | Definition
explorer.role.call:               קריאה | Call
explorer.role.import:             ייבוא | Import
explorer.role.comment:            הערה | Comment
explorer.role.fieldWrite:         כתיבה של השדה | Writes the field
explorer.role.fieldRead:          קריאה של השדה | Reads the field
explorer.role.otherTarget:        קריאה לפונקציה האחרת | Call to the other function
explorer.role.answer:             זו התשובה | This is the answer

explorer.graph.nodes:             צמתים | Nodes
explorer.graph.edges:             קשתות | Edges
explorer.graph.start:             נקודת התחלה | Start
explorer.graph.affected:          מושפעים | Affected
explorer.graph.hops:              מרחק בצעדים | Steps away
explorer.graph.dependsOn:         תלוי ב | Depends on
explorer.graph.dependedOnBy:      תלויים בו | Is depended on by
explorer.graph.filterNote:        הסינון משנה רק את מה שמצויר. הספירה היא על כל הגרף. | The filter changes only what is drawn. The count uses the whole graph.
explorer.graph.figure:            גרף של חנות הצעצוע: 11 צמתים ו-10 קשתות בשני מאגרים | The toy shop as a graph: 11 nodes and 10 edges in two repos
explorer.kind.function:           פונקציה | Function
explorer.kind.endpoint:           נקודת קצה | Endpoint
explorer.kind.field:              שדה | Field
explorer.kind.contractGroup:      חוזה ה-API | API contract
explorer.edge.calls:              קורא ל | calls
explorer.edge.requests:           פונה אל | requests
explorer.edge.handledBy:          מטופל על ידי | is handled by
explorer.edge.reads:              קורא את | reads
explorer.edge.partOf:             חלק מ | is part of

explorer.ask.structure:           מבנה | Structure
explorer.ask.identity:            זהות | Identity
explorer.ask.interface:           ממשק | Interface
explorer.ask.buildBroken:         הבנייה שבורה | The build is broken
explorer.ask.publishedNote:       שלושת הגרפים כאן פורסמו לשני המאגרים. המתג משפיע רק על החיפוש. | The three graphs here were published for both repos. The switch affects only the search.
explorer.ask.truth:               התשובה הנכונה | The correct answer
explorer.ask.col.search:          חיפוש טקסט | Text search
explorer.ask.col.syntax:          גרף תחבירי | Syntax graph
explorer.ask.col.index:           אינדקס מהדר | Compiler index
explorer.ask.col.contract:        גרף חוזים | Contract graph
explorer.ask.built.search:        מחפש אותיות בקבצים שעל המחשב | Looks for letters in the files on the machine
explorer.ask.built.syntax:        נבנה על ידי מנתח תחביר, קובץ אחר קובץ. מכיר שמות. | Built by a parser, file by file. Knows names.
explorer.ask.built.index:         נבנה בעזרת המהדר. מכיר כל סמל בדיוק. | Built with the compiler. Knows each symbol exactly.
explorer.ask.built.contract:      נבנה מממשקים מוצהרים וממי שהצהיר שהוא משתמש בהם. | Built from declared interfaces and their declared users.
explorer.ask.searchLine:          {{relevant}} מתוך {{hits}} תוצאות עונות על השאלה · {{files}} קבצים לפתוח | {{relevant}} of {{hits}} hits answer the question · {{files}} files to open
explorer.verdict.right:           מדויק | Exact
explorer.verdict.imprecise:       לא חד-משמעי | Ambiguous
explorer.verdict.blind:           עיוור | Blind
explorer.verdict.unavailable:     אין אינדקס | No index
explorer.ask.why.syntax.callers.imprecise:   יש שתי הגדרות בשם הזה, והגרף מתאים לפי שם. אחד משני המועמדים שגוי. | Two definitions share this name and the graph matches by name. One of the two candidates is wrong.
explorer.ask.why.syntax.callers.right:       נשארה רק הגדרה אחת בשם הזה, אז ההתאמה לפי שם מספיקה. | Only one definition with this name is left, so matching by name is enough.
explorer.ask.why.syntax.callees.right:       הקריאות כתובות בגוף הפונקציה, ומנתח תחביר רואה אותן. | The calls are written in the function body, and a parser sees them.
explorer.ask.why.syntax.fieldReaders.blind:  בצד אחד יש מחרוזת ובצד השני תכונה. מבחינת התחביר אין ביניהן קשר. | One side has a string, the other a property. To the syntax they are unrelated.
explorer.ask.why.index.callers.right:        המהדר פענח כל קריאה להגדרה אחת. | The compiler resolved each call to one definition.
explorer.ask.why.index.callees.right:        אותו דבר: כל קריאה מפוענחת לסמל מדויק. | The same: each call is resolved to an exact symbol.
explorer.ask.why.index.fieldReaders.blind:   לכל שפה יש אינדקס משלה, ובקשת HTTP ביניהן היא לא סמל. | Each language has its own index, and an HTTP request between them is not a symbol.
explorer.ask.why.index.unavailable:          המהדר לא הצליח לעבד את הפרויקט, ולכן בדרך כלל אין אינדקס ל-commit הזה. | The compiler could not process the project, so there is usually no index for this commit.
explorer.ask.why.contract.fieldReaders.right: השדה הוא חלק מממשק מוצהר, ומי שקורא אותו רשום. | The field is part of a declared interface, and its reader is on record.
explorer.ask.why.contract.blind:             זה קורה בתוך השירות. חוזה מכיר רק את הגבול שלו. | This happens inside the service. A contract knows only its boundary.

explorer.scale.repos:             מאגרי קוד | Repos
explorer.scale.developers:        מפתחים | Developers
explorer.scale.reposPerDeveloper: מאגרים שכל מפתח עובד עליהם | Repos each developer works on
explorer.scale.s.everyMachineEverything: כל מחשב מאנדקס הכול | Every machine indexes everything
explorer.scale.s.everyMachineOwn: כל מחשב מאנדקס רק את שלו | Every machine indexes only its own
explorer.scale.s.publishOnce:     מאנדקסים פעם אחת ומפרסמים | Index once and publish
explorer.scale.builds:            בניות של אינדקס | Index builds
explorer.scale.reach:             מאגרים שהסוכן רואה: {{a}} מתוך {{b}} ({{pct}}%) | Repos the agent can see: {{a}} of {{b}} ({{pct}}%)
explorer.scale.rebuilds:          בניות מחדש אחרי מיזוג אחד: {{n}} | Rebuilds after one merge: {{n}}
explorer.scale.logScale:          אורך הפסים בקנה מידה לוגריתמי | Bar lengths use a log scale
explorer.scale.arithmetic:        זה חשבון על המספרים שלמעלה, לא מדידה. | This is arithmetic on the numbers above, not a measurement.

explorer.staleness.head:          ראש הענף | Head
explorer.staleness.published:     הפרסום האחרון | Last publish
explorer.staleness.publishNow:    לפרסם עכשיו | Publish now
explorer.staleness.behind:        צעדים מאחור | Commits behind
explorer.staleness.stillTrue:     עדיין נכונות | Still true
explorer.staleness.phantom:       מתארות קוד שכבר לא קיים | Describe code that is gone
explorer.staleness.missing:       חסרות בתמונת המצב | Missing from the snapshot
explorer.staleness.commit.c1:     השם round_cents שונה ל-round_money | round_cents is renamed round_money
explorer.staleness.commit.c2:     הקובץ orders/legacy.py נמחק | orders/legacy.py is deleted
explorer.staleness.commit.c3:     ב-web-shop נוספה renderReceipt, שגם היא מציגה את המחיר | web-shop adds renderReceipt, which also shows the price
explorer.staleness.commit.c4:     נערכה הערה. שום קשר לא השתנה. | A comment is edited. No relation changed.
explorer.staleness.snapshotSays:  תמונת המצב אומרת | The snapshot says
explorer.staleness.codeSays:      הקוד אומר | The code says
explorer.staleness.mismatch:      לא תואם | Does not match
explorer.staleness.decision.trust:      תמונת המצב מעודכנת. אפשר לסמוך עליה. | The snapshot is current. Trust it.
explorer.staleness.decision.verifyLive: תמונת המצב מאחור והקוד בהישג יד. בודקים ישירות בקוד. | The snapshot is behind and the source is at hand. Check the code directly.
explorer.staleness.decision.answerAsOf: תמונת המצב מאחור ואין קוד מקור. עונים, ומציינים לאיזה commit התשובה נכונה. | The snapshot is behind and there is no source. Answer, and say which commit the answer is for.
explorer.staleness.figure:        ציר זמן של חמישה שלבים, עם ראש הענף והפרסום האחרון, ומתחתיו הגרף | A timeline of five commits with the head and the last publish, and the graph below it

explorer.cadence.commitsPerDay:   שינויים למאגר ביום | Commits per repo per day
explorer.cadence.yourNumber:      המספר שלכם. דוגמה, לא נתון סטטיסטי. | Your number. An example, not a statistic.
explorer.cadence.pipeline:        משך תהליך הפרסום (דקות) | Pipeline duration (minutes)
explorer.cadence.c.everyMerge:    בכל מיזוג | On every merge
explorer.cadence.c.hourly:        כל שעה | Every hour
explorer.cadence.c.nightly:       פעם בלילה | Once a night
explorer.cadence.c.weekly:        פעם בשבוע | Once a week
explorer.cadence.behind:          תשובה יכולה להיות עד {{n}} צעדים מאחור | An answer can be up to {{n}} commits behind
explorer.cadence.lessThanOne:     פחות מ-1 | less than 1
explorer.cadence.publishes:       פרסומים ביום ב-{{repos}} מאגרים | Publishes a day across {{repos}} repos
explorer.cadence.assumption:      החשבון מניח שהשינויים מתפזרים באופן אחיד על פני היום. | Assumes commits are spread evenly over the day.
explorer.cadence.figure:          ציר זמן של יום אחד עם שינויים ונקודות פרסום | One day as a timeline, with commits and publish points

explorer.topology.t.local:        מקומי | Local
explorer.topology.t.central:      מרכזי | Central
explorer.topology.t.hybrid:       משולב | Hybrid
explorer.topology.t.sharded:      מפוצל | Sharded
explorer.topology.lane.product:   צוותי מוצר (בעלי המאגרים) | Product teams (repo owners)
explorer.topology.lane.platform:  צוות פלטפורמה | Platform team
explorer.topology.lane.security:  אבטחה והרשאות | Security and access
explorer.topology.lane.developers: מפתחים | Developers
explorer.topology.node.repo:      מאגר קוד | Repo
explorer.topology.node.ci:        CI: בונה אינדקס ומפרסם | CI: builds the index, publishes
explorer.topology.node.registry:  מרשם תמונות מצב | Snapshot registry
explorer.topology.node.server:    שרת MCP | MCP server
explorer.topology.node.policy:    מי רשאי לקרוא מה | Who may read what
explorer.topology.node.machine:   מחשב של מפתח | Developer machine
explorer.topology.node.agent:     סוכן | Agent
explorer.topology.node.client:    לקוח MCP | MCP client
explorer.topology.node.local:     גרף מקומי + שרת MCP מקומי | Local graph + local MCP server
explorer.topology.m.servers:      שרתים פעילים | Servers running
explorer.topology.m.builds:       בניות של אינדקס | Index builds
explorer.topology.m.reach:        מאגרים בהישג הסוכן | Repos the agent can reach
explorer.topology.m.affected:     מפתחים שמאבדים את השירות אם שרת אחד נופל | Developers who lose it if one server fails
explorer.topology.m.uncommitted:  רואה שינויים שעוד לא נכנסו ל-commit | Sees uncommitted work
explorer.topology.m.survives:     העבודה שלכם שורדת תקלה מרכזית | Own work survives a central failure
explorer.topology.shards:         שרתים | Servers
explorer.topology.changeOrg:      לשנות את הארגון | Change the organization
explorer.topology.assumptions:    ההנחות: המפתחים מתחלקים שווה בשווה בין השרתים, ואין גיבוי. במשולב, "מאבדים" פירושו תשובות על מאגרים של אחרים. | Assumptions: developers are split evenly between servers, with no failover. In hybrid, "lose" means answers about other people's repos.
explorer.topology.track.question: שאלה | A question
explorer.topology.track.publish:  פרסום | A publish
explorer.topology.ownedBy:        באחריות | Owned by
explorer.topology.does:           מה זה עושה | What it does
explorer.topology.here:           בסידור הזה | In this arrangement
explorer.topology.notUsed:        לא בשימוש בסידור הזה | Not used in this arrangement
explorer.topology.figure:         תרשים של ארגון לדוגמה בארבעה מסלולים: צוותי מוצר, פלטפורמה, אבטחה והרשאות, מפתחים | A diagram of an example organization in four lanes: product teams, platform, security and access, developers
explorer.topology.edge.merge:     שינוי ממוזג ומפעיל את ה-CI | A change is merged and triggers CI
explorer.topology.edge.snapshot:  ה-CI שומר תמונת מצב במרשם | CI stores a snapshot in the registry
explorer.topology.edge.load:      השרת טוען תמונות מצב מהמרשם | The server loads snapshots from the registry
explorer.topology.edge.ask:       לקוח ה-MCP קורא לכלי בשרת | The MCP client calls a tool on the server
explorer.topology.edge.policy:    כלל ההרשאות חל כאן | The access rule applies here
explorer.topology.edge.clone:     המפתח מוריד את המאגר למחשב | The developer clones the repo

explorer.topology.does.repo:      מחזיק את קוד המקור של צוות אחד. | Holds one team's source code.
explorer.topology.does.ci:        רץ אחרי כל מיזוג, מריץ את כלי האינדוקס ושומר את התוצאה. | Runs after every merge, runs the indexer and stores the result.
explorer.topology.does.registry:  רושם איזו תמונת מצב שייכת לאיזה מאגר ולאיזה commit. | Records which snapshot belongs to which repo and which commit.
explorer.topology.does.server:    מקבל שאלות מסוכנים כקריאות לכלים ועונה מתוך תמונות המצב. | Takes questions from agents as tool calls and answers from the snapshots.
explorer.topology.does.policy:    הכלל שקובע מי רשאי לקרוא איזה מאגר. תמונת מצב יורשת אותו מהמאגר שלה. | The rule for who may read which repo. A snapshot inherits it from its repo.
explorer.topology.does.machine:   מריץ את הסוכן. בתוך הסוכן יש לקוח MCP, אחד לכל שרת שהוא מחובר אליו. | Runs the agent. Inside the agent there is one MCP client per server it is connected to.

explorer.topology.here.repo.local:      רק מאגרים שהורדו למחשב נראים לסוכן. | Only repos cloned to the machine are visible to the agent.
explorer.topology.here.repo.other:      כל מיזוג מפעיל פרסום של תמונת מצב חדשה. | Every merge triggers the publish of a new snapshot.
explorer.topology.here.ci.used:         בנייה אחת לכל מאגר, לא לכל מחשב. | One build per repo, not per machine.
explorer.topology.here.registry.used:   המקור היחיד שממנו השרתים טוענים. | The one place the servers load from.
explorer.topology.here.server.central:  שרת אחד לכל המפתחים. כולם תלויים בו. | One server for all developers. Everyone depends on it.
explorer.topology.here.server.hybrid:   עונה על מאגרים של אחרים. על עותק העבודה שלכם עונה השרת המקומי. | Answers about other people's repos. The local server answers about your working copy.
explorer.topology.here.server.sharded:  כל שרת משרת חלק מהמפתחים, וכולם מגישים את אותן תמונות מצב. | Each server serves part of the developers, and all serve the same snapshots.
explorer.topology.here.policy.local:    הבדיקה היחידה היא אם יכולתם להוריד את המאגר. | The only check is whether you could clone the repo.
explorer.topology.here.policy.other:    צריך להיאכף במרשם, בשרת, או בשניהם. ראו שיעור 7. | Has to be enforced at the registry, at the server, or both. See lesson 7.
explorer.topology.here.machine.local:   בונה את הגרפים בעצמו ומריץ שרת מקומי כתת-תהליך. | Builds its own graphs and runs a local server as a subprocess.
explorer.topology.here.machine.central: לא בונה שום דבר. רק שואל את השרת המרכזי. | Builds nothing. It only asks the central server.
explorer.topology.here.machine.hybrid:  בונה גרף לעותק העבודה שלו, ושואל את השרת המרכזי על כל השאר. | Builds a graph of its own working copy and asks the central server about the rest.
explorer.topology.here.machine.sharded: שואל את השרת שהוקצה לו. | Asks the server it is assigned to.

explorer.topology.step.q1:  הסוכן צריך עובדה על קוד במאגר של צוות אחר. | The agent needs a fact about code in another team's repo.
explorer.topology.step.q2:  לקוח ה-MCP קורא לכלי בשרת. | The MCP client calls a tool on the server.
explorer.topology.step.q3:  השרת בודק מה מותר לפונה לקרוא. | The server checks what the caller may read.
explorer.topology.step.q4:  השרת קורא את תמונת המצב שרשומה במרשם. | The server reads the snapshot listed in the registry.
explorer.topology.step.q5:  התשובה חוזרת לסוכן, יחד עם ה-commit של תמונת המצב. | The answer returns to the agent, with the snapshot's commit.
explorer.topology.step.h1:  הסוכן צריך שתי עובדות: אחת על הקוד שלכם ואחת על קוד של צוות אחר. | The agent needs two facts: one about your code and one about another team's.
explorer.topology.step.h2:  על עותק העבודה שלכם עונה השרת המקומי, כולל שינויים שעוד לא נכנסו ל-commit. | The local server answers about your working copy, uncommitted changes included.
explorer.topology.step.h3:  על המאגר האחר לקוח ה-MCP שואל את השרת המרכזי. | For the other repo the MCP client asks the central server.
explorer.topology.step.h4:  השרת המרכזי בודק הרשאות וקורא את תמונת המצב. | The central server checks access and reads the snapshot.
explorer.topology.step.h5:  התשובה חוזרת עם ה-commit שלה. לסוכן יש עכשיו את שתי העובדות. | The answer returns with its commit. The agent now has both facts.
explorer.topology.step.l1:  הסוכן צריך עובדה על קוד. | The agent needs a fact about code.
explorer.topology.step.l2:  לקוח ה-MCP שואל את השרת המקומי, שרץ על אותו מחשב. | The MCP client asks the local server, which runs on the same machine.
explorer.topology.step.l3:  השרת המקומי עונה מתוך גרף שנבנה ממאגר שהורד למחשב. | The local server answers from a graph built from a cloned repo.
explorer.topology.step.l4:  על מאגרים שלא הורדו אין את מי לשאול. | For repos that were not cloned there is no one to ask.
explorer.topology.step.p1:  שינוי ממוזג למאגר. | A change is merged into a repo.
explorer.topology.step.p2:  ה-CI מריץ את כלי האינדוקס על המאגר. | CI runs the indexer on the repo.
explorer.topology.step.p3:  תמונת המצב נשמרת, וה-commit שלה נרשם במרשם. | The snapshot is stored and its commit is recorded in the registry.
explorer.topology.step.p4:  השרתים טוענים את תמונת המצב החדשה. מעכשיו התשובות מעודכנות. | The servers load the new snapshot. Answers are current from now on.
explorer.topology.step.n1:  בסידור הזה לא מפרסמים דבר. כל מחשב מאנדקס לעצמו. | Nothing is published in this arrangement. Each machine indexes for itself.

explorer.access.share:            חלק המאגרים שהמפתח הזה רשאי לקרוא | Share of repos this developer may read
explorer.access.exampleNote:      דוגמה, לא נתון סטטיסטי. | An example, not a statistic.
explorer.access.where:            איפה הבדיקה? | Where is the check?
explorer.access.c.none:           אין | None
explorer.access.c.server:         בשרת | Server
explorer.access.c.registry:       במרשם | Registry
explorer.access.c.both:           בשניהם | Both
explorer.access.skipServer:       הבקשה עוקפת את השרת ופונה ישר למרשם | The request skips the server and goes straight to the registry
explorer.access.serviceAccount:   השרת קורא מהמרשם עם חשבון אחד שמותר לו לקרוא הכול | The server reads the registry with one account that may read everything
explorer.access.mayRead:          רשאי לקרוא | May read
explorer.access.shouldNotSee:     לא אמור לראות | Should not see
explorer.access.exposed:          נחשפים במקרה הזה | Exposed in this case
explorer.access.v.blocked:        נחסם | Blocked
explorer.access.v.exposed:        חשוף | Exposed
explorer.access.box.developer:    מפתח | Developer
explorer.access.box.server:       שרת MCP | MCP server
explorer.access.box.registry:     מרשם | Registry
explorer.access.modelNote:        זה מודל של תכנון נפוץ אחד, לא תיאור של מוצר. | A model of one common design, not a description of a product.
explorer.access.figure:           מסלול של בקשה מהמפתח אל המרשם, עם המקומות שבהם נבדקות הרשאות | The path of a request from the developer to the registry, with the places where access is checked

explorer.landscape.layer.format.name:     פורמט הנתונים | Data format
explorer.landscape.layer.format.q:        איך כותבים אינדקס לקובץ? | How is an index written to a file?
explorer.landscape.layer.format.standard: יש כמה פורמטים שפורסמו בפתוח, וכל אחד מהם מוגדר היטב. | Several formats are published openly, and each is well defined.
explorer.landscape.layer.format.notStandard: אין פורמט אחד שכולם הסכימו עליו. כלים שונים קוראים פורמטים שונים. | No single format that everyone agreed on. Different tools read different formats.
explorer.landscape.layer.indexer.name:    כלי אינדוקס | Indexers
explorer.landscape.layer.indexer.q:       מי מפיק את העובדות מהקוד? | Who extracts the facts from the code?
explorer.landscape.layer.indexer.standard: כלום. אלה פרויקטים של קוד פתוח, אחד לכל שפה. | Nothing. These are open-source projects, one per language.
explorer.landscape.layer.indexer.notStandard: רמת הכיסוי משתנה משפה לשפה, ולא לכל שפה יש כלי. | Coverage differs by language, and not every language has a tool.
explorer.landscape.layer.storage.name:    אחסון, שאילתות ומרשם | Storage, query and registry
explorer.landscape.layer.storage.q:       איפה העובדות נשמרות, ואיך שואלים? | Where are the facts kept, and how do you ask?
explorer.landscape.layer.storage.standard: כלום. יש מערכות קוד פתוח ויש תיאורים שחברות פרסמו. | Nothing. There are open-source systems and accounts that companies have published.
explorer.landscape.layer.storage.notStandard: המרשם, כלומר איזו תמונת מצב שייכת לאיזה מאגר ו-commit, נבנה בכל ארגון מחדש. | The registry, meaning which snapshot belongs to which repo and commit, is built anew in each organization.
explorer.landscape.layer.serving.name:    הגשה | Serving
explorer.landscape.layer.serving.q:       איך הסוכן שואל? | How does the agent ask?
explorer.landscape.layer.serving.standard: האופן שבו סוכן מגלה כלים וקורא להם. | How an agent discovers and calls tools.
explorer.landscape.layer.serving.notStandard: אילו כלים שרת גרף מציע, ומה הם מחזירים. את זה קובע מי שבונה את השרת. | Which tools a graph server offers and what they return. Whoever builds the server decides.
explorer.landscape.layer.org.name:        מידע ארגוני וחוזים | Organization metadata and contracts
explorer.landscape.layer.org.q:           מי אחראי על מה, ומה הממשקים? | Who owns what, and what are the interfaces?
explorer.landscape.layer.org.standard:    פורמטים לתיאור ממשקים ולרשימות רכיבים. | Formats for describing interfaces and for listing components.
explorer.landscape.layer.org.notStandard: החיבור בין קוד, חוזים ובעלות לגרף אחד. | Joining code, contracts and ownership into one graph.
explorer.landscape.status.spec:           מפרט פתוח | Open spec
explorer.landscape.status.project:        פרויקט קוד פתוח | Open-source project
explorer.landscape.status.pattern:        כל ארגון בונה בעצמו | Each organization's own
explorer.landscape.count.spec:            {{n}} מפרטים פתוחים | {{n}} open specs
explorer.landscape.count.project:         {{n}} פרויקטים | {{n}} projects
explorer.landscape.count.pattern:         {{n}} דפוסים | {{n}} patterns
explorer.landscape.unknown:               על המערך הפנימי של חברה יודעים רק ממה שהיא פרסמה. כל השאר לא ידוע. | A company's internal setup is known only from what it has published. Everything else is unknown.
explorer.landscape.piece.lsif:            פורמט שצמח מעולם ה-LSP, לניווט בקוד בלי עותק מקומי של המקור. | A format from the LSP world, for navigating code without a local copy of the source.
explorer.landscape.piece.scip:            סכמת protobuf פתוחה לאינדקס קוד. תוכננה על ידי Sourcegraph, בין השאר בעקבות קשיים עם LSIF. | An open protobuf schema for a code index. Designed by Sourcegraph, partly after pain points with LSIF.
explorer.landscape.piece.kythe-schema:    סכמת הגרף של Kythe, פרויקט קוד פתוח של Google שמטרתו חילופי מידע על קוד בלי תלות בשפה. | The graph schema of Kythe, an open-source project from Google that aims at language-agnostic exchange of facts about code.
explorer.landscape.piece.tree-sitter:     מחולל מנתחי תחביר וספריית ניתוח. נותן תוצאות שימושיות גם כשיש שגיאות תחביר. | A parser generator and parsing library. Gives useful results even with syntax errors.
explorer.landscape.piece.scip-indexers:   כלי נפרד לכל שפה, שנשען על המהדר או על סביבת הבנייה של אותה שפה. | A separate tool per language, relying on that language's compiler or build setup.
explorer.landscape.piece.kythe-indexers:  כלים שמשתלבים בתהליך הבנייה ומפיקים ממנו צמתים וקשתות. | Tools that hook into the build and extract nodes and edges from it.
explorer.landscape.piece.codeql:          בונה מסד נתונים של בסיס הקוד לצורכי ניתוח. בשפות מהודרות, על ידי מעקב אחרי הבנייה. | Builds a database of the codebase for analysis. For compiled languages, by watching the build.
explorer.landscape.piece.glean:           מערכת קוד פתוח של Meta לשמירת עובדות על קוד, עם שפת שאילתות משלה. קולטת גם SCIP ו-LSIF. | An open-source system from Meta for storing facts about code, with its own query language. Also takes in SCIP and LSIF.
explorer.landscape.piece.central-index:   Google תיארה ב-2020 אינדקס מרכזי אחד לחיפוש הקוד שלה: עושים את העבודה פעם אחת, בשביל כולם. | Google described in 2020 one central index for its code search: the work is done once, for everyone.
explorer.landscape.piece.registry:        אין לזה תקן וגם לא שם מוסכם. בקורס הזה קוראים לזה מרשם. | No standard and no agreed name. This course calls it a registry.
explorer.landscape.piece.mcp:             מפרט פתוח: סוכן מגלה כלים בשרת וקורא להם. המפרט מתעדכן מדי פעם, אז בדקו את הגרסה. | An open specification: an agent discovers tools on a server and calls them. It is revised from time to time, so check the revision.
explorer.landscape.piece.lsp:             הפרוטוקול שבין עורך קוד לשרת שפה. ממנו צמח LSIF. | The protocol between a code editor and a language server. LSIF grew out of it.
explorer.landscape.piece.graph-tools:     המפרט של MCP לא עוסק בזה. שני שרתים יכולים להגיש גרפים שונים לגמרי. | The MCP specification does not cover this. Two servers can serve completely different graphs.
explorer.landscape.piece.backstage:       קטלוג תוכנה בקוד פתוח: רכיבים, ממשקים וצוותים, עם קשרים כמו ownedBy ו-consumesApi. מקור האמת שלו הוא קובצי תיאור שנשמרים לצד הקוד. | An open-source software catalog: components, APIs and teams, with relations such as ownedBy and consumesApi. Its source of truth is descriptor files kept in source control.
explorer.landscape.piece.openapi:         תיאור של HTTP API שאינו תלוי בשפה. | A language-agnostic description of an HTTP API.
explorer.landscape.piece.asyncapi:        תיאור של ממשקים מבוססי הודעות ואירועים. | A description of message-driven and event-driven APIs.
explorer.landscape.piece.protobuf:        הגדרה של מבני נתונים שאינה תלויה בשפה או בפלטפורמה. | A language-neutral, platform-neutral definition of structured data.
explorer.landscape.piece.graphql:         מערכת טיפוסים ושפת שאילתות. הסכמה מתארת מה השירות מציע. | A type system and query language. The schema describes what the service offers.
explorer.landscape.piece.spdx:            תקן פתוח לרשימת רכיבים של תוכנה (SBOM). | An open standard for a software bill of materials (SBOM).
explorer.landscape.piece.cyclonedx:       תקן לרשימת רכיבים, שפורסם כ-ECMA-424. | A bill-of-materials standard, published as ECMA-424.
explorer.landscape.piece.joining:         אין תקן שמחבר את שלושתם. "גרף חוזים" בקורס הזה הוא שם לרעיון, לא לפורמט. | No standard joins the three. "Contract graph" in this course names an idea, not a format.
```

In Hebrew strings that embed an identifier (`format_price`, `money.py`, `web-shop`,
`round_cents`, `ownedBy`, `commit`, `CI`, `MCP`), the component wraps the identifier in a
`.sci` island: split the string on a small fixed list of identifiers
(`IDENTIFIERS` in `src/i18n/identifiers.ts`) and render matches inside `<bdi class="sci"
dir="ltr">`. Do not rely on the bidi algorithm for these.

### 5.5 Achievements

Calm, recomputed from state by a pure function, no streaks, nothing time-based.

```ts
export type AchievementId = 'first-lesson' | 'graph-basics' | 'big-picture' | 'at-scale' | 'ten-correct' | 'all-complete';
const BASICS = ['agent-sees-what-it-opens', 'what-is-a-code-graph', 'three-graphs-three-questions'];
const SCALE = ['build-once-read-many', 'the-topology', 'scaling-to-an-organization'];
// first-lesson: any 1 lesson done · graph-basics: all of BASICS · big-picture: 'is-there-a-standard'
// at-scale: all of SCALE · ten-correct: 10 correct attempts · all-complete: every lesson
```

| id | he title / body | en title / body |
|---|---|---|
| `first-lesson` | שיעור ראשון / סיימתם את השיעור הראשון שלכם. | First lesson / You completed your first lesson. |
| `graph-basics` | צמתים וקשתות / סיימתם את שלושת שיעורי היסוד. | Nodes and edges / You finished the three foundation lessons. |
| `big-picture` | המפה כולה / עכשיו אתם יודעים מה תקן ומה לא. | The whole map / You now know what is standard and what is not. |
| `at-scale` | בקנה מידה / סיימתם את שלושת שיעורי הארגון. | At scale / You finished the three organization lessons. |
| `ten-correct` | עשר תשובות נכונות / עניתם נכון על 10 שאלות תרגול. | Ten correct / You answered 10 practice questions correctly. |
| `all-complete` | אקדמיית גרף הקוד, הושלמה / סיימתם את כל שבעת השיעורים. | Code Graph Academy, complete / You finished all seven lessons. |

Tests: empty state earns none; one lesson earns `first-lesson` only; the three BASICS
earn `first-lesson` and `graph-basics`; all seven earn all but `ten-correct`; 10 correct
attempts earn `ten-correct` regardless of lessons. The quizzes hold 27 questions in
total (T-2), so ten correct is reachable.

---

## 6. Acceptance checklist

Run from `apps/codegraph/` unless stated. Every item is pass or fail.

**Build and tests**

1. `npm run check` is clean (typecheck, vitest, build).
2. Every hand-checked table in §4 exists as a test and passes: §4.1 consistency, §4.2
   (5 rows), §4.3 (4 reach series, 2 count tables, 21 descriptions, no pill overlap),
   §4.4 (3 × 4 table, broken-build column, the `graphAt(2)` case), §4.5 (3 orgs), §4.6
   (the 15-cell diff table, 3 decisions), §4.7 (7 rows), §4.8 (metrics table, step
   lengths, description lengths, no box overlap, all points inside the viewBox, in both
   layouts and four topologies), §4.9 (16 cases plus 5 values), §4.10 (21 pieces, 5 count
   rows, source rule).
3. Content tests in `src/content/content.test.ts`:
   - **T-1** seven lessons load, ids equal the list in §3.1, `order` is 1 to 7, all in
     topic `code-graphs`.
   - **T-2** quiz sizes are 3, 4, 4, 4, 4, 4, 4 (27 questions); every string has both
     `en` and `he`, non-empty.
   - **T-3** in every YAML string, after removing `{{…}}` tokens, no `_` remains.
   - **T-4** the numbers in prose match the functions: lesson 1 (`6`, `4`, `28`), lesson 2
     (`11`, `10`, `1, 2, 5, 6`), lesson 5 (`10,000,000`, `60,000`, `500`, `0.6`, `8`, `2`,
     `3`), lesson 6 (`3`, `500`, `20,000`, `4`, `5,000`), lesson 7 (`10`, `5,000`, `500`,
     `300`, `200`); and each numeric quiz `correctValue` equals its function result
     (6; 2; 200000; 200; 5000; 3; 500).
   - **T-5** `en.json` and `he.json` have identical key sets; every key in §5.4 exists;
     no value is empty.
4. `git status` shows `docs/subjects/codegraph/` rebuilt and committed; nothing under
   `docs/subjects/` was edited by hand; no other subject's files changed; `docs/index.html`
   and `docs/hub/*` are untouched.

**Browser pass** (Playwright, preinstalled Chromium, served with the real `/academy/`
path), at **390 × 844 and 1440 × 900, HE and EN, light and dark** (8 combinations), on
the home page and all seven lessons:

5. No console errors or warnings from the app; no failed requests other than fonts when
   offline.
6. `document.documentElement.scrollWidth === clientWidth` on every page, in every
   combination, including with the widest state of each explorer (sharded topology,
   `format_price` with both repos, all code panels open).
7. No raw i18n key is visible (`/\b(explorer|lesson|home|dashboard)\.[a-z]/` does not
   match any rendered text).
8. Every SVG `<text>` and every explorer label has a rendered font size ≥ 12 px
   (measure `getBoundingClientRect` scale × computed size) at both widths.
9. At 390 px the topology, graph and access diagrams use their narrow layouts (assert
   the `viewBox`), and at 1440 px the wide ones.
10. Language and theme toggles work and survive a reload; the pre-paint script sets
    `lang`, `dir` and theme with no flash (assert the attributes before React mounts).
11. Interaction, not just render: drag every slider and both staleness handles; tap a
    node in each diagram; step through both tracks in all four topologies; flip every
    switch; answer one quiz fully; reload and confirm the lesson is marked done.
12. Storage check from CLAUDE.md: open one lesson, finish nothing, read
    `academy-codegraph:v1`; `state.lastVisited` is that lesson's id.
13. First visit (empty storage) shows 0 progress, "–" accuracy, no achievements, and the
    start CTA. A corrupted record (`'{"state":{"lessonsCompleted":7}}'`) loads without
    an error.

**Hebrew and RTL**

14. In Hebrew every identifier, path, number, commit id and formula is an LTR island:
    no reversed `format_price`, `GET /orders/{id}`, `500 × 20,000`, `c0`.
15. Every range input has computed `direction: ltr` and fills from the left in both
    languages; the commit timeline and the day strip run left to right in both.
16. Diagram geometry is identical in HE and EN (same node boxes); only label text
    differs, and no Hebrew label overflows its box or overlaps another.
17. Scale bars grow from the start edge (right in Hebrew, left in English).

**Accessibility and motion**

18. Every `:hover` rule in the built CSS is inside `@media (hover: hover)` (scan the
    built stylesheet programmatically).
19. With `prefers-reduced-motion: reduce`: no travelling dot, no draw-in, steps change
    instantly, and no `requestAnimationFrame` loop is running after load.
20. With motion allowed, nothing animates unless the learner acts, and nothing loops.
21. Every interactive SVG element is reachable by Tab and activates with Enter and
    Space; the landscape bands move with the arrow keys; the two staleness handles are
    operable from their range inputs.
22. Every diagram has a visible caption and a hidden list from its `describe*`
    function, in the current language.
23. Greyscale check: take one screenshot of each explorer with `filter: grayscale(1)` on
    `<html>`; verdicts, edge kinds, true/phantom/missing and used/unused are still told
    apart (by icon, word, dash or shape).
24. Contrast: sample the computed colours of every text element in every explorer, in
    both themes; each is ≥ 4.5:1 against its actual background. The rules in §1.3 hold
    (no light lime text; `--series-b`, `--good`, `--critical` text only on `--surface`
    and `--surface-2`).
25. The feedback pill hides over the stepper row and the quiz buttons
    (`data-fab-avoid`).

**Content hygiene**

26. Forbidden-text scan. Run over `apps/codegraph/src`, `apps/codegraph/index.html`,
    `apps/codegraph/README.md`, `apps/codegraph/scripts` and the built
    `docs/subjects/codegraph/`, case-insensitive; each must print nothing:

    ```bash
    grep -rniE 'workshop|סדנ' <paths>
    grep -rniE '43 ?k|137 ?k|43,?000|137,?000' <paths>
    grep -rniE 'tokens? (saved|saving|fewer)|fewer tokens|חיסכון ב(טוקנים|אסימונים)' <paths>
    grep -rniE "$ACADEMY_PRIVATE_PATTERN" <paths>
    grep -rniE 'free forever|חינם|certified|official curriculum' <paths>
    grep -rniE 'ask your (org|platform)|שאלו את צוות' <paths>
    ```

    `ACADEMY_PRIVATE_PATTERN` is a regular expression that Guy supplies at verification
    time through the environment. It holds the name of any employer, internal tool,
    team or repo that must not appear. **It is never written into this repository**,
    including this file, a script, a commit message or a PR description: this repo is
    public, and a list of forbidden names is itself a disclosure. If the variable is
    unset the check fails rather than passing silently.
27. The only company and project names in learner-facing text are the ones in §2 and
    §4.10 (Google, Meta, Sourcegraph, GitHub via CodeQL, Kythe, Glean, Backstage and the
    format names), each attached to a claim on the §2 table. No sentence says how a
    named company works beyond its own published text.
28. The words "example", "illustrative" or the `org.illustrative` line are visible in
    every explorer that shows `500` or `20,000`.
29. No link in the app points anywhere except the §2 source URLs (landscape panel) and
    the existing footer credit. No link to the hub's subject list is added, and no other
    subject links here.
30. `docs/index.html`, `docs/hub/hub.js` and `docs/subjects/index.html` contain no
    occurrence of `codegraph`.
31. Before the first commit: `git config user.name user.email` shows a human identity
    (rule 5).

---

## 7. Risks, open questions, CLAUDE.md edits

### 7.1 Risks

| Risk | Mitigation |
|---|---|
| The lessons are more text-heavy and less "playful" than Math; three explorers (`askGraphs`, `landscape`, `access`) are tap-driven, not drag-driven. | Each lesson still opens with something that moves in the first screen; the drag-driven ones carry lessons 1, 2, 5, 6, 7. Accept for 3 and 4. |
| The topology diagram at 390 px is 850 units tall. | The "Change the organization" group is closed on phones, the stepper sits directly under the diagram, and the step sentence is announced; check that one lane plus the stepper fits a 844 px viewport when scrolled to the active lane (scroll the active node into view on step change, `block: 'nearest'`, no smooth scroll under reduced motion). |
| The MCP specification changes. | The lessons state only scope-level facts (F21 to F25) and say the specification is revised. Re-read the authorization page before each content update; the revision cited is in §2.3. |
| Source links rot. | Links are data in `landscape.ts` with one test that they are well formed; a yearly manual check is an open item, not automated. |
| Naming companies in lesson 4. | Every named claim is on the §2 table with the company's own published source; F10 is dated ("in 2020"). Guy confirms (Q6). |
| `500` and `20,000` read as real. | D6, §1.5, checklist 28. |
| The Hebrew uses several coined terms (מרשם, תמונת מצב, גרף חוזים, אינדקס מהדר, מפוצל). | Each is introduced next to its Latin term the first time. Guy reviews with `npm run export:md` (Q8). |
| The facts could not be read on the projects' own websites from the authoring sandbox. | The same text was read from each project's public repository (§2). The implementer re-opens the website pages once from an unrestricted network and records any difference here. Three items stayed unverified and were dropped: F7a, F13, F19a; F11a is taught as unknown. |
| The model in `access.ts` is a simplification. | The explorer says so (`explorer.access.modelNote`), and the lesson says "in this model". |
| The staircase hero curve may look odd in `HeroSignature`, which was built for smooth curves. | If it renders badly, sample the same function at integers only and join with straight segments (still function results). Do not replace it with a decorative curve. |
| Zod refinement inside a discriminated union. | §5.1 note. |

### 7.2 Open questions for Guy

1. **Unlisted or on the hub?** Default: unlisted, like Nitrox. Listing it later means a
   tile, a hero node, a `SOURCES` entry and a count-chip update (`HUB_LLD.md` §11.7).
2. **`noindex`?** Default: none, so the page is public and crawlable, as Nitrox is. Say
   if you want `<meta name="robots" content="noindex">` in `apps/codegraph/index.html`.
3. **Seven lessons.** The brief said five or six; the landscape lesson made seven.
   Alternative: fold lesson 2 into lesson 1. Not recommended.
4. **A private overlay later?** The course is generic by design. If you want your own
   organization's real values next to it, the clean way is a file that never enters this
   repo (for example a local JSON that pre-fills the sliders through a URL parameter).
   Not specified here. Say if you want it designed.
5. **Name and palette.** "אקדמיית גרף הקוד · Code Graph Academy", plum and lime.
6. **Named projects and companies in lesson 4.** They appear only with their own public
   writing. Confirm you are comfortable naming them at all.
7. **Feedback key.** The widget is inert until you create a Web3Forms key with
   `edenguy+academy-codegraph@gmail.com`.
8. **Hebrew terms.** מאגר קוד (not ריפו), מרשם for registry, תמונת מצב for snapshot,
   זרוע and מסלול for pillar and lane, מפוצל for sharded. Change any you dislike before
   implementation; they recur in about 150 strings.
9. **Default for "repos each developer works on"** is 3 and for "commits per day" is 10.
   Both are labelled as examples. Pick other starting values if these feel wrong.
10. **This spec is public.** It deliberately names no employer and no event. Keep it
    that way when editing it.

### 7.3 CLAUDE.md edits (make them in the implementation PR, not in the spec PR)

1. **Intro tree, "Architecture".** Add `├── CODEGRAPH_LLD.md   Code Graph Academy spec
   (unlisted subject)` under `BACKGROUND_LLD.md`; add `│   └── codegraph/   Code Graph
   Academy (unlisted)` under `apps/`; change the `docs/subjects/` line to `nitrox/ math/
   physics/ chemistry/ codegraph/`.
2. **"Subjects today" table.** Add a row:
   `| **Code Graph Academy** | apps/codegraph | One topic, 7 lessons: how a coding agent
   uses precomputed code graphs, the three kinds, the landscape of formats and tools, and
   the topology at organization scale. Scaffolded from Chemistry. Not a school subject
   and **unlisted**, like Nitrox: live at /academy/subjects/codegraph/, not on the hub.
   Generic by rule: no company, tool, team or event names beyond the public sources in
   CODEGRAPH_LLD.md §2. Feedback form needs a real Web3Forms key. |`
3. **The "Nitrox is unlisted, on purpose" paragraph.** Generalize the heading sentence to
   "**Nitrox and Code Graph are unlisted, on purpose (Guy's decision).**", say that
   neither is a school subject, and that the rules in the paragraph (URL must keep
   working, never move or delete the app or its `docs/subjects/` folder, never change
   `base`, do not add to the hub or to cross-subject navigation unless Guy asks) apply to
   both.
4. **"The hub reads this storage".** After the list of keys add: "`academy-codegraph:v1`
   exists too and is deliberately **not** in `SOURCES`: the subject is unlisted."
5. **"Anatomy of a Math/Physics subject app" → Explorers.** Add: "Code Graph:
   `SearchCostExplorer`, `GraphViewExplorer`, `AskGraphsExplorer`, `LandscapeExplorer`,
   `ScaleExplorer`, `StalenessExplorer`, `TopologyExplorer`, `CadenceExplorer`,
   `AccessExplorer`, over pure functions in `src/graph/*.ts`. Its diagrams have two
   layouts (wide and narrow) chosen by container width."
6. **Skin palette line.** Add: "Code Graph = plum `#96218a` with lime `#8fbf26` (lime is
   never text in light mode)."
7. **"Non-negotiable rules", rule 6.** Append: "Code Graph Academy's claims are sourced
   in `CODEGRAPH_LLD.md` §2; a claim not on that table is not taught, and nothing in that
   app may name or describe a specific employer's internal systems."
8. **"Current status" → Live on `main`.** Add Code Graph Academy (7 lessons, unlisted).
9. **"Open items".** Add: Code Graph feedback form is inert until a real key replaces
   `REPLACE_WITH_WEB3FORMS_KEY_FOR_academy-codegraph` in
   `apps/codegraph/src/components/FeedbackWidget.tsx`; Code Graph has no share cards; its
   source links (§2) need a manual check once a year; `SUBJECT_APP_SKIN_LLD.md` has no
   palette section for it yet (the palette lives in `CODEGRAPH_LLD.md` §1.3).
10. **`README.md`** (repo root): add the subject to its subject list with the same
    "unlisted" note.

---

## 8. Implementation plan

For an implementer working from this spec. One commit per step; each step leaves
`npm run check` passing. Work in your own worktree on a branch (for example
`guy/codegraph-app`), stage files by name, check `git config user.name user.email`
before the first commit, do not push to `main` or open a PR unless Guy says so.

| Step | Do | Run | Commit |
|---|---|---|---|
| 1 | `cp -r apps/chemistry apps/codegraph`; remove `node_modules`, `docs/review/*`, the OG card scripts. Rename everything in §5.2 (package, lock, vite, index.html, storage keys, feedback constant, export scripts). Keep Chemistry's lessons and explorers for now so the app still builds. | `npm install`, `npm run check` | "Code Graph Academy: scaffold from Chemistry" |
| 2 | Palette (§1.3), favicon and logo (§1.4), `styles.css` banner, slider rule (§4.0 rule 6). | `npm run check`; screenshot home in both themes | "Code Graph: plum and lime palette, mark" |
| 3 | `src/graph/toy.ts`, `search.ts`, `graph.ts`, `answers.ts`, `staleness.ts` with their tests (§4.1 to §4.4, §4.6). No UI. | `npm test` | "Code Graph: toy codebase and graph functions" |
| 4 | `src/graph/scale.ts`, `cadence.ts`, `topology.ts`, `access.ts`, `landscape.ts` with tests (§4.5, §4.7 to §4.10). No UI. | `npm test` | "Code Graph: scale, topology, access and landscape functions" |
| 5 | Schema (§5.1), `topics.ts`, the seven YAML files (§3), `content.test.ts` (T-1 to T-4), achievements (§5.5), `heroCurve.ts`, `lessonSignature.ts`. Delete `src/chemistry/`, the Chemistry lessons and `ChemistryExplorer.tsx`. `LessonExplorer` returns a placeholder panel per kind for now (caption plus the config as text). | `npm run check` | "Code Graph: content, schema, achievements" |
| 6 | Locale files (§5.3, §5.4), T-5, `identifiers.ts`, shared pieces (`FigureAlt`, `useNarrow`, `OrgNote`, new icons). | `npm run check` | "Code Graph: strings and shared explorer parts" |
| 7 | `SearchCostExplorer`, `GraphViewExplorer` with `ToyGraphSvg`, `AskGraphsExplorer`. | `npm run check`; browser pass for lessons 1 to 3 | "Code Graph: explorers for lessons 1 to 3" |
| 8 | `LandscapeExplorer`. | browser pass for lesson 4 | "Code Graph: landscape explorer" |
| 9 | `ScaleExplorer`, `StalenessExplorer`. | browser pass for lesson 5 | "Code Graph: scale and staleness explorers" |
| 10 | `TopologyExplorer` (both layouts, steps, role panel). Record any moved waypoint in §4.8. | browser pass for lesson 6, all four topologies, both tracks | "Code Graph: topology explorer" |
| 11 | `CadenceExplorer`, `AccessExplorer`. | browser pass for lesson 7 | "Code Graph: cadence and access explorers" |
| 12 | Full checklist of §6, every item, with the private pattern from Guy for item 26. Fix what fails. `npm run export:md` and hand the Hebrew review copy to Guy. | §6 | "Code Graph: verification fixes" (only if needed) |
| 13 | `npm run build`; commit `docs/subjects/codegraph/` by name. | `npm run check` | "Code Graph: build output" |
| 14 | CLAUDE.md edits (§7.3), `README.md`, `apps/codegraph/README.md`. Update this spec where the build deviated. | none | "Docs: Code Graph Academy in CLAUDE.md and README" |

After merge (only when Guy merges): open
`https://edenguy.github.io/academy/subjects/codegraph/` in a private window, in both
languages, and confirm the hub is unchanged.
