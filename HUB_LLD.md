# Academy hub landing page — low-level design (redesign)

Target file: `docs/index.html` (plus a few hub-owned assets under `docs/hub/`).
Constraints that do not move: plain static HTML/CSS/vanilla JS, no framework, no build step,
GitHub Pages serves `docs/` as-is. Hebrew first, English second, one language visible at a
time via the existing `data-lang` + `.t-he`/`.t-en` mechanism. "Free" is always tied to the
pilot. Nothing on this page is AI-powered and nothing on it may say or imply it is — "an AI
site" in the brief means an *aesthetic register* (precise, lit, alive, instrument-like), not a
feature claim.

This document is opinionated on purpose. Where it says "do X", do X; where it offers a
variant, it says so explicitly. Everything else is decided.

---

## 0. The one idea the whole page is built on

Every lesson in this project, in every subject, shares exactly one physical gesture: **you
grab a handle and move it, and the idea responds.** The Riemann explorer is a slider under a
curve. The Nitrox lab is sliders over partial pressures. That gesture is the project's real
differentiator, and it is also the thing that makes it feel "hi-tech" to a teenager — not
because it looks like AI, but because it *behaves*: things on the page respond to your hand.

So the page is designed around **the handle**:

- the logo is a handle on a curve (§1);
- the headline is about grabbing, not memorizing (§2);
- the hero visual is a real, draggable handle (§5.2);
- the "infographics" are either live (you move them) or they explain the handle (§5.3–5.5);
- motion and glow are reserved for things that are live (§3.5).

Everything decorative that doesn't serve that idea was removed (the orbit diagram, the two
colored background blobs, gradient-filled headline text, emoji glyphs).

---

## 1. Logo / icon system

### 1.1 Verdict on the current hub-and-spoke mark

Replace it. One center node branching to three is literally the Android "share" glyph and
reads as "network / molecule / org chart" — a cliché of exactly the kind the brief rules out,
and it says nothing about *how* this project teaches. It also uses Math Academy's exact
gradient (`#6250d6 → #e87ba4`), so the hub favicon is currently wearing one subject's colors —
a direct violation of the hub-must-stay-neutral rule.

### 1.2 The new mark: "the Handle" (HE: "הידית")

A smooth rising curve crossing a dark tile, with a white handle sitting at its exact center
and a thin vertical cursor hairline passing through the handle. Read it as: *a slider whose
track is the idea itself.* It is subject-neutral by construction — a curve-that-responds
exists in calculus (an integrand), diving physics (pO₂ vs depth), physics (a wave), chemistry
(a rate) — and it is the gesture every lesson shares.

Why it reads as futuristic / hi-tech to a teenager without being a sparkle, a brain, a circuit
or a neural net:

- It is **monoline, geometric, single-form** — the vocabulary of instrument UIs and modern
  product marks (one bold shape, one twist), not of illustration.
- The glowing white node on a dark field is the visual grammar of "a live control" — the
  thing on a screen you know you can touch.
- It is **a tiny simulation in itself**: on the page, the handle actually slides along the
  curve (§1.5). A logo that moves because you hovered it is the hi-tech cue, not a star shape.
- The curve carries a **spectrum** (teal → violet → pink → amber): the hub is "white light",
  each subject is one color split out of it. That is the hub's neutrality made literal — it
  carries *all* subjects, not one — and it is the only place on the page a multi-hue gradient
  is allowed (§3.2).

### 1.3 Exact geometry (`docs/hub/logo.svg`, 64×64 viewBox)

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <defs>
    <linearGradient id="spectrum" gradientUnits="userSpaceOnUse" x1="11" y1="46" x2="53" y2="18">
      <stop offset="0"    stop-color="#2fd4c6"/>   <!-- teal   -->
      <stop offset="0.38" stop-color="#7c5cff"/>   <!-- violet -->
      <stop offset="0.70" stop-color="#ff7ec4"/>   <!-- pink   -->
      <stop offset="1"    stop-color="#ffb547"/>   <!-- amber  -->
    </linearGradient>
    <radialGradient id="halo">
      <stop offset="0"   stop-color="#ffffff" stop-opacity="0.38"/>
      <stop offset="1"   stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <!-- tile: always dark, in both themes (logo tiles don't theme) -->
  <rect width="64" height="64" rx="16" fill="#120b2e"/>
  <!-- cursor hairline -->
  <line x1="32" y1="11" x2="32" y2="53" stroke="#ffffff" stroke-opacity="0.32"
        stroke-width="1.5" stroke-linecap="round"/>
  <!-- the curve: a single cubic, symmetric about (32,32) -->
  <path d="M11 46 C 28 46, 36 18, 53 18" fill="none" stroke="url(#spectrum)"
        stroke-width="5" stroke-linecap="round"/>
  <!-- the handle -->
  <circle cx="32" cy="32" r="10" fill="url(#halo)"/>
  <circle cx="32" cy="32" r="6"  fill="#ffffff"/>
</svg>
```

Notes for whoever draws it:

- The cubic's t = 0.5 point is exactly (32, 32) — `(P0 + 3P1 + 3P2 + P3) / 8` — so the handle
  sits precisely on the curve at the tile's center. Don't "eyeball-adjust" the control points;
  if the shape is changed, re-derive the handle position.
- Tile radius 16 on a 64 grid matches Math's and Nitrox's tiles — this is the family cue.
- `favicon.svg` is the same file. At 16 px the hairline disappears (0.4 px) — that's fine; the
  tile + curve + dot carry it. Do **not** thicken the hairline to survive 16 px; it would
  overpower the mark at 32–64 px, which is where it is actually seen (tab bar, share card,
  top bar).
- Also ship `docs/hub/logo-mono.svg`: curve and dot in `currentColor`, no tile — for the
  footer and for any place the mark sits on a colored surface.
- The mark never mirrors under RTL. It's a logo, not a directional icon.

### 1.4 Relationship to the subject icons

| | Hub | Nitrox Academy | Math Academy | Future subject |
|---|---|---|---|---|
| What the mark says | **how** we teach (the handle) | **what** (gas, bubbles, water) | **what** (∫) | what |
| Tile | 64, rx 16, `#120b2e` | 64, rx 16, teal→blue | 64, rx 16, violet→pink | 64, rx 16, own gradient |
| Glyph | white handle on spectrum curve | its own | its own | its own |

Rule kept: subject colors appear on the hub **only on that subject's card**. The hub's own
chrome (top bar, buttons, headings, hero) uses the hub palette in §3.2, never teal or
Math-pink.

Optional, out of scope for this pass: Nitrox's icon (`apps/nitrox/public/icons/icon.svg`)
has a dark outer border and an inner inset tile that the other two don't. If the family is
ever harmonized, it should drop the inset and sit flush like Math's and the hub's.

### 1.5 The mark is alive

In the page's top bar (and on the hero card's corner), the mark is inline SVG, and the handle
+ hairline are grouped and placed with CSS motion path:

```css
.mark .handle { offset-path: path('M11 46 C 28 46, 36 18, 53 18'); offset-distance: 50%;
                offset-rotate: 0deg; transition: offset-distance 420ms cubic-bezier(.2,.8,.2,1); }
.brand:hover .mark .handle, .brand:focus-visible .mark .handle { offset-distance: 82%; }
@media (prefers-reduced-motion: no-preference) {
  .mark .handle { animation: breathe 5s ease-in-out infinite; }   /* 50% → 44% → 56% → 50% */
}
```

The `<g class="handle">` contains the halo circle, the white circle and the hairline, all
drawn relative to (0,0) so the group's offset position *is* the handle position. If a browser
lacks `offset-path` on SVG children, the group's static transform leaves it at center — no JS
fallback needed.

---

## 2. Mission statement (final copy)

Third person throughout (the page is about the method, not a personal narrative — the
original personal-story framing was removed, see §5.5). Teen register in Hebrew: short
sentences, plural-present verbs ("משננים", "תופסים"), no "למידה מבוססת חקר".

### 2.1 Headline (h1, two lines)

| | line 1 | line 2 (emphasized) |
|---|---|---|
| HE | **לא משננים.** | **תופסים.** |
| EN | **Don't memorize it.** | **Grab it.** |

"תופסים" carries both meanings at once — you grab the handle, and you *get it* ("תפסת?").
That double meaning is why this is the headline and not "מבינים". In English the physical
verb wins because the handle is right there; the lede delivers the second meaning.

Fallback only if Guy vetoes "תופסים": `לא משננים. מזיזים.` / `Don't memorize it. Move it.`
Do not fall back to "understand / learn / discover".

### 2.2 Supporting line (lede, under the h1)

Superseded: the original lede told the personal origin story (the Addis Ababa Nitrox course).
That story — and any mention of Ilana — was removed by a later decision (see §4's note); the
lede ships as:

HE:
> בכל שיעור כאן יש משהו שמזיזים ביד, ורואים מה קורה. לא נוסחה לשנן — רעיון שמרגישים. זו השיטה בכל נושא, מהיום הראשון.

EN:
> Every lesson here has something you move with your hand, and you watch what happens. Not a formula to memorize — an idea you feel. That's the method for every subject, from day one.

### 2.3 Eyebrow badge (above the h1)

HE: `פיילוט · חינם בינתיים` EN: `Pilot · free for now`
("בינתיים" / "for now" is the honest phrasing: free during the pilot, no forever promise.)

### 2.4 Calls to action (hero)

Primary (scrolls to §5.4): HE `לנסות סימולציה` · EN `Try a simulation`
Secondary (scrolls to §5.6): HE `לכל הנושאים` · EN `All subjects`

### 2.5 Meta / share copy

`<meta name="description">` and `og:description` (HE page):
> לא משננים. תופסים. התחיל מקורס נייטרוקס בעשר בלילה בשדה תעופה; היום שיעורים בכמה נושאים, ובכל אחד סימולציה שמזיזים ביד. חינם בזמן הפיילוט.

`twitter:description` (HE): `כלי לימוד עצמאי: בכל שיעור יש ידית שמזיזים, ורואים מה קורה. חינם בזמן הפיילוט.`

English asset card (`preview-square-en.jpg`) tagline:
> Don't memorize it. Grab it. Started with a Nitrox course at 10pm in an airport; now lessons in several subjects, each with a simulation you move by hand. Free during the pilot.

`<title>`: `האקדמיה · Academy` (unchanged).

### 2.6 Section titles and labels (used in §5)

| key | HE | EN |
|---|---|---|
| method.title | למה לא פשוט לשנן? | Why not just memorize? |
| method.rowA | לשנן | Memorize |
| method.rowB | להזיז | Move it |
| method.stepsA | נוסחה → תשובה → זוכרים עד המבחן | formula → answer → you remember it until the exam |
| method.stepsB | נוסחה → ידית → רואים מה משתנה → מבינים למה | formula → handle → watch it change → you know why |
| method.captionA | מקבלים תשובה. זוכרים אותה עד המבחן. | You get the answer. You remember it until the exam. |
| method.captionB | מזיזים משהו, רואים מה משתנה, ומבינים למה. | You move something, see what changes, and understand why. |
| live.title | ככה נראה שיעור כאן | This is what a lesson looks like here |
| live.hint | תזיזו את הידית | Move the handle |
| live.tab.math | אינטגרל · מלבנים | Integral · rectangles |
| live.tab.nitrox | נייטרוקס · לחץ חלקי | Nitrox · partial pressure |
| live.math.n | מלבנים | rectangles |
| live.math.estimate | שטח משוער | estimated area |
| live.math.exact | מדויק | exact |
| live.nitrox.depth | עומק | depth |
| live.nitrox.po2 | לחץ חלקי של חמצן | oxygen partial pressure |
| live.nitrox.over | מעל גבול התכנון (1.4) | past the planning limit (1.4) |
| live.open | לשיעור המלא | Open the full lesson |
| story.title | איך זה התחיל | How it started |
| subjects.title | נושאים | Subjects |
| status.live | פעיל | Live |
| status.pilot | פיילוט | Pilot |
| status.soon | בקרוב | Soon |
| footer | נבנה על ידי גיא עדן · כלי לימוד עצמאי · חינם בזמן הפיילוט · בעברית ובאנגלית | Built by Guy Eden · an independent study tool · free during the pilot · in Hebrew and English |

Arrows in the method strip are SVG, not the → character, so they can mirror under RTL (§6.3).

---

## 3. Visual, color and typography system

### 3.1 What "futuristic hi-tech" means here, concretely

Not "AI product": no sparkles, no neural dots, no mesh-gradient blobs, no gradient headline.
What reads as premium/modern to a 15-year-old in 2026 is the look of a **well-lit instrument**:

1. **Dark-first, one light source.** Near-black indigo. A single large soft light at the
   top-start corner (where the headline is), not two colored blobs. Light mode is "paper lab":
   cool off-white, the same hairlines, glows at half strength.
2. **Panels, not cards.** Surfaces are glass instrument panels: 1 px hairline border + a 1 px
   lighter top edge (inset highlight) + backdrop blur. They feel machined, not "floaty".
3. **Mostly monochrome; color means something.** Ink is near-white; the hub accent (electric
   violet) is for interactive elements only; the spectrum gradient appears only as a thin
   line (the mark, the hero card's top edge); subject colors appear only on
   subject cards and inside their own demo.
4. **Mono readouts.** Numbers, chips and labels are set in a real monospace (IBM Plex Mono),
   tabular, LTR-isolated: `22:00 · ADD`, `n = 24`, `pO₂ 1.28`. This is the single strongest
   "instrument" cue and it costs nothing.
5. **Glow = alive.** Glow is only on things you can move or that are reporting a live value
   (the handle, slider thumbs, the status dot). Nothing static glows.
6. **Ruler ticks.** A short row of tick marks (every 20 px, taller every 100 px, `--line`
   color) under the hero demo and under each live demo. The measurement motif ties every
   visual back to "this is a simulation".
7. **Motion with physics, not bounce.** `cubic-bezier(.2,.8,.2,1)`, 180–320 ms. One slow idle
   (the mark breathing, 5 s). No infinite float/bob, no particles, no parallax layers.

### 3.2 Color tokens (CSS custom properties on `:root`, dark via `[data-theme="dark"]`)

The hub keeps the violet lineage of the existing palette but gives up pink: violet+pink is
Math Academy's signature, and the hub shouldn't wear it. Hub violet is shifted bluer and more
electric (`#7c5cff` vs Math's `#6250d6`) so the two read as relatives, not twins.

```css
:root {                                   /* light: "paper lab" */
  --bg: #f5f3fc;  --bg-2: #ece9f8;
  --panel: rgba(255,255,255,0.78); --panel-solid: #ffffff;
  --panel-edge: rgba(255,255,255,0.9);    /* inset top highlight */
  --line: rgba(60,40,140,0.12); --line-strong: rgba(60,40,140,0.26);
  --ink: #15102a; --ink-2: #463c6a; --muted: #7a7099;
  --accent: #5b3df5; --accent-ink: #ffffff; --accent-soft: rgba(91,61,245,0.12);
  --glow: rgba(91,61,245,0.28);
  --warn: #b7791f; --good: #1e9e6a;
  /* spectrum / subject hues (light variants) */
  --teal: #0e9f94; --violet: #5b3df5; --pink: #e24f94; --amber: #e39200; --blue: #2a8fe0;
  --tile: #120b2e;                        /* logo tile, same in both themes */
}
:root[data-theme="dark"] {                /* dark: "lit instrument" */
  --bg: #0a0718;  --bg-2: #0f0b24;
  --panel: rgba(22,16,52,0.62); --panel-solid: #16103a;
  --panel-edge: rgba(255,255,255,0.07);
  --line: rgba(173,160,255,0.14); --line-strong: rgba(173,160,255,0.30);
  --ink: #f4f1ff; --ink-2: #c6bdea; --muted: #857aad;
  --accent: #7c5cff; --accent-ink: #0d0824; --accent-soft: rgba(124,92,255,0.16);
  --glow: rgba(124,92,255,0.45);
  --warn: #ffb547; --good: #3ddc97;
  --teal: #2fd4c6; --violet: #7c5cff; --pink: #ff7ec4; --amber: #ffb547; --blue: #5bb0ff;
}
```

Subject card colors are **not** hub tokens; each card sets its own `--c1/--c2` inline:
Nitrox `#0e9f94 → #2fd4c6`, Math `#6250d6 → #e87ba4`, Physics `var(--blue) → var(--violet)`,
Chemistry `var(--amber) → var(--pink)` (the last two are placeholders until those apps exist
and define their own).

Spectrum line (the only multi-hue gradient on the page), reused as a CSS value:
`--spectrum: linear-gradient(90deg, var(--teal), var(--violet) 38%, var(--pink) 70%, var(--amber));`
In RTL, flip it to `270deg` so the story order (teal first) still reads start→end.

Background (replaces the two blobs + grid):
```css
body { background:
  radial-gradient(900px 600px at 0% 0%, var(--accent-soft), transparent 65%),
  linear-gradient(180deg, var(--bg), var(--bg-2)); }
[dir="ltr"] body { /* same, light source stays at the start corner */ }
[dir="rtl"] body { background-position: 100% 0%, 0 0; }  /* or write the gradient at 100% 0% for rtl */
```
No grid lines on the body. The measurement motif lives in the ruler ticks, not a wallpaper.

Contrast: `--muted` on `--bg` in dark ≈ 4.9:1, in light ≈ 4.6:1 — both pass for ≥ 14 px text.
Don't go lighter than these.

### 3.3 Typography

**IBM Plex Sans Hebrew** for all text in both languages + **IBM Plex Mono** for readouts.
Verified to resolve from Google Fonts with weights 400/500/600/700:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Hebrew:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
```

Why Plex and not Rubik (the subject apps' face): Rubik is rounded and friendly — right for
inside a lesson, wrong for the "system" page. Plex is engineered, slightly technical, and its
Hebrew was drawn as part of the family, so HE and EN look like the same voice (most Hebrew
webfonts pair a Hebrew with a mismatched Latin). The hub being typographically distinct from
the apps is a feature: hub = OS, subjects = apps. One family, no display face — restraint is
the premium cue.

Scale:

| role | family / weight | size | line-height | tracking |
|---|---|---|---|---|
| h1 | Plex Sans Hebrew 700 | `clamp(42px, 7.2vw, 80px)` | 1.02 HE / 0.98 EN | 0 HE / −0.02em EN |
| h2 | Plex Sans Hebrew 600 | `clamp(24px, 3.2vw, 34px)` | 1.15 | 0 / −0.01em |
| lede | Plex Sans Hebrew 400 | `clamp(17px, 1.6vw, 19px)` | 1.6 | 0 |
| body | Plex Sans Hebrew 400 | 15–16px | 1.55 | 0 |
| chip / label | Plex Mono 500 | 12–13px | 1 | +0.08em, uppercase — **Latin only** |
| readout | Plex Mono 500, tabular-nums | 28–40px | 1 | 0 |

Rules: Hebrew is never tracked (negative or positive) and never uppercased — enforce with
`:root[lang="he"] h1, :root[lang="he"] h2 { letter-spacing: 0 }` and keep chip uppercase on
`.t-en` only. Every number, airport code and formula is an LTR island:
`.num { direction: ltr; unicode-bidi: isolate; font-variant-numeric: tabular-nums; }`.

### 3.4 Surfaces, radii, shadows

```css
.panel { background: var(--panel); backdrop-filter: blur(18px);
         border: 1px solid var(--line); border-radius: 24px;
         box-shadow: inset 0 1px 0 var(--panel-edge), 0 24px 60px -32px rgba(0,0,0,.55); }
.panel--hero { border-top: 0; }
.panel--hero::before { content:''; position:absolute; inset:0 0 auto 0; height:2px;
                       background: var(--spectrum); border-radius: 24px 24px 0 0; }
```
Radii: panels 24, inner cards 18, chips/buttons 999. Light theme shadows at 0.18 alpha.

### 3.5 Motion language

- Reveal on scroll: `opacity 0→1`, `translateY 14px→0`, 360 ms, stagger 60 ms per sibling,
  once (IntersectionObserver, threshold .2). Panels only, not every paragraph.
- Hover on interactive panels/cards: `translateY(-2px)` + border-color → `--accent` (or the
  card's `--c2`), 180 ms. No scale, no 3D tilt.
- Handles (hero, sliders): thumb `scale(1.08)` on `:active`, halo opacity .35 → .6.
- The mark breathes (5 s) and slides on brand hover (§1.5).
- Pointer spotlight on the hero panel: a radial highlight (`--mx/--my` CSS vars set on
  `pointermove`, 320 px radius, `--panel-edge` color at 0.12) — pointer devices only
  (`@media (hover: hover)`), and only on the hero panel.
- `prefers-reduced-motion: reduce` → all of the above off, drags still work.

### 3.6 Iconography

24-grid, 1.75 px stroke, round caps/joins, `currentColor`. No emoji anywhere (the current
🌐 🌙 ☀️ ✦ ● all go). Needed icons: sun, moon, arrow (mirrors in RTL), external-link, a
"drag" affordance (two short vertical bars), play-ish "open" chevron. Subject glyphs on
cards stay what they are (cylinder, ∫, atom, flask) redrawn on this stroke spec.

---

## 4. Page skeleton and files

```
docs/
├── index.html            markup + the pre-paint lang/theme script (inline, unchanged pattern)
└── hub/
    ├── hub.css           all styles (one file, ~500 lines)
    ├── hub.js            all behavior (one file, ~350 lines, plain ES2020, no modules needed)
    ├── logo.svg          §1.3
    ├── logo-mono.svg     §1.3
    ├── favicon.svg       = logo.svg
    └── social/           regenerated by scripts/render-og-cards.mjs (§8)
```

Splitting CSS/JS out of `index.html` is allowed (static files, no build) and keeps the page
reviewable; the pre-paint script stays inline in `<head>` so there's no flash of the wrong
language/direction/theme. Keep `<html lang="he" dir="rtl">` as the server-side default.

Max content width **1080 px** (up from 860 — the page now has real content). Section
vertical rhythm: 96 px desktop, 64 px ≤ 720 px. Side gutters `clamp(16px, 5vw, 48px)`.
Everything uses logical properties (`margin-inline-start`, `inset-inline-end`, `text-align:
start`) so RTL/LTR is a free flip.

Top to bottom:

1. Top bar — brand + controls
2. Hero — headline, lede, CTAs, **the live Handle** (draggable subject scrubber)
3. Method strip — "Why not just memorize?" (infographic: memorize vs move)
4. Live preview — "This is what a lesson looks like" (two real mini-simulations)
5. Subjects — the cards
6. Footer

(An "Origin timeline" section was specified and briefly shipped here — see the superseded §5.5
below — then removed by a later decision to drop the personal origin story and any mention of
Ilana from the project entirely, including from Nitrox Academy's own first-run notice and
dashboard. Don't reintroduce it.)

---

## 5. Section-by-section specification

### 5.1 Top bar

- Start: `.brand` = inline `logo.svg` at 36 px (with the live handle, §1.5) + wordmark
  `האקדמיה` / `Academy`, Plex Sans 600 15 px. The brand is an `<a href="#top">`.
- End: a **segmented language control**, not a globe button: two options `עב` | `EN` in a
  999-radius pill with a sliding indicator (`transform: translateX`, 200 ms). Both labels
  always visible, the active one in `--accent-ink` on `--accent`. `role="group"`,
  each option a `<button aria-pressed>`. Then a theme icon button (sun/moon SVG).
- Sticky, `backdrop-filter: blur(14px)`, bottom hairline appears only after scrolling 8 px
  (class toggled on `scroll`, passive listener).

### 5.2 Hero — "the Handle, live"

Layout: 2-column grid `minmax(0,7fr) minmax(0,5fr)` from 900 px up, text at the start
column; single column below 900 (headline → demo → lede → CTAs, so the demo is above the
fold on a phone).

Text column: eyebrow (§2.3), h1 (§2.1; line 2 is `--ink` with a 2 px `--spectrum` underline
drawn as a `::after`, **not** gradient-filled text), lede (§2.2, max 52ch), CTAs (§2.4;
primary = filled `--accent`, secondary = hairline outline).

Visual column: a `.panel.panel--hero` containing **the hero handle** — a large, draggable
version of the mark that doubles as a subject scrubber:

- `<svg viewBox="0 0 520 360">` with the curve `M 40 290 C 230 290, 290 70, 480 70` (the mark's
  curve scaled; midpoint = (260, 180)), stroke 6, `url(#spectrumHero)` (userSpaceOnUse along
  the curve's bounding diagonal).
- Four **subject nodes** on the curve at arc-length fractions `0.14, 0.40, 0.64, 0.88`
  (positions computed once in JS via `getPointAtLength`), r = 9, filled with each subject's
  `--c2` (teal, Math violet, blue, amber), "soon" nodes at 45 % opacity with a dashed ring.
  Node order along the curve = story order (Nitrox first). Each node has a mono chip label
  above it (`NITROX`, `MATH`, `PHYSICS`, `CHEM` in EN; in HE the chips are Plex Sans 600 13 px:
  נייטרוקס / מתמטיקה / פיזיקה / כימיה).
- The **handle**: `<g class="hero-handle">` (halo r 16 + white r 9 + a vertical hairline from
  y = 30 to y = 330 through the handle), `cursor: grab`, `tabindex="0"`, `role="slider"`,
  `aria-valuemin/max/now` over the four subjects, `aria-valuetext` = subject name + status.
- A **readout row** under the SVG, mono: `● NITROX · LIVE` (EN) / `● נייטרוקס · פעיל` (HE),
  plus an "open →" link that targets the snapped subject's URL (hidden for "soon").
- A ruler tick row along the panel's bottom edge (§3.1 #6).

Behavior (vanilla, `hub.js`):

1. On init, sample the path into 240 points (`getTotalLength` + `getPointAtLength`), store
   `[x, y, s]`. The curve is monotonic in x, so "nearest point to pointer" = binary search
   on x. Place nodes at the stored fractions. Handle starts on node 0 (Nitrox).
2. `pointerdown` on the handle (or anywhere on the SVG) → `setPointerCapture`, add
   `.dragging`; `pointermove` → map `clientX` to SVG x via `getScreenCTM().inverse()`, find
   nearest sample, set the group's `transform: translate(x, y)` and the hairline's x; the
   readout updates live to the *nearest* node's subject (so it changes mid-drag, which is
   the point — it responds while you move).
3. `pointerup` → snap to the nearest node with a 260 ms transition; set `data-active`
   subject on `<body>`, which the matching subject card (§5.6) uses to show a glow ring
   (`[data-active="math"] .subject[data-subject="math"] { box-shadow: 0 0 0 1px var(--c2),
   0 0 32px -6px var(--c2) }`).
4. Keyboard: ←/→ (mirrored under RTL: in RTL, → moves to the *previous* node so the arrow
   key matches the visual direction), Home/End, Enter/Space opens the active subject.
5. Clicking a node directly snaps to it. Double-click/tap on a live node opens it.
6. Idle: if the user hasn't touched it after 2.5 s, the handle makes **one** slow pass to
   node 1 and back (3 s) to advertise that it moves — then stays still. Not looped.
7. Touch: `touch-action: none` on the SVG only (page still scrolls elsewhere).

### 5.3 Method strip — "למה לא פשוט לשנן?" (infographic 1)

A panel with two rows, each a horizontal flow of 3–4 steps joined by SVG arrows. This is the
"simulate vs memorize" diagram the brief asks for, and it explains the mechanism — it does
**not** claim outcomes or retention statistics (nothing here is a fact we can source; the
captions are Guy's premise stated as a premise).

Row A — `לשנן` / `Memorize` (muted, `--ink-2`, no glow):
`נוסחה` (a small card with three flat text lines) → `תשובה` (a card with one bold line) →
`זוכרים עד המבחן` (same card, 40 % opacity, with a thin "X" strike).
Caption: method.captionA.

Row B — `להזיז` / `Move it` (full ink, the handle glows):
`נוסחה` (same card) → `ידית` (a mini slider: track + glowing thumb, **animated** on reveal:
the thumb slides 20 % → 70 %) → `רואים מה משתנה` (a mini chart whose bar grows in sync with
the thumb — pure CSS `transform: scaleY`, driven by the same keyframe timing) →
`מבינים למה` (the card from step 1, now with the lines "lit" in `--accent`).
Caption: method.captionB.

Rows stack vertically; steps stack vertically below 640 px (arrows rotate 90°). All arrows
mirror under RTL (§6.3). Row B's animation plays once on reveal; on hover of the row it
replays.

### 5.4 Live preview — "ככה נראה שיעור כאן" (infographic 2, actually live)

A panel with a two-tab segmented control (live.tab.math / live.tab.nitrox) and one demo
visible at a time. These are **real** simulations, ported to vanilla SVG — not videos, not
screenshots, not fake "loading" animations. Each ends with an "Open the full lesson" link to
the subject. Tabs are `role="tablist"`; the active tab is remembered in `localStorage`
(`academy:hub-demo`).

**Math demo — Riemann rectangles** (a faithful miniature of `IntegralExplorer`):
- f(x) = x², a = 0, b = 2, midpoint rule, `n` ∈ [1, 40], initial 4.
- `<svg viewBox="0 0 480 240">`: axes in `--line-strong`; area under the curve in
  `rgba(98,80,214,.14)` (Math's `--accent-soft`); rectangles fill `rgba(98,80,214,.28)` stroke
  `#6250d6` (Math's violet — this demo wears Math's color because it *is* Math's lesson);
  curve stroke `--ink` 2.5.
- Controls row: `<input type="range" class="handle-slider">` + mono readout `n = 4`.
- Readout block: `live.math.estimate` → mono 36 px, 2 decimals, re-rendered on each input
  with a 160 ms `scale .94→1` pop; next to it, smaller: `live.math.exact 2.667` (∫₀² x² dx =
  8/3 — true, and the gap closing is the whole lesson in one gesture).
- Rebuild rectangles with plain DOM: keep an array of 40 `<rect>` elements, set attributes,
  hide extras. No per-frame allocation.

**Nitrox demo — pO₂ vs depth**:
- Fixed mix chip `EAN32` (FO₂ = 0.32), depth slider 0–40 m step 1, initial 18.
- pO₂ = 0.32 × (1 + depth/10) bar (the standard teaching approximation, 10 m ≈ 1 bar, the
  same one the Nitrox app uses). At 40 m this is exactly 1.60.
- Visual: a horizontal gauge from 0 to 1.6 bar, a fill in Nitrox teal that grows with depth,
  and a marker line at **1.4** labelled `1.4`. The number 1.4 is the documented recreational
  planning limit (`apps/nitrox/src/science/limits.ts`, `DEFAULT_PLANNING_PPO2`, with
  provenance comment). The implementer copies it from there with a comment pointing at the
  source — **do not** add any other limit, MOD number, or duration to the hub. When pO₂ >
  1.4 the readout turns `--warn` and `live.nitrox.over` appears. Nothing here frames
  exceeding the limit as acceptable (Nitrox rule 4).
- Readouts: `depth 18 m` (mono) and `pO₂ 0.90 bar` (mono 36 px).
- Below both demos: ruler ticks.

Both demos are keyboard-operable (native range inputs), both sliders use the project's
thumb style (28 px, `--glow` halo), and both are `dir="ltr"` islands inside the RTL page
(numeric scales never mirror — same rule as the apps).

### 5.5 Origin timeline — removed

This section originally specified a horizontal timeline telling the personal origin story
(Seychelles → Addis Ababa → home), sourced from Nitrox Academy's own "Why this website
exists" first-run story and dashboard callout, and quoting Ilana (Guy's dive instructor) by
name. It shipped briefly, then was removed by a later decision to drop the personal story and
every reference to Ilana from the project — both here on the hub and from Nitrox Academy
itself (`apps/nitrox/src/app/FirstRunNotice.tsx` now shows only the legal/responsibility step;
`DashboardPage.tsx` no longer has the story `Callout`; the `storyTitle`/`storyBody` i18n keys
are gone from both locales). Don't re-add any of it. The hub's "Subjects" section (below)
simply follows the method strip and live preview now.

### 5.6 Subjects

Title `נושאים` / `Subjects` with a mono count chip (`2 LIVE · 2 SOON` EN / `2 פעילים · 2 בקרוב` HE
in Plex Sans). Grid `repeat(auto-fit, minmax(240px, 1fr))`, gap 16.

Card anatomy (`.subject.panel`, `data-subject="nitrox|math|physics|chemistry"`, inline
`--c1/--c2`):

1. Tile 44 px, rx 14, `linear-gradient(145deg, var(--c1), var(--c2))`, white glyph (§3.6).
2. Name (Plex Sans 600 19 px) + status chip (`status.*`, dot in `--c2` for live/pilot).
3. One-liner (keep the existing two; they're good):
   - Nitrox: `אוויר מועשר: לחץ חלקי, MOD וגבולות חמצן — דרך סימולציה, לא שינון.` /
     `Enriched air: partial pressure, MOD and oxygen limits — through simulation, not memorization.`
   - Math: `אינטגרלים: מתחילים במלבנים, מגיעים לקיצור דרך.` /
     `Integrals: start with rectangles, arrive at a shortcut.`
4. **Signature line**: a 100 % wide, 28 px tall SVG at the card's bottom with a short curve
   in `--c2` (`stroke-dasharray` = length; draws itself on hover, 420 ms) and a small handle
   dot that rides to the end. Each subject gets its own curve shape: Nitrox a descending
   pressure line, Math a parabola with two rectangles under it, Physics a sine, Chemistry a
   logistic. It's a 6-line SVG per card and it makes every card feel like a lesson's doorway.
5. Hover: lift 2 px, border → `--c2`, glow `0 0 32px -6px var(--c2)`; the whole card is the
   `<a>`.
6. "Soon" cards: 55 % opacity, dashed `--line-strong` border, no hover lift, no link, the
   signature line static. No "notify me" (no backend; don't fake one).

Cards get `[data-active=…]` glow from the hero scrubber (§5.2 step 3); clicking a card never
moves the hero handle (one-way, so the cards stay plain links).

### 5.7 Footer

Single line, `--muted`, 13 px: `footer` copy (§2.6) · `logo-mono.svg` at 16 px ·
`github.com/edenguy/academy` (text link, external-link icon). Nothing else.

---

## 6. Interactivity inventory (all vanilla JS/CSS, no backend)

| # | What | Mechanism | Why it feels alive |
|---|---|---|---|
| 1 | Logo handle slides | CSS `offset-path` on an SVG group; hover/focus changes `offset-distance` | the brand itself is a simulation |
| 2 | Hero handle drag + snap | pointer events, path sampling, `getScreenCTM`, transition on release; keyboard slider semantics | first thing a teen does is grab it; it answers mid-drag |
| 3 | Riemann demo | range input → rebuild ≤ 40 rects, readout pop | a real lesson in one slider |
| 4 | Nitrox demo | range input → gauge fill + readout, warn state past the sourced limit | a real lesson in one slider |
| 5 | Method strip animation | CSS keyframes on reveal, replay on hover | explains the handle by moving one |
| 6 | Card signature lines | `stroke-dasharray` draw on hover | each card is a doorway, not a brochure |
| 7 | Hero spotlight | `--mx/--my` from `pointermove`, radial highlight, pointer devices only | the panel is lit by your hand |
| 8 | Reveal-on-scroll | IntersectionObserver, once | pacing |
| 9 | Lang/theme | existing pre-paint script + segmented control | unchanged contract |

Everything degrades: without JS the page is fully readable, the demos show their initial
state, the hero shows the handle at node 0, both languages still toggle (no — the toggle
needs JS, as today; the HE default renders correctly server-side).

### 6.1 `hub.js` structure

Six IIFEs sharing nothing but DOM: `prefs()` (lang/theme, migrated from today's inline
script body), `heroHandle()`, `riemannDemo()`, `nitroxDemo()`, `methodStrip()`, `reveal()`
(also drives the spotlight). Each guards on `document.querySelector`
returning null so a section can be removed without breaking the others. No globals, no
`setInterval`, `requestAnimationFrame` only inside drag/animation handlers. Target ≤ 12 KB
unminified.

### 6.2 RTL rules (don't get these wrong)

- All layout via logical properties; `text-align: start`.
- Numeric scales, sliders, gauges, the two demos' SVGs, chips with codes/numbers: `dir="ltr"`
  islands with `unicode-bidi: isolate`.
- SVG arrows and the "open" chevron: `[dir="rtl"] .icon-dir { transform: scaleX(-1); }`.
- The hero curve and the logo do **not** mirror; the hero scrubber's keyboard mapping does
  (§5.2 step 4).
- The spectrum gradient angle flips (90deg ↔ 270deg) so teal is always at the start edge.
- `.t-he` / `.t-en` only — never both languages in one block, never a Hebrew sentence with an
  English clause inside it except for proper nouns (`Nitrox Academy`, `EAN32`, airport codes).

### 6.3 Accessibility

- Hero handle: `role="slider"`, keyboard, `aria-valuetext`; focus ring = 3 px `--accent`.
- Tabs: `role="tablist"/"tab"/"tabpanel"`, arrow-key switching.
- All demos' SVGs: `role="img"` + `aria-label` in the active language (`.t-he/.t-en` can't
  live in attributes, so set `aria-label` from a `data-label-he/en` pair in `prefs()`).
- Reduced motion: disable breathe, idle pass, reveal transforms, draw animations.
- Color never carries meaning alone (the warn state also changes text).

---

## 7. What to avoid (explicit ban list for the implementer)

Visual tropes — do not use any of these, even "just as an accent":

- four-point sparkle / ✦ / "magic" stars; magic wands; lightbulbs; brains; robot faces;
  chat bubbles; "AI" lettering or badges; any text claiming AI, smart, adaptive, personalized
- neural-network dots-and-lines; constellation/particle backgrounds; circuit-board traces;
  hexagon/honeycomb; binary rain; glitch text; HUD rings/reticles; holographic foil
- gradient-filled headline text; rainbow/aurora mesh-gradient backgrounds; two colored
  blobs behind a glass card (what the page has today); a wallpaper grid
- 3D glass blobs, floating spheres/cubes, isometric illustrations, stock photos of students
- 3D tilt-on-hover cards, cursor trails, typewriter headline effect, marquees, infinite
  bobbing/floating elements, confetti
- emoji as icons (🌐 🌙 ☀️ ✦ ●), the → character as an arrow in UI
- Rubik or any rounded "friendly" face on the hub; Hebrew with letter-spacing or uppercase
- the hub-and-spoke / share glyph; anything using Math's violet→pink pair on hub chrome

Copy traps:

- "learn through curiosity", "learning reimagined", "the future of education", "for
  everyone", "free" without "pilot/for now", "certified", "AI-powered", any retention or
  efficacy statistic, any fact about the story that isn't on the Nitrox about page
- mixing Hebrew and English inline; translating EN marketing idioms word-for-word into HE

---

## 8. Share cards and project docs to update in the same PR

- `scripts/og-card.html` + `scripts/render-og-cards.mjs`: replace `SPARK_SVG` with the Handle
  mark (§1.3, tile included), set the card background to the hub dark `--bg` with the single
  top-start light, title `האקדמיה`/`Academy` in Plex Sans Hebrew 700, tagline from §2.5
  (HE for `preview-square.jpg`, EN for `preview-square-en.jpg`). Fonts: the card template
  loads the same Google Fonts URL; Playwright must wait for `document.fonts.ready` before
  screenshotting. Re-render both.
- `CLAUDE.md` "The hub page" section: "neutral 'spark' mark and orbit-diagram hero visual"
  → "neutral 'Handle' mark (a handle on a spectrum curve, `docs/hub/logo.svg`) and a
  draggable hero handle that scrubs between subjects". Also step 4 of "How to add a new
  academy topic" references the spark mark — update. Add: a new subject must be added in
  two places on the hub — the subject card and the hero curve's node list.
- `README.md` step 3 of "Adding a subject": same note.

---

## 9. Implementation order (ship incrementally, each step is a working page)

1. Tokens, fonts, background, top bar (segmented lang control, SVG theme icon), footer.
   Headline + lede + eyebrow + CTAs with the final copy. Remove orbit, blobs, grid, emoji.
2. Logo: `logo.svg`, `logo-mono.svg`, `favicon.svg`; inline mark in the top bar with the
   CSS motion-path handle.
3. Subjects section (cards with signature lines, status chips).
4. Hero handle (§5.2) — drag, snap, keyboard, card glow.
5. Live preview (§5.4) — Riemann first, Nitrox second.
6. Method strip (§5.3).
7. Reveal, spotlight, reduced-motion pass.
8. Share cards + CLAUDE.md/README updates.

---

## 10. Acceptance checklist

- [ ] 390 px and 1440 px, HE and EN, dark and light: no horizontal overflow, no console errors,
      nothing clipped, both languages never visible at once.
- [ ] `<html lang dir data-lang data-theme>` set before first paint; toggles persist.
- [ ] Only two font families load (Plex Sans Hebrew, Plex Mono); no Rubik on the hub.
- [ ] Hebrew headings have `letter-spacing: 0`; no Hebrew uppercase; every number/code is an
      LTR island; sliders and gauges don't mirror; arrows do.
- [ ] Hero handle: drag with mouse and touch, snaps to nodes, arrow keys work and are
      mirrored in RTL, Enter opens the active live subject, screen reader announces the
      subject name.
- [ ] Riemann demo estimate → 2.67 as n → 40; Nitrox demo reads 1.60 at 40 m and turns warn
      above 1.4; 1.4 is referenced to `limits.ts` in a code comment; no other limit numbers.
- [ ] No personal origin story and no mention of Ilana anywhere on the hub or in Nitrox
      Academy; "free" always qualified by pilot/for now; no AI claims; no emoji; no gradient
      text; no sparkle anywhere, including the share cards.
- [ ] `prefers-reduced-motion`: no idle animation, drags still work.
- [ ] Lighthouse (mobile): Performance ≥ 95, Accessibility 100; page weight < 80 KB
      excluding fonts.
- [ ] `docs/hub/social/*.jpg` re-rendered with the Handle mark; CLAUDE.md/README no longer
      mention the "spark" mark or the orbit diagram.
