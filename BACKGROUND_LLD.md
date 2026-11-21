# The Paper layer — floating napkins (and bubbles) — low-level design

Status: **Revision 2 is the current design (spec, not built). Revision 1 is what is built**
(Phase 0: the engine; Phase 1a: Math's stage band and gutters, both on `main`).
Scope: the hub, Math, Physics, Chemistry (Phase 1) and Nitrox (Phase 2, gated).
Where this file and an older spec disagree, this file wins for the Paper layer only; every
other rule in `CLAUDE.md`, `HUB_LLD.md` and `SUBJECT_APP_SKIN_LLD.md` still applies. Inside
this file, Revision 2 (sections R0–R11) wins over Revision 1 (sections 0–16).

---

# REVISION 2 — napkins everywhere, glass cards, wild paper, a large random catalog

Status: **spec, not built.** What is on `main` today is Revision 1 (Phase 0 + Phase 1a: a stage
band and two margin gutters in Math). This revision replaces Revision 1's main decisions. It is
written for an implementer who has not seen the discussion.

**How to read this file.** Sections R0–R11 below are current. Sections 0–16 after them are
Revision 1. A Revision 1 passage that this revision replaces carries a line starting
"**Superseded by Revision 2**"; everything in Revision 1 without that line still applies
(the pen, the sprite renderer, the motion key, the automatic stops, the Nitrox bubbles, the
sync script, the facts rule). Where the two disagree, Revision 2 wins.

Contents: R0 the direction · R1 decisions · R2 what was measured · R3 the full-page layer ·
R4 glass and legibility · R5 performance, the quality ladder, calm mode · R6 the wild surface ·
R7 catalogs and random order · R8 integration into Math · R9 acceptance · R10 phases ·
R11 risks and cut order.

---

## R0. The direction

Guy looked at Math Academy with Revision 1 live on his phone and said (translated):

> I would like the napkins to be larger. I want more of them. I want the cards to be
> translucent so that the napkins behind them are semi-visible. And I want the napkins to be
> on the entire page and not only on the upper top of the page. And I want the napkins to be
> more curved and more crazy shaped, with more curvature, like a saddle, but not really a
> classic saddle — waves and all kinds of wrinkles in all three dimensions. And I want more
> than just two formulas: all kinds of formulas, shown in random.

He also said the napkins look too pale: small, washed out, and cut by the top edge of the band.

So:

1. Napkins fill the **whole page** on every page type (home, lesson, quiz), on one fixed layer
   behind everything.
2. They are **larger** and there are **more** of them.
3. Cards are **translucent glass**; napkins show through, softened.
4. The paper is **far wilder**: bumps, ripples, a twist, a bend, a curled corner.
5. The catalog is **large and shuffled**: 51 payloads in Math instead of 11.

Revision 1 rejected a full-page layer because text straight on napkins was unreadable. That
finding still holds, and this revision does not ignore it: **no text ever stands straight on
the field. Every piece of text sits on a glass surface whose worst case was measured** (R4).
That one rule is what makes the owner's direction workable.

Costs, stated once: it draws four to six times more pixels than Revision 1; glass over a
moving canvas makes the browser re-blur on every drawn frame; and a graph on strongly curved
paper looks bent (the grid bends with it, so it reads as paper, but it is less of a clean
plot). R5 and R11 say what is done about each and what goes first if a budget is missed.

---

## R1. Decisions

| # | Decision | Replaces |
|---|---|---|
| E1 | One `position: fixed` full-viewport canvas (the **field**) behind everything, on every page of an app and on the hub. No stage band, no gutters, no edge fog. | D4, D5, §3, §5.4 |
| E2 | Napkin count by viewport width: 6 under 700 px, 7 from 700, 9 from 1100, 11 from 1800. A napkin is 0.82–1.10 of the viewport width on a phone and 400–690 px on a desktop. | §3 counts, §5.3 |
| E3 | Stronger paper: white napkins, edge, shadow, grid and ink alpha raised (R3.4); depth range halved and depth fog floor raised from 0.45 to 0.78. | §7 (Math row), §5.2 |
| E4 | **No text on the field.** Every text block sits on glass: cards become translucent, and text that used to stand on the page (hero copy, section headings, lesson header and prose, footer, loose links) gets a glass **plate**. | "Nothing is ever placed over the Paper layer" in §3 |
| E5 | Three glass strengths with measured worst-case contrast: pane 0.72 / 0.78 (light / dark), bench and reading sheet 0.86 / 0.88, wells 0.94. Blur 14 px. A **clear** fallback without blur at 0.90 / 0.93. | — |
| E6 | The engine tells CSS what it can afford through `data-paper` on `<html>`: `frost`, `clear`, or absent (no field: every card is solid, exactly as today). | — |
| E7 | A five-step quality ladder driven by measured frame gaps: resolution, blur, count, frame rate, still frame (R5.2). | §8.4 |
| E8 | The button has three states: moving, **calm**, still. It lives in the top bar. | §8.5 placement |
| E9 | Surface: 5–8 bumps, 2–3 ripples, twist, bend, one curled corner, relief 0.85–1.10 half-widths, slope capped at 1.5. The rim is wild, the middle is calmer so the drawing stays readable. | §5.2 relief row, "flatter, steadier napkins" in §0 |
| E10 | Math catalog 51 payloads in 9 families. A seeded shuffle bag deals them: no repeat within a bag, never two neighbours of one family. | §5.2 payload index rule, §10.1 count |
| E11 | Still true: no glow, no scroll parallax, no pointer reaction, symbols only on napkins, every payload a checked fact, one motion key for all apps, still frame for reduced motion. | D6, D8, D9 stand |

---

## R2. What was measured before writing this

A throwaway prototype (never committed) patched the shipped engine with the page flow, the
surface of R6 and the placement of R3, added the glass CSS of R4 and the plates to the real
Math app, built it, and served the build. Everything below is from that build.

Method, as in §2.1: Playwright, bundled Chromium, headless, **software rasteriser, no GPU**.
Frame rate = `requestAnimationFrame` gaps over 4 s after 3 s of warm-up, governor disabled so
each level is measured alone. "÷4" = `Emulation.setCPUThrottlingRate = 4`. "JS" = time inside
the engine's own `draw()` (p50 / p95).

**Read these numbers as pessimistic and relative.** Filling a canvas and blurring a backdrop
are GPU work on a real phone or laptop; here they run on the CPU, and the throttle slows them
too. The harness cannot say what a real phone does. It can say which lever matters most, and
it sets the gate for the real-device check (R9 item 14).

### R2.1 Frame rate

Phone, 390×844 at device pixel ratio 3, 6 napkins. Levels are those of R5.2.

| Case | fps, no throttle | fps, ÷4 | JS ms, ÷4 |
|---|---|---|---|
| Revision 1 stage, 2 napkins (from §2.1, for comparison) | 59.8 | 55.4 | 1.9 / 3.4 |
| Home, L0: frost glass, canvas 780×1688 (1.32 MP) | 50.5 (58.8 with 5 napkins) | 14.6 | 6.8 / 11.7 |
| Home, same but clear glass (no blur) | 60.0 (5 napkins) | 10.5–18.3 (noisy) | 6.0 / 9.1 |
| Home, frost, canvas capped at 0.7 MP | — | 20.2 | 5.4 / 13.8 |
| Home, frost, canvas at ratio 1 (0.33 MP) | — | 42.6 | 5.2 / 9.3 |
| Home, clear, canvas at ratio 1 | — | 42.3 | 5.4 / 8.5 |
| Home, L2: clear, 0.6 MP | — | 21.6 | 8.0 / 13.1 |
| Home, L3: clear, 0.6 MP, 4 napkins | — | 30.5 | 5.7 / 7.9 |
| Home, L4: L3 at half rate | — | page 41.7, 21 draws/s | 5.9 / 12.8 |
| Lesson page, L0 | 56.8 | 15.6 | 6.2 / 11.8 |
| Lesson page, L3 | — | 25.3 | 7.2 / 8.8 |

Desktop, 1440×900 at ratio 2, 9 napkins (canvas 1497×935, 1.4 MP cap).

| Case | fps, no throttle | fps, ÷4 | JS ms |
|---|---|---|---|
| Home, L0: frost | 24.8 (31.9 with 8 napkins) | 7.8 | 3.1 / 5.0 unthrottled |
| Home, clear glass | 54.3 (60.0 with 8 napkins) | 11.6 | 2.4 / 4.1 unthrottled |
| Home, frost with blur 8 px instead of 14 | 29.0 | — | — |
| Home, L3: clear, 6 napkins | — | 14.1 | 9.4 / 11.8 at ÷4 |
| Home, L4: L3 at half rate | — | page 27.5, 13.8 draws/s | — |
| Lesson page, L0: frost | 28.9 (20.6 in one run) | — | 2.4 / 3.0 |
| Lesson page, clear | 56.0 | — | 2.0 / 3.1 |

Hidden tab: 0 frames in 600 ms. Reduced motion: 0 engine frames in 1.5 s, the same still frame
on two loads (canvas bytes identical at 390 and 1440 px), no pause button. No console error,
no horizontal overflow on home or lesson at either width.

What the numbers say:

1. **On a phone the cost is pixels, not blur.** Frost against clear is within noise at every
   size; canvas resolution moves ÷4 from 15 to 43 fps. So the first step down is resolution.
2. **On a wide screen the cost is blur.** The frosted area is large (plates, cards, the bench):
   25 fps with it, 54 without, and a smaller radius does not help (29). So the second step
   down is blur.
3. **The engine's own JavaScript is not the problem** (2–3 ms a frame unthrottled with the new
   surface and 6–9 napkins), though it is 3–4 times Revision 1.
4. **A machine like "÷4 without a GPU" cannot run this.** It ends on the still frame, by
   design. Nothing above L3 reaches 30 fps there.
5. Honest summary: in this harness a phone-sized page is smooth unthrottled (50–59 fps) and a
   desktop-sized page is smooth only without blur. Whether a real mid-range phone is smooth
   **is not known** and must be measured on the device before Phase 1a-v2 merges.

### R2.2 Legibility through glass (the numbers behind R4)

Method: on the built app, hide the content, cover the viewport with one probe element
carrying the glass recipe, screenshot at ratio 1, and take the single worst pixel (darkest in
light, lightest in dark) over 8 seeds × 3 payload sets (the shuffled catalog, every napkin
carrying the bar chart M1, every napkin carrying the filled triangle M2: the densest inks)
× 390 and 1440 px, with the tokens of R3.4. Then the WCAG contrast of each of the app's six
text colours against that pixel. The weakest colour decides: `--good` in light, `--muted` in
dark. On today's solid surface they have 5.37 and 5.23.

| Glass | Light: worst pixel, weakest text | Dark: worst pixel, weakest text |
|---|---|---|
| alpha 0.62, blur 14 | `rgb(234,229,240)`, **4.34 fails** | `rgb(51,37,88)`, **4.17 fails** |
| alpha 0.70, blur 14 | `rgb(239,234,244)`, 4.54 | `rgb(47,33,83)`, **4.41 fails** |
| alpha 0.76–0.78, blur 14 | `rgb(243,240,247)`, 4.76 | `rgb(44,30,79)`, 4.59 |
| alpha 0.86, blur 14 | `rgb(247,245,250)`, 4.96 | `rgb(39,26,73)`, 4.85 |
| alpha 0.90, no blur | `rgb(239,236,240)`, 4.58 | `rgb(46,36,82)`, **4.33 fails** |
| alpha 0.93, no blur | `rgb(244,241,244)`, 4.79 | `rgb(42,32,76)`, 4.58 |
| top bar, alpha 0.74, blur 14 | not sampled (see R4.2) | `rgb(37,24,63)`, 5.03 |

The no-blur rows agree with arithmetic: the darkest ink a napkin can show is the label colour
`#4a3a63` at ink alpha 0.95 on a white napkin; under 0.90 white glass that is
`rgb(239,236,240)`, and `--good` `#0b7a4f` on it is 4.58:1. `--ink` and `--ink-2`, which carry
all body text, never fall below 7.8:1 in any row.

### R2.3 What was looked at

Screenshots at 390 and 1440 px, light and dark, home and a lesson, top and scrolled:

- Napkins read as sheets of paper all over the page; behind a pane they are soft coloured
  shapes with a visible edge and the heavier strokes, and they are sharp between and around
  the cards.
- The hero headline, the lesson prose and the key points read as before. The explorer's
  chart is crisp (it sits in a well on the bench: under 1 % of the field comes through).
- At relief 1.3 with slope cap 2.0 a sine curve stopped looking like one and labels hung off
  folded paper. At relief 0.85–1.10, slope cap 1.5 and a calmer middle (R6) the napkins are
  visibly crumpled and wavy with ragged outlines, and every formula was readable.
- A regular grid of start positions left the middle of a wide page empty. The low-discrepancy
  sequence of R3.2 covers the page.
- In light mode the Revision 1 tokens were as pale as the owner said. With R3.4 the sheets
  stand off the page.

---

## R3. The full-page layer

### R3.1 Where

One host per page, `<div class="paper-field">`, `position: fixed`, covering the viewport,
`z-index: -1` inside the app's `#root` (which is `isolation: isolate`), so it is above the page
background and below all content. One canvas inside it. It is on every route. The hub gets the
same host as the first child of `<body>` with `z-index: 0` and `.wrap` above it (Phase 1d-v2).

The host is `inset: 0 0 auto 0; height: 100lvh` (the *large* viewport), not
`inset: 0`: on a phone the browser's address bar slides away while scrolling, and a host tied
to the visible viewport would resize the canvas at that moment.

Engine, `flow: 'page'`:

- No edge fog. A napkin leaves by drifting past the edge and by its own fade at the ends of
  its life; nothing clips it along a line.
- A resize does not deal new napkins. Positions and travel are stored as fractions of the
  host's width and height and are rescaled; only the canvas is resized. (Revision 1 threw the
  napkins away on any size change.)
- The IntersectionObserver is kept but always reports visible; the loop still stops for a
  hidden tab, idle, pause, and the cases of §8.3.
- The app's page background keeps its light and gradient. The 24 px graph rule on `body` and
  the `#root::before` fade are switched off while a field is mounted (R8.2): the napkins are
  the graph paper now and a second grid behind them is noise.

### R3.2 Count, size, placement

| Viewport width | Napkins | Sheet width `b` (its own size, before perspective) | On screen at its nearest |
|---|---|---|---|
| under 700 px | 6 | `0.96 × w × (0.85…1.15)`: 318–430 px at 390 | 0.6–1.0 of the viewport width |
| 700–1099 | 7 | `clamp(0.36 w, 400, 600) × (0.85…1.15)`: 340–460 px | 250–410 px |
| 1100–1799 | 9 | same: 440–600 px at 1440 | 320–530 px |
| from 1800 | 11 | same, 510–690 px | 370–610 px |

The caller may pass `count`; without it the engine uses this table. (Revision 1 on a phone:
2 napkins of 130–180 px.)

```js
// flow === 'page'; w, h = host size; i = slot, g = its generation; rnd = this napkin's seeded source
const phone = w < 700, base = phone ? w * 0.96 : clamp(w * 0.36, 400, 600);
const b = base * (0.85 + rnd() * 0.3);
hw = b / 2; hh = hw * (0.62 + rnd() * 0.2);
// where its path is centred: the R2 low-discrepancy sequence, so any run of napkins covers the page
const k = i + g * count + seed * 3;
mx = w * (0.04 + 0.92 * ((0.5 + k * 0.7548776662) % 1));
my = h * (0.06 + 0.88 * ((0.5 + k * 0.5698402910) % 1));
// its travel over its life: any direction; a "crossing" napkin (40 %) goes far
const th = rnd() * TAU, far = Math.min((crossing ? 0.55 : 0.22) * Math.max(w, h), MAX_DRIFT * LIFE_S);
dx = Math.cos(th) * far; dy = Math.sin(th) * far;
zNear = 0.12 + rnd() * 0.25;  zEnd = crossing ? 0.6 + rnd() * 0.4 : Z_FAR;
```

`LIFE_S = 44` for the page flow, `MAX_DRIFT = 20` px/s as before, so `far` is at most 880 px.
Napkins overlap; they are drawn far to near as before.

### R3.3 Depth and fog, so they are not pale

| | Revision 1 | Revision 2 (page flow) |
|---|---|---|
| `Z_FAR` | 2 (a far napkin is a third of its size) | 1.25 (never under 44 %) |
| Depth fog, `fog = fade × (floor + (1 − floor) × near)` | floor 0.45 | floor 0.78 |
| Fade at the ends of a life | first and last 7 % | same |
| Rigid turn `rot`, `spin` | ±0.25, ±0.15 rad | ±0.55, ±0.30 rad |
| Tilt amplitudes | 0.55, 0.60 rad | 0.42, 0.46 rad (the surface itself now carries the shape) |
| Canvas pixel cap | 0.9 MP | 1.4 MP at level L0 (a phone gets ratio 2; 1440×900 gets 1.04) |

### R3.4 Tokens

`--paper-ink-alpha` is 0.95 everywhere (was 0.8). `--napkin-cells` stays 12. Inks and
`--paper-text` are unchanged from §7. Numbers after an ink are its contrast at 0.95 on the new
napkin.

| | `--napkin` | `--napkin-edge` | `--napkin-shadow` | `--paper-grid` / `--paper-grid5` | ink 1 | ink 2 | ink 3 | text |
|---|---|---|---|---|---|---|---|---|
| **Math light** | `#ffffff` | `rgba(98,42,182,.5)` | `rgba(60,30,120,.26)` | `rgba(98,42,182,.17)` / `rgba(98,42,182,.36)` | 5.22 | 4.97 | 4.07 | 8.74 |
| **Math dark** | `#2b1c55` | `rgba(173,150,255,.55)` | `rgba(0,0,0,.55)` | `rgba(173,150,255,.2)` / `rgba(173,150,255,.42)` | 5.89 | 5.45 | 4.94 | 7.95 |
| Physics light | `#ffffff` | `rgba(31,68,173,.5)` | `rgba(20,40,110,.26)` | `rgba(31,68,173,.17)` / `rgba(31,68,173,.36)` | 5.53 | 4.06 | 4.07 | 7.57 |
| Physics dark | `#1b2957` | `rgba(140,170,255,.55)` | `rgba(0,0,0,.55)` | `rgba(140,170,255,.2)` / `rgba(140,170,255,.42)` | 5.42 | 6.24 | 6.39 | 7.59 |
| Chemistry light | `#fffefb` | `rgba(138,78,8,.5)` | `rgba(90,60,20,.26)` | `rgba(138,78,8,.17)` / `rgba(138,78,8,.36)` | 5.86 | 4.54 | 7.35 | 7.35 |
| Chemistry dark | `#30251a` | `rgba(240,180,90,.55)` | `rgba(0,0,0,.55)` | `rgba(240,180,90,.2)` / `rgba(240,180,90,.42)` | 7.46 | 7.08 | 8.37 | 8.37 |
| Hub light | `#ffffff` | `rgba(60,40,140,.5)` | `rgba(23,16,43,.26)` | `rgba(60,40,140,.17)` / `rgba(60,40,140,.36)` | 5.60 | 4.15 | 4.44 | 8.59 |
| Hub dark | `#1d1650` | `rgba(173,160,255,.55)` | `rgba(0,0,0,.55)` | `rgba(173,160,255,.2)` / `rgba(173,160,255,.42)` | 5.07 | 8.09 | 6.48 | 8.47 |

The Math rows were rendered and looked at. Napkin against page: 1.15:1 in light (was 1.10) and
1.27:1 in dark (was 1.19); the sheet is carried by its edge, shadow and grid, which are about
twice as strong as before. The other six rows follow the same rule and their contrast is
computed, but they have not been rendered: each is confirmed by R9 items 5 and 6 in its own
phase, and R4's alphas are re-sampled for that subject's palette before it ships.

---

## R4. Glass and legibility

### R4.1 The rule

**Every piece of text is on glass or on a solid surface. Nothing is on the field.** Three
kinds of surface:

| Tier | What uses it | Light | Dark | Blur |
|---|---|---|---|---|
| **Pane** | `.elev-1` (lesson cards, dashboard cards) and `.plate` (hero copy, section and topic headings, footer) | `rgba(255,255,255,.72)` | `rgba(31,20,64,.78)` | `blur(14px) saturate(1.35)` |
| **Bench** | `.elev-2` (explorer panel, hero signature panel, "continue" card) and `.read` (the lesson's reading sheet, key points, the quiz panel) | `rgba(255,255,255,.86)` | `rgba(31,20,64,.88)` | same |
| **Well** | `.elev-0` (plot area, readout tiles, quiz choices, inputs, the toggle pill) | `rgba(248,241,253,.94)` | `rgba(39,26,77,.94)` | none |
| **Bar** | the top bar, always (not only when scrolled) | `rgba(245,236,251,.74)` | `rgba(20,10,40,.74)` | same as pane |
| **Chip** | `.plate-chip` (a loose link or a heading that is one line: "all lessons", the quiz heading, the hero hint) | `rgba(255,255,255,.90)` | `rgba(31,20,64,.93)` | none |
| **Solid** | `.solid` (the feedback sheet, the achievement toast), every button, the feedback button | unchanged, opaque | unchanged | none |

The colours are each theme's `--surface` (panes, benches, chips), `--surface-2` (wells) and
`--bg` (bar) with an alpha. They are written as `rgba(var(--glass-rgb), var(--g-pane))` so a
subject only sets three RGB triplets.

Edge: the existing `1px solid var(--line)` border, plus `inset 0 1px 0 var(--glass-edge)`
(`rgba(255,255,255,.85)` light, `rgba(255,255,255,.08)` dark) so a pane has a lit top edge. The
existing outer shadows of `.elev-1` and `.elev-2` stay; the hue stripe on `.elev-2` stays. The
dark theme's `linear-gradient(...)` sheen on `.elev-1` / `.elev-2` is dropped while a field is
mounted (it was painted over an opaque surface).

Why three strengths:

- A **pane** holds a few lines: a card title, a count, a heading. It is where the owner's
  "semi-visible" is delivered: about a quarter of the field comes through, softened.
- A **bench** holds long prose or a live graph. 12–14 % comes through: a napkin is still
  there as a faint moving shape, and around the sheet it is fully visible.
- A **well** inside a bench carries the chart. Field reaching the chart: 0.14 × 0.06 = under
  1 %. Explorer graphs stay as crisp as today.

### R4.2 Worst case

From R2.2, with the weakest text colour of each theme (`--good` light, `--muted` dark):

| Surface | Light | Dark | Requirement |
|---|---|---|---|
| Pane, frost | 4.54 at 0.70, 4.76 at 0.78; **0.72 chosen, about 4.6** | 4.59 at 0.76; **0.78 chosen, about 4.6** | 4.5 body |
| Bench, frost | 4.96 | 4.85 at 0.86; 0.88 chosen | 4.5 |
| Pane and chip, clear (no blur) | 4.58 at 0.90 | 4.58 at 0.93 | 4.5 |
| Bench, clear: 0.94 / 0.95 | above the 0.93 row: ≥ 4.79 | ≥ 4.58 | 4.5 |
| Well alone on the field, 0.94 | ≥ 4.79 | ≥ 4.58 | 4.5 |
| Bar, frost 0.74 | not sampled in light; the only text there is `--ink` and `--ink-2` (17 and 10:1 on the solid bar); R9 item 6 samples it | 5.03 for the weakest colour | 4.5 |
| `--ink`, `--ink-2` on any tier | ≥ 8.17 | ≥ 7.83 | 4.5 |
| Large text and graphics (hero headline in `--accent`, icons, progress rings) on a pane | `--accent` 4.88 at 0.70 | `--accent` 4.59 at 0.70, 4.78 at 0.76 | 3.0 |

The margin on a frosted pane is thin (4.6 against 4.5) because the app's own `--muted`,
`--accent`, `--good` and `--critical` have only 5.2–5.9 on a solid surface today. Two
consequences:

1. Do not lower a pane's alpha below 0.72 / 0.78 without re-running R9 item 6.
2. If the owner wants clearer glass, the way is to deepen those four text colours by one step
   in the palette (to about 7:1 on the solid surface), then re-sample; a pane could then go to
   about 0.60. That is a palette change with its own review and is not part of this revision.

Not covered by these numbers, and unchanged by this work: small chips that already put
`--accent` or `--accent-2` text on a tinted fill. They sit on a pane, so their fill is at
worst a few percent darker than today. R9 item 6 samples them and reports; fix any that falls
under 4.5 by using `--ink-2` for that chip's text.

### R4.3 The three states of `data-paper`

The engine sets one attribute on `<html>` while a page-flow canvas is mounted and removes it
when none is:

| `data-paper` | When | CSS |
|---|---|---|
| absent | no field: script not loaded, `getContext` failed, print | every surface exactly as before this revision, opaque |
| `frost` | field mounted, quality level L0 or L1 | R4.1 table, with `backdrop-filter` |
| `clear` | level L2 or lower, **or** no `backdrop-filter` support, **or** `prefers-reduced-transparency: reduce` | no `backdrop-filter`; pane 0.90 / 0.93, bench 0.94 / 0.95, bar 0.92 |

`@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)))` and
`@media (prefers-reduced-transparency: reduce)` apply the `clear` values in CSS as well, so
they hold even if the attribute says `frost`. `@media (prefers-contrast: more)` makes every
tier opaque. `@media print` hides the field and makes every tier opaque.

Honest note on `clear`: at 0.90–0.93 a napkin behind a card is a faint tint. The owner's
"semi-visible" is delivered by `frost`; `clear` keeps the napkins everywhere around the cards
and keeps the text safe. Which one a real phone ends up in is decided by R5.2.

### R4.4 What may not be done

- No text, icon or control on the field. R9 item 7 checks it mechanically.
- No glass inside glass with a second blur: a well and a chip never blur; a plate never
  contains a card. At most 10 frosted elements may be on screen at once (home at 1440 has 9).
- No `backdrop-filter` on anything that scrolls horizontally or animates continuously.
- The field never gets brighter or more saturated than its tokens to "show through" better.

---

## R5. Performance, the quality ladder, calm mode

### R5.1 Budget

| | Budget |
|---|---|
| Target | 60 fps at L0 where the device can; otherwise the ladder's floors (R5.2); never a field redraw in the same frame as a learner's drag (R5.3) |
| JS inside `draw()` | p95 ≤ 5 ms on a mid phone at L0 (prototype: 3.3 ms unthrottled, 11.7 at ÷4) |
| Canvases | exactly one per page |
| Canvas pixels | L0: ≤ 1.4 MP. L1 and lower: ≤ 0.6 MP |
| Frosted elements on screen | ≤ 10 |
| Start | first frame is the still frame after first paint; motion starts 600 ms after `load` and not before idle, as in §8.1 |
| Added download | engine ≤ 16 KB, Math catalog ≤ 30 KB unminified; no font, image or dependency |

### R5.2 The ladder

The governor of §8.4 is replaced. While moving, it averages the gaps between drawn frames over
60 frames (skipping the first 30 after any start or level change, and any gap over 250 ms).
If the mean is over **22 ms** it steps down one level. It never steps up in a session. The
level is stored in `sessionStorage['academy:paper-level']` so the next page starts where this
one ended instead of stuttering again; `academy:paper-slow` is kept as the name for "reached
L5".

| Level | Canvas cap | Glass | Napkins | Drawn frames | Why this step, from R2.1 |
|---|---|---|---|---|---|
| **L0** | 1.4 MP | frost | full (6 / 7 / 9 / 11) | every frame | — |
| **L1** | 0.6 MP | frost | full | every frame | phone ÷4: 14.6 → 20.2 fps at 0.7 MP, 42.6 at 0.33 MP; nearly invisible on moving paper |
| **L2** | 0.6 MP | clear | full | every frame | desktop: 25 → 54 fps unthrottled |
| **L3** | 0.6 MP | clear | two thirds (4 / 5 / 6 / 7) | every frame | phone ÷4: 21.6 → 30.5; desktop ÷4: 11.6 → 14.1 |
| **L4** | 0.6 MP | clear | two thirds | every second frame | page stays responsive: 41.7 fps for the page, 21 draws/s |
| **L5** | 0.6 MP | clear | two thirds | **still frame** for the session | at L4 the mean gap between draws is over 50 ms |

A display already held to 30 Hz (an iPhone in Low Power Mode) must not be mistaken for a slow
device: if at L0 the mean gap is between 28 and 40 ms while the engine's own `draw()` p95 is
under 5 ms, the governor judges against 44 ms from then on and drops no level for that
reading. (The engine therefore times its own `draw()` always, not only in debug.)

Order: resolution first because it costs the eye least and is the largest lever on a phone;
blur second because it is the largest lever on a wide screen and the napkins stay sharp
around the cards; count third; frame rate fourth because at 20 px/s drift 30 fps is hard to
tell from 60; standing still last.

Changing the count mid-flight: the slots with the highest index finish their current life and
are not dealt again; nothing disappears abruptly.

### R5.3 Interaction hold

While a pointer is down inside `#content` (a slider, a chart handle, a quiz choice) and for
300 ms after it lifts, the engine skips its draws. The frame callback keeps running and does
nothing. A dragged handle therefore never shares a frame with a field redraw, whatever the
level. The napkins stand for that moment; at their drift speed the pause is not noticed. This
was not measured in the prototype; R9 item 12 measures it.

### R5.4 The button: moving, calm, still

One button, three states, cycling in that order. State is the same key,
`localStorage['academy:paper-motion']`: `'on'` (default), `'calm'`, `'off'`.

| State | What it does | Icon |
|---|---|---|
| moving | as specified | `pause` (two bars) |
| **calm** | the same napkins at 0.35 of the speed (drift, turn, tilt, ripples, bump drift, drawing-in), a draw on every third frame (20 a second), glass as the level allows | `calm` (a single wave: `M3 12c3-4 6-4 9 0s6 4 9 0`) |
| still | one still frame, no animation frames | `play` |

Calm is for a reader who likes the paper but finds the movement busy next to a paragraph, and
it roughly thirds the drawing work. Under §8.3 (reduced motion, Save-Data, weak or
low-battery device, L5) the button is hidden, as before.

| | Hebrew | English |
|---|---|---|
| label while moving | הרגעת תנועת הרקע | Calm the background motion |
| label while calm | עצירת תנועת הרקע | Stop background motion |
| label while still | הפעלת תנועת הרקע | Play background motion |

Keys `settings.paperCalm`, `settings.paperStop`, `settings.paperPlay` (the old
`settings.paperPause` is removed). The label names what a press will do. `aria-pressed` is not
used any more (three states); the label carries the state.

Placement: R8.3.

### R5.5 What is honest to promise

- Unthrottled in the harness: phone-sized pages 50–59 fps at L0; desktop-sized pages 25–32 fps
  at L0 and 54–60 fps from L2.
- A laptop without a usable GPU will settle at L2 within about three seconds and look fine
  there, without frosted glass.
- A slow phone will settle between L1 and L5. If the real-device check shows a mid-range
  phone at L4 or L5, apply R11's cut order before merging; do not ship a field that is a still
  picture for most visitors without telling the owner.
- Battery: one full-screen canvas redrawn 60 times a second costs more than Revision 1's band
  for as long as the page is open (Revision 1 stopped once the band scrolled away; this never
  scrolls away). The idle stop (5 minutes), the hidden-tab stop, the low-battery still frame
  and calm mode are what limit it.

---

## R6. The wild surface

### R6.1 The height function

A napkin's surface is `z = hw × gain × (H(u, w, t) − mid)`, with `u`, `w` in −1…1 as before.

```
H = Σ large bumps  +  twist·u·w  +  bend·(u·cos ψ + w·sin ψ)²        ← the big shape, everywhere
  + E(u, w) × ( Σ small bumps + Σ ripples + curl·max(0, u·cos χ + w·sin χ − k₀)² )   ← the wrinkles

E(u, w) = 0.35 + 0.65 × smoothstep(0.25, 0.95, max(|u|, |w|))
```

`E` is the "wild rim, readable heart" rule: wrinkles are at full strength along the edges and
at 35 % in the middle half of the sheet, where the drawing and the formula are. The outline is
what makes a napkin look crumpled; the middle is what has to be read.

All from the napkin's own seeded source:

| Part | How many | Parameters | How it moves |
|---|---|---|---|
| Large bumps | 3 | Gaussian `a·exp(−d²/2r²)`; `r` 0.34–0.56; `a` ±(0.6–1.0), signs alternating; centre on a ring: angle `turn + (j ± 0.25)·2π/n`, distance 0.2–0.95 from a point within ±0.2 of the middle | centre drifts ±0.16 at 0.11 and 0.09 rad/s (as in Revision 1) |
| Small bumps | 2–5 (so 5–8 bumps in all) | `r` 0.16–0.30; `a` ±(0.33–0.55), signs continuing the alternation; placed on the same ring | same drift |
| Long ripple | 1 | `a·sin(k·(u·cos θ + w·sin θ) + φ)`; 0.6–1.2 waves across the sheet (`k` = that × π); `a` 0.30–0.55; `θ` any | 60 %: travelling, phase speed ±(0.25–0.55) rad/s. 40 %: standing, amplitude × `cos(ω t + φ₂)`, `ω` 0.2–0.4 rad/s |
| Short ripples | 1–2 | 1.3–2.4 waves across; `a` 0.16–0.30; own `θ` | same choice, independently |
| Twist | 1 | `τ·u·w`, `τ` ±(0.5–1.0) | × `sin(0.06 t + 3φ)` |
| Bend | 1 | `β·(u·cos ψ + w·sin ψ)²`, `β` ±(0.3–0.8), `ψ` any | × `cos(0.05 t + 5φ)` |
| Curl | 1 corner | `κ·c²` where `c = u·cos χ + w·sin χ − k₀ > 0`; `χ` one of the four diagonals; `k₀` 0.85–1.10; `κ` ±(1.5–4.0) | × `(0.6 + 0.4·sin(0.08 t + φ))` |

`twist·u·w` alone is the classic saddle. It is one voice of seven here, and it changes sign
over about 100 s, so no napkin sits as a saddle.

In calm mode every time `t` above runs at 0.35 of the clock.

### R6.2 Normalising: relief and slope

Each frame, sample `H` on a 13 × 13 lattice (169 samples, reused array). From it:

```js
gain = Math.min(relief / (hi - lo), SLOPE_MAX / steepest);   mid = (hi + lo) / 2;
```

- `relief` = 0.85 + rnd × 0.25 half-widths, peak to trough (Revision 1: 0.28–0.40; the glucose
  page: 0.54–0.70).
- `steepest` = the largest finite difference between neighbouring samples, in real proportions
  (a difference along `w` is multiplied by `hw / hh`).
- `SLOPE_MAX = 1.5` (about 56°).

The relief term sets how deep the sheet is; the slope term stops a short ripple from standing
up as a wall when the relief is all spent on it. Both are continuous in time, so the scale
never jumps.

### R6.3 Over-tilt and self-overlap

- The rigid tilt is at most about 35° off the screen plane (amplitudes 0.42 and 0.46 rad).
- In the middle of the sheet the wrinkles are at 35 %, so the local slope there stays well
  under the cap and the heart never turns its back to the viewer.
- At the rim, 56° of slope on 35° of tilt can pass 90°: a corner or an edge wave can fold
  over itself. **This is allowed.** It is what a crumpled corner looks like, it was in the
  prototype screenshots, and it is confined to the outer quarter. The sheet is filled as one
  outline polygon, so a fold-over shows as the outline crossing itself, not as a hole.
- Not allowed: a fold in the middle. R9 item 5 looks for it (a grid line crossing itself
  inside the graph box). If one appears, lower `SLOPE_MAX` to 1.3 before touching anything else.

### R6.4 Projecting what is drawn

- **Grid and outline:** as before, point by point, but in more pieces: `SEG = 10` (was 7), so
  a grid line is 20 straight pieces and a short ripple has at least 8 pieces per wave.
- **Pen lines:** `seg`, `dash` and an `arrow`'s shaft are 8 pieces (was 5). `curve` keeps its
  cap of 56 steps. New: `para` (R7.2), 56 steps.
- **Text sprites:** the renderer and both clamps of §6.4 are unchanged, with three additions:
  1. A label's anchor must lie in the heart: `|u| ≤ 0.8`, `|w| ≤ 0.8`.
  2. The tangent plane is taken over a wider stencil, `e = 0.12` instead of 0.04, so a label
     follows the average lie of the paper under it and not one wrinkle.
  3. A label whose letters would be under 9 px is not drawn (was about 7 px).
  A label is still flat within itself. With the calm heart this read as writing on paper in
  the prototype; strip-warping stays rejected.
- **Truth of a graph on bent paper:** the curve is still sampled from the real function and
  bends exactly as the grid under it bends. A parabola on a wave does not look like a clean
  parabola from every angle. This is accepted as the price of the owner's direction; the
  heart rule is what keeps it recognisable.

### R6.5 Cost

Per napkin and frame: 169 lattice samples, about 44 outline points, about 420 grid points and
230 depth probes, plus the payload (≤ 220 points, R7.2). Each point is one `H`: up to 8
`exp`, 3 `sin`. Measured in the prototype: 2.1 / 3.3 ms (p50 / p95) for 6 napkins on the phone
size and 3.1 / 5.0 ms for 9 on the desktop size, unthrottled. If the JS budget is missed on a
real phone: evaluate `H` once per frame on a 25 × 25 lattice and interpolate bilinearly inside
`P()`; nothing else in the engine changes.

### R6.6 Three examples

Illustrative parameter sets, to show the range (the engine draws its own from the seed):

| | "Wave" | "Crumple" | "Fold" |
|---|---|---|---|
| Bumps (r, a) | 3 large: (0.50, +0.9) (0.42, −0.7) (0.38, +0.6); 2 small | 3 large; 5 small: (0.18, −0.5) (0.22, +0.4) (0.16, −0.35) (0.27, +0.5) (0.20, −0.4) | 3 large: (0.55, −1.0) (0.36, +0.8) (0.40, −0.6); 3 small |
| Long ripple | 1.1 waves, a 0.52, travelling +0.4 rad/s, θ 20° | 0.7 waves, a 0.32, standing | 0.9 waves, a 0.40, travelling −0.3 |
| Short ripples | one: 1.6 waves, a 0.18 | two: 2.3 waves a 0.28; 1.5 waves a 0.22 | one: 2.0 waves, a 0.20, standing |
| Twist τ / bend β | +0.5 / −0.3 | −0.7 / +0.5 | +1.0 / +0.8 at ψ 60° |
| Curl κ, k₀ | +1.5, 1.10 | −3.0, 0.90 | +4.0, 0.85 |
| relief | 0.90 | 1.05 | 1.10 |
| Reads as | a sheet with a swell running across it | paper that was balled up and opened | a sheet bent down the middle with one corner lifted |

---

## R7. Catalogs and random order

### R7.1 Rules (in addition to §10's four)

5. Every payload has a **family**. The scheduler never puts two of one family next to each
   other (R7.4).
6. A payload is one of two layouts. **Graph:** label band on top, graph box below, as in
   §6.3. **Formula:** no graph; the main line centred at `(0, −0.12)` with `em = 0.26`, an
   optional second line at `(0, 0.30)` with `em = 0.20`, an optional small condition at
   `(0, 0.62)` with `em = 0.15`. A formula napkin may add one small drawing (M30's square).
7. A label is at most 36 characters after the markup is removed. Longer facts are two lines.
8. Conditions that make an identity true are on the napkin (`n ≠ −1`, `q ≠ 1`, `|q| < 1`,
   `a, b > 0`), as symbols.
9. Notation is the one the lessons use (`f′(x)`, `Δy/Δx`, `√x`) and, for sequences, the
   Israeli school letters `a_{1}`, `d`, `q`, `S_{n}`. Trigonometric names are written `sin`,
   `cos`, `tan`. Whether the Israeli 5-unit formula sheet prints `tan` or `tg` was not checked:
   the specialist reviewer of the content round trip confirms it before M35 ships, and M35 is
   left out if there is doubt. Everything on a napkin is left to right, as before.
10. `check()` is required for every row and recomputes the stated fact numerically. Where a
    subject function exists it is used; elsewhere `Math.*`. A derivative is checked against a
    central difference with `h = 1e−5` to within `1e−6`. All 40 new checks below were run in
    Node while writing this and are true.

### R7.2 Additions to the pen and the contract

```ts
export interface Payload {
  id: string; tier: 'A' | 'B';
  family: string;                 // new: 'INT' | 'DER' | 'EXT' | 'ALG' | 'TRIG' | 'EXP' | 'ABS' | 'GEO' | 'SER' in Math
  draw(pen: Pen): void; check(): boolean;
}
export interface Pen {
  // ... everything in §6.2, and:
  /** A parametric curve (u(s), w(s)) for s in s0..s1, drawn up to `part`; steps ≤ 56. For circles, ellipses, sideways curves. */
  para(fu: (s: number) => number, fw: (s: number) => number, s0: number, s1: number, part?: number, steps?: number, dashed?: boolean): void;
}
```

`curve` already takes `dashed` (the shipped `engine.d.ts`). Per-napkin budget (§6.5) becomes:
220 projected points, 16 stroke or fill calls, 4 labels.

A curve with a pole (M23, M35, M42) is drawn as separate `curve` calls per branch and clipped
to the graph box by its domain, never by joining across the pole. Asymptotes are `dash` in
`pen.ink(2)` at alpha 0.5.

### R7.3 Math Academy — 51 payloads

M1–M11 are §10.1's rows, unchanged, with these families: M1–M4 `INT`; M5–M8, M10 `DER`; M9
`EXT`; M11 `TRIG`. The 40 new rows:

**INT — integrals and sums (with M1–M4: 9)**

| id | Drawn | Label markup | Tier, correctness | `check()` |
|---|---|---|---|---|
| M12 | `x²` on [0, 3]; 6 left-endpoint bars in ink 1 under the curve and 6 right-endpoint bars in ink 2 over it (`rectangles(..., 'left' / 'right')`), then the curve | `L_{6} < ∫ < R_{6}` | A. Lesson `02-riemann-sums`, key point: for an increasing curve the left sum underestimates and the right sum overestimates | `riemannSum(parabola, 0, 3, 6, 'left') < powerIntegral(2, 0, 3) && powerIntegral(2, 0, 3) < riemannSum(parabola, 0, 3, 6, 'right')` |
| M13 | `x²` on [0, 3.2], the area from 1 to 3 filled, small labels `a`, `b` under the axis | `∫_{a}^{b} f(x) dx = F(b) − F(a)` | B. Textbook: the fundamental theorem of calculus, which lesson `03-antiderivative` names in its key points | `Math.abs(powerIntegral(2, 1, 3) - (27 / 3 - 1 / 3)) < 1e-12` |
| M14 | formula | `∫ x^{n} dx = x^{n+1}/(n+1) + C` · condition `n ≠ −1` | B. Textbook: the power rule for antiderivatives, the indefinite form of M4 | derivative of `x⁴/4` at 1.7 equals `1.7³` |
| M15 | `y = x` (ink 1) and `y = x²` (ink 0) on [0, 1.15]; the region between them on [0, 1] filled | `∫_{0}^{1} (x − x^{2}) dx = 1/6` | B. Computed with the subject's own function: ½ − ⅓ | `Math.abs(powerIntegral(1, 0, 1) - powerIntegral(2, 0, 1) - 1 / 6) < 1e-12` |
| M16 | `x³` on [−1.2, 1.2] (`FUNCTIONS.cubic.fn`); the area on [0, 1] filled in ink 1 and on [−1, 0] in ink 2 | `∫_{−1}^{1} x^{3} dx = 0` | B. Computed: an odd function over a symmetric interval | `Math.abs(powerIntegral(3, -1, 1)) < 1e-12` |

**DER — the derivative (with M5–M8, M10: 12)**

| id | Drawn | Label markup | Tier, correctness | `check()` |
|---|---|---|---|---|
| M17 | formula | `f′(x) = lim_{h→0} (f(x+h) − f(x))/h` | B. Textbook definition; the same limit lesson `04-rate-of-change` describes in words (the average rate as x₂ approaches x₁) | for `½x²` at 2 with `h = 1e−6`: within `1e−5` of 2 |
| M18 | `f = ½x²` (ink 1) and `3f` (ink 0) on [0, 2.4], a tangent to each at x = 1 | `(c·f)′ = c·f′` | A. Lesson `05-derivative-rules`, key point: constant-multiple rule | `evalDerivativeTerm({ coeff: 3, power: 2 }, 1) === 6` (that lesson's quiz) |
| M19 | formula | `(f·g)′ = f′·g + f·g′` | B. Textbook: product rule | checked on `x²·sin x` at 0.8 |
| M20 | formula | `(f/g)′ = (f′·g − f·g′)/g^{2}` | B. Textbook: quotient rule | checked on `sin x / x²` at 0.8 |
| M21 | formula | `(f(g(x)))′ = f′(g(x))·g′(x)` | B. Textbook: chain rule | checked on `sin(x²)` at 0.8 |
| M22 | `x²` on [−2.2, 2.2] (`FUNCTIONS.parabola.fn`); a tangent sliding from −1.5 to 1.5 and back, slope `2x`. Still: x = 1 | `(x^{2})′ = 2x` | A. Lesson `05-derivative-rules`: the power rule with n = 2 | `evalDerivativeTerm({ coeff: 1, power: 2 }, 3) === 6` |
| M23 | `1/x` on [0.3, 4] (one branch, `evalTerm({ coeff: 1, power: -1 }, x)`), tangent at x = 1 | `(1/x)′ = −1/x^{2}` | B. Textbook; the power rule with n = −1, through the subject's `derivativeTerm` | `evalDerivativeTerm({ coeff: 1, power: -1 }, 1) === -1` |

**EXT — increase, decrease, extrema (with M9: 4)**

| id | Drawn | Label markup | Tier, correctness | `check()` |
|---|---|---|---|---|
| M24 | `x³ − 3x` on [−2.2, 2.2] (`CURVES.cubicWave`), the rising parts in ink 0 and the falling part in ink 1 (split at its extrema); small labels `f′ > 0`, `f′ < 0`, `f′ > 0` over the three parts | none in the band | A. Lesson `06-extremum-points`, key point: f′ > 0 increasing, f′ < 0 decreasing | `slopeSign(CURVES.cubicWave, -2) === 'inc' && slopeSign(CURVES.cubicWave, 0) === 'dec' && slopeSign(CURVES.cubicWave, 2) === 'inc'` |
| M25 | same curve; a hollow dot at (0, 0); the part left of it in ink 0 and right of it in ink 1 | `f″(0) = 0` | B. Textbook: f″(x) = 6x changes sign at 0, an inflection point. Not in the lessons | `CURVES.cubicWave.derivative` is smallest at 0: `d(±0.01) > d(0)` |
| M26 | `y = x² − 4x + 3` on [−0.3, 4.3]; a dot at the vertex (2, −1); the axis of symmetry dashed | `x = −b/(2a)` | B. Textbook: vertex of a parabola. Here a = 1, b = −4 | `-(-4) / 2 === 2`, `f(2) === -1`, `f(1.9) > f(2)`, `f(2.1) > f(2)` |

**ALG — algebra (5)**

| id | Drawn | Label markup | Tier, correctness | `check()` |
|---|---|---|---|---|
| M27 | the same parabola; dots at its roots x = 1 and x = 3 | `x^{2} − 4x + 3 = (x − 1)(x − 3)` | B. Checked by expansion | `f(1) === 0 && f(3) === 0 && f(5) === (5 - 1) * (5 - 3)` |
| M28 | formula | `x = (−b ± √(b^{2} − 4ac))/(2a)` · second line `ax^{2} + bx + c = 0` · condition `a ≠ 0` | B. Textbook: quadratic formula | for (1, −4, 3) it gives 3 and 1 |
| M29 | formula | `a^{2} − b^{2} = (a − b)(a + b)` | B. Textbook identity | `49 - 9 === (7 - 3) * (7 + 3)` |
| M30 | formula, with a drawing under it: a square of side `a + b` cut into `a²` (filled ink 1), `b²` (filled ink 2) and two `ab` rectangles; small labels `a`, `b` on two sides | `(a + b)^{2} = a^{2} + 2ab + b^{2}` | B. Textbook identity; the drawing is its standard area proof. Draw with a : b = 3 : 2 | `(7 + 3) ** 2 === 49 + 2 * 21 + 9` |
| M31 | `y = ½x + 1` on [−1, 5]; a slope triangle between x = 2 and x = 4 with small labels `Δx`, `Δy` | `y = mx + b` | B. Textbook: a line; `m = Δy/Δx` as in lesson `04-rate-of-change` | `(0.5 * 4 + 1) - (0.5 * 2 + 1) === 0.5 * 2` |

**TRIG — trigonometry (with M11: 6)**

| id | Drawn | Label markup | Tier, correctness | `check()` |
|---|---|---|---|---|
| M32 | `cos x` on [0, 2π] from `Math.cos`, to scale | `y = cos x` | B. As M11 | `Math.cos(0) === 1` |
| M33 | no axes box: a unit circle (`para`), both axes through its centre, a radius at 50°, its two legs dashed, an `arc` for the angle; small labels `1`, `sin x`, `cos x` | `sin^{2}x + cos^{2}x = 1` | B. Textbook identity (Pythagoras in the unit circle) | at 0.7: within `1e−12` of 1 |
| M34 | `sin x` (ink 1, thin) and `sin 2x` (ink 0) on [0, 2π] | `sin 2x = 2 sin x cos x` | B. Textbook: double-angle identity | at 0.7: within `1e−12` |
| M35 | `tan x` on (−π/2, π/2), clipped to ±3; the two asymptotes dashed | `tan x = sin x / cos x` | B. Textbook definition. See R7.1 rule 9 on `tan` / `tg` | at 0.5: within `1e−12` |
| M36 | `sin x` (ink 0) and `cos x` (ink 1, dashed) on [0, 2π] | `(sin x)′ = cos x` | B. Textbook derivative. Not in the lessons | central difference of `Math.sin` at 0.9 against `Math.cos(0.9)` |

**EXP — exponentials and logarithms (5)**

| id | Drawn | Label markup | Tier, correctness | `check()` |
|---|---|---|---|---|
| M37 | `eˣ` on [−2, 1.6] from `Math.exp`; a dot at (0, 1) and the tangent there (slope 1) | `(e^{x})′ = e^{x}` | B. Textbook | central difference at 0.4; `Math.exp(0) === 1` |
| M38 | `ln x` on [0.15, 5] from `Math.log`; a dot at (1, 0) and the tangent there (slope 1) | `(ln x)′ = 1/x` | B. Textbook; x > 0 is the drawn domain | central difference at 2 against 0.5; `Math.log(1) === 0` |
| M39 | formula | `a^{m}·a^{n} = a^{m+n}` · second line `(a^{m})^{n} = a^{mn}` | B. Textbook: laws of exponents | `2**3 * 2**4 === 2**7 && (2**3)**4 === 2**12` |
| M40 | formula | `log(ab) = log a + log b` · second line `log(a^{n}) = n·log a` · condition `a, b > 0` | B. Textbook: laws of logarithms, any base | with `Math.log` on 2 and 3 |
| M41 | formula | `e = lim_{n→∞} (1 + 1/n)^{n}` | B. Textbook definition of e | `Math.abs((1 + 1e-6) ** 1e6 - Math.E) < 1e-5` |

**ABS — rational, absolute value, piecewise (3)**

| id | Drawn | Label markup | Tier, correctness | `check()` |
|---|---|---|---|---|
| M42 | `1/x` on [−4, −0.28] and [0.28, 4], two branches; the axes are its asymptotes | `y = 1/x` | B. The label states only what the curve is | `1 / 2 === 0.5 && 1 / -2 === -0.5` |
| M43 | `|x|` on [−3, 3]; the left half in ink 1 and the right half in ink 0; a filled dot at the origin | `|x| = x  (x ≥ 0)` · second line `|x| = −x  (x < 0)` | B. Textbook definition, a piecewise function | `Math.abs(-3) === 3 && Math.abs(3) === 3` |
| M44 | `x² − 1` on [−1.8, 1.8] dashed in ink 2, and `|x² − 1|` over it in ink 0 | `y = |x^{2} − 1|` | B. The label states only what the curve is | `Math.abs(0 - 1) === 1 && Math.abs(4 - 1) === 3 && Math.abs(1 - 1) === 0` |

**GEO — curves and the plane (3)**

| id | Drawn | Label markup | Tier, correctness | `check()` |
|---|---|---|---|---|
| M45 | a circle about the origin (`para`: `r cos s`, `r sin s`), one radius, small label `r` | `x^{2} + y^{2} = r^{2}` | B. Textbook: circle centred at the origin | the parametrisation satisfies it at 0.9 |
| M46 | an ellipse with a : b = 2 : 1 (`para`), its two semi-axes drawn, small labels `a`, `b` | `x^{2}/a^{2} + y^{2}/b^{2} = 1` | B. Textbook: canonical ellipse | `(2cos s, sin s)` satisfies it at 1.1 |
| M47 | two dots at (1, 1) and (4, 5), the segment between them, a dashed right triangle under it | `d = √((x_{2} − x_{1})^{2} + (y_{2} − y_{1})^{2})` | B. Textbook: distance between two points | `Math.sqrt(3 ** 2 + 4 ** 2) === 5` |

**SER — limits and series (4)**

| id | Drawn | Label markup | Tier, correctness | `check()` |
|---|---|---|---|---|
| M48 | `sin x / x` on [−9, 9] with a hollow dot at (0, 1) (the function is not defined at 0: draw two branches up to ±0.05) | `lim_{x→0} sin x / x = 1` | B. Textbook limit | `Math.abs(Math.sin(1e-6) / 1e-6 - 1) < 1e-9` |
| M49 | a staircase of unit squares, columns of height 1 to 5, filling in one column at a time | `1 + 2 + … + n = n(n+1)/2` | B. Textbook: sum of an arithmetic series | `15 === 5 * 6 / 2 && 5050 === 100 * 101 / 2` |
| M50 | formula | `S_{n} = a_{1}(q^{n} − 1)/(q − 1)` · condition `q ≠ 1` | B. Textbook: sum of a geometric series, Israeli school letters | a₁ = 1, q = 2, n = 10 gives 1023 |
| M51 | bars of height 1, ½, ¼, ⅛, 1/16 of equal width, and a dashed line at height 2 that their running total (a thin stepped line) approaches | `S = a_{1}/(1 − q)` · condition `|q| < 1` | B. Textbook: sum of an infinite geometric series | 60 terms of ½ᵏ within `1e−9` of 2 |

Totals: INT 9, DER 12, EXT 4, ALG 5, TRIG 6, EXP 5, ABS 3, GEO 3, SER 4 = 51. Tier A: 14
(M1–M10, M12, M18, M22, M24). Tier B: 37 (M11 and 36 new rows); each
is a standard school identity, and most are beyond what the six lessons teach. They are
ornament, not teaching (§0 item 4 stands): nothing in a lesson relies on a learner having
seen one.

A reviewer who prefers lesson-only content on napkins can ask for tier B to be cut; the
catalog then has 14 payloads and the owner's "all kinds of formulas" is not met. That is the
owner's call, not the implementer's.

### R7.4 Random order: the shuffle bag

Per canvas, replacing the index formula of §5.2:

```js
// state: bag = [], epoch = 0
function deal(view, slot) {
  const avoid = new Set(nearestTwo(view, slot).map((n) => family(n.pi)));   // families of the two live napkins whose centres are nearest to this slot's
  let k = view.bag.findIndex((p) => !avoid.has(family(p)));
  if (k < 0) {                                         // only those families are left: open the next bag behind the remainder
    view.bag = view.bag.concat(shuffled(view.seed * 977 + view.epoch++));
    k = view.bag.findIndex((p) => !avoid.has(family(p)));
    if (k < 0) k = 0;
  }
  return view.bag.splice(k, 1)[0];
}
// shuffled(s): Fisher–Yates over [0 … payloads.length − 1] with the engine's own random(s)
// the first call finds bag empty, so it opens bag 0 the same way
```

A napkin calls `deal` when it is born and at each new drawing cycle (every 12.6 s), as today.

Properties (simulated over 20 000 deals with Math's family sizes, 6 and 9 napkins):

- every payload is dealt exactly once per bag, so all 51 are seen before any is seen twice,
  except at the seam between two bags, where at most the last few of one bag (8 at most in
  the simulation) are still waiting while the next has opened;
- two neighbouring napkins never carried the same family (0 cases in 20 000);
- with `only` set (debug), `deal` is bypassed.

**Deterministic still frame:** the still frame is drawn from a fresh state: bag 0 from the
canvas's seed, slots dealt in slot order 0, 1, 2 …, each napkin placed at `now = 9` and
checked against the napkins already placed. Same seed and same viewport size give the same
picture, to the byte (R2.1). Moving frames are not reproducible across loads and do not need
to be.

A resize keeps the bag (R3.1). A theme change keeps the bag.

### R7.5 The other catalogs: size targets

Same engine, same contract, same scheduler. Each is specified row by row, as R7.3 is, in its
own phase before it is built; these are the targets so the scheduler's assumptions hold (at
least 6 families, no family over a third of the catalog, at least 3 per family).

| Catalog | Target | Families (working list) |
|---|---|---|
| Physics | at least 36 (11 exist in §10.2) | position–time graphs · velocity–time graphs · acceleration · kinematics equations (formula napkins) · motion diagrams · vectors and components · units-free ratios. Still no forces until a lesson teaches dynamics |
| Chemistry | at least 30 (8 exist in §10.3) | ionic pairs · covalent molecules (single, double, triple) · polarity and dipoles · intermolecular forces · metallic lattice · network solids · formula napkins (the formulas the lessons name). Still no reaction equations in the app |
| Hub | at least 36: 12 from each subject, re-drawn by hand as in §10.4 | family = subject first (never two neighbours from one subject), then that subject's own family as a tie-break |
| Nitrox | none (bubbles, §12) | — |

---

## R8. Integration into Math (Phase 1a-v2)

The engine copy rule is unchanged: edit `docs/hub/paper-engine.js`, run
`node scripts/check-paper-sync.mjs --write`, rebuild every app that has a copy.

### R8.1 Engine (`docs/hub/paper-engine.js`, then the copy)

| Change | Where |
|---|---|
| `flow: 'page'`: placement R3.2, no fog, fractions on resize, `LIFE_S` 44, `Z_FAR` 1.25, fog floor 0.78, turn and tilt of R3.3 | `napkin()`, `lifeOf()`, `fogs()`, `resize()`, `sheet()` |
| Surface R6: `height()`, `settle()` with the 13 × 13 lattice, relief and slope; `SEG` 10; pen pieces 8 | surface block, pen |
| Label rules of R6.4 (stencil 0.12, 9 px floor) | `text()` |
| `PEN.para` | pen |
| Shuffle bag R7.4; `family` read from each payload | `napkins()` |
| Quality ladder R5.2, `sessionStorage['academy:paper-level']`, the 30 Hz rule | scheduler |
| Interaction hold R5.3 (`pointerdown` / `pointerup` / `pointercancel` on `document`, capture, passive; target inside `#content` or `[data-paper-hold]`) | scheduler |
| Motion state `'on' | 'calm' | 'off'`; calm clock ×0.35 and every third frame | scheduler, API |
| `data-paper` on `<html>`: set to `frost` or `clear` when the first page-flow view mounts and on every level change; removed when the last one is destroyed | `mount()`, `destroy()`, governor |
| Default count from R3.2 when `count` is omitted | `mount()` |
| `flow: 'x'` and `'y'` (stage, gutter) keep working exactly as shipped: the hub's Phase 1d may still be built on either model, and the gallery uses them | — |

API additions (`engine.d.ts`): `flow: 'x' | 'y' | 'page'`; `count?: number`;
`MotionState = 'on' | 'calm' | 'off'`; `AcademyPaper.level(): 0 | 1 | 2 | 3 | 4 | 5`;
`Payload.family`; `Pen.para`.

### R8.2 `apps/math/src/styles.css`

PALETTE block: replace the Paper tokens with the Math rows of R3.4 (light and dark),
`--paper-ink-alpha: 0.95`, and add:

```css
:root                    { --glass-rgb: 255, 255, 255; --well-rgb: 248, 241, 253; --bar-rgb: 245, 236, 251;
                           --glass-edge: rgba(255, 255, 255, 0.85); --g-pane: 0.72; --g-bench: 0.86; --g-pane-clear: 0.90; --g-bench-clear: 0.94; }
:root[data-theme='dark'] { --glass-rgb: 31, 20, 64;    --well-rgb: 39, 26, 77;    --bar-rgb: 20, 10, 40;
                           --glass-edge: rgba(255, 255, 255, 0.08); --g-pane: 0.78; --g-bench: 0.88; --g-pane-clear: 0.93; --g-bench-clear: 0.95; }
```

SKIN BASE block: **remove** the whole "Paper layer" block that Phase 1a added
(`.paper-stage`, `.paper-gutter`, `.paper-toggle` and its print rule) and put this in its
place. Everything is scoped under `:root[data-paper]`, so the block does nothing in an app
that has no field; it can therefore be copied into Physics and Chemistry in the same change
and the three SKIN BASE blocks stay identical.

```css
/* ---------- Paper layer, Revision 2 (BACKGROUND_LLD.md R3, R4) ---------- */
.paper-field { position: fixed; inset: 0 0 auto 0; height: 100vh; height: 100lvh;
               z-index: -1; pointer-events: none; direction: ltr; }
.academy-paper { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; contain: strict; }

/* the napkins are the graph paper now: no page rule, no fade */
:root[data-paper] body { background:
    radial-gradient(1100px 620px at var(--light-x, 0%) -10%, var(--accent-soft), transparent 62%),
    linear-gradient(180deg, var(--bg) 0%, var(--bg-2) 100%); }
:root[data-paper] #root::before { display: none; }

/* text that stood on the page gets a plate */
.plate { border-radius: var(--r-lg); padding: 16px 18px; }
@media (min-width: 768px) { .plate { padding: 20px 24px; } }
.plate-chip { border-radius: var(--r-pill); padding: 6px 14px; }
:root[data-paper] :is(.plate, .plate-chip) { border: 1px solid var(--line); }

/* panes */
:root[data-paper] :is(.elev-1, .plate) {
  background: rgba(var(--glass-rgb), var(--g-pane));
  box-shadow: inset 0 1px 0 var(--glass-edge), 0 1px 2px rgba(16, 27, 54, 0.05), 0 14px 32px -18px var(--hue-shadow);
}
/* benches and reading sheets */
:root[data-paper] :is(.elev-2, .read) { background: rgba(var(--glass-rgb), var(--g-bench)); }
/* wells, chips, bar */
:root[data-paper] .elev-0     { background: rgba(var(--well-rgb), 0.94); }
:root[data-paper] .plate-chip { background: rgba(var(--glass-rgb), var(--g-pane-clear)); }
:root[data-paper] .glass-bar  { background: rgba(var(--bar-rgb), 0.74); border-bottom: 1px solid var(--line); }
/* opt out: modals and toasts stay opaque */
:root[data-paper] .solid      { background: var(--surface); -webkit-backdrop-filter: none; backdrop-filter: none; }

/* frost */
:root[data-paper='frost'] :is(.elev-1, .elev-2, .plate, .read, .glass-bar) {
  -webkit-backdrop-filter: blur(14px) saturate(1.35); backdrop-filter: blur(14px) saturate(1.35);
}
/* clear: the engine stepped down, or the browser cannot blur, or the reader asked for less transparency */
:root[data-paper='clear'] :is(.elev-1, .plate)  { background: rgba(var(--glass-rgb), var(--g-pane-clear)); }
:root[data-paper='clear'] :is(.elev-2, .read)   { background: rgba(var(--glass-rgb), var(--g-bench-clear)); }
:root[data-paper='clear'] .glass-bar            { background: rgba(var(--bar-rgb), 0.92); }
@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
  :root[data-paper] :is(.elev-1, .plate) { background: rgba(var(--glass-rgb), var(--g-pane-clear)); }
  :root[data-paper] :is(.elev-2, .read)  { background: rgba(var(--glass-rgb), var(--g-bench-clear)); }
  :root[data-paper] .glass-bar           { background: rgba(var(--bar-rgb), 0.92); }
}
@media (prefers-reduced-transparency: reduce) {
  :root[data-paper] :is(.elev-1, .elev-2, .plate, .read, .glass-bar) { -webkit-backdrop-filter: none; backdrop-filter: none; }
  :root[data-paper] :is(.elev-1, .plate) { background: rgba(var(--glass-rgb), var(--g-pane-clear)); }
  :root[data-paper] :is(.elev-2, .read)  { background: rgba(var(--glass-rgb), var(--g-bench-clear)); }
  :root[data-paper] .glass-bar           { background: rgba(var(--bar-rgb), 0.92); }
}
@media (prefers-contrast: more) {
  :root[data-paper] :is(.elev-1, .elev-2, .plate, .plate-chip, .read) { background: var(--surface); -webkit-backdrop-filter: none; backdrop-filter: none; }
  :root[data-paper] .elev-0 { background: var(--surface-2); }
  :root[data-paper] .glass-bar { background: var(--bg); -webkit-backdrop-filter: none; backdrop-filter: none; }
}
@media print {
  .paper-field { display: none; }
  :root[data-paper] :is(.elev-1, .elev-2, .plate, .plate-chip, .read) { background: var(--surface); -webkit-backdrop-filter: none; backdrop-filter: none; }
}
```

The dark-theme rule `:root[data-theme='dark'] .elev-1, :root[data-theme='dark'] .elev-2
{ background: linear-gradient(...), var(--surface); ... }` has the same specificity as the
glass rules and comes earlier in the file, so the glass rules win; keep this block **after**
the Elevation block. Its `box-shadow` stays.

### R8.3 Components

| File | Change |
|---|---|
| `src/paper/Paper.tsx` | **Remove** `PaperStage`, `PaperGutters`, `STAGE_SEED`'s stage wording and the `placement` prop. **Add** `PaperField`: a `div.paper-field`, mounted once in `useEffect` with `{ flow: 'page', payloads: PAYLOADS, font: paperFont(), seed: FIELD_SEED, only: paperOnly() }` (no `count`: the engine's table), `destroy()` on unmount. Keep `paperFont`, `paperOnly`, `useMedia` only if still used. `PaperToggle` becomes the three-state button of R5.4: no `data-placement`, no `aria-pressed`; classes as the other buttons in the top bar's pill; icon `pause` / `calm` / `play`. `FIELD_SEED` is chosen by eye from seeds 0–9 at 390 and 1440 px, as `STAGE_SEED` was |
| `src/app/Shell.tsx` | `<PaperField />` as the first child of the root `div` (replaces `<PaperGutters />`). The header gets class `glass-bar` and loses `border-transparent`, `data-[scrolled=true]:bg-bg/80`, `data-[scrolled=true]:backdrop-blur-xl`, `data-[scrolled=true]:border-line` and the transition; the sentinel and its IntersectionObserver are removed with them (the bar is glass always). `<PaperToggle />` is the first button inside `QuickToggles`. The app name gets `min-w-0 truncate` so four buttons fit at 360 px |
| `src/features/home/HomePage.tsx` | Remove `<PaperStage />` and its import. Add `plate` to: the hero copy `div` (eyebrow, headline, lede, note); the syllabus `header`; in `TopicSection`, a wrapper around the title row and the description (and move `mb-4` to it); the `footer` (drop its `pb-4`). The hero hint under the signature panel gets `plate-chip` and `text-ink-2` instead of `text-muted` |
| `src/features/lesson/LessonPage.tsx` | Wrap the lesson `header` and the `lesson-prose` block in one `<div className="plate read space-y-6">` (the reading sheet). The "back" link gets `plate-chip` (drop `-ms-3`). The quiz `h2` gets `plate-chip` and `inline-flex`. The key-points `Card` gets `read` |
| `src/components/Quiz.tsx` | the quiz panel's root card gets `read` |
| `src/components/FeedbackWidget.tsx`, `src/app/AchievementToast.tsx` | the sheet and the toast get `solid` |
| `src/components/ui/Icon.tsx` | add `calm: 'M3 12c3-4 6-4 9 0s6 4 9 0'` |
| `src/i18n/locales/{en,he}.json` | R5.4's three keys; remove `settings.paperPause` |
| `src/paper/payloads.ts`, `payloads.test.ts` | `family` on M1–M11; M12–M51 per R7.3; `LABELS` for all 51; the id-list test and one `check()` test per row; a test that no family is over a third of the catalog |
| `src/paper/engine.d.ts` | R8.1's API |
| `docs/subjects/math/` | rebuilt by `npm run check`, committed |

Not touched: `index.html`'s pre-paint script, `providers.tsx`, `src/progress`, any explorer,
any lesson YAML.

`--fab-clearance` and `data-fab-avoid` are unchanged. The feedback button stays where it is,
opaque, at the bottom end corner. Nothing else is `position: fixed` any more (Revision 1's
fixed pause button is gone), so nothing competes with it.

The dev query `?paperOnly=<n>` stays (dev builds only). Add `?paperLevel=<0–5>` and
`?paperSeed=<n>` the same way, for R9.

---

## R9. Acceptance checklist (replaces §14)

"Matrix" = 390×844 and 1440×900 × Hebrew and English × light and dark = 8 runs, in Playwright
(`chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })`, the package resolved from
`apps/math/scripts/`), on **home and one lesson page**, top and scrolled to the explorer.

1. `node scripts/check-paper-sync.mjs` exits 0.
2. `cd apps/<subject> && npm run check` is clean. `payloads.test.ts`: one passing `check()` per
   row of §10 and R7.3; the id list equals the spec's; every payload has a family; no family
   holds more than a third.
3. Matrix: no console error, no page error, no raw i18n key;
   `document.documentElement.scrollWidth === clientWidth`, also at 360 px wide.
4. Layer: exactly one `canvas.academy-paper` on every route; its host is `position: fixed`,
   `pointer-events: none`, `aria-hidden` on the canvas; `<html>` has `data-paper`; with the
   engine's script blocked the page renders with solid cards and no `data-paper`.
5. Every payload, forced with `?paperOnly=<n>`, light and dark, at 390 and 1440: the label is
   whole, on the paper, not touching a stroke, and matches the spec character for character;
   the drawing matches its row; no grid line crosses itself inside the graph box; no missing
   glyph. **Look at each screenshot.**
6. **Contrast sampling** (the method of R2.2), per theme, at both widths, 8 seeds × 3 payload
   sets, for each of: pane, bench, bar, chip, a well alone, in `frost` and in `clear`. For
   each, the worst pixel against every text colour used on that tier: body text ≥ 4.5:1,
   large text and graphics ≥ 3:1. Record the table in the PR. Also sample the real page: for
   every text element on home and lesson, the pixels of its background box in a still-frame
   screenshot against its computed `color`; report any pair under 4.5:1 (3:1 for text of
   24 px, or 18.66 px bold, and larger).
7. **No text on the field:** for every element under `header` and `main` that has a text node
   of its own, walk up to `#root`: an ancestor must have one of `.elev-0`, `.elev-1`,
   `.elev-2`, `.plate`, `.plate-chip`, `.read`, `.solid`, `.glass-bar`, or a computed
   background alpha ≥ 0.7. Zero failures on home, lesson, and a finished quiz.
8. Glass states: with `?paperLevel=0` computed `backdrop-filter` on a pane is the blur and its
   background alpha is 0.72 / 0.78; with `?paperLevel=2` no `backdrop-filter` and 0.90 / 0.93;
   emulating `prefers-reduced-transparency: reduce` gives the clear values; `prefers-contrast:
   more` gives opaque; print gives opaque and no canvas.
9. Still frame, `reducedMotion: 'reduce'`: the canvas shows a full still frame; two loads give
   byte-identical canvas data at each width; the button is absent; over 2 s
   `AcademyPaper._frames` does not change.
10. Stops and states: hidden tab → 0 frames in 600 ms; button → calm
    (`localStorage['academy:paper-motion'] === 'calm'`, about 20 draws a second), → still (a
    still frame, 0 frames), → moving; reload keeps the state; another subject on the same
    origin shows the same state; five idle minutes → still, any input → resumes.
11. **Frame rate**, home and lesson, 390×844 @3 and 1440×900 @2, governor off, 4 s after 3 s
    of warm-up, at L0, L2 and L3. Unthrottled, phone size: mean ≥ 50 fps at L0 (prototype
    50.5–58.8). Unthrottled, desktop size: mean ≥ 50 fps at L2 (prototype 54.3) and report L0.
    At ÷4, phone size: ≥ 28 fps at L3 (prototype 30.5) and report the rest. JS `draw()` p95
    unthrottled ≤ 5 ms. Then governor on at ÷4: it reaches a level whose mean gap is ≤ 22 ms,
    or L5, within 15 s, and `sessionStorage['academy:paper-level']` holds it. Record all
    numbers in the PR next to R2.1's.
12. Interaction: drag a chart handle and a slider for 3 s at L0 and at ÷4: `AcademyPaper._draws`
    does not change during the drag, and the gaps between the app's own frames during the drag
    are no worse than with the field hidden (mean within 10 %). Answer a quiz, reload:
    progress persisted.
13. Hebrew and RTL: slider fill and thumb direction, chart orientation and axis direction
    exactly as before this change (screenshot diff of the explorer's well against `main`:
    identical apart from the well's 0.94 alpha); napkin graphs run left to right and formulas
    read left to right in both languages; the top bar's four buttons are in logical order.
14. **Real devices, required before Phase 1a-v2 merges** (manual): one mid-range Android
    phone (Chrome) and one iPhone (Safari); home for two minutes and a lesson for two minutes
    each. Write down: the level it settled at (`AcademyPaper.level()` through remote
    devtools, or a temporary on-screen readout in a dev build); whether scrolling and dragging
    a handle are smooth; whether the phone warms; Low Power Mode behaviour; and whether the
    address bar sliding away disturbs the napkins (R3.1). If a phone settles at L4 or L5,
    stop and apply R11's cut order.
15. Static: every `:hover` rule inside `@media (hover: hover)` (the existing programmatic
    check); the engine has no `shadowBlur`, `filter`, `getImageData`, `setInterval`; the
    button has a 44 px hit area, a visible focus ring and its label in the active language;
    the first screen at 390×844 still shows the hero panel above y = 844.
16. After merge: the live site in a private window, home and a lesson, both themes.

---

## R10. Phases (replaces §13 from 1a on)

Each is one branch and one PR, mergeable alone.

| Phase | Contents | Depends on |
|---|---|---|
| 0, 1a | **Done** (Revision 1, on `main`) | — |
| **1a-v2 Math** | R8 in full: engine changes, sync, Math's field, glass, plates, button, 51 payloads; the same SKIN BASE block copied into Physics and Chemistry (inert there). R9 items 1–16 on Math | — |
| **1b-v2 Physics** | field, plates, button, catalog to R7.5's target (rows specified first, in this file); its R3.4 row confirmed and R4's alphas re-sampled for its palette | 1a-v2 |
| **1c-v2 Chemistry** | the same for Chemistry | 1a-v2 |
| **1d-v2 Hub** | the field behind the whole hub; the hub's panels are already glass (`--panel`), so the work is re-sampling their alphas against the field (R9 item 6), plates for any text on the page, the button in the top bar, `docs/hub/paper-payloads.js` to R7.5's target | 1a-v2 |
| **2 Nitrox** | §12 unchanged: bubbles, a stage on the Dashboard. **Still gated: build only after Guy re-confirms.** Whether its bubbles should also go full-page is asked then, not assumed | Guy |

Show 1a-v2 to Guy on his phone before starting 1b-v2: the look, and the level real phones
reach, are decided there. 1b-v2, 1c-v2 and 1d-v2 are independent of each other.

---

## R11. Risks, and what to cut first

1. **Real phones are unmeasured.** The harness has no GPU. Everything about smoothness on a
   phone is a hypothesis until R9 item 14. This is the largest risk in the revision.
2. **Battery and heat.** A full-screen canvas never scrolls away. Mitigations: the ladder, the
   interaction hold, idle and hidden stops, low-battery still frame, calm mode. If a phone
   warms in two minutes, make calm the default on coarse-pointer devices.
3. **Thin contrast margin on panes** (about 4.6:1 for the weakest text colour). It is measured,
   not guessed, but a new ink, a darker napkin token or a lower alpha can break it. R9 item 6
   is the guard; R4.2 names the proper fix if more transparency is wanted.
4. **"Clear" glass is not very see-through.** A device that steps down to L2 shows napkins
   around the cards and only a tint behind them. If most phones land there, the owner's third
   wish is only half met on them; say so when showing 1a-v2.
5. **Bent graphs.** Wild paper bends a plot. The calm heart limits it; it does not remove it.
   If a specialist reviewer objects, raise the heart's calm (0.35 → 0.2) before lowering relief.
6. **Busy behind reading.** Movement around a paragraph distracts some readers. Calm and still
   are one press away, and the reading sheet lets 14 % through. If it is still too much, make
   the reading sheet opaque (`--g-bench: 1` for `.read`) and keep the bench glass.
7. **Safari.** `backdrop-filter` over a canvas that changes every frame, `100lvh`, and canvas
   fill rate are all unmeasured there. The `clear` path needs none of the first.
8. **Fold-over at the rim** may look like a rendering fault to some eyes. Lower `SLOPE_MAX`.
9. **Catalog size and review load.** 36 tier-B identities are outside the lessons. Each has a
   numeric check, but a check cannot catch a wrong label string. R9 item 5 is a human reading
   51 screenshots; do not skip it.
10. **SKIN BASE drift.** The glass block is scoped so it can live in all three apps at once.
    If it is put into Math only, the three blocks differ until 1b-v2 and 1c-v2: do not.

**Cut order** when a budget is missed on a real device, first to last. Each is a default
changed, not a feature removed, until (g):

- (a) Start phones at L1 (0.6 MP canvas). Nearly invisible.
- (b) Half rate by default on coarse-pointer devices (30 draws a second).
- (c) Phone count 6 → 5, desktop 9 → 7.
- (d) Blur radius 14 → 10 px and no `saturate()`. (Measured: little gain; try it only on a
  device that shows one.)
- (e) Start phones at L2 (clear glass). This gives up "semi-visible" on phones: ask Guy first.
- (f) Drop the short ripples and the small bumps (keeps the big shape, cuts about a third of
  the engine's arithmetic).
- (g) Calm as the default everywhere.
- (h) Still frame on phones, motion on wide screens only.

Never cut: the no-text-on-the-field rule, the measured alphas, the still frame, the button,
the `check()` tests.

---
---

# REVISION 1 (as built in Phase 0 and Phase 1a)

Kept for the parts that still apply and as the record of what is on `main`. Passages replaced
by Revision 2 are marked.

Contents of Revision 1: 0 the request and how it is read · 1 decisions at a glance · 2 what was measured ·
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

**Superseded by Revision 2 (R0, R3, R6).** Both departures below are withdrawn at the owner's direction: the layer is full-page, with every text block on measured glass, and the paper is wilder than the glucose page's. Kept as the record of why Revision 1 was built as it was.

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

**Superseded by Revision 2 (R1)** for D4 and D5 (stage and gutters, no layer on a phone lesson). D1–D3 and D6–D9 stand; D8's button gains a calm state (R5.4).

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

**Superseded by Revision 2 (R2.2, R2.3, R4)** where it rejects a full-page canvas. The finding that text straight on a napkin is unreadable stands, and is why Revision 2 puts every text block on glass.

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

**Superseded by Revision 2 (R3).** The whole section: there is one full-page field on every page, no stage, no gutters, and content does sit over the layer, on glass.

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

**Superseded by Revision 2 (R8.3)** in one line of the tree: `Paper.tsx` exports `PaperField` and the three-state button instead of `<PaperStage/>` and `<PaperGutters/>`. The file layout, the engine header, the sync procedure and the no-shared-package reasoning stand.

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

**Superseded by Revision 2** for the page flow in these rows: pixel cap (R3.3), placement and count (R3.2), relief, turn and tilt (R6, R3.3), `SEG` (R6.4), edge fog (none, R3.1), and the payload index rule under the table (R7.4). The other rows stand.

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

**Superseded by Revision 2 (R3.2)** for the field. The two flows below stay in the engine for the gallery and remain valid code paths.

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

**Superseded by Revision 2 (R3.1):** the page flow has no edge fog. Applies only to the `x` and `y` flows.

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

**Superseded by Revision 2 (R7.2)** for the numbers: 220 points, 16 calls, 4 labels. The prohibitions stand.

A payload may use at most: 160 projected points, 14 stroke or fill calls, 4 labels. No
`shadowBlur`, no gradients, no `filter`, no `getImageData`. No allocation per frame (reuse
module-level arrays as the glucose engine does with `PX`, `PY`).

---

## 7. Tokens

**Superseded by Revision 2 (R3.4)** for `--napkin`, `--napkin-edge`, `--napkin-shadow`, the two grid tokens and `--paper-ink-alpha` (now 0.95). The inks, `--paper-text`, `--paper-font` and the notes on where inks come from stand; the contrast figures after each ink are replaced by R3.4's.

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

**Superseded by Revision 2 (R5.1).**

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

**Superseded by Revision 2 (R5.2):** a five-step ladder replaces the two steps below.

While moving, keep the last 90 `requestAnimationFrame` gaps (ignore the first 30 after any
start and any gap over 250 ms, which is a tab switch). Every 90 frames:

1. mean gap > 24 ms at full rate → switch to **half rate** (draw on every second frame;
   a device already held to 30 Hz, such as an iPhone in Low Power Mode, lands here and stays);
2. at half rate, mean interval between draws > 50 ms → set
   `sessionStorage['academy:paper-slow'] = '1'` and settle to the still frame for the session.

It never steps back up. There is no per-device tuning beyond this.

### 8.5 The pause button (WCAG 2.2.2)

**Superseded by Revision 2 (R5.4, R8.3)** for placement, the number of states and the labels. The storage key, its sharing across apps and the `try/catch` rule stand.

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

**Superseded by Revision 2** in two bullets: "Nothing existing changes contrast" (it does: R4 measures it) and the `.paper-stage` / `.paper-gutter` class names (now `.paper-field`). Everything else stands, including: the canvas is never mirrored, and no word is drawn on it.

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

**Superseded by Revision 2 (R7.3)** for the count: these 11 rows stand unchanged and gain a family; 40 rows are added.

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

**Superseded by Revision 2 (R8).** The list and CSS below are what Phase 1a shipped in Math; R8 says what replaces them.

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

**Superseded by Revision 2 (R10)** from Phase 1a on.

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

**Superseded by Revision 2 (R9).**

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

**Superseded by Revision 2 (R11).** Risk 1 below ("it may feel smaller than what Guy liked") is what happened; its last sentence ("do not go back to a full-page canvas behind text") is withdrawn.

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

**Revision 2 changed the same three files again:** `CLAUDE.md` ("Background" section, the architecture tree line, the status line), `HUB_LLD.md` §7.1 and `SUBJECT_APP_SKIN_LLD.md` §7 / §10 now say the layer is full-page behind glass, not confined to bands. The reason recorded below still holds, with one change: "confined to bands with no text" is replaced by "never behind text that is not on measured glass".

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
