# The Paper layer — floating napkins (and bubbles) — low-level design

Status: **spec, not built.** Written for an implementer who has not seen the discussion.
Scope: the hub, Math, Physics, Chemistry (Phase 1) and Nitrox (Phase 2, gated).
Where this file and an older spec disagree, this file wins for the Paper layer only; every
other rule in `CLAUDE.md`, `HUB_LLD.md` and `SUBJECT_APP_SKIN_LLD.md` still applies.

Contents: 0 the request and how it is read · 1 decisions at a glance · 2 what was measured ·
3 where it appears · 4 architecture · 5 the engine · 6 payloads and the pen · 7 tokens ·
8 budget, degrading and the off switch · 9 accessibility and RTL · 10 content catalogs ·
11 integration, file by file · 12 Nitrox bubbles (Phase 2) · 13 phases · 14 acceptance ·
15 risks and what to cut first · 16 amendments to the other specs.

---

## 0. The request, and how it is read

Guy showed a self-contained page from his glucose-tracking project: sheets ("napkins") of
graph paper, each curved its own way, drifting in 3D on one `<canvas>`, each drawing one trace.
He said "I like this dynamic bg" and asked for:

> Math graphs and equations for math classes, physics vectors and equations and chemical
> formulas in floating napkins, across the different subjects. And bubbles in the scuba site.

Reading:

1. **Same engine, a different thing on the paper per subject.** Math napkins carry function
   graphs and formulas; Physics napkins carry motion graphs, vector arrows and kinematics
   equations; Chemistry napkins carry molecules, ions and formulas; the hub carries a mix of all
   three. Nitrox gets rising bubbles and no paper.
2. **Chemistry is a live subject** (`apps/chemistry`, 6 lessons on structure and bonding), not a
   "coming soon" placeholder. So Chemistry gets its own napkins in its own app (Phase 1c), and
   the hub's chemistry napkins need no "placeholder" caveat. Its catalog follows what the
   lessons teach: bonding and structure. The lessons teach no reactions, so reaction equations
   are kept to one clearly marked textbook item on the hub (§10.4).
3. **Everything on a napkin is a fact a learner may trust** (CLAUDE.md rule 6). Each payload
   is either tier A (a formula or number that appears in that subject's lessons, checked in a
   unit test against the subject's own pure functions) or tier B (an uncontroversial textbook
   identity, listed and justified in §10).
4. **It is decoration.** Nothing is taught only by the background, nothing in it is clickable,
   and it never competes with a lesson: text never has a napkin behind it (§3).
5. **Nitrox is Phase 2 and gated.** Guy invests in Nitrox only if the Israeli Diving Federation
   partnership happens. §12 is self-contained and is built only after he re-confirms. Phase 1
   does not touch `apps/nitrox` or `docs/subjects/nitrox/`.

Two deliberate departures from the glucose page, both forced by evidence (§2):

- **Not a full-page background.** In the glucose page almost nothing stands on the paper. Here
  the hero copy, the section headings and every lesson's prose stand directly on the page. A
  napkin behind a paragraph makes it unreadable (screenshots in §2.2). So napkins fly only
  where there is no text: a **stage** band at the top of a home page, and the two **page
  margins** beside the content column on wide screens.
- **Flatter, steadier napkins.** The glucose napkins curve by 27–35 % of their width and turn
  up to ±54°. A graph with an equation on it stops reading at that relief, so ours use about
  half of both.

---

## 1. Decisions at a glance

| # | Decision | Why |
|---|---|---|
| D1 | One engine file, plain JavaScript, no imports. Canonical copy `docs/hub/paper-engine.js`; byte-identical copies in `apps/<subject>/src/paper/engine.js`. A script fails the check if they differ. | Apps never import each other; the hub has no build. Same pattern as the SKIN BASE block. |
| D2 | Payloads are per subject and are not shared: TypeScript in each app (they import the subject's own pure functions), a hand-written JavaScript file on the hub. | Facts stay with their source of truth. |
| D3 | A payload draws through a **pen** in the napkin's own coordinates. Lines, bars, arrows and atoms are projected point by point through the surface. Text is a cached sprite drawn once with the affine map of the surface's tangent plane at the label's anchor, with a legibility clamp. | Measured: adds no visible cost and stays readable (§2). |
| D4 | Two placements only: a **stage** (an in-flow band, on home pages and the hub hero) and **gutters** (two fixed canvases in the page margins, only when a margin is at least 96 px). Each canvas is only as large as its band. | Text is never under a napkin, and the canvases are 6–10 times smaller than a full-viewport one. |
| D5 | Lesson and quiz pages: gutters only. On a phone a lesson page has **no** Paper layer at all. | Reading and the explorer come first. Guy may overrule; the lever is in §15. |
| D6 | No glow, no parallax, no pointer reaction, no pen "pulse" ring. | Keeps HUB_LLD §3.1 #5 ("glow = alive") and the no-parallax rule intact. |
| D7 | One narrow exception to the "no infinite animation / no floating elements" rules, written into all three specs (§16). | The owner asked for it; the exception names this system only. |
| D8 | A pause button, one `localStorage` key shared by the hub and every app (same origin), plus automatic still frames for reduced motion, Save-Data, weak devices, low battery, slow frames and five idle minutes. | WCAG 2.2.2, and battery. |
| D9 | Napkins carry symbols only: no Hebrew or English words. | Nothing to translate, nothing to mirror, no bidi inside a canvas. |

---

## 2. What was measured before writing this

A throwaway prototype (never committed) ported the glucose engine, added the pen, the label
sprites, six payloads, the stage and gutter layouts and a bubbles mode, and was injected into
the real built hub and Math app.

### 2.1 Frame time

Method: Playwright, bundled Chromium (headless, **software rasteriser, no GPU**), 240
consecutive `requestAnimationFrame` gaps after 0.8 s of warm-up, with and without
`Emulation.setCPUThrottlingRate = 4`. "JS draw" is the time inside the engine's own `draw()`.
Software rasterising makes the absolute numbers pessimistic against a real phone's GPU, so
read them as a comparison against the glucose page, which Guy already accepts.

| Case (viewport @ device pixel ratio) | fps, no throttle | fps, CPU ÷4 | JS draw p50 / p95, CPU ÷4 |
|---|---|---|---|
| Glucose page as shown, 390×844 @3 (full-viewport canvas) | 60.0 | 18.2 | — |
| Our engine, same full-viewport layout, 4 napkins with payloads and labels | 60.0 | 24.1 | 2.7 / 6.3 ms |
| Same, payloads off | 60.0 | 26.6 | — |
| **This spec on the real Math home, 390×844 @3: stage, 2 napkins** | **59.8** | **55.4** | 1.9 / 3.4 ms |
| Same page scrolled past the stage | 60.0 | 60.0 | 0 draws in 240 frames |
| Glucose page, 1440×900 @2 | 44.8 | 8.7 | — |
| **This spec, Math home 1440×900 @2: stage + two gutters** | **59.8** | 13.0 | 2.0 / 4.8 ms |
| Same, scrolled past the stage (gutters only; this is also a lesson page) | 60.0 | 44.8 | 1.4 / 3.0 ms |
| Bubbles, full viewport, 390×844 @3 | 60.0 | 60.0 | 0.1 / 0.8 ms |
| Hidden tab | — | — | 0 frames in 600 ms |

Findings that shaped the design:

1. **Payloads and labels are nearly free.** Turning them off moved 24.1 to 26.6 fps. The cost
   is pixels filled (canvas area × napkin count), not what is drawn on a napkin.
2. **The canvas size is the lever.** The stage on a phone is 390×150 CSS px at ratio 2 =
   0.23 megapixel, against 1.3 for a full-viewport canvas. That is the difference between
   18 and 55 fps in the same harness.
3. The desktop stage at ratio 2 under ÷4 throttle (13 fps) is the weakest case. §8 caps the
   pixel count per canvas and steps down when frames are slow, so a machine like that ends on
   a still frame instead of a stutter.

Not measured, and required before Phase 1 is called done: a real mid-range Android phone and
a real iPhone (Safari), see §14 item 12.

### 2.2 Legibility (screenshots at 390 and 1440 px, light and dark)

- Graphs, bars, arrows and atoms projected through the surface read well and bend with it.
- Sprite text with the tangent-plane map stays readable while a napkin tilts; at the glucose
  relief it does not, at 0.28–0.40 it does. Text below about 7 px is dropped and the napkin
  keeps only its drawing.
- A label that shares space with the graph is unreadable. Every payload therefore has a
  **label band** on top and a **graph box** below (§6.3).
- A full-page canvas behind the real pages put napkins behind the hero headline, the lede and
  every paragraph of a lesson. Cutting soft holes in the canvas behind text (the glucose
  page's `.on-paper` idea) made the text readable but left torn scraps of napkins between
  text blocks, and on a phone almost nothing was left. Rejected.
- The stage and gutters showed whole napkins with readable equations and left the reading
  column clean. Adopted.

---

## 3. Where it appears

| Page | Phone and tablet (margin < 96 px) | Wide (margin ≥ 96 px) |
|---|---|---|
| App home (`/`) of Math, Physics, Chemistry | stage, 2 napkins | stage, 3 napkins + 1 napkin in each gutter |
| App lesson and quiz pages | nothing | 1 napkin in each gutter |
| Hub (`docs/index.html`) | stage in the hero, 2 napkins | stage, 3 napkins + 1 in each gutter |
| `/academy/subjects/` redirect page | nothing | nothing |
| Nitrox (Phase 2) | §12 | §12 |

**Stage.** An in-flow block, the first thing under the top bar on a home page and the first
child of the hub's `.hero`. It scrolls with the page. Height `clamp(120px, 19vh, 176px)`, and
`clamp(160px, 22vh, 220px)` from 1024 px. It contains one canvas and the pause button, and no
text. It pushes the page down by its height; on a 390×844 phone the hub's handle panel then
starts at about 395 px and Math's hero panel at about 570 px, both still on the first screen
(HUB_LLD §10 and CLAUDE.md "show the product" still hold; §14 item 9 checks it).

**Gutters.** Two `position: fixed` canvases, one per page margin, each
`(viewport − column) / 2 + 24 px` wide, from under the top bar to the bottom of the viewport.
The 24 px that reach under the column's padding are faded out. They exist only when a margin
is at least 96 px: from 1216 px in the apps (column 1024) and from 1272 px on the hub (column
1080). They do not scroll, and nothing in them reacts to scrolling.

Nothing is ever placed over the Paper layer except the pause button and, in the end gutter,
the feedback button (solid). Cards, panels, prose, explorers and the top bar never overlap a
canvas, so no card needs to change, no `backdrop-filter` re-blurs a moving canvas, and no
contrast changes for existing text.

The page's own background stays exactly as it is (the hub's light and gradient; the apps'
light, gradient and the faint 24 px rule in the top 520 px). The napkins lie on that desk.

---

## 4. Architecture

```
docs/hub/paper-engine.js          CANONICAL engine (hand-written; the hub loads it as a classic script)
docs/hub/paper-payloads.js        the hub's mixed catalog (hand-written)
apps/math/src/paper/engine.js     byte-identical COPY of the canonical engine
apps/math/src/paper/engine.d.ts   types for the global the engine defines
apps/math/src/paper/payloads.ts   Math's catalog (imports src/math/*)
apps/math/src/paper/payloads.test.ts
apps/math/src/paper/Paper.tsx     <PaperStage/>, <PaperGutters/>, the pause button
apps/physics/src/paper/…          same five files
apps/chemistry/src/paper/…        same five files
apps/nitrox/src/paper/…           Phase 2 only
scripts/check-paper-sync.mjs      fails when any copy differs from the canonical file
scripts/paper-gallery.html        dev-only gallery of the hub catalog (not under docs/, never served)
```

- **The engine** is one classic-script file with no `import` and no `export`. It defines
  `globalThis.AcademyPaper`. The hub loads it with `<script defer>`; an app does
  `import './engine.js'` for the side effect and uses the global through `engine.d.ts`
  (a side-effect import of a `.js` file needs no `allowJs`).
- **Header of every copy**, first lines of the file:
  ```js
  // The Paper layer engine. Spec: BACKGROUND_LLD.md.
  // CANONICAL FILE: docs/hub/paper-engine.js. Every apps/<subject>/src/paper/engine.js is a
  // byte-identical copy. Edit the canonical file, copy it over each app's file, rebuild each
  // app, and run `node scripts/check-paper-sync.mjs`. Never edit a copy.
  ```
- **Sync procedure.** `scripts/check-paper-sync.mjs` (Node built-ins only) hashes
  `docs/hub/paper-engine.js` and every `apps/*/src/paper/engine.js` that exists, prints each
  path with `same` or `DIFFERS`, and exits 1 on any difference. With `--write` it copies the
  canonical file over the copies. It is part of §14.
- **Why no shared package:** CLAUDE.md allows one only once duplication has proven itself.
  This is the first iteration; a single dependency-free file with a checker is cheaper than a
  workspace.
- **Payloads are not synced.** The hub's file repeats, by hand, a subset of the apps'
  drawings. §10 is the single list of what each one says; a change to a fact is made in §10
  first and then in each file that draws it.

---

## 5. The engine

Port the glucose engine (`sheet`, `settle`, `napkin`, `random`, `readTokens`, the grid passes,
the shadow as two wide strokes) and change exactly the following.

### 5.1 API

```ts
// engine.d.ts
export interface PaperOptions {
  flow: 'x' | 'y';                 // stage: napkins travel along x. gutter: along y.
  kind?: 'napkins' | 'bubbles';    // default 'napkins'
  payloads?: Payload[];            // required for napkins
  count: number;                   // napkins (or, for bubbles, ignored: see §12)
  font: string;                    // family list for label sprites, e.g. "'JetBrains Mono Variable', ui-monospace, monospace"
  seed?: number;                   // so the two gutters do not show the same napkins
  only?: number;                   // debug: every napkin carries payloads[only]
}
export interface PaperHandle { canvas: HTMLCanvasElement; refresh(): void; destroy(): void }
export type MotionState = 'on' | 'off';   // the user's choice
declare global {
  var AcademyPaper: {
    mount(host: HTMLElement, options: PaperOptions): PaperHandle;
    motion(): MotionState;              // reads localStorage 'academy:paper-motion', default 'on'
    setMotion(state: MotionState): void; // persists, applies to every mounted canvas
    moving(): boolean;                  // true only while frames are actually being drawn
    canMove(): boolean;                 // false when §8.3 forces a still frame
    onChange(cb: () => void): () => void; // motion()/moving()/canMove() changed
  };
}
```

`mount` creates `<canvas class="academy-paper" aria-hidden="true">` inside `host` (which is
`position: relative` or `fixed` and sized by CSS) and draws to the host's box. If
`getContext('2d')` fails it returns a handle whose methods do nothing and leaves the host
empty.

### 5.2 Differences from the glucose engine

| Glucose | Here |
|---|---|
| One canvas, `alpha: false`, fills `--paper` | One canvas per host, transparent, `clearRect` each frame; the page background shows through |
| `MAX_DPR = 2` | `ratio = max(1, min(devicePixelRatio, 2, sqrt(900000 / (cssWidth × cssHeight))))` |
| One loop per mount | **One shared `requestAnimationFrame` loop** for all canvases; a canvas that is off screen (IntersectionObserver on its host) is skipped; with no canvas to draw the loop stops |
| Napkins placed anywhere in the viewport | Placement by `flow`, §5.3 |
| `count = 4…7` by area | `count` is given by the caller (§3) |
| `relief: 0.54 + rnd() * 0.16` | `0.28 + rnd() * 0.12` |
| `rot: (rnd() - 0.5) * 1.1`, `spin: (rnd() - 0.5) * 0.8` | `(rnd() - 0.5) * 0.5` and `(rnd() - 0.5) * 0.3`: a napkin stays within about 23° of upright |
| Scroll parallax (`lift`) and the scroll listener | Removed |
| Camera sway `sin(now * 0.07) * 14 * s0` | Kept |
| `--napkin-cells: 15` | 12 |
| One glucose trace, glow strokes, reading dots, breathing pen ring | A payload (§6); no glow, no ring |
| `DRAW_S 7, HOLD_S 2.5, FADE_S 1.6` | `DRAW_S 6, HOLD_S 5, FADE_S 1.6` (a formula needs time to be read); `LIFE_S` stays 40 |
| Hard canvas edge | Edge fog, §5.4 |
| `MutationObserver` on `data-theme`, `class`, `style` of `<html>` and `<body>` | Same, plus `lang`/`dir` are ignored (nothing depends on them); on a theme change tokens are re-read and the sprite cache is cleared |
| Still frame at `STILL_AT = 9`, trace complete | Same: payload drawn complete (`pen.t = 1`, `pen.now = 9`) |

Which payload a napkin carries: `payloads[(g * 5 + i * 3 + cycle * 7 + seed) % payloads.length]`
with `i` the slot, `g` its generation and `cycle = floor(p * LIFE_S / CYCLE_S)`. If that index
equals the one another live napkin of the same canvas shows, add 1 until it does not.

### 5.3 Placement

`w`, `h` are the host's CSS size. `along`, `crossing` and `rnd` as in the glucose `napkin()`.

```js
if (flow === 'x') {                       // stage
  const b = Math.min(w * (w < 700 ? 0.6 : 0.3), h * 1.55), go = rnd() < 0.5 ? -1 : 1;
  hw = b / 2; hh = hw * (0.6 + rnd() * 0.1);
  mx = w * along; my = h * (0.5 + (rnd() - 0.5) * 0.16);
  if (crossing) { mx = w / 2; dx = go * (w + b * 1.2); dy = (rnd() - 0.5) * h * 0.2; }
  else          { dx = go * b * (0.5 + rnd() * 0.5);  dy = (rnd() - 0.5) * h * 0.2; }
} else {                                  // gutter
  const b = Math.max(150, Math.min(340, w * 0.92));
  hw = b / 2; hh = hw * (0.62 + rnd() * 0.16);
  mx = w / 2; my = h * (0.12 + 0.76 * along);
  dx = (rnd() - 0.5) * w * 0.12;
  dy = (rnd() < 0.5 ? -1 : 1) * h * (crossing ? 1.3 : 0.3);
}
zNear = 0.12 + rnd() * 0.25;              // was rnd() * 0.25: the nearest napkin is a little smaller
```

`focal = hw * 4.4` and everything else in `sheet()` is unchanged. On a 390 px phone a stage
napkin is about 130–180 px wide when near, with its formula at 12–18 px.

### 5.4 Edge fog

After the napkins are drawn, erase toward the canvas edges so nothing is cut by a straight
line. `globalCompositeOperation = 'destination-out'`, linear gradients created once per
resize:

- stage: top and bottom 14 % of the height, start and end 24 px;
- gutter: the inner edge (the side toward the content column) 40 px, top 24 px.

Then restore `'source-over'`.

---

## 6. Payloads and the pen

### 6.1 The contract

```ts
export interface Payload {
  id: string;                 // 'M1' … as in §10
  tier: 'A' | 'B';
  draw(pen: Pen): void;       // called once per frame for a visible napkin, after its grid
  check(): boolean;           // recomputes every number the payload states from the subject's own functions
}
```

The engine calls `draw` with the napkin's fade already applied; a payload never sets absolute
alpha or reads the clock itself. A payload is pure: the same `pen.t` and `pen.now` give the
same picture (so a still frame is the same on every load).

### 6.2 The pen

Coordinates: `u` from −1 (left edge of the napkin) to 1, `w` from −1 (top) to 1 (bottom).
Everything is drawn 0.02 half-widths above the surface, as the glucose trace is.

```ts
export interface Pen {
  readonly t: number;      // 0..1 through the drawing phase; 1 while held, fading, and in a still frame
  readonly now: number;    // seconds, for a slow loop (a sliding tangent); 9 in a still frame
  readonly still: boolean;
  ink(i: 0 | 1 | 2): string;        // this napkin's inks; which token is "0" rotates per napkin
  readonly text: string;            // --paper-text
  style(colour: string, widthPx: number, alpha?: number): void;   // width at the nearest size; min 1.2 px
  curve(fn: (u: number) => number, u0: number, u1: number, part?: number, steps?: number): void; // w = fn(u), drawn up to `part`; steps ≤ 56
  seg(u0: number, w0: number, u1: number, w1: number): void;      // straight in napkin space, 5 pieces so it follows the surface
  dash(u0: number, w0: number, u1: number, w1: number): void;     // same, setLineDash([4k, 4k])
  arrow(u0: number, w0: number, u1: number, w1: number): void;    // seg + a filled head, 9 px at nearest size, 0.45 rad half-angle
  quad(u0: number, w0: number, u1: number, w1: number, fill: number): void;   // axis-aligned bar: 8 projected points, filled at alpha `fill`, outlined
  area(fn: (u: number) => number, u0: number, u1: number, wBase: number, fill: number): void; // region between the curve and a baseline
  dot(u: number, w: number, rPx: number, filled?: boolean): void;
  disc(u: number, w: number, rPx: number, colour: string, letter?: string): void;  // an atom: napkin-coloured disc, coloured rim, optional letter
  arc(u: number, w: number, r: number, a0: number, a1: number): void;             // an angle mark, r in u units
  label(markup: string, u: number, w: number, em: number,
        opts?: { colour?: string; ax?: number; ay?: number; alpha?: number }): void; // em = letter height in u units; ax, ay = anchor 0..1, default 0.5, 0.5
}
```

**Lines and shapes** go through the surface point by point with the engine's `P(u, w, up)`,
exactly as the glucose trace does, so they bend with the paper.

**Self-drawing.** A payload uses `pen.t` to draw in: the main curve up to `part = pen.t`,
bars one at a time (`shown = ceil(n * min(1, pen.t * 1.4))`), arrows growing from their tail.
Labels take `alpha = clamp((pen.t - 0.55) / 0.3, 0, 1)` so the formula appears as the drawing
completes. No opacity change in the system is faster than 0.5 s.

### 6.3 Layout inside a napkin

- **Label band:** `w` from −0.86 to −0.58. The main formula is centred at `(0, −0.72)`,
  `em = 0.2`.
- **Graph box:** `u` from −0.78 to 0.82, `w` from −0.42 to 0.74. Axes are two `arrow`s in
  `pen.ink(2)` at alpha 0.55, width 1.3. Small labels inside the box (`v`, `Δt`, an atom's
  charge) use `em = 0.15–0.17` and must not touch a stroke.
- A helper in each catalog file maps maths to napkin space and draws the axes:
  ```ts
  function frame(pen: Pen, x0: number, x1: number, y0: number, y1: number) {
    const ux = (x: number) => -0.7 + ((x - x0) / (x1 - x0)) * 1.45;
    const wy = (y: number) => 0.66 - ((y - y0) / (y1 - y0)) * 1.02;
    pen.style(pen.ink(2), 1.3, 0.55);
    pen.arrow(-0.78, wy(0), 0.82, wy(0)); pen.arrow(ux(0), 0.74, ux(0), -0.42);
    return { ux, wy, fn: (f: (x: number) => number) => (u: number) => wy(f(x0 + ((u + 0.7) / 1.45) * (x1 - x0))) };
  }
  ```
  A curve is always sampled from the real function (`FUNCTIONS.parabola.fn`,
  `SCENARIOS.quadratic.position`, …), never from a hand-shaped path.

### 6.4 Text: sprites on the tangent plane

Text cannot be projected point by point, and warping it in strips costs a `drawImage` per
strip for no visible gain at these sizes. Decision: **one cached sprite per string, drawn
with one `drawImage` under an affine transform that is the surface's tangent plane at the
label's anchor**, then clamped so it always reads.

*Markup* (plain strings, so they can be listed and reviewed in §10):

| Markup | Meaning | Example |
|---|---|---|
| `^{…}` | superscript, 0.62 em, raised 0.45 em | `x^{2}` |
| `_{…}` | subscript, 0.62 em, lowered 0.22 em | `v_{0}`, `H_{2}O` |
| `_{…}^{…}` directly after each other | stacked on the same x (integral limits) | `∫_{0}^{3}` |
| `~{…}` | a vector: the letter with a small arrow drawn over it (1 px line and head, 0.12 em above the cap height) | `~{v}` |

Everything else is literal Unicode: `′ · − → ½ Δ θ δ ≡ ⁺`-style characters are written as
real characters, with superscript charges through `^{…}` (`Na^{+}`, `Mg^{2+}`), minus as
U+2212 `−`, prime as U+2032 `′`, the middle dot as U+00B7, the arrow as U+2192.

*Sprite:* an offscreen canvas, font `600 44px <options.font>`, `direction = 'ltr'`,
`textAlign = 'left'`, `textBaseline = 'alphabetic'` (set all three explicitly: a canvas
inherits `direction` from the document, and the hub and apps are RTL by default). Height
1.7 em, 4 px side padding, colour baked in. Cache key `markup|colour|font`. The cache is
cleared on a theme change and when `document.fonts` fires `loadingdone`; the engine calls
`document.fonts.load('600 44px ' + firstFamily)` once at mount and builds no sprite before it
settles. Budget: at most 40 sprites alive; beyond that drop the oldest.

*Drawing a label at `(u, w)`* (this code ran in the prototype):

```js
const e = 0.04;
P(u, w, UP);               const ox = X, oy = Y;
P(u + e, w, UP);           let exx = (X - ox) / e, exy = (Y - oy) / e;    // px per u along the napkin's x
P(u, w + e * hw / hh, UP); let eyx = (X - ox) / e, eyy = (Y - oy) / e;    // px per the same length along its y
// clamp 1: neither axis shorter than 62 % of the other (limits foreshortening)
let lx = Math.hypot(exx, exy), ly = Math.hypot(eyx, eyy); const lo = 0.62 * Math.max(lx, ly);
if (lx < lo) { exx *= lo / lx; exy *= lo / lx; lx = lo; }
if (ly < lo) { eyx *= lo / ly; eyy *= lo / ly; ly = lo; }
// clamp 2: if the axes are more than about 25° from square, pull y 60 % of the way to the perpendicular of x
if ((exx * eyy - exy * eyx) / (lx * ly) < 0.9) {
  const px = -exy / lx, py = exx / lx; eyx = (eyx / ly) * 0.4 + px * 0.6; eyy = (eyy / ly) * 0.4 + py * 0.6;
  const m = Math.hypot(eyx, eyy); eyx *= ly / m; eyy *= ly / m;
}
let sc = (em * 1.7) / sprite.h;                                   // sprite px → u units
sc = Math.min(sc, 1.7 / sprite.w);                                // never wider than 85 % of the napkin
if (sprite.h * sc * ly < 12) return;                              // letters under about 7 px: draw nothing
const a = exx * sc, b = exy * sc, c = eyx * sc, d = eyy * sc;
ctx.setTransform(dpr * a, dpr * b, dpr * c, dpr * d,
                 dpr * (ox - (a * sprite.w * ax + c * sprite.h * ay)),
                 dpr * (oy - (b * sprite.w * ax + d * sprite.h * ay)));
ctx.drawImage(sprite.canvas, 0, 0);
ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
```

Trade-off, stated plainly: a label is flat within itself (it does not bend over a bump), so
on a strongly curved spot it can look like a sticker. At relief 0.28–0.40 and a label no
wider than 85 % of the napkin this was not noticeable in the prototype. The alternative
(8–12 strips per label) multiplies `drawImage` calls for an effect nobody will see at 14 px.

### 6.5 Per-napkin budget

A payload may use at most: 160 projected points, 14 stroke or fill calls, 4 labels. No
`shadowBlur`, no gradients, no `filter`, no `getImageData`. No allocation per frame (reuse
module-level arrays as the glucose engine does with `PX`, `PY`).

---

## 7. Tokens

Each app adds these to its PALETTE block in `src/styles.css`; the hub adds them to
`docs/hub/hub.css` next to its other tokens. `--paper-ink-alpha` is 0.8 everywhere and
`--napkin-cells` is 12. Contrast was computed (WCAG relative luminance) for each ink blended
at 0.8 over its napkin: every ink is at least 3:1 (non-text graphics, WCAG 1.4.11) and the
formula text at least 4.5:1, although the layer is decoration and needs neither.

| | `--napkin` | `--napkin-edge` | `--napkin-shadow` | `--paper-grid` / `--paper-grid5` | `--paper-ink-1` | `--paper-ink-2` | `--paper-ink-3` | `--paper-text` |
|---|---|---|---|---|---|---|---|---|
| Math light | `#fdf9ff` | `rgba(98,42,182,.22)` | `rgba(60,30,120,.13)` | `rgba(98,42,182,.09)` / `rgba(98,42,182,.2)` | `#6250d6` 3.74 | `#b83a72` 3.69 | `#2a78d6` 3.09 | `#4a3a63` 5.50 |
| Math dark | `#221641` | `rgba(173,150,255,.34)` | `rgba(0,0,0,.4)` | `rgba(173,150,255,.12)` / `rgba(173,150,255,.28)` | `#a99ff0` 5.01 | `#ee7fa9` 4.66 | `#5a9cf0` 4.26 | `#cdbdee` 6.61 |
| Physics light | `#f9fbff` | `rgba(31,68,173,.22)` | `rgba(20,40,110,.13)` | `rgba(31,68,173,.09)` / `rgba(31,68,173,.2)` | `#3457d1` 3.94 | `#0b7fbd` 3.11 | `#b3640a` 3.10 | `#3a4a75` 4.93 |
| Physics dark | `#152046` | `rgba(140,170,255,.34)` | `rgba(0,0,0,.4)` | `rgba(140,170,255,.12)` / `rgba(140,170,255,.28)` | `#8aa3ff` 4.75 | `#38c2ef` 5.39 | `#f0a84c` 5.47 | `#b9c6ee` 6.47 |
| Chemistry light | `#fffcf6` | `rgba(138,78,8,.22)` | `rgba(90,60,20,.13)` | `rgba(138,78,8,.09)` / `rgba(138,78,8,.2)` | `#8a4e08` 4.16 | `#0f7d71` 3.43 | `#5a4a36` 4.87 | `#5a4a36` 4.87 |
| Chemistry dark | `#261d14` | `rgba(240,180,90,.34)` | `rgba(0,0,0,.4)` | `rgba(240,180,90,.12)` / `rgba(240,180,90,.28)` | `#f0b45a` 6.23 | `#3ecfb8` 5.90 | `#d8c8b0` 6.94 | `#d8c8b0` 6.94 |
| Hub light | `#ffffff` | `rgba(60,40,140,.22)` | `rgba(23,16,43,.13)` | `rgba(60,40,140,.09)` / `rgba(60,40,140,.2)` | `#5b3df5` 4.19 | `#0b857c` 3.24 | `#c93a80` 3.51 | `#463c6a` 5.58 |
| Hub dark | `#16103a` | `rgba(173,160,255,.34)` | `rgba(0,0,0,.45)` | `rgba(173,160,255,.12)` / `rgba(173,160,255,.28)` | `#9a82ff` 4.28 | `#2fd4c6` 6.53 | `#ff7ec4` 5.34 | `#c6bdea` 6.86 |

Notes:

- Inks come from each subject's own palette. Where the palette colour fails 3:1 on the
  napkin it is deepened in the same hue (Math pink `#e87ba4` → `#b83a72`, Physics cyan
  `#17a3e8` → `#0b7fbd`, Physics amber `#e0932f` → `#b3640a`, hub teal and pink likewise).
  Ink 3 in Math and Physics is the subject's plot series colour, allowed "inside plots" by the
  skin spec §2.3. Chemistry has only two hues, so its third ink is the neutral text ink.
- The hub's inks are its own spectrum hues, the same for every napkin whatever its subject.
  Subject colours stay on the tiles (HUB_LLD §11.3).
- Dark tokens go under `:root[data-theme='dark']` in the apps and `[data-theme="dark"]` on the
  hub, matching each file's existing selectors.
- The napkin is one small step off the page (1.10–1.19:1) and reads as a sheet by its edge
  and shadow, as in the glucose page.
- `--paper-font`: apps `'JetBrains Mono Variable', ui-monospace, monospace` (already bundled,
  already used by `.sci`); hub `'IBM Plex Mono', ui-monospace, monospace`.

---

## 8. Budget, degrading, and the off switch

### 8.1 Budget

| | Budget |
|---|---|
| Target | 60 fps on a mid-range phone; never a dropped interaction frame in an explorer |
| JS inside `draw()` | p95 ≤ 4 ms on a mid phone (prototype: 0.8 ms unthrottled, 3.4 ms at CPU ÷4) |
| Canvas pixels | ≤ 0.9 megapixel per canvas (§5.2); ≤ 3 canvases on a page |
| Napkins on a page | phone 2; wide home 5 (3 + 1 + 1); wide lesson 2 |
| Per napkin | §6.5 |
| Start | First frame is the still frame, drawn after the page's first paint. Motion starts 600 ms after `load` (or on `requestIdleCallback`, whichever is later) so it never competes with the app's start-up |
| Added download | engine ≤ 12 KB, a catalog ≤ 8 KB, unminified; no font, no image, no dependency |

### 8.2 When it stops by itself

| Condition | Result |
|---|---|
| `document.hidden` | loop stopped; resumes on `visibilitychange` |
| A canvas's host is off screen (IntersectionObserver, `rootMargin: '32px'`) | that canvas is skipped; the loop stops when none is left |
| No `pointer`, `key`, `scroll` or `touch` event for 5 minutes | settle to the still frame; the next such event resumes |
| The user paused (§8.4) | still frame |

### 8.3 When it never moves (`canMove()` is false; the pause button is hidden)

Checked once at the first `mount`, re-checked when the media query or battery changes:

- `prefers-reduced-motion: reduce`;
- `navigator.connection?.saveData === true`;
- `navigator.hardwareConcurrency <= 2` or `navigator.deviceMemory <= 2`;
- `navigator.getBattery` exists and reports `charging === false && level <= 0.2`;
- the governor gave up earlier in this tab (`sessionStorage['academy:paper-slow'] === '1'`).

### 8.4 The governor

While moving, keep the last 90 `requestAnimationFrame` gaps (ignore the first 30 after any
start and any gap over 250 ms, which is a tab switch). Every 90 frames:

1. mean gap > 24 ms at full rate → switch to **half rate** (draw on every second frame;
   a device already held to 30 Hz, such as an iPhone in Low Power Mode, lands here and stays);
2. at half rate, mean interval between draws > 50 ms → set
   `sessionStorage['academy:paper-slow'] = '1'` and settle to the still frame for the session.

It never steps back up. There is no per-device tuning beyond this.

### 8.5 The pause button (WCAG 2.2.2)

One button per page, shown only while `canMove()`:

- on a page with a stage: inside the stage, `position: absolute; inset-block-end: 6px;
  inset-inline-end: 6px`;
- on a wide lesson or quiz page (gutters, no stage): `position: fixed; inset-block-end: 16px;
  inset-inline-start: 16px`, inside the start gutter, so it covers no content and is on the
  opposite side from the feedback button. It needs no `data-fab-avoid`.

36 px circle with a 44 px hit area (`::after` inset −4 px), `elev-0` look in the apps
(`background: var(--surface-2); border: 1px solid var(--line); color: var(--ink-2)`), the
hub's `.icon-btn` look on the hub. Icon: two bars when moving, the existing `play` triangle
when paused (apps: add `pause: 'M8 5v14M16 5v14'` to `Icon.tsx`; hub: inline SVG, 1.75 px
stroke). `aria-pressed` is true while paused. Hover style only inside `@media (hover: hover)`.

| | Hebrew | English |
|---|---|---|
| `aria-label` and `title` while moving | השהיית תנועת הרקע | Pause background motion |
| while paused | הפעלת תנועת הרקע | Play background motion |

Apps: keys `settings.paperPause`, `settings.paperPlay` in both locale files. Hub:
`data-label-he` / `data-label-en` pairs, applied by the existing `prefs()` label pass, with a
second pair `data-label-on-he/en` for the paused state swapped by the button's own code.

State: `localStorage['academy:paper-motion']` = `'on'` (default when absent) or `'off'`. One
key for the hub and every app: they share an origin, so pausing once holds everywhere. It is
not in any app's progress store (so `mergePersisted` and the hydration gotchas in CLAUDE.md
are untouched) and needs no pre-paint script (the first frame is the still frame either way).
Wrap every access in `try/catch`, as the hub already does.

---

## 9. Accessibility and RTL

- Every canvas: `aria-hidden="true"`, `pointer-events: none`, no `tabindex`, no `role`.
  Hosts carry no text. Nothing is conveyed only by the Paper layer: every formula on a napkin
  is also in a lesson, and a tier B identity is ornament.
- Reduced motion: one still frame, drawn complete, identical on every load (seeded).
- No flashing: slowest things only. No opacity change faster than 0.5 s, no element appears
  or disappears abruptly (napkins fade over the first and last 7 % of 40 s), drift under
  20 px/s.
- Nothing existing changes contrast: no text and no control sits over a canvas except the
  pause button, which has its own solid background (icon `--ink-2` on `--surface-2`: ≥ 7:1 in
  both themes of all three apps; verify on the hub's `.icon-btn`).
- Focus: the pause button is in the tab order where it sits in the DOM (after the top bar on
  home; last in `main`'s siblings on a lesson page), with the app's normal focus ring.
- **RTL:** the canvas is never mirrored. `.paper-stage` and `.paper-gutter` get
  `direction: ltr`. Graphs keep x to the right, vectors keep their direction, formulas are
  drawn left to right (§6.4 sets the sprite's direction explicitly). Gutters are placed with
  physical `left` / `right`. The only logical placement is the pause button (inline-end in the
  stage, inline-start when fixed). No Hebrew or English word is ever drawn on a canvas (D9).
- Print: `@media print { .paper-stage, .paper-gutter { display: none; } }`.

---

## 10. Content catalogs

Rules for the implementer:

1. Draw exactly what the row says, from the function named, and nothing else. Do not add a
   payload that is not in this section. To add one later, add its row here first, with its
   source.
2. Tier A numbers are recomputed in `check()` from the subject's pure functions and asserted
   in `payloads.test.ts` (`for (const p of PAYLOADS) expect(p.check()).toBe(true)`), plus one
   test that the ids match this section's list.
3. Notation follows the lessons: `f′(x)`, `v_{0}` (not `u`), `Δs/Δt`, `½`.
4. No tick labels, no units, no numbers on axes. A napkin shows a shape and one formula.

### 10.1 Math Academy (`apps/math/src/paper/payloads.ts`) — 11 payloads

| id | Drawn (graph box) | Label markup | Tier and source | `check()` |
|---|---|---|---|---|
| M1 | `f(x) = x²` on [0, 3] (`FUNCTIONS.parabola.fn`), 6 midpoint bars filling in one at a time, then the curve | `∫_{0}^{3} x^{2} dx = 9` | A. Lesson `03-antiderivative`, quiz: "3³ / 3 = 27 / 3 = 9" | `powerIntegral(2, 0, 3) === 9` |
| M2 | `f(x) = x` on [0, 6] (`FUNCTIONS.line.fn`), the triangle under it filled (`area`) | `∫_{0}^{6} x dx = 18` | A. Lesson `01-area-under-curve`, quiz: "½ × 6 × 6 = 18" | `powerIntegral(1, 0, 6) === 18` |
| M3 | `f(x) = x²` on [0, 4], 4 midpoint bars (midpoints 0.5, 1.5, 2.5, 3.5), then the curve | `∫_{0}^{4} x^{2} dx = 64/3` | A. Lesson `02-riemann-sums`: exact area 21.33 = 64/3; the four bars are that lesson's midpoint question (sum 21) | `Math.abs(powerIntegral(2, 0, 4) - 64 / 3) < 1e-12 && riemannSum(FUNCTIONS.parabola.fn, 0, 4, 4, 'midpoint') === 21` |
| M4 | `f(x) = x³` on [0, 1.6] (`FUNCTIONS.cubic.fn`), area under it filled | `∫_{0}^{b} x^{n} dx = b^{n+1}/(n+1)` | A. Lesson `03-antiderivative`, key point (the power-rule shortcut), same wording | `powerIntegral(3, 0, 2) === 2 ** 4 / 4` |
| M5 | `f(x) = ½x²` on [0, 5] (`CURVES.quadratic.fn`); a secant through `x₁ = 2` and `x₂`, where `x₂` moves slowly from 4 toward 2.3 and back (`pen.now`); dots at both points. Still frame: `x₂ = 4` | `m = Δy/Δx` | A. Lesson `04-rate-of-change`, key point: `m = [f(x2) − f(x1)] / (x2 − x1)`; `Δy/Δx` is that same quotient | `averageRateOfChange(CURVES.quadratic, 2, 4) === 3` |
| M6 | `f(x) = ½x²` on [0, 5]; the tangent at a point sliding from x = 1 to 4 and back; slope taken from `CURVES.quadratic.derivative`. Still frame: x = 2.5 | `(½x^{2})′ = x` | A. Lesson `04-rate-of-change`, quiz explanation: "For f(x) = 0.5x², the derivative is f′(x) = x" | `CURVES.quadratic.derivative(5) === 5` |
| M7 | `x³` on [−1.3, 1.3] in ink 0 and its derivative `3x²` in ink 1, dashed (from `derivativeTerm({ coeff: 1, power: 3 })`) | `(x^{n})′ = n·x^{n−1}` | A. Lesson `05-derivative-rules`, key point: "d/dx[xⁿ] = n·xⁿ⁻¹" | `evalDerivativeTerm({ coeff: 1, power: 4 }, 2) === 32` (that lesson's own quiz) |
| M8 | `√x` on [0, 4] and its tangent at x = 1 (slope ½) | `(√x)′ = 1/(2√x)` | A. Lesson `05-derivative-rules`, quiz explanation: `d/dx[x^(1/2)] = (1/2)x^(−1/2)`, the same expression | `evalDerivativeTerm({ coeff: 1, power: 0.5 }, 1) === 0.5` |
| M9 | `f(x) = x³ − 3x` on [−2.2, 2.2] (`CURVES.cubicWave.fn`); dots at its two extrema from `CURVES.cubicWave.extrema` with a short flat tangent through each | `(x^{3} − 3x)′ = 3x^{2} − 3` | A. Lesson `06-extremum-points` explorer curve; `derivative.ts`: f′(x) = 3x² − 3, zero at x = ±1 | `CURVES.cubicWave.derivative(1) === 0 && CURVES.cubicWave.derivative(-1) === 0` |
| M10 | Two curves `f = x` and `g = ½x²` on [0, 3] in inks 1 and 2, and their sum in ink 0 | `(f + g)′ = f′ + g′` | A. Lesson `05-derivative-rules`, key point (sum rule), same wording | `true` (an identity; nothing numeric is stated) |
| M11 | `y = sin x` on [0, 2π], sampled from `Math.sin`, amplitude drawn to scale against the axes, x-axis through y = 0 | `y = sin x` | **B.** Not in the lessons (they use polynomials and a root). Guy asked for it by name; the label states only what the curve is. Leave it out of the Math catalog if a reviewer prefers lesson-only content | `Math.sin(Math.PI / 2) === 1` |

### 10.2 Physics Academy (`apps/physics/src/paper/payloads.ts`) — 11 payloads

Axes are t (right) and s or v (up). Vectors are `arrow`s; vector letters use `~{…}`.

| id | Drawn | Label markup | Tier and source | `check()` |
|---|---|---|---|---|
| P1 | s–t straight line, `SCENARIOS.constant.position` on [0, 8]; a slope triangle with small labels `Δt`, `Δs` | `v = Δs/Δt` | A. Lesson `02-velocity-slope`, key point: average velocity is Δs/Δt (for a straight line this is the velocity) | `averageVelocity(SCENARIOS.constant, 0, 8) === 1.5` |
| P2 | s–t curve `SCENARIOS.quadratic.position` (s = ½t²) on [0, 4]; secant through t = 1 and t = 3 with dots | `Δs/Δt = 2` | A. Lesson `02-velocity-slope`, quiz: (4.5 − 0.5) / (3 − 1) = 2 | `averageVelocity(SCENARIOS.quadratic, 1, 3) === 2` |
| P3 | Same curve; tangent sliding from t = 1 to 3.5 and back, slope from `SCENARIOS.quadratic.velocity`. Still: t = 2 | `v(t) = ds/dt` | A. Lesson `02-velocity-slope`, key point, same wording | `SCENARIOS.quadratic.velocity(2) === 2` |
| P4 | v–t line through the origin, slope `a = 2` (`velocityAtConstantAccel(2, t)`), on [0, 5]; 5 midpoint bars filling in (`velocityRectangles(2, 5, 5, 'midpoint')`) | `s = ½at^{2}` | A. Lesson `03-acceleration-area`, key point and quiz: from rest, a = 2, t = 5 → 25 m | `exactDisplacement(2, 5) === 25` |
| P5 | v–t line starting above the origin (intercept marked `v_{0}`), slope triangle | `v = v_{0} + at` | A. Lesson `03-acceleration-area`, quiz: "v = v₀ + at = 0 + 2 × 5 = 10 m/s" | `velocityAtConstantAccel(2, 5) === 10` |
| P6 | v–t line with a slope triangle, small labels `Δt`, `Δv` | `a = dv/dt` | A. Lesson `03-acceleration-area`, key point, same wording | `true` |
| P7 | s–t curve `SCENARIOS.oscillate.position` on [0, 8]; dots at its two turning points (t = 2, t = 6) with a flat tangent through each | `v = 0` | A. Lesson `01-position-vs-time`, quiz explanation: the curve flattens at t = 2 s, the turning point, "velocity zero" | `Math.abs(SCENARIOS.oscillate.velocity(2)) < 1e-12 && Math.abs(SCENARIOS.oscillate.velocity(6)) < 1e-12` |
| P8 | A motion diagram, no axes: a horizontal track with 5 dots whose spacing grows as 1 : 3 : 5 : 7 (positions `exactDisplacement(a, k)` for k = 0…4); on each dot a velocity arrow of length ∝ `velocityAtConstantAccel(a, k)` in ink 0, and one constant arrow of equal length under each in ink 1. Small labels `~{v}`, `~{a}` | `v = v_{0} + at` | A for the equation (as P5); the picture is that equation with v₀ = 0: equal Δv in equal Δt | `exactDisplacement(1, 2) - exactDisplacement(1, 1) === 3 * exactDisplacement(1, 1)` |
| P9 | v–t line from intercept `v_{0}`; the area under it split into a rectangle (ink 1) and a triangle (ink 2), each filled | `s = v_{0}t + ½at^{2}` | **B.** The lessons give only the from-rest case. This is the standard constant-acceleration displacement: the area under `v = v₀ + at`, rectangle `v₀t` plus triangle `½at²`. With v₀ = 0 it reduces to P4 | `true` |
| P10 | A vector `~{v}` from the origin of a small axis cross, its two components dashed along the axes, an `arc` marking θ; small labels `~{v}`, `v_{x}`, `v_{y}`, `θ` | `v^{2} = v_{x}^{2} + v_{y}^{2}` | **B.** Not in the lessons (they are one-dimensional). Pythagoras for perpendicular components of a vector; here `v`, `v_x`, `v_y` are magnitudes | `true` |
| P11 | Two arrows `~{a}` and `~{b}` tip to tail and their sum from the first tail to the last tip, drawn growing in that order | `~{c} = ~{a} + ~{b}` | **B.** Not in the lessons. Vector addition, tip to tail; draw the sum exactly to the last tip | `true` |

Deliberately left out: `F = ma` and any force diagram. No lesson teaches dynamics yet; add a
row when one does.

### 10.3 Chemistry Academy (`apps/chemistry/src/paper/payloads.ts`) — 8 payloads

Atoms are `disc`s with the element letter; bonds are `seg`s in ink 2 at alpha 0.8, drawn
before the discs. A double bond is two parallel segments, a triple bond three. Charges and
partial charges are small labels (`em` 0.15) beside the atom, never inside it. No bond length
or angle is ever printed (the lessons state none).

| id | Drawn | Label markup | Tier and source | `check()` |
|---|---|---|---|---|
| C1 | Two discs `Na` and `Cl`; one small electron dot travels from Na to Cl as `pen.t` goes 0 → 0.7; then `+` appears by Na and `−` by Cl | `Na^{+} Cl^{−}` | A. Lesson `01-ionic-bond`, key points: one electron moved; `ION_PAIRS` in `ionic.ts` | `const p = ION_PAIRS['na-cl']; p.electrons === 1 && p.metalCharge + p.nonmetalCount * p.nonmetalCharge === 0` |
| C2 | `Mg` between two `Cl`; two electron dots travel, one to each Cl; then `2+` by Mg and `−` by each Cl | `MgCl_{2}` | A. Lesson `01-ionic-bond`: "MgCl2 needs two, so the charges still cancel" | `const p = ION_PAIRS['mg-cl']; p.electrons === 2 && p.nonmetalCount === 2 && p.metalCharge + p.nonmetalCount * p.nonmetalCharge === 0` |
| C3 | Three pairs of unlabelled discs in a row, joined by one, two and three bond lines, drawn in that order | No band label. Small labels under the pairs: `–`, `=`, `≡` | A. Lesson `02-covalent-bond`, key point: single, double, triple are one, two, three shared pairs | `sharedPairs(1) === 1 && sharedPairs(2) === 2 && sharedPairs(3) === 3` |
| C4 | `O` with two `H`, bent, atoms placed with `waterMolecule(0, 0, rotation)` from `water.ts` (which uses `WATER_ANGLE_DEG`); small labels `δ−` by O, `δ+` by each H | `H_{2}O` | A. Lesson `03-bond-polarity`, key points: "H2O is bent and polar"; δ+ / δ− notation | `isPolar(WATER_ANGLE_DEG) === true` |
| C5 | `O`, `C`, `O` in a straight line, two double bonds; two equal arrows above the bonds pointing from C toward each O | `CO_{2}` | A. Lesson `03-bond-polarity`: "CO2 is linear and nonpolar"; "two equal bond dipoles cancel at 180°". Arrows point to the more electronegative O | `isPolar(180) === false` |
| C6 | Two water molecules (`waterMolecule`), placed so one H points at the other O within `H_BOND_REACH`; a `dash` from that H to that O | `O–H ··· O` | A. Lesson `05-intermolecular-forces`, key point (a hydrogen already bonded to oxygen pointing at an oxygen on a neighbour) | `hydrogenBondBetween(a, b) === true` for the two molecules drawn |
| C7 | A 3 × 2 lattice of discs each marked `+`; 5 small dots drifting slowly through the gaps (`pen.now`, wrapped). Still frame: dots at fixed seeded places | `e^{−}`, small, beside one drifting dot (no band label) | A. Lesson `04-metallic-bond`, key point: positive ions in a sea of electrons | `true` |
| C8 | A patch of a network: 7 `C` discs in a zig-zag mesh in which every interior atom has exactly four bond lines to neighbours; atoms on the patch's edge have short open stubs so the network visibly continues | `C` | A. Lessons `02-covalent-bond` and `06-comparing-materials`: diamond is a covalent network, every atom bonded to its neighbours | `isNetwork('network') === true` |

Every name in a `check()` cell was read from the module on `main` when this was written. If a
module has changed since, assert on what it exports now; do not add fields or functions to a
science module to suit this layer.

### 10.4 Hub (`docs/hub/paper-payloads.js`) — 12 payloads

Hand-written JavaScript re-drawings. Each has a comment naming its source row here and the
lesson it comes from, the way the hub's Riemann demo cites its source. Functions are written
out (`x * x`, `0.5 * t * t`), with the source file named beside them.

| Hub id | Same as | Label markup |
|---|---|---|
| H1 | M1 | `∫_{0}^{3} x^{2} dx = 9` |
| H2 | M6 | `(½x^{2})′ = x` |
| H3 | M7 | `(x^{n})′ = n·x^{n−1}` |
| H4 | M9 | `(x^{3} − 3x)′ = 3x^{2} − 3` |
| H5 | P3 | `v(t) = ds/dt` |
| H6 | P4 | `s = ½at^{2}` |
| H7 | P8 | `v = v_{0} + at` |
| H8 | P10 (tier B) | `v^{2} = v_{x}^{2} + v_{y}^{2}` |
| H9 | C1 | `Na^{+} Cl^{−}` |
| H10 | C4 (water geometry: angle constant 104.5 copied with a comment naming `apps/chemistry/src/chemistry/water.ts`) | `H_{2}O` |
| H11 | C5 | `CO_{2}` |
| H12 | new: two `H–H` pairs and one `O=O` pair on the left, an arrow, two bent water molecules on the right | `2H_{2} + O_{2} → 2H_{2}O` |

H12 is **tier B** and exists only on the hub: Guy asked for a chemical equation, and this one
is balanced (H: 2 × 2 = 4 and 2 × 2 = 4; O: 2 and 2 × 1 = 2). The Chemistry lessons teach
bonding, not reactions, so it is not in the Chemistry app, and the hub's Chemistry tile copy
must not be changed to suggest reactions are taught. Glucose (`C₆H₁₂O₆`) is left out: its
formula alone means nothing without its name, and napkins carry no words (D9).

The hub's napkin order interleaves subjects (H1, H5, H9, H2, H6, H10, …) so two neighbours
rarely come from the same subject.

### 10.5 Nitrox

No formulas. §12.

---

## 11. Integration, file by file

### 11.1 Each of Math, Physics, Chemistry (same list, per app)

| File | Change |
|---|---|
| `src/paper/engine.js` | New. Copy of the canonical engine |
| `src/paper/engine.d.ts` | New. §5.1 and §6 types |
| `src/paper/payloads.ts`, `payloads.test.ts` | New. §10 |
| `src/paper/Paper.tsx` | New. `PaperStage`, `PaperGutters`, `PaperToggle` |
| `src/features/home/HomePage.tsx` | `<PaperStage />` as the first child of the page |
| `src/app/Shell.tsx` | `<PaperGutters />` as the first child of the root `div`, before the skip link's sibling `header` (it is `position: fixed`, so order only matters for stacking) |
| `src/components/ui/Icon.tsx` | add `pause` |
| `src/i18n/locales/en.json`, `he.json` | `settings.paperPause`, `settings.paperPlay` |
| `src/styles.css` | tokens (§7) in the PALETTE block; the CSS below in the SKIN BASE block, so it stays byte-identical across the three apps |
| `docs/subjects/<subject>/` | rebuilt by `npm run check`, committed (rule 4) |

```css
/* ---------- Paper layer (BACKGROUND_LLD.md) ---------- */
.paper-stage { position: relative; height: clamp(120px, 19vh, 176px); direction: ltr; }
@media (min-width: 1024px) { .paper-stage { height: clamp(160px, 22vh, 220px); } }
.paper-gutter {
  position: fixed; top: 60px; bottom: 0; width: calc((100vw - 1024px) / 2 + 24px);
  z-index: -1; pointer-events: none; direction: ltr; display: none;
}
.paper-gutter[data-side='left'] { left: 0; }
.paper-gutter[data-side='right'] { right: 0; }
@media (min-width: 1216px) { .paper-gutter { display: block; } }
.academy-paper { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; contain: strict; }
@media print { .paper-stage, .paper-gutter { display: none; } }
```

Stacking, exactly: `#root` is `isolation: isolate` and its `::before` (the graph-paper fade,
`z-index: -1`) covers the page below 520 px with `var(--bg)`. The gutters are rendered
**inside** `#root` by `Shell`, also at `z-index: -1` and later in the DOM, so they paint above
that fade and below all content. Do not mount them on `<body>`: the fade would cover them.
The stage is ordinary in-flow content. Existing layers are untouched: top bar `z-30`,
feedback button `z-40`, its sheet `z-50`, the toast. `--fab-clearance` is untouched; the
stage is at the top of the page and never near the feedback button.

`Paper.tsx` behaviour:

- `PaperStage`: a `div.paper-stage`; on mount `AcademyPaper.mount(el, { flow: 'x', payloads:
  PAYLOADS, count: matchMedia('(min-width: 1024px)').matches ? 3 : 2, font })`; `destroy()` on
  unmount. Renders `<PaperToggle placement="stage" />` inside.
- `PaperGutters`: two `div.paper-gutter` with `data-side`; mounts each
  (`flow: 'y'`, `count: 1`, `seed: 1` and `4`) only while `matchMedia('(min-width: 1216px)')`
  matches (listen for `change`; `destroy()` when it stops matching). On a route that is not
  `/`, also renders `<PaperToggle placement="fixed" />`.
- `PaperToggle`: `useSyncExternalStore(AcademyPaper.onChange, …)`; renders nothing when
  `!AcademyPaper.canMove()`.
- `mount` is called in `useEffect`, never during render. It does not wait for the progress
  store to hydrate: this layer reads nothing from it.
- Do not touch `index.html`'s pre-paint script, `providers.tsx`, or anything in `src/progress`.
- `Shell` already scrolls to top on route change; nothing more is needed.

### 11.2 Hub

| File | Change |
|---|---|
| `docs/hub/paper-engine.js` | New (canonical) |
| `docs/hub/paper-payloads.js` | New. §10.4. Defines `window.ACADEMY_HUB_PAYLOADS` |
| `docs/index.html` | `<div class="paper-stage" id="paper-stage"></div>` as the first child of `<section class="hero">`; two `<div class="paper-gutter" data-side="left|right"></div>` as the first children of `<body>`; the pause button inside the stage; two `<script defer>` tags before `hub/hub.js` |
| `docs/hub/hub.css` | tokens (§7); the same CSS block as §11.1 with `1080px` for the column, `1272px` for the breakpoint, `top: 64px`, `z-index: 0` on the gutters, and `.wrap { position: relative; z-index: 1; }` |
| `docs/hub/hub.js` | one new guarded IIFE `paper()`: mounts the stage and (while `min-width: 1272px` matches) the gutters, wires the pause button and its labels. Guards on `window.AcademyPaper` and on the elements, like the other IIFEs |

The hub stays under its weight budget in spirit: the two files are deferred and are not
needed for first paint. HUB_LLD §10's "page weight < 80 KB excluding fonts" is re-measured in
§14; if the two files push it over, raise that line to 100 KB in the same PR and say so.

### 11.3 Repo root

`scripts/check-paper-sync.mjs`, `scripts/paper-gallery.html` (loads
`../docs/hub/paper-engine.js` and `../docs/hub/paper-payloads.js`; shows every hub payload as
a still napkin in a grid, light and dark, with its id; opened from the file system, never
served). `CLAUDE.md`: keep the "Background" section current (§16).

---

## 12. Nitrox bubbles — Phase 2, build only after Guy re-confirms

Self-contained. Nothing in Phase 0–1 depends on it, and it changes no URL, `base`, route or
stored key of Nitrox.

**What it is.** Rising bubbles in the same depth language as the napkins: bubbles nearer the
viewer are larger, sharper and faster; far ones are small and faint. No graph paper, no
formulas, no fish, no caustics, no gradient "water" wash.

**Where.** A stage at the top of the Dashboard (`/`), same heights as §3, and nowhere else.
Nitrox's wide layout has a sidebar instead of two margins, so there are no gutters. Lesson,
lab, practice and assessment pages get nothing.

**Engine.** `kind: 'bubbles'`, same file, same scheduler, tokens, edge fog (bottom fog 22 %
so bubbles rise out of nothing, top fog 14 %), pause key and degrade rules. Per bubble, all
from one seeded random source (no state, as in the prototype):

- count: `clamp(round(w × h / 5200), 10, 34)`;
- depth `z` uniform in 0…2, scale `s = 1 / (1 + z)`;
- radius at depth 0: `5 + rnd² × 24` px;
- rise speed `(18 + r₀ × 1.6) × s` px/s (larger bubbles rise faster);
- five loose streams: `x = w × ((stream + 0.5) / 5 ± 0.06) + sin(now × (0.5…1) + phase) × (5 + 0.5 r₀) × s`;
- radius grows from 75 % to 100 % of its size over the rise and never shrinks (qualitative
  only: a rising bubble expands; no number is shown or implied);
- a gentle wobble: an ellipse with axes `r × q` and `r / q`, `q = 1 + 0.06 sin(2.2 now + phase)`;
- drawn as: fill `--bubble-fill`, a rim stroke `--bubble` (width `max(0.8, 1.4 s)`), and for
  radii over 5 px one short highlight arc at 62 % of the radius from 3.5 to 4.6 rad;
- alpha `(0.3 + 0.7 (1 − z / 2)) ×` a fade over the first 6 % and last 10 % of the rise.

Still frame: the same bubbles at `now = 9`.

**Tokens** (in `apps/nitrox/src/styles.css`, from Nitrox's own teal):

| | `--bubble` | `--bubble-fill` |
|---|---|---|
| light | `rgba(11,133,124,.55)` | `rgba(11,133,124,.06)` |
| dark | `rgba(47,212,198,.5)` | `rgba(47,212,198,.07)` |

Rim against the page: about 2.1:1 light, 3.8:1 dark. Pure decoration, so no minimum applies;
do not raise the light alpha above 0.6 (it starts to read as UI).

**Files.** `apps/nitrox/src/paper/{engine.js, engine.d.ts, Paper.tsx}`, the Dashboard page,
`styles.css`, both locale files (the two pause labels, under Nitrox's own key naming), then
`npm run check` and commit `docs/subjects/nitrox/`. Read `apps/nitrox/CLAUDE.md` first.

**Nitrox-specific cautions.** (1) It is a PWA with `registerType: 'prompt'`: returning
visitors see the old build until they accept the update; that is not a failed deploy. (2) The
mobile bottom nav is `fixed` with `backdrop-blur`: the stage is at the top of the page and
never under it. (3) Nitrox stays unlisted: do not add it to the hub while doing this.

**Acceptance.** §14 items 1–8 and 10–12 on the Dashboard, plus: no route other than `/`
contains a canvas; the service worker still precaches and the app still works offline after
one online load.

---

## 13. Phases

Each phase is one branch and one PR, mergeable alone, in this order.

| Phase | Contents | Visible change on the site |
|---|---|---|
| **0** | `docs/hub/paper-engine.js` complete (napkins and bubbles, stage and gutter flows, scheduler, governor, motion API, still frame); `scripts/check-paper-sync.mjs`; `scripts/paper-gallery.html` with two sample payloads | None: the file is served but nothing loads it |
| **1a Math** | §11.1 for `apps/math`, catalog §10.1 | Math home and wide lesson pages |
| **1b Physics** | §11.1 for `apps/physics`, catalog §10.2 | Physics |
| **1c Chemistry** | §11.1 for `apps/chemistry`, catalog §10.3 | Chemistry |
| **1d Hub** | §11.2, catalog §10.4; the spec amendments' "implemented" wording | Hub |
| **2 Nitrox** | §12. **Only after Guy re-confirms** | Nitrox Dashboard |

1a, 1b, 1c and 1d are independent of each other and each needs only Phase 0. Build 1a first
and show it to Guy before the others: it is where the look is decided (§15 risk 1). After any
engine fix in a later phase, run `check-paper-sync.mjs --write` and rebuild every app that
already has a copy, in the same PR.

---

## 14. Acceptance checklist

Run per phase, on what that phase touches. "Matrix" = 390×844 and 1440×900 × HE and EN ×
light and dark = 8 runs, in Playwright (`chromium.launch({ executablePath:
'/opt/pw-browsers/chromium' })`, resolving the package from `apps/math/scripts/`).

1. `node scripts/check-paper-sync.mjs` exits 0.
2. `cd apps/<subject> && npm run check` is clean; `payloads.test.ts` has one passing
   `check()` per row of §10 and a test that the list of ids equals §10's.
3. Matrix: no console error or page error; `document.documentElement.scrollWidth ===
   clientWidth`; no raw i18n key.
4. Matrix, `reducedMotion: 'reduce'`: every canvas shows a still frame; two loads give
   byte-identical screenshots of the stage; the pause button is absent; over 2 s no
   `requestAnimationFrame` callback of the engine runs (count them through a debug counter
   `AcademyPaper._frames`).
5. Every payload, forced with `only` (apps: `?paperOnly=<n>` read by `Paper.tsx` in dev
   builds only; hub: the gallery page), light and dark: the label is whole, inside the
   napkin, not touching a stroke, and matches §10 character for character; the drawing
   matches its row. Look at each screenshot; do not only diff them.
6. Geometry, by `getBoundingClientRect`: no canvas rectangle intersects any element that has
   text (`main h1, h2, h3, p, li`, cards, the top bar) other than the pause button and the
   feedback button. On a phone lesson page `document.querySelectorAll('canvas.academy-paper')
   .length === 0`.
7. Frame time, on the app home and on one lesson page, at 390×844 @3 and 1440×900 @2: collect
   240 consecutive `requestAnimationFrame` gaps after 0.8 s. Unthrottled: mean ≥ 58 fps and
   p95 gap ≤ 17.5 ms. With `Emulation.setCPUThrottlingRate = 4` on the phone size: mean
   ≥ 45 fps (prototype: 55.4). Report the JS `draw()` p95 as well (≤ 4 ms unthrottled).
   Record the numbers in the PR.
8. Stops: hidden tab (override `document.hidden`, dispatch `visibilitychange`) → 0 frames in
   600 ms; scroll the stage off screen on a phone → 0 frames; pause → still frame and
   `localStorage['academy:paper-motion'] === 'off'`; reload → still paused; open another
   subject → paused there too; play → moves.
9. First screen at 390×844: the hub's handle panel and each app's hero panel start above
   y = 844 (and the hub's other §10 / §11.9 / §12.6 checks still pass, in full, for 1d).
10. Interaction unchanged: drag an explorer handle and a slider, answer a quiz, reload,
    progress persisted. In Hebrew: slider fill and thumb direction, chart orientation and
    axis direction are exactly as before; napkin graphs run left to right and formulas read
    left to right in both languages.
11. Static checks: every `:hover` rule is inside `@media (hover: hover)` (run the existing
    programmatic check); the engine file contains no `shadowBlur`, `filter`, `getImageData`,
    `setInterval`; canvases have `aria-hidden="true"` and computed `pointer-events: none`;
    the pause button has a 44 px hit area, a visible focus ring, and its label in the active
    language; contrast of its icon ≥ 4.5:1.
12. **Real devices (manual, required before 1a merges):** one mid-range Android phone
    (Chrome) and one iPhone (Safari), home page for two minutes and a lesson for two minutes:
    motion is smooth, the explorer does not stutter, the phone does not warm noticeably, and
    with Low Power Mode on the layer runs at half rate or stands still. Write what was
    observed in the PR.
13. After merge: the live site, private window, hub and each touched app.

---

## 15. Risks, and what to cut first

1. **It may feel smaller than what Guy liked.** On a phone it is a 120–176 px band with two
   napkins, not a whole moving page. That is the price of never putting a napkin behind
   text. Show Phase 1a early. If he wants more presence, the levers, in order: raise the
   phone stage to `clamp(150px, 24vh, 210px)`; add a second, shorter stage above the footer
   of a home page; add a 96 px stage above a lesson's title (overruling D5). Do not go back
   to a full-page canvas behind text.
2. **Visual noise next to a lesson** (wide screens): one napkin per margin is the ceiling. If
   it distracts in use, remove gutters from lesson and quiz pages first, keep them on home.
3. **Battery.** A canvas that redraws 60 times a second costs power for as long as it is
   visible. Mitigations are in §8 (small canvases, off-screen stop, idle stop, half rate,
   low-battery still). If real-device testing still shows drain, make half rate (30 fps) the
   default everywhere: at these drift speeds the difference is hard to see.
4. **Safari canvas performance** is unmeasured here. Known hazards avoided by design: no
   `shadowBlur`, no `filter`, no CSS `mask` on a canvas (edge fog is drawn in the canvas),
   no `backdrop-filter` above a moving canvas, no full-viewport canvas. If Safari still
   struggles, drop the napkin shadow strokes (two wide strokes per napkin), then the fine
   grid lines (keep every fifth).
5. **Flat labels on curved paper** (§6.4). If a label looks like a sticker, lower `relief`
   further (0.22–0.32) before considering strip warping.
6. **Glyph coverage.** `∫ ′ ≡ δ θ →` must exist in JetBrains Mono / IBM Plex Mono or fall
   back per glyph to a system font. Item 5 catches a missing glyph; if one is missing in the
   bundled font, replace that character by a drawn mark in the sprite renderer rather than
   adding a font.
7. **Drift between the engine copies, and between the hub's re-drawn payloads and the apps'.**
   The first is checked by a script; the second only by §10 and review. Keep §10 the place
   where a fact is changed first.
8. **The rule exception spreading.** Someone will cite this layer to justify a bobbing icon.
   §16 words the exception so it covers this system only.

Order of cuts if the frame budget is not met on a real device: (a) half rate by default;
(b) phone stage count 2 → 1; (c) gutters off on lesson pages; (d) napkin shadow off;
(e) fine grid off; (f) gutters off everywhere; (g) still frame on phones, motion on wide
screens only. Never cut: the still frame, the pause button, `check()` tests.

---

## 16. Amendments made to the other specs in this change

- `CLAUDE.md`: architecture tree lists this file and the new paths; a "Background" section
  states the rules a contributor must not break; the hub "Register" bullet and the
  reduced-motion verification bullet point here.
- `HUB_LLD.md` §3.1 item 7 and §7: one exception, the Paper layer, defined here. Everything
  else in the ban list stands, including no particles, no parallax, no glow on static
  things, no wallpaper grid.
- `SUBJECT_APP_SKIN_LLD.md` §7 ("never" row) and §10 ("infinite animation of any kind"): the
  same single exception.

Reason for the exception, recorded once: the owner asked for this background by name after
seeing it running. It is kept compatible with what those rules protect: it is confined to
bands with no text, it has no glow and no parallax, it can be paused, it stands still for
anyone who asks their system for less motion, and it carries only correct, sourced content.
