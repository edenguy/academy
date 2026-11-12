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

**Revision (mobile rebalance, after the first live review on a phone).** The first
implementation of this spec was reviewed on a phone and read as sparse and under-scaled:
a 64 px dead band under the top bar, the handle panel pushed below the fold with 7 px
labels and 5 px tap targets, a method strip of skeleton-loader-looking cards stacked a
screen tall, subject cards ~370 px tall for two lines of content, and a footer whose 16 px
mono mark rendered as a smudge. The sections below were revised in place to what now ships;
where a decision changed, the old one is noted as *superseded* so the reasoning survives.
Decisions that changed: §3.1 #6 (ruler ticks dropped from the hero), §5.2 (hero order on
phones, node placement, axis chips, constant-size controls, `touch-action`, keyboard
mapping), §5.3 (real formula instead of placeholder lines; tile layout), §5.6 (card anatomy,
2-column grid, Hebrew names), §5.7 (footer stack), §5.8 (feedback widget, new).

**Revision (warmth pass, after comparing the hub to Nitrox Academy's own UI).** The repo
owner found the hub "too generic" next to Nitrox's app — not a palette complaint (the hub
stays neutral, see §1.4) but a surface-and-density one: against Nitrox's opaque `--surface`
cards (solid fill, visible border, a grounded `--shadow`), the hub's glass panels read as
comparatively thin and floaty, and the 96 px desktop section gaps read as dead air once the
page had real panels to fill them (method strip, live preview, subjects grid; confirmed by
screenshot comparison at 390/1440, both themes, both languages, before any change). Fixed in
place, no information architecture changed: §3.2's `--panel`/`--line`/`--panel-edge` alphas
raised and `--shadow` split into a two-layer ambient + contact shadow (closer in spirit to
Nitrox's own `--shadow` token); §3.4's panel blur brought down from 18px to 14px (crisper,
less milky); §4's desktop section rhythm trimmed from 96px to 84px; the inset top-edge
highlight that `.panel` already had was extended to `.subject` cards, and each subject
tile got a neutral (uncoloured) contact shadow for lift, not a glow; the hero curve's
`is-active` node — the one reporting the live selection — got a small `currentColor` glow,
justified by the existing glow=alive rule (§3.1 #5) since it is literally live, not static;
stroke weights on the hero curve and the card signature lines were thickened slightly
(6→7, 2→2.4) so the one place subject colour is allowed to appear carries a bit more
presence. Mobile phone rhythm (already tuned by the mobile-rebalance revision above) and
every section's content/copy/order were left untouched.

**Revision (inviting landing — restructure; spec only, see §11).** After the warmth pass the
repo owner still found the hub "not very inviting" next to Nitrox Academy's dashboard. The
warmth pass changed surfaces; §11 changes *structure*: the three live subjects become large,
tinted, progress-aware tiles directly under the hero, the "why not memorize" and "how a lesson
looks" sections move below them, the hero loses its two CTA buttons, and the rule that subject
colour may appear only on subject cards is relaxed. §11 is the single implementation-ready
spec for that work; the sections it contradicts were amended in place and marked
*superseded by §11* so this document stays internally consistent. Nothing in §11 is built yet.

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

*Superseded by §11.3.* The original rule was "subject colors appear on the hub **only on that
subject's card**". It is now: the hub's own *chrome* (top bar, language/theme controls,
headings, hero copy, footer, the feedback button, the method strip) stays on the hub palette in
§3.2; subject colour may appear anywhere a subject itself is represented — its tile (tinted
surface, badge, status, ring, continue pill), its hero node and axis chip, and its own live
demo — within the tint caps in §11.4 so the page reads as one system, not four.

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

### 2.4 Calls to action (hero) — superseded by §11

Shipped as: primary (scrolls to §5.4) HE `לנסות סימולציה` · EN `Try a simulation`; secondary
(scrolls to §5.6) HE `לכל הנושאים` · EN `All subjects`. §11 removes both buttons: the subject
tiles sit directly under the hero and *are* the calls to action, and scrolling past three
tiles to reach a "try a simulation" demo made the hero's primary button point at the fourth
screen of the page. The hero panel's own "Open the full lesson" link (§5.2) stays.

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
| live.tab.nitrox | נייטרוקס · לחץ חלקי | Nitrox · pO₂ (the longer "partial pressure" wrapped the tab to two lines on phones) |
| live.math.n | מלבנים | rectangles |
| live.math.estimate | שטח משוער | estimated area |
| live.math.exact | מדויק | exact |
| live.nitrox.depth | עומק | depth |
| live.nitrox.po2 | לחץ חלקי של חמצן | oxygen partial pressure |
| live.nitrox.over | מעל גבול התכנון (1.4) | past the planning limit (1.4) |
| live.open | לשיעור המלא | Open the full lesson |
| story.title | איך זה התחיל | How it started |
| subjects.title | נושאים | Subjects |
| subjects.count | 3 פעילים · 1 בקרוב | 3 LIVE · 1 SOON |
| hero.axis | נייטרוקס / מתמטיקה / פיזיקה / כימיה | NITROX / MATH / PHYSICS / CHEM |
| feedback.fab | משוב | Feedback |
| status.live | פעיל | Live |
| status.pilot | פיילוט | Pilot |
| status.soon | בקרוב | Soon |
| footer | נבנה על ידי גיא עדן · כלי לימוד עצמאי · חינם בזמן הפיילוט · בעברית ובאנגלית | Built by Guy Eden · an independent study tool · free during the pilot · in Hebrew and English |

`subjects.count` is superseded by §11 (no count chip on the tiles section). Every string the
tiles need — names, promises, meta lines, continue/start labels, the greeting — is in §11.6.

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
   line (the mark, the hero card's top edge). *Amended by §11.3:* subject colour appears
   wherever a subject is represented (its tile — surface tint, badge, status, ring — its hero
   node/chip, its demo), never on hub chrome; the tiles are the one deliberately colourful
   band on the page, and their tints are capped (§11.4) so they read as one family.
4. **Mono readouts.** Numbers, chips and labels are set in a real monospace (IBM Plex Mono),
   tabular, LTR-isolated: `22:00 · ADD`, `n = 24`, `pO₂ 1.28`. This is the single strongest
   "instrument" cue and it costs nothing.
5. **Glow = alive.** Glow is only on things you can move or that are reporting a live value
   (the handle, slider thumbs, the status dot). Nothing static glows.
6. **Ruler ticks — superseded.** A row of tick marks under the hero panel was specified as a
   "measurement motif". In practice, at phone width it read as a dashed progress bar / a
   skeleton loader, i.e. static decoration that glowed with meaning it didn't have (which
   §3.1 #5 forbids). Removed. The instrument cue is now carried by things that are actually
   live: the hairline cursor, the axis chips under the hero curve (§5.2), the mono readouts.
7. **Motion with physics, not bounce.** `cubic-bezier(.2,.8,.2,1)`, 180–320 ms. One slow idle
   (the mark breathing, 5 s). No infinite float/bob, no particles, no parallax layers.

### 3.2 Color tokens (CSS custom properties on `:root`, dark via `[data-theme="dark"]`)

The hub keeps the violet lineage of the existing palette but gives up pink: violet+pink is
Math Academy's signature, and the hub shouldn't wear it. Hub violet is shifted bluer and more
electric (`#7c5cff` vs Math's `#6250d6`) so the two read as relatives, not twins.

```css
:root {                                   /* light: "paper lab" */
  --bg: #f5f3fc;  --bg-2: #ece9f8;
  --panel: rgba(255,255,255,0.86); --panel-solid: #ffffff;
  --panel-edge: rgba(255,255,255,0.95);   /* inset top highlight */
  --line: rgba(60,40,140,0.16); --line-strong: rgba(60,40,140,0.32);
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
  --panel: rgba(22,16,52,0.74); --panel-solid: #16103a;
  --panel-edge: rgba(255,255,255,0.11);
  --line: rgba(173,160,255,0.18); --line-strong: rgba(173,160,255,0.36);
  --ink: #f4f1ff; --ink-2: #c6bdea; --muted: #857aad;
  --accent: #7c5cff; --accent-ink: #0d0824; --accent-soft: rgba(124,92,255,0.16);
  --glow: rgba(124,92,255,0.45);
  --warn: #ffb547; --good: #3ddc97;
  --teal: #2fd4c6; --violet: #7c5cff; --pink: #ff7ec4; --amber: #ffb547; --blue: #5bb0ff;
}
```

(Warmth-pass revision: `--panel`, `--panel-edge`, `--line` and `--line-strong` alphas were
raised in both themes — crisper edges, a less see-through surface — see the revision note
above.)

Subject colours are **not** `:root` hub tokens. *Amended by §11.4:* each subject's `--c1/--c2`
(gradient pair, from its own app's favicon) and `--ct` (a text-safe variant, per theme) are
declared in `hub.css` on `[data-subject="…"]` selectors — not inline — so dark mode can
override them: Nitrox `#0e9f94 → #2fd4c6`, Math `#6250d6 → #e87ba4`, Physics `#3457d1 →
#17a3e8` (`apps/physics/public/favicon.svg`), Chemistry `#e0922a → #14998a`
(`apps/chemistry/public/favicon.svg`). The hero nodes keep their inline fills (they are SVG
attributes). Chemistry's node fill is `#e0922a`, the same `--c1`.

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
No grid lines on the body. Paint the background on `<html>` (`min-height: 100%`), **not** with
`background-attachment: fixed` — fixed attachment is unreliable on mobile browsers and left
the lower page unlit in dark mode in the first implementation.

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
| h1 (HE) | Plex Sans Hebrew 700 | `clamp(44px, 7.2vw, 80px)` | 1.04 | 0 |
| h1 (EN) | Plex Sans Hebrew 700 | `clamp(38px, 5.2vw, 64px)` | 1.0 | −0.02em |
| h2 | Plex Sans Hebrew 600 | `clamp(22px, 3vw, 32px)` | 1.2 | 0 / −0.01em |
| lede | Plex Sans Hebrew 400 | `clamp(17px, 1.6vw, 19px)` | 1.6 | 0 |
| body | Plex Sans Hebrew 400 | 15–16px | 1.55 | 0 |
| chip / label | Plex Mono 500 | 12–13px | 1 | +0.08em, uppercase — **Latin only** |
| readout | Plex Mono 500, tabular-nums | 28–40px | 1 | 0 |

The two h1 sizes differ on purpose: "Don't memorize it." is ~1.9× wider than "לא משננים."
at the same size, and at 80 px it broke into three lines in the 7fr column ("Don't / memorize
it. / Grab it."). Each language must fit its headline in exactly two lines at 390 and 1440;
`text-wrap: balance` is on as a safety net.

Rules: Hebrew is never tracked (negative or positive) and never uppercased — enforce with
`:root[lang="he"] h1, :root[lang="he"] h2 { letter-spacing: 0 }` and keep chip uppercase on
`.t-en` only. Every number, airport code and formula is an LTR island:
`.num { direction: ltr; unicode-bidi: isolate; font-variant-numeric: tabular-nums; }`.
Plex Mono has **no Hebrew glyphs** — a chip set in Mono with Hebrew inside silently falls back
to a system face (this happened to the eyebrow, the status chips and the hero readout in the
first build). So chips/eyebrow/status/axis labels are Plex Sans 600 by default, and only their
`.t-en` span switches to Mono uppercase. Don't put `.num` (LTR) on a Hebrew sentence that
merely contains digits (`3 פעילים · 1 בקרוב`); Hebrew text with numbers renders correctly in
its own RTL context.

### 3.4 Surfaces, radii, shadows

```css
.panel { background: var(--panel); backdrop-filter: blur(14px);
         border: 1px solid var(--line); border-radius: 24px;
         box-shadow: inset 0 1px 0 var(--panel-edge), var(--shadow); }
.panel--hero { border-top: 0; }
.panel--hero::before { content:''; position:absolute; inset:0 0 auto 0; height:3px;
                       background: var(--spectrum); border-radius: 24px 24px 0 0; }
```
Radii: panels 24, inner cards 18, chips/buttons 999.

`--shadow` is a two-layer stack — a long, soft ambient throw plus a tight contact shadow
right under the surface — closer in spirit to `apps/nitrox/src/styles.css`'s own `--shadow`
token than the single wide shadow the hub shipped with originally (warmth-pass revision):
```css
/* light */ --shadow: 0 20px 48px -26px rgba(23,16,43,.32), 0 3px 10px -4px rgba(23,16,43,.20);
/* dark  */ --shadow: 0 22px 54px -26px rgba(0,0,0,.70), 0 4px 14px -6px rgba(0,0,0,.55);
```
`.subject` cards get the same `inset 0 1px 0 var(--panel-edge)` top highlight as `.panel` —
they are the same machined surface, not a flatter cousin of it — and each `.subject-tile`
carries its own small neutral (uncoloured) contact shadow for lift. Neither is a glow (§3.1
#5 still applies): both are plain, colourless drop shadows.

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
vertical rhythm: **84 px** desktop (warmth-pass revision, down from the original 96px — with
the method strip, live preview and subjects grid actually in place, 96px read as dead air),
**56 px** below 720 px (unchanged — already tuned by the mobile-rebalance revision), and the
hero starts 20 px under the top bar on phones (the original 64 px there was a dead band that
pushed the handle below the fold). Side gutters `clamp(16px, 5vw, 48px)`.
Everything uses logical properties (`margin-inline-start`, `inset-inline-end`, `text-align:
start`) so RTL/LTR is a free flip.

Top to bottom (*order revised by §11*; the original order — hero, method strip, live preview,
subjects, footer — buried the only things a visitor can open under two sections of
explanation):

1. Top bar — brand + controls
2. Hero — headline, **the live Handle** (draggable subject scrubber), one-sentence lede
   (no CTA buttons — §2.4 superseded)
3. Subjects — the tiles (§11): Nitrox, Math, Physics + a compact Chemistry "soon" strip
4. Live preview — "This is what a lesson looks like" (two real mini-simulations)
5. Method strip — "Why not just memorize?" (two columns on desktop, §11.2)
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

Layout: the hero is three grid items — `.hero-copy` (eyebrow + h1), `.hero-panel` (the
handle), `.hero-more` (lede + CTAs) — so the DOM order *is* the phone order:
**headline → the handle → lede → CTAs**, and the thing you grab is on the first screen of a
390×844 phone (panel top ≈ 250 px). From 900 px up: `grid-template-areas: "copy panel" "more
panel"`, columns `minmax(0,7fr) minmax(0,5fr)`, the panel vertically centred against the
copy. (The first build put the whole text column first and the panel landed below the fold
on phones — a drift from this spec that the mobile review caught.)

Copy: eyebrow (§2.3), h1 (§2.1; line 2 is `--ink` with a 4 px `--spectrum` underline drawn as
a `::after`, **not** gradient-filled text), lede (§2.2, max 52ch), CTAs (§2.4; primary =
filled `--accent`, secondary = hairline outline). *§11 revision:* `.hero-more` holds only the
shortened lede (§11.6 `hero.lede`); the `.hero-ctas` block is removed.

Panel: a `.panel.panel--spectrum-edge.hero-panel` containing **the hero handle** — a large,
draggable version of the mark that doubles as a subject scrubber:

- `<svg viewBox="0 0 520 300">` with the curve `M 40 256 C 230 256, 290 48, 480 48` (the
  mark's curve scaled), stroke 6 with `vector-effect: non-scaling-stroke` so it stays 6 px on
  a phone, `url(#spectrumHero)` (userSpaceOnUse along the curve's bounding diagonal). A
  hairline cursor runs from y = 16 to the bottom edge (y = 300) so it visually continues into
  the axis row below.
- Four **subject nodes** placed by **target x** (`74, 200, 322, 446` SVG units; the y is
  looked up on the sampled curve), not by arc-length fraction — arc fractions bunched the
  middle nodes ~63 px apart at phone width, too close for labels. Node order along the
  curve = story order (Nitrox first). Dots are filled with each subject's own colour (teal,
  Math violet, Physics blue, amber), "soon" nodes at 35 % fill with a dashed ring. The
  `is-active` node also gets a small `currentColor` glow (warmth-pass revision) — it is the
  one reporting the live selection, so it earns the glow=alive rule (§3.1 #5); no other node
  glows.
- Nodes and the handle are drawn at unit size and **counter-scaled in JS**
  (`transform: translate(x,y) scale(k)`, `k = 520 / renderedWidth`, clamped to [1, 1.8],
  re-measured with a `ResizeObserver`) so they are the same on-screen size whether the panel
  is 300 px or 440 px wide. Dot r 7 (9 when active), handle thumb r 9 + halo r 17.
- **Axis chips**, not in-SVG labels: an HTML row (`.hero-axis`, 30 px tall) under the SVG
  with one `<button class="axis-chip">` per subject, absolutely positioned at
  `left: x/520 %` and centred with `translateX(-50%)`. Plex Sans 600 12 px in HE
  (נייטרוקס / מתמטיקה / פיזיקה / כימיה), Plex Mono 11 px uppercase in EN (`NITROX` / `MATH`
  / `PHYSICS` / `CHEM`). The active chip is filled `--accent`; "soon" chips are dashed and
  muted. Tapping a chip snaps the handle there — it is the touch-friendly way to pick a
  subject (a 5 px SVG dot is not a tap target). Labels inside the SVG were tried first and
  scaled down to ~7 px on a phone; HTML text doesn't scale with the drawing.
- The **handle**: `<g class="hero-handle-group">` (halo + white thumb with an `--accent`
  ring), `cursor: grab`, `tabindex="0"`, `role="slider"`, `aria-valuemin/max/now` over the
  four subjects, `aria-valuetext` = subject name + status.
- A **readout row** under the axis, separated by a hairline: `● נייטרוקס · פעיל` (HE, Plex
  Sans 600) / `● NITROX · LIVE` (EN, mono) and a small outlined pill button "לשיעור המלא" /
  "Open the full lesson" with a mirrored arrow, targeting the snapped subject's URL (hidden
  for "soon").
- No ruler (§3.1 #6, superseded).

Behavior (vanilla, `hub.js`):

1. On init, sample the path into 240 points (`getTotalLength` + `getPointAtLength`). The
   curve is monotonic in x, so "nearest point to an x" = binary search. Resolve each
   subject's target x to a sample, position its node and its axis chip. Handle starts on
   node 0 (Nitrox).
2. `pointerdown` anywhere on the SVG → `setPointerCapture`, add `.dragging`; `pointermove`
   → map `clientX` to SVG x via `getScreenCTM().inverse()`, place the handle on the nearest
   sample and move the hairline; the readout and the active axis chip update live to the
   *nearest* node's subject (so it changes mid-drag — it responds while you move).
3. `pointerup`/`pointercancel` → snap to the nearest node with a 260 ms transition.
   *Superseded by §11.8:* the original step also set `data-active` on `<body>` for a matching
   subject-card glow; no CSS ever consumed `body[data-active]` (the card rule was written as
   `.subject.active-glow`, a class nothing toggles), so both halves are dead code and §11.8
   removes them rather than reviving them — the tiles are plain links.
4. Keyboard: arrow keys follow the **visual** direction — the curve never mirrors, so → is
   always "the next node to the right", in both languages (the earlier "mirror under RTL"
   rule was wrong for an unmirrored drawing: pressing → moved the handle left). Home/End,
   Enter/Space opens the active live subject.
5. Clicking a node or its axis chip snaps to it. Double-click on a live node opens it.
6. Idle: if the user hasn't touched it after 2.5 s, the handle makes **one** slow pass to
   node 1 and back (3 s) to advertise that it moves — then stays still. Not looped. Off
   under `prefers-reduced-motion`.
7. Touch: `touch-action: pan-y` on the SVG — horizontal drags scrub, vertical swipes still
   scroll the page. (`touch-action: none` made the whole panel a dead zone for scrolling on
   phones; a swipe that lands on it simply did nothing.)

### 5.3 Method strip — "למה לא פשוט לשנן?" (infographic 1)

A panel with two rows, each titled (method.rowA / method.rowB, 12 px: muted for A, `--accent`
for B) and each a horizontal flow of 3–4 **step tiles** joined by SVG arrows, with a caption.
This is the "simulate vs memorize" diagram the brief asks for, and it explains the mechanism
— it does **not** claim outcomes or retention statistics (nothing here is a fact we can
source; the captions are Guy's premise stated as a premise).

A step tile = a 56 px (64 px ≥ 720) hairline box holding one small visual, with an 11–12.5 px
label underneath. The **"formula" is real**: `∫₀² x² dx`, set in Plex Mono with HTML
`<sub>/<sup>` (not Unicode superscripts — glyph coverage), and its answer `8/3`. That is
Math Academy's own integral, the one the live demo below computes; *superseded:* the first
build drew the formula as three grey placeholder bars, which read as a skeleton loader at
every width and was the single thing that made the page look unfinished.

Row A — `לשנן` / `Memorize`: `∫₀² x² dx` (label נוסחה) → `8/3` (תשובה) → `8/3` struck through
at 45 % (זוכרים עד המבחן). Caption: method.captionA.

Row B — `להזיז` / `Move it`: `∫₀² x² dx` (נוסחה) → a mini slider, thumb glowing and
**animated** on reveal 18 % → 74 % (ידית) → three bars that grow in a 80 ms stagger (רואים
מה משתנה) → the formula again, lit in `--accent` on `--accent-soft` with a soft glow
(מבינים למה). Caption: method.captionB.

Steps are `flex: 1 1 0; max-width: 150px`, so on a phone all four tiles of row B fit on **one
line** (~65 px each at 390) and the strip is ~320 px tall instead of a screen and a half of
vertically stacked cards (*superseded:* "steps stack vertically below 640 px"). Arrows mirror
under RTL (§6.3). Row B's animation plays once on reveal; hovering the row replays it.

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
  curve stroke `--ink` 2.5 — the curve is a polyline **generated from f(x) in JS** (48
  points), not a hand-drawn cubic that approximates x² (the rectangles' tops sit exactly on
  f at the midpoints, so the curve must too).
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

### 5.6 Subjects — superseded by §11 (kept for the reasoning)

Everything below describes the card grid that shipped and that §11 replaces with the tiles
section (`#subjects`, §11.5). Title `נושאים` / `Subjects` with a count chip (`3 LIVE · 1 SOON` EN in mono / `3 פעילים · 1
בקרוב` HE in Plex Sans — update it when a subject lights up). Grid: one column on phones,
**two columns from 640 px** (`repeat(2, minmax(0,1fr))`), gap 14–16. *Superseded:*
`auto-fit, minmax(240px, 1fr)` — with four subjects at 1080 px that produced 3 + 1 and left
one card orphaned on its own row.

Card anatomy (`.subject`, `data-subject="nitrox|math|physics|chemistry"`, inline `--c1/--c2`),
**header row first**, so a card is ~150 px tall on a phone instead of ~370:

1. `.subject-head`: a 42 px tile (rx 13, `linear-gradient(145deg, var(--c1), var(--c2))`,
   white glyph, §3.6) beside a stacked **name + status chip**. *Superseded:* tile above
   name above description above status, each on its own row — on a 358 px card that was
   mostly air.
2. Name is **bilingual**, like everything else on the page: HE uses the app's own Hebrew name
   from its `<title>` (אקדמיית נייטרוקס / אקדמיית המתמטיקה / אקדמיית הפיזיקה / אקדמיית
   הכימיה), EN the English one. Plex Sans 600 17–18 px. Status chip (`status.*`) in `--c2`,
   Plex Sans 600 12 px HE / mono 11 px EN.
3. One-liner, 14 px `--ink-2`:
   - Nitrox: `אוויר מועשר: לחץ חלקי, MOD וגבולות חמצן — דרך סימולציה, לא שינון.` /
     `Enriched air: partial pressure, MOD and oxygen limits — through simulation, not memorization.`
   - Math (now two topics — derivatives and integrals, see `apps/math/src/content/topics.ts`):
     `נגזרות ואינטגרלים: משיפוע ממוצע לנגזרת, וממלבנים לקיצור דרך.` /
     `Derivatives and integrals: from average slope to the derivative, and from rectangles to a shortcut.`
   - Physics: `תנועה: מיקום, מהירות ותאוצה — גוררים ידית על גרף ורואים את הקשר ביניהם.` /
     `Motion: position, velocity and acceleration — drag a handle on a graph and watch how they connect.`
   - Chemistry (soon): `עדיין בעבודה.` / `Still in the works.`
4. **Signature line**: a 100 % wide, 22 px tall SVG pinned to the card's bottom (`margin-top:
   auto`) with a short curve in `--c2` (`vector-effect: non-scaling-stroke`) and a small
   handle dot that appears on hover. Each subject gets its own curve shape: Nitrox a
   descending pressure line, Math a parabola with two rectangles under it, Physics a sine,
   Chemistry a logistic. It's a 6-line SVG per card and it makes every card feel like a
   lesson's doorway.
5. Hover: lift 2 px, border → `--c2`, glow `0 0 32px -6px var(--c2)`; the whole card is the
   `<a>`.
6. "Soon" cards: 60 % opacity, dashed `--line-strong` border, no hover lift, no link, the
   signature line static. No "notify me" (no backend; don't fake one).

Cards were meant to get a glow from the hero scrubber (§5.2 step 3) — never wired up, see
§11.8; clicking a card never moves the hero handle (one-way, so the cards stay plain links).

### 5.7 Footer

A centred **stack**, `--muted`, 13 px: the full Handle mark (`logo.svg`, 22 px — *superseded:*
`logo-mono.svg` at 16 px, which rendered as an unreadable smudge in the muted colour) · line
1 `נבנה על ידי גיא עדן · כלי לימוד עצמאי` · line 2 `חינם בזמן הפיילוט · בעברית ובאנגלית` ·
`github.com/edenguy/academy` (text link, external-link icon). Nothing else. The single-line
version wrapped on phones with a stray `·` starting a line. Bottom padding 96 px so the
feedback button (§5.8) never sits on the link at the end of the page.

### 5.8 Feedback widget (added after this spec; reskinned to hub tokens)

A fixed button at the end-bottom corner opens a small form (question / idea / feature request /
bug report, message, optional screenshot and email) that posts to a form-relay service; it
exists so a learner can report something without a GitHub account. Rules for it on the hub:

- Icon is an **envelope**, not a speech bubble (§7 bans chat bubbles: a bubble FAB reads as
  "chat with an AI"). On phones it is a 46 px circle; from 720 px it is a pill with the word
  `משוב` / `Feedback`, so it isn't a mystery button.
- Hub accent, hub glow, 999 radius. It is the one fixed element on the page, so it must never
  cover a control for good: content gets ≥ 96 px of bottom padding, and the hero's open-lesson
  button sits at the panel's bottom-start where the FAB (end side) doesn't overlap it.
- Labels are bilingual through `.t-he/.t-en`; `aria-label` through `data-label-he/en`.

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
| 10 | Subject tiles' progress state (§11.7) | read-only IndexedDB read of each app's own persisted record, same origin; ring + "continue" pill | the hub remembers *your* stuff, like the apps do |
| 11 | Tile preview handle slides (§11.5) | CSS `offset-path` on the preview's dot, hover/focus-within | every tile is a doorway with a handle on it |

Everything degrades: without JS the page is fully readable, the demos show their initial
state, the hero shows the handle at node 0, both languages still toggle (no — the toggle
needs JS, as today; the HE default renders correctly server-side).

### 6.1 `hub.js` structure

Six IIFEs sharing nothing but DOM: `prefs()` (lang/theme, migrated from today's inline
script body), `heroHandle()`, `riemannDemo()`, `nitroxDemo()`, `methodStrip()`, `reveal()`
(also drives the spotlight). *§11 adds* `tileProgress()` (§11.7) — read-only, asynchronous,
guarded, never blocks first paint. Each guards on `document.querySelector`
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
- [ ] Hero handle: drag with mouse and touch, snaps to nodes, arrow keys follow the visual
      direction (→ = next node to the right, in both languages), axis chips snap, Enter opens
      the active live subject, screen reader announces the subject name. A vertical swipe
      on the panel scrolls the page.
- [ ] On a 390 px phone the handle panel starts within the first screen; axis chips don't
      overlap each other at 360 px in either language; the EN headline is exactly two lines
      at 390 and 1440.
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

For the tiles restructure, run §11.9 as well — it supersedes the subject-card items above.

---

> **Later amendment (Nitrox unlisted).** Nitrox Academy was removed from the hub at Guy's request
> (it's unrelated to the school-subject academies): no tile, hero node/axis chip, demo tab or
> `SOURCES` entry, no link on `/academy/subjects/`, and the share cards no longer mention it.
> Its URL stays live. Wherever this section describes a Nitrox tile, node, chip, pO₂ demo or
> `nitrox-academy:v1` read, that part is **superseded**: the hub has three subject tiles (Math,
> Physics, Chemistry), a single Riemann demo (no tab row), and hero positions Math x=120,
> Physics x=270, Chemistry x=420. Chemistry is a live Pilot tile, not a soon strip. The tile
> grid is one column on a phone, two columns from 640 px with the third tile spanning both
> columns until 899 px, and three equal columns from 900 px.

## 11. Revision — "Inviting landing": restructure around subject tiles (spec, implemented)

Scope: `docs/index.html`, `docs/hub/hub.css`, `docs/hub/hub.js` only. Nothing under `apps/`
or `docs/subjects/` changes. No new network dependency, no framework, no raster image; every
new graphic is inline SVG. Everything the earlier sections say still holds unless a passage
is marked *superseded by §11* above. Where this section says "do X", do X.

### 11.1 Diagnosis — why the hub still isn't inviting after the warmth pass

Evidence: a Playwright sweep of the live `docs/` build on 2026-11-09 — hub, Nitrox Academy's
dashboard and Math Academy's home, at 390×844 and 1440×900, HE and EN, dark and light — plus
`getBoundingClientRect` measurements on the hub (HE, light). Numbers are from that run.

1. **The things you can open are two screens down.** On a 390 px phone the first subject
   card starts at **y = 1818 px** (viewport 844 → 2.15 screens of scrolling); at 1440×900 it
   starts at **1696 px** (1.9 screens). Above it sit the hero (90–727), the method strip
   (783–1175) and the live demo (~1175–1700). A first-time visitor reads two explanations of
   the method before seeing a single subject. Nitrox's dashboard, by contrast, has a CTA
   button at ~310 px and its first progress ring at ~430 px; Math's home has "Start learning"
   at ~690 px with the lesson grid right after.
2. **Nothing on the first screen says "this is yours".** Nitrox greets ("ברוכים הבאים"),
   shows *your* course progress (`0 מתוך 11 שיעורים` in a ring), *your* next lesson ("הבא
   בתור: פרק 1 · מהו נייטרוקס?"), *your* achievements. Math and Physics now do the same
   (rings, "ready to start?" card, continue CTA). The hub shows the same page to everyone,
   always — it is a brochure in a family of dashboards.
3. **Monochrome where the apps are colourful.** Across the hub's 2,779 px (phone) the only
   colour is the hero curve and four 42 px icon tiles; every surface is the same
   white/lavender panel. Nitrox's dashboard has a teal CTA, an orange ring, teal and orange
   56 px icon tiles on tinted squares, and per-chapter progress bars — colour is how it says
   "here is a thing you can do". The hub's own rule (§1.4, "subject colours only on the
   subject's card") capped it at exactly the thing that reads as warm.
4. **The hero spends 140 px on buttons that point down the page.** The lede + two CTAs
   occupy 587–727 px on the phone; the primary button ("Try a simulation") scrolls to the
   demo at ~1175 px — the fourth screen. A button whose target is below the thing it is
   competing with (the subjects) is noise.
5. **The subject cards are small and mostly text.** ~150 px tall on a phone and 147 px on
   desktop, a 42 px tile, two lines of description, a 22 px signature line. They look like
   list items, not doors. Nitrox's chapter tiles are smaller still but they sit *below* a
   dense, personal dashboard — the hub has no such dashboard above its cards.

What is already right and stays: the headline and its double meaning, the Plex/mono
instrument register, the dark-first lighting, the draggable hero handle (first screen, works
on touch), both live demos, the method strip's real formula, the feedback widget, the
footer, and every RTL/LTR-island rule.

### 11.2 New page order and wireframes

Order (both widths): **top bar → hero (headline + handle panel + one-sentence lede) →
subject tiles → live preview → method strip → footer.** The hero's two CTA buttons are
removed (§2.4). The live demo comes before the method strip because it is proof, and the
method strip explains the proof; on desktop the method strip collapses to two columns.

Measured budget for the phone (390×844, HE, from the sweep above, after the changes): top
bar 58 → hero copy 90–226 (eyebrow + two-line h1, unchanged) → handle panel 248–565
(unchanged) → lede ≈ 587–640 (one sentence, two lines) → tiles section starts ≈ 666 →
first tile's header row (badge + name + status) fully visible by ≈ 740 px, i.e. **inside the
first screen**, with the tile's promise line and preview arriving at the first flick.

```
390 px (phone), HE, dark                         1440 px, HE
┌──────────────────────────────┐                ┌─────────────────────────────────────────────────────────┐
│ ☾  [EN|עב]          האקדמיה ▣│ top bar        │ ☾ [EN|עב]                                    האקדמיה ▣ │
│                               │                │                                                           │
│           ● פיילוט · חינם בינתיים │            │ ┌───────────────────┐         ● פיילוט · חינם בינתיים   │
│                  לא משננים.   │ h1             │ │   hero handle     │                    לא משננים.     │
│                  תופסים.      │                │ │   (unchanged)     │                    תופסים.        │
│ ┌───────────────────────────┐ │                │ │                   │   בכל שיעור יש משהו שמזיזים ביד — │
│ │     hero handle panel     │ │ unchanged      │ │ chips · readout   │   ורואים מה קורה. זו השיטה, בכל   │
│ │  curve · nodes · chips    │ │                │ └───────────────────┘   נושא.                            │
│ │  ● נייטרוקס · פעיל  [לשיעור]│ │                │                                                           │
│ └───────────────────────────┘ │                │ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐      │
│ בכל שיעור יש משהו שמזיזים ביד │ lede (1 sent.) │ │[◉] פיזיקה    │ │[◉] מתמטיקה   │ │[◉] נייטרוקס  │ tiles│
│ — ורואים מה קורה. זו השיטה,   │                │ │ ● פיילוט     │ │ ● פיילוט     │ │ ● פעיל       │      │
│ בכל נושא.                     │                │ │ promise…     │ │ promise…     │ │ promise…     │      │
│ ──────── fold ≈ 844 ───────── │                │ │ ~~~preview~~~│ │ ▁▂▃▅▇ curve  │ │ ╱ pO₂ line   │      │
│ ┌───────────────────────────┐ │ TILE 1         │ │ 3 שיעורים  [→]│ │ 6 שיעורים  [→]│ │ 11 שיעורים [→]│      │
│ │ [◉48]  אקדמיית נייטרוקס   │ │  badge+name    │ └──────────────┘ └──────────────┘ └──────────────┘      │
│ │        ● פעיל             │ │  status        │ ┌─────────────────────────────────────────────────────┐ │
│ │ כמה עמוק אפשר לרדת עם     │ │  promise       │ │ [◌] אקדמיית הכימיה · בקרוב · בעבודה. עדיין אין מה…  │ │ soon strip
│ │ התערובת הזו? גוררים ורואים.│ │                │ └─────────────────────────────────────────────────────┘ │
│ │ ┌───────────────────────┐ │ │  preview       │                                                           │
│ │ │ 1.4 ─ ─ ─ ─ ─ ─ ─ ─ ╱ │ │ │  (honest svg)  │                 ככה נראה שיעור כאן                        │ live
│ │ │            ╱──●───    │ │ │                │ ┌─────────────────────────────────────────────────────┐ │
│ │ └───────────────────────┘ │ │                │ │ [tabs]   demo (unchanged)                             │ │
│ │ 11 שיעורים · 2 פרקים [להתחיל →]│ │  meta + cta  │ └─────────────────────────────────────────────────────┘ │
│ └───────────────────────────┘ │                │                                                           │
│ ┌───────────────────────────┐ │ TILE 2 (math)  │                 למה לא פשוט לשנן?                         │ method
│ │ …                         │ │                │ ┌──────────────────────────┬──────────────────────────┐ │ 2 cols
│ ┌───────────────────────────┐ │ TILE 3 (phys)  │ │ להזיז  ∫→ ─●─ → ▮▮▮ → ∫  │ לשנן  ∫ → 8/3 → 8̶/̶3̶      │ │
│ ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐ │ soon strip     │ └──────────────────────────┴──────────────────────────┘ │
│  [◌] אקדמיית הכימיה · בקרוב   │                │                        footer (unchanged)                 │
│ └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘ │                └─────────────────────────────────────────────────────────┘
│   ככה נראה שיעור כאן  (live)  │
│   למה לא פשוט לשנן?  (method) │
│   footer                      │
└──────────────────────────────┘
```

With progress (any tile): a greeting line appears above the grid (`ממשיכים מאיפה שעצרתם`),
that tile's meta row becomes a 36 px ring + `3 מתוך 11 שיעורים`, and its pill reads
`להמשיך` and links to the lesson the learner was in (§11.7).

### 11.3 The colour rule, relaxed (replaces §1.4's "only on its card")

Why relax it: the diagnosis above (#3) is that the one rule which kept the hub "neutral"
also kept it cold. The hub is still the OS and the subjects are still the apps; what changes
is that the OS may show each app's colour wherever that app is represented — exactly like a
home screen shows app icons in their own colours on a neutral background.

The new rule, precisely:

- **Hub chrome stays neutral**: top bar, language/theme controls, headline, lede, section
  titles, the method strip, the footer, the feedback button, the live-demo panel frame.
  These use only §3.2 tokens. Nothing here changes.
- **A subject's colour appears where that subject is represented**: its tile (tinted
  surface, badge gradient, status chip, ring, continue pill, preview strokes), its node and
  axis chip on the hero curve (already so), and inside its own live demo (already so).
- **Caps, so it reads as one system**: surface tint ≤ 8 % of `--c1` over `--panel-solid` in
  light, ≤ 14 % in dark (§11.4 tokens); exactly one saturated element per tile (the 48 px
  badge gradient); text on a tile is `--ink`/`--ink-2` or the subject's text-safe `--ct` —
  never `--c2` and never `--muted` (the muted token falls to 4.1–4.3:1 on the tints);
  headings are never coloured; no tinted backgrounds outside the tiles; the spectrum
  gradient remains the only multi-hue gradient.
- **Everything else in §7 stands** (no sparkles, no emoji, no AI copy, no gradient text, no
  blobs). Glow stays reserved for live/pressable things: a tile may glow softly on hover
  because it is pressable; nothing static glows.

### 11.4 Tokens and tile CSS (exact; add to `hub.css`, replacing the `.subject*` block)

Subject colour declarations live on `[data-subject]` so dark mode can override `--ct`
(the hero nodes keep their inline SVG fills). Contrast figures are computed (WCAG 2.x) for
the actual tint washes: light = `--c1` at 8 % over `#ffffff`, dark = `--c1` at 14 % over
`#16103a`.

```css
/* ---------- Subject tiles (HUB_LLD.md §11) ---------- */
/* Per-subject colour: --c1/--c2 = the app's own favicon gradient; --ct = a text-safe
   variant that passes 4.5:1 on the tile's tinted surface in that theme. Never use --c2 or
   --muted as text on a tile. */
.tile[data-subject="nitrox"]    { --c1: #0e9f94; --c2: #2fd4c6; --ct: #0a6f67; }  /* 5.5:1 on light tint */
.tile[data-subject="math"]      { --c1: #6250d6; --c2: #e87ba4; --ct: #5542c4; }  /* 6.3:1 */
.tile[data-subject="physics"]   { --c1: #3457d1; --c2: #17a3e8; --ct: #2b4bbd; }  /* 6.6:1 */
.tile[data-subject="chemistry"] { --c1: #e0922a; --c2: #14998a; --ct: #8a4e08; }  /* 6.2:1 on light tint #fdf6ee */
:root[data-theme="dark"] .tile[data-subject="nitrox"]  { --ct: #2fd4c6; }  /* 8.2:1 on dark tint */
:root[data-theme="dark"] .tile[data-subject="math"]    { --ct: #a99df0; }  /* 6.6:1 */
:root[data-theme="dark"] .tile[data-subject="physics"] { --ct: #7fa6ff; }  /* 6.7:1 */
:root[data-theme="dark"] .tile[data-subject="chemistry"] { --ct: #f0b45a; }  /* 8.0:1 on dark tint #322238 */

:root { --ct-ink: #ffffff; --tile-tint: 8%; --tile-edge: 30%; }
:root[data-theme="dark"] { --ct-ink: #0d0824; --tile-tint: 14%; --tile-edge: 26%; }

section.subjects { margin-block: 26px 56px; }
@media (min-width: 720px) { section.subjects { margin-block: 36px 84px; } }
.subjects-title { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
.tiles-greeting { font-size: 15px; font-weight: 600; color: var(--ink-2); margin-bottom: 12px; }
.tiles-greeting[hidden] { display: none; }

.tiles { display: grid; grid-template-columns: minmax(0, 1fr); gap: 14px; }
@media (min-width: 640px) { .tiles { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; } }
/* 640–899: the third live tile spans both columns so it is not a half-width orphan. */
@media (min-width: 640px) and (max-width: 899px) { .tiles > .tile:nth-child(3) { grid-column: 1 / -1; } }
@media (min-width: 900px) { .tiles { grid-template-columns: repeat(3, minmax(0, 1fr)); } }

.tile {
  position: relative; display: flex; flex-direction: column; gap: 10px; min-width: 0;
  padding: 16px 16px 14px; border-radius: 20px; text-decoration: none; color: inherit;
  background: color-mix(in srgb, var(--c1) var(--tile-tint), var(--panel-solid));
  border: 1px solid color-mix(in srgb, var(--c2) var(--tile-edge), var(--line));
  box-shadow: inset 0 1px 0 var(--panel-edge), var(--shadow);
  transition: transform 180ms var(--ease), border-color 180ms ease, box-shadow 180ms ease;
}
@media (min-width: 640px) { .tile { padding: 18px 18px 16px; } }
.tile:focus-visible { outline: 3px solid var(--ct); outline-offset: 3px; }
.tile:active { transform: translateY(0) scale(0.995); }
@media (hover: hover) {
  .tile:hover { transform: translateY(-2px); border-color: var(--c2);
    box-shadow: inset 0 1px 0 var(--panel-edge), var(--shadow), 0 0 32px -10px color-mix(in srgb, var(--c2) 70%, transparent); }
  .tile:hover .tile-cta { background: color-mix(in srgb, var(--ct) 88%, black); }
  /* Nitrox and Math: the dot slides along the curve. Physics: the tangent draws in instead
     (its tangent is computed for the midpoint, so its dot must stay put). */
  .tile[data-subject="nitrox"]:hover .pv-dot, .tile[data-subject="math"]:hover .pv-dot { offset-distance: 78%; }
  .tile[data-subject="physics"]:hover .pv-tangent { stroke-dashoffset: 0; }
  .tile[data-subject="chemistry"]:hover .pv-dot { offset-distance: 78%; }
}
.tile[data-subject="nitrox"]:focus-visible .pv-dot, .tile[data-subject="math"]:focus-visible .pv-dot { offset-distance: 78%; }
.tile[data-subject="physics"]:focus-visible .pv-tangent { stroke-dashoffset: 0; }
.tile[data-subject="chemistry"]:focus-visible .pv-dot { offset-distance: 78%; }

.tile-head { display: flex; align-items: center; gap: 12px; }
.tile-badge {
  width: 48px; height: 48px; flex-shrink: 0; border-radius: 14px; display: grid; place-items: center;
  background: linear-gradient(145deg, var(--c1), var(--c2));
  box-shadow: 0 8px 18px -10px color-mix(in srgb, var(--c1) 60%, black);   /* contact shadow, not a glow */
}
.tile-badge svg { width: 26px; height: 26px; stroke: #fff; fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
.tile-title { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
.tile h3 { font-size: 18px; font-weight: 600; line-height: 1.2; color: var(--ink); }
.tile-status { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600; line-height: 1; color: var(--ct); }
.tile-status .dot { width: 6px; height: 6px; border-radius: 50%; background: var(--ct); }
.tile-status .t-en { font-family: var(--mono); font-weight: 500; text-transform: uppercase; letter-spacing: 0.08em; font-size: 11px; }
.tile-promise { font-size: 14px; line-height: 1.5; color: var(--ink-2); }

.tile-preview { width: 100%; height: auto; display: block; direction: ltr; overflow: visible;
  border-radius: 12px; background: color-mix(in srgb, var(--panel-solid) 55%, transparent); }
:root[data-theme="dark"] .tile-preview { background: rgba(255,255,255,0.04); }
.tile-preview .pv-curve { fill: none; stroke: var(--c2); stroke-width: 2.4; stroke-linecap: round; vector-effect: non-scaling-stroke; }
.tile-preview .pv-fill { fill: var(--c1); fill-opacity: 0.12; }
.tile-preview .pv-rect { fill: var(--c1); fill-opacity: 0.22; stroke: var(--c1); stroke-width: 1; vector-effect: non-scaling-stroke; }
.tile-preview .pv-limit { stroke: var(--warn); stroke-width: 1.5; stroke-dasharray: 4 4; vector-effect: non-scaling-stroke; }
.tile-preview .pv-label { font-family: var(--mono); font-size: 10px; fill: var(--warn); }
.tile-preview .pv-mix { font-family: var(--mono); font-size: 10px; fill: var(--ink-2); }
.tile-preview .pv-tangent { stroke: var(--c1); stroke-width: 2; stroke-dasharray: 90; stroke-dashoffset: 90; vector-effect: non-scaling-stroke; transition: stroke-dashoffset 320ms var(--ease); }
.tile-preview .pv-dot { fill: var(--c2); stroke: var(--panel-solid); stroke-width: 2; }
.tile-preview .pv-bond { stroke: var(--c1); stroke-width: 2; }
.tile-preview .pv-atom { fill: none; stroke: var(--c1); stroke-width: 2; }
/* The handle dot rides the curve with CSS motion path where supported (same mechanic as the
   logo, §1.5); without support it stays at its static cx/cy on the curve. */
@supports (offset-path: path('M0 0 L1 1')) {
  .tile-preview .pv-dot { cx: 0; cy: 0; offset-distance: 50%; offset-rotate: 0deg; transition: offset-distance 320ms var(--ease); }
  .tile[data-subject="nitrox"]  .pv-dot { offset-path: path('M16 52.8 L304 8'); }
  .tile[data-subject="math"]    .pv-dot { offset-path: path('M16 64 Q 160 64 304 8'); }
  .tile[data-subject="physics"] .pv-dot { offset-path: path('M16 60 C 120 60, 200 12, 304 12'); }
  .tile[data-subject="chemistry"] .pv-dot { offset-path: path('M56 36 L264 36'); }
}

.tile-foot { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-top: auto; }
.tile-meta { display: inline-flex; align-items: center; gap: 10px; font-size: 13px; font-weight: 500; color: var(--ink-2); min-width: 0; }
.tile-meta .t-en { font-family: var(--mono); font-size: 12px; letter-spacing: 0.02em; }
.tile-ring { width: 36px; height: 36px; flex-shrink: 0; display: none; }
.tile-ring .track { fill: none; stroke: color-mix(in srgb, var(--c1) 22%, var(--panel-solid)); stroke-width: 4; }
.tile-ring .arc { fill: none; stroke: var(--ct); stroke-width: 4; stroke-linecap: round; transform: rotate(-90deg); transform-origin: 50% 50%;
  stroke-dasharray: 97.39; stroke-dashoffset: 97.39; transition: stroke-dashoffset 700ms var(--ease); }
.tile-cta {
  display: inline-flex; align-items: center; gap: 6px; flex-shrink: 0; white-space: nowrap;
  font-size: 13px; font-weight: 600; line-height: 1; padding: 10px 14px; border-radius: 999px;
  background: var(--ct); color: var(--ct-ink); transition: background 180ms ease;
}
.tile-cta svg { width: 14px; height: 14px; stroke: currentColor; fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }

/* State: progress found (class set by hub.js, §11.7) */
.tile.has-progress .tile-ring { display: block; }
.tile.has-progress .meta-first, .tile:not(.has-progress) .meta-progress,
.tile.has-progress .cta-start, .tile:not(.has-progress) .cta-continue,
.tile:not(.is-complete) .cta-review, .tile.is-complete .cta-continue { display: none; }

/* The Chemistry soon strip is gone. Do not add `.tile--soon` back for a live subject. */

/* Method strip: two columns on desktop so it stops being a second screen of its own */
@media (min-width: 900px) {
  .method-panel { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); column-gap: 28px; }
  .method-row + .method-row { margin-top: 0; padding-top: 0; border-top: 0; border-inline-start: 1px dashed var(--line-strong); padding-inline-start: 28px; }
}

@media (prefers-reduced-motion: reduce) {
  .tile, .tile-cta, .pv-dot, .pv-tangent, .tile-ring .arc { transition: none !important; }
}
```

Also: in the existing reduced-motion block and in `reveal()`'s selector list, replace
`.subject` with `.tile` (tiles use the `.reveal` class for the once-only fade-in). Delete
`.hero-ctas` and the whole `.subjects-head`/`.subjects-grid`/`.subject*` block (§11.8).

### 11.5 Markup (exact)

**Hero**: delete the `.hero-ctas` div; replace the lede text with §11.6 `hero.lede`:

```html
<div class="hero-more">
  <p class="lede">
    <span class="t-he">בכל שיעור יש משהו שמזיזים ביד — ורואים מה קורה. זו השיטה, בכל נושא.</span>
    <span class="t-en">Every lesson has something you move with your hand — and you watch what happens. That's the method, in every subject.</span>
  </p>
</div>
```

**Tiles section** — replaces the entire `<section id="subjects">` and moves to directly
after `</section>` of the hero (before `.live`, which now comes before `.method`):

```html
<section class="subjects" id="subjects" aria-labelledby="subjects-title">
  <h2 class="subjects-title" id="subjects-title"><span class="t-he">נושאים</span><span class="t-en">Subjects</span></h2>
  <p class="tiles-greeting" id="tiles-greeting" hidden>
    <span class="t-he">ממשיכים מאיפה שעצרתם</span><span class="t-en">Pick up where you left off</span>
  </p>
  <div class="tiles">

    <a class="tile reveal" href="/academy/subjects/nitrox/" data-subject="nitrox">
      <div class="tile-head">
        <div class="tile-badge" aria-hidden="true">
          <svg viewBox="0 0 24 24"><path d="M9 2h6v3H9zM8 5h8a2 2 0 0 1 2 2v12a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3V7a2 2 0 0 1 2-2Zm0 5h8"/></svg>
        </div>
        <div class="tile-title">
          <h3><span class="t-he">אקדמיית נייטרוקס</span><span class="t-en">Nitrox Academy</span></h3>
          <span class="tile-status"><span class="dot"></span><span class="t-he">פעיל</span><span class="t-en">Live</span></span>
        </div>
      </div>
      <p class="tile-promise">
        <span class="t-he">כמה עמוק אפשר לרדת עם התערובת הזו? גוררים את העומק ורואים.</span>
        <span class="t-en">How deep can this mix go? Drag the depth and see.</span>
      </p>
      <!-- pO₂ vs depth for EAN32 (FO₂ 0.32), 0–40 m, the same teaching approximation the live
           demo uses (pO₂ = 0.32 × (1 + depth/10)): a straight line from 0.32 bar at 0 m to 1.60
           bar at 40 m. Plot: x 16→304 = 0→40 m; y 64→8 = 0→1.6 bar (35 px per bar).
           0.32 → y 52.8; 1.60 → y 8; the dashed limit at 1.4 bar → y 15. The 1.4 is
           DEFAULT_PLANNING_PPO2 from apps/nitrox/src/science/limits.ts — no other number. -->
      <svg class="tile-preview" viewBox="0 0 320 72" aria-hidden="true">
        <text class="pv-mix" x="16" y="12">EAN32</text>
        <polygon class="pv-fill" points="16,52.8 304,8 304,64 16,64"/>
        <line class="pv-limit" x1="16" y1="15" x2="304" y2="15"/>
        <text class="pv-label" x="304" y="12" text-anchor="end">1.4</text>
        <path class="pv-curve" d="M16 52.8 L304 8"/>
        <circle class="pv-dot" cx="160" cy="30.4" r="4.5"/>
      </svg>
      <div class="tile-foot">
        <span class="tile-meta">
          <svg class="tile-ring" viewBox="0 0 36 36" aria-hidden="true"><circle class="track" cx="18" cy="18" r="15.5"/><circle class="arc" cx="18" cy="18" r="15.5"/></svg>
          <span class="meta-first"><span class="t-he">11 שיעורים · 2 פרקים</span><span class="t-en">11 lessons · 2 chapters</span></span>
          <span class="meta-progress"><span class="t-he"></span><span class="t-en"></span></span>
        </span>
        <span class="tile-cta">
          <span class="cta-start"><span class="t-he">להתחיל</span><span class="t-en">Start</span></span>
          <span class="cta-continue"><span class="t-he">להמשיך</span><span class="t-en">Continue</span></span>
          <span class="cta-review"><span class="t-he">לחזור</span><span class="t-en">Review</span></span>
          <svg class="icon-dir" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>
        </span>
      </div>
    </a>

    <a class="tile reveal" href="/academy/subjects/math/" data-subject="math">
      <div class="tile-head">
        <div class="tile-badge" aria-hidden="true">
          <!-- the ∫ as a stroke, same geometry as apps/math/public/favicon.svg scaled to the 24 grid -->
          <svg viewBox="0 0 24 24"><path d="M15 5.5c-1.1 0-1.9.8-1.9 2.2v8.6c0 1.4-.8 2.2-1.9 2.2"/><circle cx="15.4" cy="5.5" r="1.2" fill="#fff" stroke="none"/><circle cx="10.9" cy="18.5" r="1.2" fill="#fff" stroke="none"/></svg>
        </div>
        <div class="tile-title">
          <h3><span class="t-he">אקדמיית המתמטיקה</span><span class="t-en">Math Academy</span></h3>
          <span class="tile-status"><span class="dot"></span><span class="t-he">פיילוט</span><span class="t-en">Pilot</span></span>
        </div>
      </div>
      <p class="tile-promise">
        <span class="t-he">נגזרת ואינטגרל שנולדים מול העיניים — ממשיק וממלבנים.</span>
        <span class="t-en">A derivative and an integral born in front of you — from a tangent and from rectangles.</span>
      </p>
      <!-- f(x) = x² on [0,2] with 6 midpoint rectangles — the live demo's own function and rule.
           Plot: x 16→304 = 0→2; y 64→8 = 0→4 (14 px per unit). The parabola is exact as one
           quadratic Bézier (control point = tangents' intersection at (1, 0) → (160, 64)).
           Rect i (i = 0..5): x = 16 + 48i, width 47, midpoint m = (i + ½)/3, height = m²·14:
           0.389, 3.5, 9.722, 19.056, 31.5, 47.056 → y = 64 − height. -->
      <svg class="tile-preview" viewBox="0 0 320 72" aria-hidden="true">
        <rect class="pv-rect" x="16"  y="63.61" width="47" height="0.39"/>
        <rect class="pv-rect" x="64"  y="60.5"  width="47" height="3.5"/>
        <rect class="pv-rect" x="112" y="54.28" width="47" height="9.72"/>
        <rect class="pv-rect" x="160" y="44.94" width="47" height="19.06"/>
        <rect class="pv-rect" x="208" y="32.5"  width="47" height="31.5"/>
        <rect class="pv-rect" x="256" y="16.94" width="47" height="47.06"/>
        <path class="pv-curve" d="M16 64 Q 160 64 304 8"/>
        <circle class="pv-dot" cx="188.8" cy="43.84" r="4.5"/>
      </svg>
      <div class="tile-foot">
        <span class="tile-meta">
          <svg class="tile-ring" viewBox="0 0 36 36" aria-hidden="true"><circle class="track" cx="18" cy="18" r="15.5"/><circle class="arc" cx="18" cy="18" r="15.5"/></svg>
          <span class="meta-first"><span class="t-he">6 שיעורים · 2 נושאים</span><span class="t-en">6 lessons · 2 topics</span></span>
          <span class="meta-progress"><span class="t-he"></span><span class="t-en"></span></span>
        </span>
        <span class="tile-cta">
          <span class="cta-start"><span class="t-he">להתחיל</span><span class="t-en">Start</span></span>
          <span class="cta-continue"><span class="t-he">להמשיך</span><span class="t-en">Continue</span></span>
          <span class="cta-review"><span class="t-he">לחזור</span><span class="t-en">Review</span></span>
          <svg class="icon-dir" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>
        </span>
      </div>
    </a>

    <a class="tile reveal" href="/academy/subjects/physics/" data-subject="physics">
      <div class="tile-head">
        <div class="tile-badge" aria-hidden="true">
          <svg viewBox="0 0 24 24"><path d="M3 18 Q 12 2 21 18"/><circle cx="12" cy="9.5" r="1.8" fill="#fff" stroke="none"/></svg>
        </div>
        <div class="tile-title">
          <h3><span class="t-he">אקדמיית הפיזיקה</span><span class="t-en">Physics Academy</span></h3>
          <span class="tile-status"><span class="dot"></span><span class="t-he">פיילוט</span><span class="t-en">Pilot</span></span>
        </div>
      </div>
      <p class="tile-promise">
        <span class="t-he">גוררים נקודה על גרף תנועה — והמהירות והתאוצה מגיבות.</span>
        <span class="t-en">Drag a point along a motion graph — velocity and acceleration respond.</span>
      </p>
      <!-- Position vs time, an ease-in-out motion (the shape Physics Academy's own hero uses),
           with the tangent at the handle = the velocity. No axis numbers: nothing here is a
           quantitative claim. Midpoint of the cubic = (160, 36); tangent slope there is
           −72/276 ≈ −0.26 (screen coords), drawn ±40 px in x. -->
      <svg class="tile-preview" viewBox="0 0 320 72" aria-hidden="true">
        <path class="pv-curve" d="M16 60 C 120 60, 200 12, 304 12"/>
        <line class="pv-tangent" x1="120" y1="46.4" x2="200" y2="25.6"/>
        <circle class="pv-dot" cx="160" cy="36" r="4.5"/>
      </svg>
      <div class="tile-foot">
        <span class="tile-meta">
          <svg class="tile-ring" viewBox="0 0 36 36" aria-hidden="true"><circle class="track" cx="18" cy="18" r="15.5"/><circle class="arc" cx="18" cy="18" r="15.5"/></svg>
          <span class="meta-first"><span class="t-he">3 שיעורים · נושא אחד</span><span class="t-en">3 lessons · 1 topic</span></span>
          <span class="meta-progress"><span class="t-he"></span><span class="t-en"></span></span>
        </span>
        <span class="tile-cta">
          <span class="cta-start"><span class="t-he">להתחיל</span><span class="t-en">Start</span></span>
          <span class="cta-continue"><span class="t-he">להמשיך</span><span class="t-en">Continue</span></span>
          <span class="cta-review"><span class="t-he">לחזור</span><span class="t-en">Review</span></span>
          <svg class="icon-dir" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>
        </span>
      </div>
    </a>

    <a class="tile reveal" href="/academy/subjects/chemistry/" data-subject="chemistry">
      <div class="tile-head">
        <div class="tile-badge" aria-hidden="true">
          <svg viewBox="0 0 24 24"><path d="M9 3h6M10 3v6l-5.5 9.5A2 2 0 0 0 6.2 21h11.6a2 2 0 0 0 1.7-3L14 9V3M7.5 15h9"/></svg>
        </div>
        <div class="tile-title">
          <h3><span class="t-he">אקדמיית הכימיה</span><span class="t-en">Chemistry Academy</span></h3>
          <span class="tile-status"><span class="dot"></span><span class="t-he">פיילוט</span><span class="t-en">Pilot</span></span>
        </div>
      </div>
      <p class="tile-promise">
        <span class="t-he">גוררים אלקטרון מאטום לאטום — והקשר, המטען והסריג מגיבים.</span>
        <span class="t-en">Drag an electron from one atom to another — the bond, the charge, and the lattice respond.</span>
      </p>
      <!-- Electron moving from a metal atom to a nonmetal, the ionTransfer lesson's own gesture.
           No numbers: the charge table lives in apps/chemistry/src/chemistry/ionic.ts.
           Plot: viewBox 320×72. Atoms at (56, 36) and (264, 36). The electron rides M56 36 L264 36.
           Static fallback is 38% along that line: x = 56 + 0.38×208 = 135, y = 36. -->
      <svg class="tile-preview" viewBox="0 0 320 72" aria-hidden="true">
        <line class="pv-bond" x1="56" y1="36" x2="264" y2="36"/>
        <circle class="pv-atom" cx="56" cy="36" r="14"/>
        <circle class="pv-atom" cx="264" cy="36" r="14"/>
        <circle class="pv-dot" cx="135" cy="36" r="4.5"/>
      </svg>
      <div class="tile-foot">
        <span class="tile-meta">
          <svg class="tile-ring" viewBox="0 0 36 36" aria-hidden="true"><circle class="track" cx="18" cy="18" r="15.5"/><circle class="arc" cx="18" cy="18" r="15.5"/></svg>
          <span class="meta-first"><span class="t-he">6 שיעורים · נושא אחד</span><span class="t-en">6 lessons · 1 topic</span></span>
          <span class="meta-progress"><span class="t-he"></span><span class="t-en"></span></span>
        </span>
        <span class="tile-cta">
          <span class="cta-start"><span class="t-he">להתחיל</span><span class="t-en">Start</span></span>
          <span class="cta-continue"><span class="t-he">להמשיך</span><span class="t-en">Continue</span></span>
          <span class="cta-review"><span class="t-he">לחזור</span><span class="t-en">Review</span></span>
          <svg class="icon-dir" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>
        </span>
      </div>
    </a>

  </div>
</section>
```

Notes for the implementer:

- The physics tile's `.pv-dot` must **not** slide (its tangent is drawn for the midpoint);
  the §11.4 hover/focus rules are already scoped so only Nitrox and Math slide, and the
  physics tile's effect is the tangent drawing in (`.pv-tangent`). Static `cx/cy` fallbacks: Nitrox
  (160, 30.4) is the line's midpoint; Math (188.8, 43.84) is the parabola at Bézier t = 0.6;
  Physics (160, 36) is the cubic's midpoint. All three sit on their curve.
- Lesson totals in `meta-first` are **content facts**, not design: Nitrox 11 = 5 (ch01) + 6
  (ch02) in `apps/nitrox/src/content/chapters/*.json` (the eight roadmap chapters have no
  lessons and are not counted — the app's own `lessonCount()` counts the same way, and its
  dashboard shows "0 מתוך 11"). Nitrox is unlisted, so that 11 is not a hub tile. Math 6 =
  `apps/math/src/content/lessons/*.yaml` in 2 topics (`topics.ts`); Physics 3 =
  `apps/physics/src/content/lessons/*.yaml`, one topic; Chemistry 6 =
  `apps/chemistry/src/content/lessons/*.yaml`, one topic. They are repeated as `total` in
  `hub.js` (§11.7) and both places must be updated together whenever content is added —
  §11.9 checks them against the YAML.
- Both `meta-progress` spans start empty and are filled by `hub.js`. Digits inside a Hebrew
  sentence (`3 מתוך 11 שיעורים`) are **not** wrapped in `.num` (§3.3's rule).
- Chemistry is a live `<a class="tile">`, same anatomy as Physics. Its preview has no numbers.
  The electron's static `cx`/`cy` is 38% along `M56 36 L264 36`. Hover and focus slide it to
  78% on Chemistry's own path only — it does not use Math's parabola.
- The whole tile is one `<a>`; the "pill" is a `<span>` (no nested interactive elements).

### 11.6 Copy — every new or changed string (HE first)

| key | HE | EN |
|---|---|---|
| hero.lede (replaces §2.2) | בכל שיעור יש משהו שמזיזים ביד — ורואים מה קורה. זו השיטה, בכל נושא. | Every lesson has something you move with your hand — and you watch what happens. That's the method, in every subject. |
| subjects.title (visually hidden h2) | נושאים | Subjects |
| tiles.greeting (hidden until progress is found) | ממשיכים מאיפה שעצרתם | Pick up where you left off |
| tile.nitrox.name | אקדמיית נייטרוקס | Nitrox Academy |
| tile.nitrox.promise | כמה עמוק אפשר לרדת עם התערובת הזו? גוררים את העומק ורואים. | How deep can this mix go? Drag the depth and see. |
| tile.nitrox.meta | 11 שיעורים · 2 פרקים | 11 lessons · 2 chapters |
| tile.math.name | אקדמיית המתמטיקה | Math Academy |
| tile.math.promise | נגזרת ואינטגרל שנולדים מול העיניים — ממשיק וממלבנים. | A derivative and an integral born in front of you — from a tangent and from rectangles. |
| tile.math.meta | 6 שיעורים · 2 נושאים | 6 lessons · 2 topics |
| tile.physics.name | אקדמיית הפיזיקה | Physics Academy |
| tile.physics.promise | גוררים נקודה על גרף תנועה — והמהירות והתאוצה מגיבות. | Drag a point along a motion graph — velocity and acceleration respond. |
| tile.physics.meta | 3 שיעורים · נושא אחד | 3 lessons · 1 topic |
| tile.chemistry.name | אקדמיית הכימיה | Chemistry Academy |
| tile.chemistry.promise | גוררים אלקטרון מאטום לאטום — והקשר, המטען והסריג מגיבים. | Drag an electron from one atom to another — the bond, the charge, and the lattice respond. |
| tile.chemistry.meta | 6 שיעורים · נושא אחד | 6 lessons · 1 topic |
| tile.status.live / pilot | פעיל / פיילוט | Live / Pilot |
| tile.cta.start | להתחיל | Start |
| tile.cta.continue | להמשיך | Continue |
| tile.cta.review (all lessons done) | לחזור | Review |
| tile.meta.progress (JS template) | `{done} מתוך {total} שיעורים` | `{done} of {total} lessons` |

Headline (§2.1), eyebrow (§2.3), section titles and the footer are unchanged. The "promise"
lines claim only what each app does today: Nitrox's MOD/depth simulation (its Lab and
Chapter 2), Math's tangent/secant and Riemann explorers, Physics's motion scrubber,
Chemistry's electron drag between two atoms. "Free" is
still said only in the eyebrow and footer, both tied to the pilot. The English subject names
are the apps' own `<title>`s; the Hebrew names likewise.

### 11.7 `hub.js` — `tileProgress()`: reading each app's progress, read-only

**Feasibility (verified 2026-11-09 with a Playwright probe against the `docs/` build served
at one origin, the same situation as `edenguy.github.io`).** All three apps persist with
zustand `persist` + `createJSONStorage` over `idb-keyval` 6.3.0 using the library's
*default* store (`get`/`set` with no custom store argument — `apps/*/src/progress/store.ts`),
i.e. IndexedDB database **`keyval-store`**, object store **`keyval`**, version 1. Each app
writes one key:

| app | key | written by |
|---|---|---|
| Nitrox | `nitrox-academy:v1` | `apps/nitrox/src/progress/store.ts` (`name`) |
| Math | `academy-math:v1` | `apps/math/src/progress/store.ts` |
| Physics | `academy-physics:v1` | `apps/physics/src/progress/store.ts` |
| Chemistry | `academy-chemistry:v1` | `apps/chemistry/src/progress/store.ts` |

The stored value is a **JSON string** of `{ "state": { … partialized fields … }, "version": 1 }`.
Observed records from the probe (fields the hub reads in bold):

```
nitrox-academy:v1  {"state":{"settings":{…},"lessonsCompleted":{},"lastVisited":{"chapterId":"ch01","lessonId":"ch01-l02"},"assessments":[],"attempts":[],"predictions":{},"achievements":{},"labVisits":0,"acknowledgedAt":null},"version":1}
academy-math:v1    {"state":{"settings":{…},"lessonsCompleted":{},"lastVisited":null,"attempts":[],"achievements":{}},"version":1}
academy-physics:v1 {"state":{"settings":{…},"lessonsCompleted":{},"lastVisited":"velocity-slope","attempts":[],"achievements":{}},"version":1}
```

The hub reads exactly two fields per record: **`state.lessonsCompleted`** (object: lesson id →
completion timestamp) and **`state.lastVisited`** (Nitrox: `{chapterId, lessonId}` object or
`null`; Math/Physics/Chemistry: lesson-id string or `null`). Nothing else — not settings, attempts,
achievements, assessments or the Nitrox acknowledgement. The hub never writes, never deletes,
never opens a `readwrite` transaction, and never upgrades the database.

The one real hazard, and its fix: `indexedDB.open('keyval-store')` on a profile where no app
has run yet would *create* an empty version-1 database with **no** `keyval` store; idb-keyval
only creates its store inside `onupgradeneeded`, which then never fires for the apps, so every
app's read/write would fail with `NotFoundError` forever. The hub must therefore **abort
inside `onupgradeneeded`** so the database is never created. The probe confirmed this: after
the hub's read on a fresh profile, `indexedDB.databases()` was `[]`; after each app had been
opened once, the hub read all three keys.

Pseudocode-plus-exact-keys (plain ES2020, one IIFE, called last in `DOMContentLoaded`):

```js
function tileProgress() {
  var tiles = document.querySelectorAll('.tile[data-subject]:not(.tile--soon)');
  if (!tiles.length || !('indexedDB' in window)) return;
  var ID_RE = /^[a-z0-9][a-z0-9-]{0,63}$/;   // lesson/chapter ids are kebab-case; anything else is rejected
  // `total` must equal the real lesson count (see §11.5 notes) — same numbers as the tiles' meta-first text.
  var SOURCES = {
    nitrox:  { key: 'nitrox-academy:v1',  total: 11, home: '/academy/subjects/nitrox/',
               lessonUrl: function (lv) { return '/academy/subjects/nitrox/#/learn/' + lv.chapterId + '/' + lv.lessonId; },
               lastVisited: function (v) { return v && typeof v === 'object' && ID_RE.test(v.chapterId) && ID_RE.test(v.lessonId) ? { chapterId: v.chapterId, lessonId: v.lessonId } : null; } },
    math:    { key: 'academy-math:v1',    total: 6,  home: '/academy/subjects/math/',
               lessonUrl: function (id) { return '/academy/subjects/math/#/lesson/' + id; },
               lastVisited: function (v) { return typeof v === 'string' && ID_RE.test(v) ? v : null; } },
    physics: { key: 'academy-physics:v1', total: 3,  home: '/academy/subjects/physics/',
               lessonUrl: function (id) { return '/academy/subjects/physics/#/lesson/' + id; },
               lastVisited: function (v) { return typeof v === 'string' && ID_RE.test(v) ? v : null; } },
    // nitrox above is superseded (unlisted). Do not add it back. Chemistry is a live tile.
    chemistry: { key: 'academy-chemistry:v1', total: 6, home: '/academy/subjects/chemistry/',
               lessonUrl: function (id) { return '/academy/subjects/chemistry/#/lesson/' + id; },
               lastVisited: function (v) { return typeof v === 'string' && ID_RE.test(v) ? v : null; } }
  };

  // 1. Open read-only; abort if the DB would be created; give up silently after 1500 ms.
  function openExisting(cb) {
    var done = false; function finish(db) { if (!done) { done = true; cb(db || null); } }
    try {
      var req = indexedDB.open('keyval-store');            // no version → opens whatever exists
      req.onupgradeneeded = function () { try { req.transaction.abort(); } catch (e) {} finish(null); }; // DB absent → never create it
      req.onerror = req.onblocked = function () { finish(null); };
      req.onsuccess = function () {
        var db = req.result;
        db.onversionchange = function () { try { db.close(); } catch (e) {} };
        if (!db.objectStoreNames.contains('keyval')) { db.close(); return finish(null); }
        finish(db);
      };
      setTimeout(function () { finish(null); }, 1500);
    } catch (e) { finish(null); }
  }

  // 2. One readonly transaction, one get per key.
  function readAll(db, keys, cb) {
    var out = {}; try {
      var tx = db.transaction('keyval', 'readonly'), store = tx.objectStore('keyval');
      keys.forEach(function (k) { var g = store.get(k); g.onsuccess = function () { out[k] = g.result; }; });
      tx.oncomplete = function () { db.close(); cb(out); };
      tx.onerror = tx.onabort = function () { db.close(); cb(out); };
    } catch (e) { try { db.close(); } catch (_) {} cb(out); }
  }

  // 3. Parse defensively: anything unexpected → null (first-visit state).
  function parse(raw, src) {
    try {
      if (typeof raw !== 'string') return null;             // idb-keyval stores zustand's JSON string
      var state = JSON.parse(raw).state;
      if (!state || typeof state !== 'object') return null;
      var lc = state.lessonsCompleted;
      var completed = {};
      if (lc && typeof lc === 'object' && !Array.isArray(lc)) {
        Object.keys(lc).forEach(function (id) { if (ID_RE.test(id) && typeof lc[id] === 'number' && isFinite(lc[id])) completed[id] = true; });
      }
      var done = Math.min(src.total, Object.keys(completed).length);
      var lv = src.lastVisited(state.lastVisited);
      var lvId = lv && (typeof lv === 'string' ? lv : lv.lessonId);
      var resume = lv && !completed[lvId];                   // the apps' own useNextLesson rule: last visited, if still incomplete
      return { done: done, total: src.total, complete: done >= src.total, href: resume ? src.lessonUrl(lv) : src.home, hasProgress: done > 0 || !!lv };
    } catch (e) { return null; }
  }

  // 4. Apply to the DOM. Both languages are written; CSS shows one.
  function apply(tile, p) {
    if (!p || !p.hasProgress) return;                        // first-visit state is the markup's default
    tile.classList.add('has-progress'); if (p.complete) tile.classList.add('is-complete');
    tile.href = p.href;
    var he = tile.querySelector('.meta-progress .t-he'), en = tile.querySelector('.meta-progress .t-en');
    if (he) he.textContent = p.done + ' מתוך ' + p.total + ' שיעורים';
    if (en) en.textContent = p.done + ' of ' + p.total + ' lessons';
    var arc = tile.querySelector('.tile-ring .arc');
    if (arc) { var c = 97.39; arc.style.strokeDashoffset = String(c * (1 - (p.total ? p.done / p.total : 0))); }
    var ring = tile.querySelector('.tile-ring'); if (ring) ring.setAttribute('aria-label', Math.round(100 * p.done / p.total) + '%');
    var greet = document.getElementById('tiles-greeting'); if (greet) greet.hidden = false;
  }

  openExisting(function (db) {
    if (!db) return;
    var keys = Object.keys(SOURCES).map(function (k) { return SOURCES[k].key; });
    readAll(db, keys, function (values) {
      tiles.forEach(function (tile) {
        var src = SOURCES[tile.dataset.subject]; if (!src) return;
        apply(tile, parse(values[src.key], src));
      });
    });
  });
}
```

Behavioural contract and edge cases (each is a §11.9 check):

| situation | what the hub does |
|---|---|
| No IndexedDB (very old browser, some webviews, blocked storage) | `'indexedDB' in window` false or `open` throws → return; tiles stay first-visit. |
| Fresh profile, no app ever opened | `onupgradeneeded` fires → abort → `databases()` stays empty; first-visit state. **The hub must never create `keyval-store`.** |
| DB exists but has no `keyval` store (impossible via idb-keyval, but guard) | `objectStoreNames.contains` false → close, first-visit. |
| Private mode where `open` errors or hangs | `onerror` / 1500 ms timeout → first-visit. |
| App opened once, nothing done (Nitrox writes a record on first load: `lessonsCompleted: {}`, `lastVisited: null`) | `hasProgress` false → first-visit state, not "0 of 11 · continue". |
| Lesson visited, none completed | `has-progress`: ring at 0 %, `0 מתוך 11 שיעורים`, pill "להמשיך" → that lesson. |
| `lastVisited` lesson already completed | pill "להמשיך" → the app's **home** (the app's own dashboard computes the next incomplete lesson; the hub has no lesson list and must not guess). |
| All lessons done (`done >= total`) | `is-complete`: ring full, pill "לחזור" → app home. |
| Record from a future app version (`version` ≠ 1, extra/missing fields) | `version` is ignored; parsing is by shape; unknown ids are counted only if kebab-case with a finite timestamp; `done` is clamped to `total`. |
| Corrupt value (not a string, not JSON, `state` missing) | `parse` → null → first-visit. |
| Ids with unexpected characters | rejected by `ID_RE`; `href` falls back to app home — nothing from storage is ever placed in a URL unvalidated. |
| Learner resets progress in an app | the app writes `lessonsCompleted: {}` / `lastVisited: null` → next hub load shows first-visit. |
| Language switched after load | both `.t-he` and `.t-en` are filled; the CSS toggle does the rest. |
| Reduced motion | ring has no transition (§11.4). |
| JS disabled | tiles render first-visit state; everything is still a working link. |
| Two tabs writing while the hub reads | readonly transaction; worst case a value one write stale — acceptable. |

Keep `tileProgress()` under ~110 lines; no globals; no `setInterval`; the only timer is the
single 1500 ms guard. Run it after `reveal()` so the first paint never waits on IndexedDB.

### 11.8 Orphaned code to remove in the same change

- `hub.css`: `.subject.active-glow { … }` (nothing ever adds `active-glow`); the whole
  `.subjects-head`, `.subjects-grid`, `.subject`, `.subject.in-view`, `.subject.soon`,
  `.subject-head`, `.subject-tile`, `.subject-title`, `.subject h3`, `.subject .status-chip*`,
  `.subject p.subject-desc`, `.subject-signature*` rules (replaced by §11.4); `.hero-ctas`;
  `.subject` in the `prefers-reduced-motion` block (replace with `.tile`); `.chip` if no other
  element uses it after the count chip goes (grep before deleting).
- `hub.js`: `body.dataset.active = s.key;` in `snapTo()` and the `var body = document.body;`
  declaration (no CSS consumes `body[data-active]`); `.subject` in `reveal()`'s
  `querySelectorAll('.reveal, .subject, .method-row')` → `.tile`.
- `index.html`: the `.hero-ctas` div, the old `<section id="subjects">` markup (cards, count
  chip, signature SVGs), and the hero anchors `href="#live"`/`href="#subjects"` that pointed
  at them. `id="live"` stays (nothing else links to it, but it is a stable anchor).
- `HUB_LLD.md` §5.6 and §2.4 are kept as superseded text; do not delete them.

### 11.9 Acceptance checklist (run at 390×844 and 1440×900, HE and EN, dark and light)

1. Page order top to bottom is: top bar, hero (eyebrow, h1, handle panel, lede), tiles, live
   preview, method strip, footer. No CTA buttons in the hero; the hero panel's "Open the full
   lesson" link still works for the snapped subject.
2. 390×844, HE and EN, no stored progress: the first tile's badge, name and status chip are
   fully visible without scrolling (header row bottom ≤ 844 px); the hero handle panel is
   still on the first screen (top ≤ 300 px).
3. 1440×900: Math, Physics, and Chemistry are three live tiles in one row of equal height.
   640–899 px is two columns, and the third tile spans both so it is not a half-width orphan.
   A phone is one column. There is no Chemistry soon strip.
4. No horizontal overflow at 360, 390, 1440 in either language; tile text never clips; the
   pill never wraps to two lines (check EN `Continue` and HE `להמשיך` at 360 px).
5. Each live tile's preview is honest and matches its comment: Nitrox line from (16, 52.8) to
   (304, 8) with the dashed 1.4 limit at y = 15 and labels `EAN32`/`1.4` only; Math's six
   rectangle heights equal `((i+½)/3)² × 14` px (0.39, 3.5, 9.72, 19.06, 31.5, 47.06); Physics
   shows no numbers. Chemistry shows two atoms and an electron, and no numbers. No other
   numbers anywhere on a tile except lesson counts.
6. Lesson counts: `meta-first` texts and `SOURCES[*].total` read Math 6, Physics 3, Chemistry 6
   and equal `ls apps/<subject>/src/content/lessons/*.yaml | wc -l` for each. Nitrox is not on
   the hub and is not part of this count.
7. Contrast (any WCAG tool, both themes): `--ct` on each tile's actual background ≥ 4.5:1;
   `--ink-2` on each tile ≥ 4.5:1; pill text on `--ct` ≥ 4.5:1; no `--muted` text and no
   `--c2` text anywhere on a tile.
8. Subject colour appears only on tiles, hero nodes/chips and inside the demos; the top bar,
   headline, section titles, method strip, footer and feedback button are unchanged hub
   tokens. The tile surfaces read as tinted paper/indigo, not as four saturated blocks
   (tint ≤ 8 % light / ≤ 14 % dark).
9. Hover is defined only inside `@media (hover: hover)`; on a touch emulation (Chromium
   device mode, iPhone preset) tapping a tile navigates with no stuck lifted/glowing state
   after returning. `:focus-visible` shows a 3 px `--ct` outline, offset 3 px.
10. Hover on the Math tile slides its preview dot 50 % → 78 % along its own curve and back;
    hover on Physics draws the tangent in; hover on Chemistry slides its electron 50 % → 78 %
    along `M56 36 L264 36` only. Chemistry is a focusable link. Nitrox is not on the hub.
11. In a browser without `offset-path` support (or with the `@supports` block commented out),
    every dot sits on its curve at the static `cx/cy`.
12. Fresh browser profile (never opened any subject app): load the hub, then run
    `await indexedDB.databases()` in the console → no `keyval-store` entry; tiles show the
    first-visit state; no console errors.
13. Open Nitrox Academy, start lesson `ch01-l02` without finishing, return to the hub: Nitrox
    tile shows the greeting line, a ring at 0 %, `0 מתוך 11 שיעורים` / `0 of 11 lessons`, pill
    `להמשיך` / `Continue`, `href` = `/academy/subjects/nitrox/#/learn/ch01/ch01-l02`. Math
    and Physics tiles are unchanged.
14. Complete a Math lesson, then open a second one: Math tile ring ≈ 17 % (1/6), `1 מתוך 6
    שיעורים`, pill → `/academy/subjects/math/#/lesson/<second id>`. Complete it too and go
    back to the first: pill → `/academy/subjects/math/` (last-visited is complete → app home).
15. Complete all three Physics lessons: ring 100 %, pill `לחזור` / `Review` → app home.
16. Reset progress inside an app (its settings/reset), reload hub → that tile is back to
    first-visit.
17. Tamper test (DevTools → Application → IndexedDB → `keyval-store` → `keyval`): set
    `academy-physics:v1` to `"not json"`, to `{"state":null}`, to a record whose
    `lastVisited` is `"../../evil"`, and to one with 99 `lessonsCompleted` entries. Each
    reload: no console error; the first two show first-visit, the third shows a pill to the
    Physics home, the fourth shows `3 מתוך 3` (clamped) and `לחזור`.
18. The hub never writes: after the sequences above, the apps' records are byte-identical to
    what the apps wrote (compare in DevTools), and the apps still load and save normally.
19. Switching language on the hub after progress has rendered flips the meta text and pill
    label with no reflow glitch; numbers inside the Hebrew sentence read in the right order.
20. `prefers-reduced-motion: reduce`: no reveal transform, no ring sweep, no dot slide; drags
    still work; tiles are fully opaque.
21. Lighthouse (mobile) still ≥ 95 performance / 100 accessibility; page weight still
    < 80 KB excluding fonts; no new network requests on load besides fonts.
22. `grep -n "active-glow\|dataset.active\|hero-ctas\|subjects-grid\|subject-signature" docs/index.html docs/hub/hub.css docs/hub/hub.js` returns nothing.
23. `CLAUDE.md` ("The hub page" and "Visual design system (hub)") and `README.md` step 3
    describe tiles, the relaxed colour rule and the progress read; `HUB_LLD.md` §1.4, §2.4,
    §3.1 #3, §3.2, §4, §5.2 step 3, §5.6 carry their *superseded by §11* notes.
