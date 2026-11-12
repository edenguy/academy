# Subject-app skin ("Bench") — low-level design

Scope: `apps/math`, `apps/physics`, and `apps/chemistry`. They were scaffolded from the same
`cp -r` and share one visual scaffold — `src/styles.css` tokens,
`components/ui/{Card,Button,Icon}.tsx`, `app/Shell.tsx`, `features/home/HomePage.tsx`,
`features/lesson/LessonPage.tsx`, `components/Quiz.tsx`, `components/FeedbackWidget.tsx`, and
the explorer panels. This spec redesigns that shared scaffold. `apps/nitrox` is out of scope
(it shares the same `.card` primitive and would read the same way, but CLAUDE.md treats it as
a different tier; nothing here touches it).

Constraints that do not move: Rubik stays (subjects = "apps" with personality; the hub is the
Plex/mono "OS"). Math keeps violet `#6250d6` → pink `#e87ba4`; Physics keeps indigo `#3457d1`
→ cyan `#17a3e8`; Chemistry uses amber `#e0922a` → teal `#14998a` on its favicon, with the
darker amber `#8a4e08` as text (the bright amber fails as text on the paper). The *system*
(surfaces, depth, composition, motion, icons, type scale) is shared; the *palette* is per
subject. Hebrew-first RTL, numbers/formulas as LTR islands.
Vite + Tailwind v4: everything below is CSS custom properties in `styles.css` + component
classes — no framework change, no new runtime dependency (`motion` is already installed and
is enough).

This document is opinionated. Where it says "do X", do X. Where there is a choice it says so.
Everything else is decided.

---

## 0. Diagnosis — why the current skin reads as "old cards, not inviting"

Evidence: Guy's phone screenshot (Physics home, light, HE) plus a Playwright sweep of both
live apps at 390 and 1440 px, light and dark, HE and EN, home + two lesson pages + the quiz
in its checked state. The findings, specific, in order of how much they hurt:

1. **The home page never shows the product.** The whole thesis of these apps is "grab a
   handle, the idea moves." The home page contains zero graphics, zero curves, zero handles —
   only three identical text boxes and a text hero. A visitor can't tell this is a simulator
   and not a PDF of notes. This is the single biggest reason it feels uninviting, and it's
   also why nothing on a static screenshot can look alive: there is nothing *to* move.
2. **Every surface is the same card.** The hero and the three lesson items use the identical
   `.card` (white, 1 px 12 %-alpha border, radius 22, one grey `0 10px 30px -12px` shadow).
   Same radius, same shadow, same padding → no hierarchy between "the headline of the app"
   and "list item #3". On the lesson page the live explorer — the most important thing on
   screen — is `card-flat`, i.e. *demoted*: no shadow, a tint so close to the page background
   (1.08:1 in light mode) that in light mode it visually dissolves into the page.
3. **The shadow is the 2016 kind.** One grey, blurred drop shadow under a pure-white rectangle
   on a near-white page is exactly the "Bootstrap card" signature. Modern depth is either
   (a) hue-tinted, two-layer (a tight contact shadow + a wide soft one in the subject's hue),
   or (b) no shadow at all with a tinted surface and a 1 px edge. Today it's neither.
4. **Cards are mostly air, and the content hugs one corner.** A lesson card on a phone is
   ~310 px tall for three lines of text and a button: text stacked at the top-start, a lone
   pill at the bottom-end, nothing in between, nothing graphic. The 22 px radius is generous
   but the padding (20 px) is tight against it, so corners look puffy while the inside looks
   sparse. The hero on desktop is a 960 px white box with text in the start 50 % and a blank
   other half.
5. **The play button is a media-player trope.** A hollow ▷ inside a pill says "video" — the
   wrong promise (nothing here plays; you drag). It's also `size="sm"` (30 px tall) on a
   phone, i.e. visually timid for the one action the card wants you to take.
6. **Type hierarchy is flat on the phone.** Hero h1 is 30 px and the Hebrew second line wraps
   to three lines ("למה דברים נעים בדיוק / ככה"). The lesson label is 11 px `uppercase
   tracking-wider` — meaningless in Hebrew (no case; tracking is already zeroed) so it's just
   small grey text. Card titles (18 px), subtitles (14), counts (12) are three greys with no
   anchor glyph; the eye has nothing to land on.
7. **Low-contrast "decoration" that also breaks the hub's own rules.** Sparkle icon on the
   eyebrow (the hub spec §7 bans this exact ✦ "AI" trope), a lightbulb on key points (banned
   there too), five-point stars as bullets (reads "favourites"), a speech-bubble FAB (reads
   "chat with an AI"), a dotted wallpaper grid plus three colored radial blobs behind glass
   (banned there as "what the page has today"). Eyebrow text in `--accent-2` is 2.8:1 (Physics)
   / 2.7:1 (Math) on the page — fails AA. `--good` text (`#0ca30c` / `#0ca36b`) on white is
   3.3:1 — fails.
8. **Two real layout bugs the sweep caught.** (a) The feedback FAB (fixed, bottom-end) sits on
   top of the quiz's "Next question" button in RTL (both are at the end side; captured in
   the checked-quiz screenshot) and overlapped a lesson-card title on Math's phone home. (b)
   `.sky-bg` is `position: fixed`, so on a long page the gradient only covers the first
   viewport and the lower page is a different flat color — visible as a hard horizontal band
   in every full-page dark screenshot, and the same failure mode the hub LLD already
   documented (§3.2: paint the background on `<html>`, not fixed).
9. **Nothing moves on purpose.** The only motion is a scale-pop on readouts and `.anim-pop` on
   the quiz result; cards have no hover/press, the hero has no life, the handle on the plot
   is a plain dot with a faint halo. For a product whose brand is motion, the UI is inert.

What is *fine* and stays: Rubik 700 headings look good in both scripts; the mono
(JetBrains Mono) readouts are a strong instrument cue; the lesson prose measure and leading
(1.08 rem / 1.8) are comfortable; dark mode's navy/indigo surfaces are already more pleasant
than light mode's white boxes (light mode is where "old" is strongest — and Guy's phone was in
light mode); the per-subject accent pairs are good and distinct; `.sci` formula chips and
`.num` LTR islands work correctly in RTL.

---

## 1. Direction — "Bench"

A **well-made, colorful tool bench on graph paper.** Not a toy box (no mascots, no cartoon
illustration, no confetti, no 3-D blobs), not an office (no grey shadows, no white boxes, no
stock icons). The register teenagers read as modern in 2026 is *tactile*: chunky, pressable
controls with a hard bottom edge; tinted surfaces instead of white; big friendly display type;
color that is saturated but used on few things; and real, moving data as the only illustration.
The trust cue for exam prep comes from the *instrument* layer underneath it: mono tabular
readouts, hairline axes, exact numbers, Hebrew exam-style choice letters (א ב ג ד).

Four rules, in priority order:

1. **Every card is a doorway.** A lesson card carries a *signature* — a tiny SVG drawn from
   that lesson's own explorer function (the real position curve, the real parabola with real
   midpoint rectangles) with a handle dot that slides when you hover or press. The hero
   carries a full-width live signature the visitor can scrub with a finger before tapping
   anything. The home page therefore *shows the product*. (§5.2, §5.3)
2. **Depth means "you can press this".** Three elevation levels, hue-tinted shadows, and a
   3 px hard "ledge" under primary controls that collapses on press. Static text panels sit
   low; live and pressable things sit high and glow faintly. The explorer panel is the
   highest surface on the lesson page. (§3)
3. **One hue family per subject, used like paint on a bench.** Light mode is a tinted paper
   (not white) with white tools on it; dark mode is a deep tinted bench with lit tools.
   Secondary hue (`--accent-2`) is for fills, strokes, chips and the signature line — never
   for body text on a light surface (contrast). (§2)
4. **Motion is physical and short.** `cubic-bezier(.2,.8,.2,1)`, 160–280 ms, lift/press/slide;
   one staggered reveal on the home grid; nothing loops. (§7)

The line between playful and infantile, concretely: ledges are 3 px (Duolingo's are 4–6 and
read as toy), radii are 20/14/10 (not 28+), there is exactly one display size per screen,
colors are the subject's two hues plus semantic good/critical only, and every "fun" element
is a real graph. No mascot, no emoji, no badges/XP/streaks (the quiz "done" state is a check,
not a trophy).

---

## 2. Tokens

`styles.css` in each app gets two clearly fenced blocks. Block A (**SKIN BASE**) is
byte-identical in `apps/math`, `apps/physics`, and `apps/chemistry` — mark it with
`/* === SKIN BASE — identical in apps/math, apps/physics, and apps/chemistry; keep in sync (diff them) === */`.
Block B (**PALETTE**) is per subject. Don't extract a shared package in this pass (CLAUDE.md:
only once the duplication is proven and stable; this is its first iteration).

### 2.1 Palette — Physics (`apps/physics/src/styles.css`)

```css
:root {                                    /* light: "tinted paper" */
  --bg: #eaeffc;          --bg-2: #e2e9fa;
  --surface: #ffffff;     --surface-2: #f1f4fd;   --surface-3: #e4eafb;
  --line: rgba(31, 68, 173, 0.12);  --line-strong: rgba(31, 68, 173, 0.26);
  --ink: #101b36;  --ink-2: #324268;  --muted: #5b6788;        /* muted darkened: 4.88:1 on --bg */
  --accent: #3457d1;      --accent-ink: #ffffff;
  --accent-deep: #2742a8;                      /* button ledge / pressed */
  --accent-soft: rgba(52, 87, 209, 0.12);
  --accent-2: #17a3e8;    --accent-2-soft: rgba(23, 163, 232, 0.16);
  --hue-shadow: rgba(52, 87, 209, 0.22);        /* tinted shadow color, light */
  --glow: rgba(52, 87, 209, 0.30);
  --series-a: #3457d1;    --series-a-soft: rgba(52, 87, 209, 0.16);
  --series-b: #e0932f;    --series-b-soft: rgba(224, 147, 47, 0.16);
  --highlight: #c2790a;   --highlight-soft: rgba(194, 121, 10, 0.16);
  --good: #0b7a4f;  --good-fill: #0ca36b;  --good-soft: rgba(12, 163, 107, 0.14);   /* text vs fill split, see §2.3 */
  --critical: #b93232;  --critical-fill: #d03b3b;  --critical-soft: rgba(208, 59, 59, 0.12);
  --grid: rgba(31, 68, 173, 0.07);              /* graph-paper + plot grid */
  color-scheme: light;
}
:root[data-theme='dark'] {                 /* dark: "lit bench" */
  --bg: #0a1024;          --bg-2: #0d1530;
  --surface: #121d3f;     --surface-2: #172548;   --surface-3: #1d2f5a;
  --line: rgba(140, 170, 255, 0.16);  --line-strong: rgba(140, 170, 255, 0.32);
  --ink: #eaf0ff;  --ink-2: #bdccf0;  --muted: #8295c4;
  --accent: #6f8cff;      --accent-ink: #0a1024;
  --accent-deep: #5470e0;
  --accent-soft: rgba(111, 140, 255, 0.18);
  --accent-2: #38c2ef;    --accent-2-soft: rgba(56, 194, 239, 0.20);
  --hue-shadow: rgba(0, 0, 0, 0.55);
  --glow: rgba(111, 140, 255, 0.38);
  --series-a: #7097ff;    --series-a-soft: rgba(112, 151, 255, 0.20);
  --series-b: #f0a84c;    --series-b-soft: rgba(240, 168, 76, 0.20);
  --highlight: #e0a830;   --highlight-soft: rgba(224, 168, 48, 0.20);
  --good: #2fd69a;  --good-fill: #2fd69a;  --good-soft: rgba(47, 214, 154, 0.18);
  --critical: #e66767;  --critical-fill: #e66767;  --critical-soft: rgba(230, 103, 103, 0.18);
  --grid: rgba(140, 170, 255, 0.08);
  color-scheme: dark;
}
```

### 2.2 Palette — Math (`apps/math/src/styles.css`)

```css
:root {
  --bg: #f5ecfb;          --bg-2: #efe3f9;
  --surface: #ffffff;     --surface-2: #f8f1fd;   --surface-3: #efe3ff;
  --line: rgba(98, 42, 182, 0.12);  --line-strong: rgba(98, 42, 182, 0.26);
  --ink: #241233;  --ink-2: #4a3a63;  --muted: #71608c;        /* 4.87:1 on --bg */
  --accent: #6250d6;      --accent-ink: #ffffff;
  --accent-deep: #4a3ab3;
  --accent-soft: rgba(98, 80, 214, 0.12);
  --accent-2: #e87ba4;    --accent-2-soft: rgba(232, 123, 164, 0.18);
  --hue-shadow: rgba(98, 80, 214, 0.22);
  --glow: rgba(98, 80, 214, 0.30);
  --series-a: #2a78d6;    --series-a-soft: rgba(42, 120, 214, 0.16);
  --series-b: #eb6834;    --series-b-soft: rgba(235, 104, 52, 0.16);
  --highlight: #c98500;   --highlight-soft: rgba(237, 161, 0, 0.16);
  --good: #0b7a4f;  --good-fill: #0ca36b;  --good-soft: rgba(12, 163, 107, 0.14);   /* was pure #0ca30c — harsh and 3.3:1 */
  --critical: #b93232;  --critical-fill: #d03b3b;  --critical-soft: rgba(208, 59, 59, 0.12);
  --grid: rgba(98, 42, 182, 0.07);
  color-scheme: light;
}
:root[data-theme='dark'] {
  --bg: #140a28;          --bg-2: #1b1033;
  --surface: #1f1440;     --surface-2: #271a4d;   --surface-3: #31235c;
  --line: rgba(173, 150, 255, 0.16);  --line-strong: rgba(173, 150, 255, 0.32);
  --ink: #f3ecff;  --ink-2: #cdbdee;  --muted: #9586c0;
  --accent: #9085e9;      --accent-ink: #1b1033;
  --accent-deep: #7569d4;
  --accent-soft: rgba(144, 133, 233, 0.18);
  --accent-2: #ee7fa9;    --accent-2-soft: rgba(238, 127, 169, 0.20);   /* lifted from #d55181 (4.3:1) to 6.7:1 on --surface */
  --hue-shadow: rgba(0, 0, 0, 0.55);
  --glow: rgba(144, 133, 233, 0.38);
  --series-a: #3987e5;    --series-a-soft: rgba(57, 135, 229, 0.20);
  --series-b: #d95926;    --series-b-soft: rgba(217, 89, 38, 0.20);
  --highlight: #e0a830;   --highlight-soft: rgba(224, 168, 48, 0.20);
  --good: #2fd69a;  --good-fill: #2fd69a;  --good-soft: rgba(47, 214, 154, 0.18);
  --critical: #e66767;  --critical-fill: #e66767;  --critical-soft: rgba(230, 103, 103, 0.18);
  --grid: rgba(173, 150, 255, 0.08);
  color-scheme: dark;
}
```

### 2.2a Palette — Chemistry (`apps/chemistry/src/styles.css`)

Favicon and hub tile gradient: amber `#e0922a` → teal `#14998a`. Text uses the darker amber,
because `#e0922a` is 2.4:1 on the light tile tint. Teal is `--accent-2` only (3.5:1 on white),
never light-mode text. `--series-b` is that same teal, and only inside plots, so the page
stays two hues plus the semantic greens and reds. `--muted` `#6d5e4c` is 5.5:1 on `--bg`.

```css
:root {                                    /* light: warm paper */
  --bg: #f7f0e4;          --bg-2: #f1e6d4;
  --surface: #ffffff;     --surface-2: #fbf6ee;   --surface-3: #f3e9d8;
  --line: rgba(138, 78, 8, 0.12);  --line-strong: rgba(138, 78, 8, 0.26);
  --axis: rgba(138, 78, 8, 0.45);
  --ink: #2a1c0c;  --ink-2: #4a3824;  --muted: #6d5e4c;   /* 5.5:1 on --bg */
  --accent: #8a4e08;      --accent-ink: #ffffff;
  --accent-deep: #6e3e05;
  --accent-soft: rgba(138, 78, 8, 0.12);
  --accent-2: #14998a;    --accent-2-soft: rgba(20, 153, 138, 0.16);
  --hue-shadow: rgba(138, 78, 8, 0.22);
  --glow: rgba(138, 78, 8, 0.30);
  --series-a: #8a4e08;    --series-a-soft: rgba(138, 78, 8, 0.16);
  --series-b: #14998a;    --series-b-soft: rgba(20, 153, 138, 0.16);
  --highlight: #a15e0a;   --highlight-soft: rgba(161, 94, 10, 0.16);
  --good: #0b7a4f;  --good-fill: #0ca36b;  --good-soft: rgba(12, 163, 107, 0.14);
  --critical: #b93232;  --critical-fill: #d03b3b;  --critical-soft: rgba(208, 59, 59, 0.12);
  --grid: rgba(138, 78, 8, 0.07);
  color-scheme: light;
}
:root[data-theme='dark'] {                 /* dark: lit bench, warm */
  --bg: #14100c;          --bg-2: #1c1610;
  --surface: #241c14;     --surface-2: #2c2218;   --surface-3: #362a1e;
  --line: rgba(240, 180, 90, 0.16);  --line-strong: rgba(240, 180, 90, 0.32);
  --axis: rgba(240, 180, 90, 0.50);
  --ink: #f8f1e6;  --ink-2: #e4d3bc;  --muted: #b5a48e;
  --accent: #f0b45a;      --accent-ink: #1a120c;
  --accent-deep: #d89a3e;
  --accent-soft: rgba(240, 180, 90, 0.18);
  --accent-2: #3ecfb8;    --accent-2-soft: rgba(62, 207, 184, 0.20);
  --hue-shadow: rgba(0, 0, 0, 0.55);
  --glow: rgba(240, 180, 90, 0.38);
  --series-a: #f0b45a;    --series-a-soft: rgba(240, 180, 90, 0.20);
  --series-b: #3ecfb8;    --series-b-soft: rgba(62, 207, 184, 0.20);
  --highlight: #e0a830;   --highlight-soft: rgba(224, 168, 48, 0.20);
  --good: #2fd69a;  --good-fill: #2fd69a;  --good-soft: rgba(47, 214, 154, 0.18);
  --critical: #e66767;  --critical-fill: #e66767;  --critical-soft: rgba(230, 103, 103, 0.18);
  --grid: rgba(240, 180, 90, 0.08);
  color-scheme: dark;
}
```

The hero signature plots `netDipole` from `src/chemistry/dipole.ts` (the vector sum of two
equal bond dipoles versus the angle between them). The tag shows that result. Lesson-card
signatures map the six chemistry explorer kinds (`ionTransfer`, `sharedPairs`, `dipole`,
`electronSea`, `waterPair`, `materialProbe`) from `explorers[0]` and the same functions.
Chemistry's home uses Math's topic-header anatomy (§5.4) for its one topic. The badge is the
chapter name only (Structure and bonding / מבנה וקישור) — no grade, and no "5-unit" claim,
because no Ministry chemistry source is cited in the repo.

### 2.3 Color rules (every subject)

- **`--accent-2` is never text on a light surface.** Cyan `#17a3e8`, pink `#e87ba4`, and
  teal `#14998a` fail as text on their pages. Use `--accent-2` for chip *backgrounds*
  (`--accent-2-soft`), strokes, signature lines, the hero gradient and the logo tile; the
  text on a chip is `--accent`. In dark mode the lifted `--accent-2` values may be text.
- **Semantic text vs fill split.** `--good` / `--critical` are *text* colors (verified
  5.4:1 / 5.9:1 on white; 4.7:1 on `--good-soft`). `--good-fill` / `--critical-fill` are for
  borders, icons and backgrounds. Never put `--good-fill` on white as text.
- **`--muted` was darkened** in both light palettes because `--bg` got darker (so white
  cards stand off the page: 1.15:1 instead of 1.08:1) and the old `--muted` fell to 4.2:1
  on the new bg. New values are 4.88:1 (Physics) and 4.87:1 (Math) on `--bg`, 5.6:1 on white.
- **Only two hues per subject plus semantics.** `--series-b` (amber/orange) appears only
  inside plots. No third decorative hue anywhere in chrome.
- Tailwind `@theme inline` block: add `--color-accent-deep`, `--color-good-fill`,
  `--color-critical-fill`, `--color-grid` alongside the existing mappings so the new tokens
  are usable as utilities (`bg-accent-deep`, `border-good-fill`, …).

### 2.4 Shared non-color tokens (SKIN BASE)

```css
:root {
  --r-xl: 20px;   /* hero signature panel, explorer "bench" */
  --r-lg: 16px;   /* lesson cards, quiz panel, key points */
  --r-md: 12px;   /* choice tiles, inputs, readout tiles, chips container */
  --r-sm: 8px;    /* .sci chips, small tags */
  --r-pill: 999px;
  --ledge: 3px;                                   /* tactile bottom edge on primary controls */
  --ease: cubic-bezier(.2, .8, .2, 1);
  --t-fast: 160ms;  --t-med: 220ms;  --t-slow: 320ms;
  --space-section: 40px;                          /* between home sections, phone */
  --fab-clearance: 96px;                          /* main padding-bottom so the FAB never covers a control */
}
@media (min-width: 768px) { :root { --space-section: 56px; } }
```

Remove `--radius: 22px`, `--shadow`, `--radius-card`, `--shadow-card`; replace with the
elevation classes below. Remove `.anim-bob` (infinite) entirely. Keep `.anim-pop` and
`.anim-wiggle`. Keep `.sci`, `.num`, `.readout`, `.lesson-prose` as they are, except `.sci`
gets `border-radius: var(--r-sm)`.

---

## 3. Surfaces, elevation, background

### 3.1 Background — replaces `.sky-bg`

Delete the `.sky-bg` element from `Shell.tsx` and its CSS (fixed-position gradient + dotted
wallpaper + three blobs). Paint the page on `html` so it covers the whole document, not one
viewport:

```css
html { min-height: 100%; background-color: var(--bg); }
body {
  background:
    radial-gradient(1100px 620px at var(--light-x, 0%) -10%, var(--accent-soft), transparent 62%),
    /* graph paper: 24 px rule, only in the top 520 px, then fades out */
    linear-gradient(var(--grid) 1px, transparent 1px) 0 0 / 24px 24px,
    linear-gradient(90deg, var(--grid) 1px, transparent 1px) 0 0 / 24px 24px,
    linear-gradient(180deg, var(--bg) 0%, var(--bg-2) 100%);
  -webkit-mask: none;   /* no mask on body — see .paper-fade */
}
[dir='rtl'] body { --light-x: 100%; }    /* one light source, at the start corner */
```

The graph paper must fade out below the hero or it becomes wallpaper (hub §7). Do it with a
single pseudo-element rather than masking `body`: `#root::before { content:''; position:
absolute; inset: 520px 0 0 0; background: linear-gradient(180deg, transparent, var(--bg) 160px);
pointer-events: none; z-index: -1; }` (`#root` is already `isolation: isolate`; make it
`position: relative`). Dark mode uses the same stack; `--grid` is already theme-aware.

Why graph paper is allowed here and not on the hub: it is literally the surface every
explorer draws on, and the plots (§5.5) use the same `--grid` rule, so the page and its
instruments share one material. It is the **only** texture permitted. No dots, no noise,
no blobs.

### 3.2 Elevation classes (SKIN BASE)

```css
/* 0 — inset well: plot area, quiz choices, readout tiles, inputs */
.elev-0 { background: var(--surface-2); border: 1px solid var(--line); border-radius: var(--r-md); }

/* 1 — card: lesson cards, key points, quiz panel, feedback sheet */
.elev-1 {
  background: var(--surface); border: 1px solid var(--line); border-radius: var(--r-lg);
  box-shadow: 0 1px 2px rgba(16, 27, 54, 0.05), 0 14px 32px -18px var(--hue-shadow);
}
/* 2 — bench: the explorer panel, the hero signature panel */
.elev-2 {
  background: var(--surface); border: 1px solid var(--line); border-radius: var(--r-xl);
  box-shadow: 0 1px 2px rgba(16, 27, 54, 0.06), 0 24px 48px -22px var(--hue-shadow),
              inset 0 1px 0 rgba(255, 255, 255, 0.9);
  position: relative;
}
.elev-2::before {            /* the hue "paint stripe" along the top edge */
  content: ''; position: absolute; inset: 0 0 auto 0; height: 3px;
  border-radius: var(--r-xl) var(--r-xl) 0 0;
  background: linear-gradient(90deg, var(--accent), var(--accent-2));
}
[dir='rtl'] .elev-2::before { background: linear-gradient(270deg, var(--accent), var(--accent-2)); }

:root[data-theme='dark'] .elev-1,
:root[data-theme='dark'] .elev-2 {
  background: linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.015)), var(--surface);
  box-shadow: 0 1px 0 rgba(255,255,255,0.05) inset, 0 20px 44px -20px var(--hue-shadow);
}
/* interactive cards (the lesson card is a link) */
.elev-1.is-link { transition: transform var(--t-med) var(--ease), box-shadow var(--t-med) var(--ease), border-color var(--t-med) var(--ease); }
@media (hover: hover) {
  .elev-1.is-link:hover { transform: translateY(-2px); border-color: var(--accent); box-shadow: 0 2px 4px rgba(16,27,54,0.05), 0 22px 40px -18px var(--hue-shadow); }
}
.elev-1.is-link:active { transform: translateY(0) scale(0.99); }
```

`Card.tsx` becomes: `variant: 'well' | 'card' | 'bench'` → `elev-0 | elev-1 | elev-2`, default
`card`, padding `p-4 md:p-5` for `well`, `p-5 md:p-6` for the others. Remove the `flat` prop
(migrate: `flat` → `variant="well"` except explorers, which become `bench` — §5.5).

### 3.3 Tactile controls — the ledge

The "pressable" signature of the skin, used on **primary buttons, segmented-control
active pills, the hero signature's handle tag, and the FAB** — nowhere else (not on cards,
not on choice tiles; those lift/press without a ledge).

```css
.ledge {
  box-shadow: 0 var(--ledge) 0 var(--accent-deep), 0 10px 22px -10px var(--glow);
  transform: translateY(0);
  transition: transform var(--t-fast) var(--ease), box-shadow var(--t-fast) var(--ease), filter var(--t-fast) var(--ease);
}
.ledge:hover { filter: brightness(1.06); }
.ledge:active, .ledge[aria-pressed='true']:active {
  transform: translateY(var(--ledge));
  box-shadow: 0 0 0 var(--accent-deep), 0 4px 10px -8px var(--glow);
}
```

`Button.tsx` variants (replace the current four):

| variant | classes | use |
|---|---|---|
| `primary` | `bg-accent text-accent-ink ledge rounded-pill font-bold` | one per view region |
| `secondary` | `bg-surface text-ink border border-line-strong rounded-pill font-semibold hover:bg-surface-2 active:translate-y-px` | prev-lesson, retake, try again |
| `ghost` | `text-ink-2 hover:bg-surface-2 hover:text-ink rounded-pill` | back link |
| `good` | `bg-good-fill text-white ledge rounded-pill` with `--accent-deep` overridden inline to `color-mix(in srgb, var(--good-fill) 75%, black)` | "Next question" after a correct answer |

Drop `pink`. Sizes: `sm` → **min-height 36 px**, `text-sm px-4`; `md` → 44 px, `text-[15px]
px-5`; `lg` → 52 px, `text-base px-6`. Never below 36 px tall on a phone (today's `sm` is 30).
Disabled: `bg-surface-3 text-muted shadow-none` with `cursor-not-allowed` — **not**
`opacity-50` (the current half-transparent "Check answer" reads as broken, not as "pick an
answer first").

---

## 4. Typography

Rubik Variable throughout (unchanged), JetBrains Mono for readouts (unchanged). Scale:

| role | size (phone / ≥768) | weight | line-height | notes |
|---|---|---|---|---|
| hero h1 | `clamp(34px, 8.6vw, 56px)` | 800 | 1.08 | `text-wrap: balance`; HE must fit in 2 lines at 390 — the current 30 px wrapped "ככה" alone onto line 3 |
| hero lede | 17 / 19 | 400 | 1.55 | `--ink-2`, `max-width: 34ch` |
| h2 section | 22 / 26 | 700 | 1.2 | home "השיעורים", topic titles, "זמן לתרגל" |
| card title | 19 / 19 | 700 | 1.25 | 2-line clamp (`-webkit-line-clamp: 2`) so cards in a row align |
| card subtitle | 14 | 400 | 1.45 | `--ink-2` |
| label / chip | 12.5 | 600 | 1 | `--muted` or `--accent`; **no uppercase, no tracking in either language** (remove `uppercase tracking-*` everywhere — in HE it did nothing, in EN it fought Rubik's rounded shapes; the chip *shape* now carries the label role) |
| lesson h1 | 28 / 40 | 800 | 1.12 | |
| prose | `.lesson-prose` unchanged (17.3 / 18.4 px, 1.8) | | | |
| readout value | 30 / 36 | Mono 600 | 1 | `tabular-nums`, LTR island |
| readout label | 13 | 500 | 1.2 | `--muted` (today 12 px — too small under a 36 px number) |
| coin numeral | 15 | Mono 600 | 1 | the lesson-number coin, §5.3 |

Hebrew is never letter-spaced; keep `:root[lang='he'] [class*='tracking-'] { letter-spacing: 0 }`
as belt-and-braces but stop adding `tracking-*` classes. Weight 800 exists in Rubik Variable
(300–900) — use it for the two h1s only; everything else stays ≤ 700 so 800 reads as "display".

---

## 5. Components

### 5.1 Top bar (`Shell.tsx`)

- Height 60 px (was 64). Transparent over the page until scrolled; then `bg-bg/80
  backdrop-blur-xl border-b border-line`. Implement with a 1 px sentinel `<div>` above the
  header observed by `IntersectionObserver` toggling `data-scrolled` on the header — ~8 lines,
  no scroll listener.
- Brand: the subject tile at **40 px** (was 34) + app name (Rubik 700, 17 px). **Drop the
  "כלי לימוד עצמאי ובלתי רשמי" line from the top bar** — it's clutter at 11 px, it already
  lives in the footer disclaimer, and on EN it wraps the brand to two lines at 390 px (seen in
  the sweep). The `<title>`, meta description and footer keep the disclaimer; nothing is lost.
- Controls: one `elev-0` pill container (`rounded-pill p-1 gap-0.5`) holding three 36 px round
  buttons: sound, language, theme. Language button shows the *other* language's label
  (`EN` / `עב`) exactly as today, Rubik 600 13 px — no globe icon (the label is the icon).
  Active (sound on) → `bg-accent-soft text-accent`.
- Logo tile: `rounded-[12px]`, gradient `145deg, var(--accent), var(--accent-2)`, glyph white;
  add `box-shadow: 0 6px 14px -6px var(--glow)` only in dark mode (glow = lit; in light mode
  the tile sits flat on paper).

### 5.2 Hero (`HomePage.tsx`) — not a card

The hero stops being a white box. Structure, phone (one column) and ≥ 900 px (two columns,
`grid-cols-[1.1fr_1fr] gap-10 items-center`):

1. **Eyebrow chip**: `inline-flex h-7 px-3 rounded-pill bg-accent-2-soft text-accent text-[12.5px] font-semibold`
   with a 6 px dot in `--accent-2` as its only glyph (replaces the sparkle). Text unchanged
   (`פיילוט חדש` / `New pilot`).
2. **h1** (§4): line 1 `--ink`, line 2 `--accent`. Same copy as today.
3. **Lede** + (Math only) the curriculum note at 13 px `--muted`.
4. **Hero signature panel** (`HeroSignature`, new component in `components/`): an `elev-2`
   panel, `aspect-ratio: 16/7` on phone (full width, under the text), `aspect-ratio: 4/3`
   in the desktop second column, containing one SVG that the visitor can scrub.

`HeroSignature` is **the same component shape in both apps**, differing only in the `curve`
it is given (per-subject files, `src/<subject>/heroCurve.ts`):

- Pointer model: `pointermove` / `pointerdown` over the SVG sets `--x` (0–1 along the plot
  width) via `getScreenCTM()` like `MotionScrubber` already does; `touch-action: pan-y` so
  vertical page scroll still works; no drag state, no slider, no keyboard (it's a teaser, and
  `aria-hidden` — the real explorers are the accessible ones). On load, if
  `prefers-reduced-motion: no-preference`, the handle sweeps once from 0 → 0.62 over 1.4 s
  (`--ease`) and stops; it never loops.
- Drawn on `--grid` graph paper (8 × 4 hairlines at `--grid`), a 3 px `--series-a` curve, a
  vertical hairline cursor at the handle, a handle (r 9, `--accent`, 2.5 px `--surface`
  ring, halo r 18 at 0.18), and a **value tag**: a `ledge`-styled mono pill that rides above
  the handle showing the live readout, LTR.
- **Physics curve**: `SCENARIOS.easeInOut.position(t)` over `SCENARIOS.easeInOut.domain`
  (the real scenario from `src/physics/kinematics.ts`), tag text `s = {value.toFixed(1)}`.
- **Math curve**: `FUNCTIONS.parabola.fn` on `[0, 4]` from `src/math/integral.ts`, plus
  `rectangles(fn, 0, 4, n, 'midpoint')` where `n = 2 + round(x * 14)` (2 → 16 rectangles as the
  pointer moves start → end); tag text `n = {n}`. The rectangles use `--series-b-soft` fill /
  `--series-b` 1.25 px stroke exactly as `IntegralExplorer` does.
- These are the subjects' own functions — nothing is invented for the demo (CLAUDE.md rule 6
  as applied to live infographics in the hub spec).

No CTA buttons in the hero: the lesson cards directly below are the CTAs, and the first one is
above the fold on a 390 × 844 phone once the hero panel is 16:7 (verify in acceptance).

### 5.3 Lesson card (`HomePage.tsx`) — the doorway

The whole card is one `<Link>` (`elev-1 is-link`, `p-4 md:p-5`, `flex flex-col gap-3`,
`min-height: 172px`). Anatomy, top to bottom:

```
┌──────────────────────────────────────────────┐
│ (1)  ●3  ·  4 שאלות תרגול          [done ✓]  │   header row: coin + meta chip + status
│ (2)  Title, 19/700, 2-line clamp             │
│      Subtitle, 14, --ink-2                    │
│ (3)  ╭──────── signature svg ────────╮  (→)  │   footer row: signature (flex-1) + arrow button
└──────────────────────────────────────────────┘
```

1. **Coin**: 30 px circle, `bg-accent-soft text-accent`, Mono 600 15 px numeral (`.num`), the
   lesson's `order`. Replaces the 11 px "שיעור 1" label. Beside it, a meta chip
   (`text-[12.5px] text-muted`) with the question count. If done: coin becomes
   `bg-good-soft text-good` with a check glyph instead of the numeral, and a `הושלם` / `Done`
   chip in `--good` appears at the end of the row.
2. Title + subtitle as today's copy.
3. **Signature** (`LessonSignature`, new component): `viewBox="0 0 200 48"`, `width: 100%`,
   `height: 48px`, `preserveAspectRatio="none"` *only* on the grid layer; curves use
   `vector-effect: non-scaling-stroke`. Content derives from `lesson.explorers[0]` (the real
   explorer config, so the card previews what the lesson actually does):

   | explorer kind | drawn | from |
   |---|---|---|
   | physics `scrubber` | position curve of `config.initialScenario`, handle at 35 % | `SCENARIOS[id].position` |
   | physics `secant` | curve of `config.scenario` + dashed `--series-b` secant between `initialT1`/`initialT2`, two small `--series-b` dots | `SCENARIOS`, `averageVelocity` |
   | physics `accelArea` | `v = a·t` line for `initialA` over `duration` + 6 midpoint rectangles in `--series-b-soft` | `velocityRectangles` |
   | math `integral` | `FUNCTIONS[fn]` on `[a,b]` + 6 midpoint rectangles | `rectangles` |
   | math `secant` | `CURVES[curve]` + dashed secant at `initialX1/initialX2` (use the config's own fields) | `CURVES` |
   | math `powerRule` | `coeff·x^power` solid + its derivative dashed (`--series-b`) | `derivativeTerm`, `evalTerm` |
   | math `extremum` | `CURVES[curve]` + a 4 px `--accent` dot at each listed extremum | `CURVES[curve].extrema` |
   | no explorer | a single `--accent` curve `M0 40 C 60 40, 120 8, 200 8` | — |

   Every signature also has one **handle dot** (r 4.5, `--accent`, 1.5 px `--surface` ring)
   on the curve, positioned with CSS `offset-path: path(<the curve's d>)` at
   `offset-distance: 38%`, transitioning to `70%` on card hover/focus-within (`--t-slow`).
   That is the shared "handle slides" mechanic from the hub's own mark (HUB_LLD §1.5),
   applied per lesson. Browsers without `offset-path` on SVG children leave the dot at its
   static `cx/cy` fallback — compute the fallback point at 38 % and set it too.
4. **Arrow button**: 40 px circle at the footer's end side, `bg-accent text-accent-ink`
   (not a ledge — the card is the pressable, this is its affordance), icon `arrow` which
   mirrors in RTL (`rtl:-scale-x-100`). On card hover it nudges 3 px toward the end
   (`translateX(3px)`, `rtl:translateX(-3px)`). Done state → `bg-good-soft text-good` with a
   `refresh` icon (the "review" action). Remove the `התחלה ▷` pill: its label moves to the
   `<Link aria-label>` (`התחלה: {title}` / `Start: {title}`) so screen readers keep the verb.

Grid: `grid-cols-1` phone, `sm:grid-cols-2`, `lg:grid-cols-3`, `gap-4`. Home sections are
spaced by `--space-section`. Reveal: cards animate in once on mount, `opacity 0→1,
translateY 10px→0`, 320 ms, stagger 40 ms by index (use `motion.div` with `initial/animate`
and `transition={{ delay: i * 0.04 }}`; honour reduced motion via `useReducedMotion()`).

### 5.4 Topic header (Math only; Physics has a single implicit topic)

```
נגזרות            [5 יח"ל · כיתה י]        ← h2 22/700 + curriculum chip
באיזה קצב משהו משתנה, ברגע הזה — …          ← 15 px --ink-2
```

Curriculum chip: `elev-0`-colored pill (`bg-surface-3 text-ink-2 text-[12.5px] font-semibold
px-3 h-7`), **not** `uppercase tracking-wider` (Hebrew), and **not** `.num` on the whole chip —
the chip is a Hebrew sentence containing digits and renders correctly in RTL as-is; wrapping
it LTR reversed the word order (visible in the sweep as `5 יח"ל · כיתה י` sitting oddly). Keep
the number inside a `<span class="num">` only if it ever needs tabular figures.

On the lesson page the same chip appears next to the subtitle (already there) with the same
fix.

### 5.5 Explorer panel — "the bench" (all six explorer components)

The explorer is the hero of the lesson page and must be the **highest** surface on it:
`Card variant="bench"` (`elev-2`, with the paint stripe). Internal layout, shared by every
explorer (`MotionScrubber`, `SlopeExplorer`, `AccelerationExplorer`, `IntegralExplorer`,
`SecantExplorer`, `PowerRuleExplorer`, `ExtremumExplorer`):

1. **Caption** (`config.caption`): 14 px 600 `--accent`, with a 16 px `handle` icon (§6) at
   its start — the one place an icon says "drag me".
2. **Readout row**: readout tiles, each `elev-0 px-3.5 py-2.5 min-w-[112px]`: label 13 px
   `--muted` above a Mono 600 30/36 px value (`.readout`). Primary tile value `--ink`;
   secondary (exact / instantaneous) `--accent`; the Physics "gapIsTiny" good-state value
   `--good`. Tiles sit in a `flex flex-wrap gap-2`; mode/scenario segmented control is at the
   row's end (wraps under on phones).
3. **Segmented control**: container `elev-0 p-1 rounded-pill inline-flex gap-1`; items
   `rounded-pill px-3.5 h-9 text-sm font-semibold text-ink-2`; active item `bg-accent
   text-accent-ink ledge` (ledge 2 px here: set `--ledge: 2px` on the container). Keep
   `role="group"`; add `aria-pressed`.
4. **Plot well**: wrap the SVG in `elev-0 overflow-hidden` with `padding: 8px 8px 4px`. Inside
   the SVG, before anything else, draw graph paper: vertical hairlines every `PLOT_W / 8`,
   horizontal every `PLOT_H / 4`, `stroke: var(--grid)`, 1 px. Axes stay `--line-strong`
   1.5 px. Axis end labels: Mono 12 px `--muted` (today they are sans — switch to
   `font-family: var(--font-mono)` via a `.axis-label` class). Curves stay 3 px round caps.
5. **Handle** (every draggable point): halo r 18 at 0.16 → 0.3 while dragging; body r 9 with
   a 2.5 px `--surface` ring (today r 8 / 2.5, fine) and an added
   `filter: drop-shadow(0 2px 6px var(--glow))`; `cursor: grab`, `grabbing` while down. Scale
   `1.08` while dragging (`transform-box: fill-box; transform-origin: center`). Add the
   **value tag**: a `<g>` 22 px above the handle with a `rect rx=6` in `--accent` and Mono
   11.5 px `--accent-ink` text showing the handle's own value (`t = 2.4`, `x = 1.20`,
   `t₁ = 1.00`), LTR; clamp its x so it never leaves the plot. This is what makes the handle
   feel like an instrument rather than a dot.
6. **Sliders** (`input.slider`): track 10 px (was 8) with the filled portion in `--accent`:
   `background: linear-gradient(90deg, var(--accent) var(--p), var(--surface-3) var(--p))`
   on the runnable track, where each explorer sets `style={{ '--p': `${pct}%` }}` on the input
   (`pct = (value-min)/(max-min)*100`). **In RTL flip to `270deg`** (`[dir='rtl'] … { background:
   linear-gradient(270deg, …) }`) because a range input's fill direction follows `dir`. Thumb
   28 px, `--accent`, 3 px `--surface` ring, `0 0 0 4px var(--glow)`; `:active` scale 1.12
   (unchanged). The slider's label (`זמן`, `מספר מלבנים`) 14 px `--ink-2` and its value in
   Mono 600 15 px `--ink` (`.readout`), unchanged positions.

Nothing about the explorers' math, state, pointer handling or accessibility changes — only
their wrapper classes, the grid layer, the value tag, the slider fill and the readout tiles.

### 5.6 Lesson page (`LessonPage.tsx`)

- Back link: ghost button with `arrow` (mirrored), unchanged.
- Header: subtitle 14 px 600 `--accent` (+ Math's curriculum chip) above the h1 (28/40, 800).
  Add the lesson **coin** (§5.3) at the header's start on ≥ 768 px, `--accent-soft`, 36 px,
  so the lesson page shares the home page's numbering glyph.
- Prose: unchanged. Add `max-width: 68ch` on the prose block (desktop lines run ~110
  characters in the sweep — too long).
- Explorers: `bench` (§5.5), `my-8`.
- **Key points**: `Card variant="card"`. Title row: 15 px 700 `--ink` with a 20 px `pin` icon
  in `--accent-2` (replaces the lightbulb). Items: the bullet is a **6 px dot in `--accent-2`
  at `mt-[0.6em]`** (replaces the star icon); text 15 px `--ink-2`. In dark mode `--accent-2`
  passes on `--surface`; in light the dot is a fill, not text, so contrast rules don't apply.
- Quiz: §5.7.
- Lesson nav: `flex justify-between gap-3 pt-2`; prev = `secondary`, next = `primary`, both
  `size="md"` (44 px). `mb` = `--fab-clearance` is provided by `<main>` padding (§5.9) — do
  not add it here.

### 5.7 Quiz (`Quiz.tsx`)

`Card variant="card"` (`elev-1`), `p-5 md:p-6 space-y-4`.

1. **Progress**: replace the text-only `שאלה 1 מ-4` with a row of `total` segments
   (`h-1.5 rounded-pill flex-1 gap-1.5`): answered-correct segments `bg-good-fill`, current
   `bg-accent`, future `bg-surface-3`. Keep the text beside it at 12.5 px `--muted`
   (`.num` on the digits only) for screen readers and clarity; `aria-live="polite"`.
2. **Prompt**: 17 px 500 `--ink`, `.lesson-prose` (unchanged).
3. **MCQ choices**: `elev-0`-colored tiles, `rounded-[var(--r-md)] px-4 py-3 w-full flex gap-3
   items-start text-start`, with a **choice letter coin** at the start: 26 px circle, Mono 600
   13 px, `bg-surface-3 text-ink-2`; letters **א ב ג ד** in HE (the Israeli exam convention —
   a trust cue), **A B C D** in EN (`locale === 'he' ? 'אבגד'[i] : 'ABCD'[i]`). States:
   - idle: `border-line bg-surface-2`; hover `border-line-strong translateY(-1px)`;
   - picked (unchecked): `border-accent border-2 bg-accent-soft`, coin `bg-accent text-accent-ink`;
   - correct: `border-good-fill border-2 bg-good-soft`, coin `bg-good-fill text-white` with a check;
   - wrong: `border-critical-fill border-2 bg-critical-soft` + `.anim-wiggle` once (the
     existing keyframe), coin `bg-critical-fill text-white` with an `x`.
   Transition `border-color, background, transform` at `--t-fast`.
4. **Numeric input**: `elev-0`-colored, `h-12 rounded-[var(--r-md)] text-lg font-semibold
   .num`, focus `border-accent ring-4 ring-accent-soft` (replaces bare `focus:border-accent`).
5. **Result panel**: as today (`rounded-[var(--r-md)] p-4 flex gap-3 anim-pop`), text colors
   switch to the new `--good` / `--critical` *text* tokens; icon colors use `*-fill`.
6. **Action row**: `flex justify-end gap-3` — on phones the primary becomes full-width
   (`w-full sm:w-auto`) so it is never a small pill hiding under the FAB. Check = `primary`;
   Try again = `secondary`; Next = `good` variant. Disabled Check uses the §3.3 disabled style.
7. **Finished state**: no trophy. `elev-1 p-6 text-center space-y-4`: a 56 px `--good-soft`
   coin with a 28 px check in `--good` that `anim-pop`s in, the `quiz.finished` text at 17 px
   600, and the lesson's own `LessonSignature` (§5.3) drawn in with
   `stroke-dasharray/offset` over 900 ms (reduced-motion: static) — the lesson's curve is the
   trophy. Retake = `secondary`.

### 5.8 Feedback widget (`FeedbackWidget.tsx`)

- FAB icon → **envelope** (§6), not a speech bubble. Phone: 48 px circle (was 56 — it was the
  largest control on the page). ≥ 720 px: pill `h-11 px-4` with label `משוב` / `Feedback`.
  Style `bg-accent text-accent-ink ledge`.
- **Collision fix** (the sweep caught the FAB covering "Next question" in RTL and a card title
  on Math's phone home): (a) `<main>` gets `padding-bottom: calc(var(--fab-clearance) +
  env(safe-area-inset-bottom))`; (b) the FAB hides while any `[data-fab-avoid]` element is
  ≥ 30 % visible — put `data-fab-avoid` on the quiz action row and the lesson nav; one
  `IntersectionObserver` in the widget toggles `translateY(140%)` + `opacity 0` with
  `--t-med`. No layout shift, deterministic, ~12 lines.
- Sheet: `elev-2` without the stripe (`elev-2 no-stripe` → `::before { display:none }`),
  `rounded-t-[var(--r-xl)]` on phones. Type chips use the segmented style (§5.5 #3, 2 × 2
  grid). Inputs as §5.7 #4. Send = `primary lg w-full`.

### 5.9 Shell / layout

- `<main>`: `max-w-5xl px-4 md:px-8 pt-5 md:pt-8`, bottom padding per §5.8.
- Footer (home only): 13 px `--muted`, two lines, `max-w-prose`; the credit link
  `hover:text-ink underline-offset-4 hover:underline`. Unchanged copy.
- Skip link: `primary` styling (already is).

---

## 6. Iconography

24-grid, **2 px** stroke (today's), round caps and joins, `currentColor`. Keep `Icon.tsx`'s
path-map approach; change its contents:

Remove: `sparkle`, `lightbulb`, `star`, `book`, `message`, `trophy`, `play`, `home`,
`chevron` (unused after this spec). Keep: `check`, `x`, `arrow`, `sun`, `moon`, `globe`
(unused in the top bar now; keep for the feedback sheet if wanted), `alert`, `refresh`,
`speaker`, `speakerMute`, `paperclip`.

Add (paths on the 24 grid, `fill="none"`):

| name | path `d` | use |
|---|---|---|
| `handle` | `M3 16 C 8 16, 10 7, 15 7 S 21 10 21 10` + `<circle cx="12" cy="10.6" r="2.6" fill="currentColor" stroke="none"/>` | explorer caption, "drag" affordance. `Icon.tsx` must support an optional second element: give `handle` a `children` entry rendered after the path. |
| `pin` | `M12 21s-6-5.3-6-10a6 6 0 1 1 12 0c0 4.7-6 10-6 10Z` + `<circle cx="12" cy="11" r="2.2" fill="currentColor" stroke="none"/>` | key points title |
| `envelope` | `M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Zm0 1 9 6 9-6` | feedback FAB |
| `target` | `M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-5a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z` + `<circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none"/>` | quiz section title |
| `lock` | `M7 11V8a5 5 0 0 1 10 0v3M6 11h12a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1Z` | reserved (not used in this pass; don't ship unused) |

Directional icons (`arrow`) mirror with `rtl:-scale-x-100` (already the pattern). `handle`,
`pin`, `envelope`, `target` never mirror.

**Subject marks** (per subject, unchanged in spirit, fixed in craft):

- Physics `Logo.tsx` + `public/favicon.svg`: keep the arc-with-dot. Make the app tile and the
  favicon the *same geometry*: arc `M14 50 Q 32 10 50 50`, stroke 4.5, dot r 4.5 at (32, 30) on
  the 64 grid (the favicon already is this; `Logo.tsx` draws a different, flatter arc — align
  it to the favicon).
- Math `Logo.tsx` + `public/favicon.svg`: the favicon's ∫ is a `<text>` in Georgia — it
  depends on fonts installed on the viewer's device and doesn't match the Rubik ∫ in the app
  tile. Replace both with one **path** ∫ drawn on the 64 grid, monoline 5 px round caps:
  `M40 14 c-3 0-5 2-5 6 v24 c0 4-2 6-5 6` plus terminal dots r 3.2 at (41, 14) and (29, 50)
  (that is the ∫ as a stroke with two ball terminals — a drawn glyph, not a typed one). Use
  the same path in `Logo.tsx` (scaled to 0.62 × size, like Physics).

---

## 7. Motion

| what | spec |
|---|---|
| easing / durations | `--ease` = `cubic-bezier(.2,.8,.2,1)`; fast 160, med 220, slow 320 ms. Spring/overshoot (`cubic-bezier(.34,1.56,.64,1)`) **only** on `.anim-pop` (quiz result, finished coin). |
| home reveal | lesson cards: opacity 0→1, y 10→0, 320 ms, stagger 40 ms, once per mount |
| hero signature | handle sweeps 0 → 62 % once on load (1.4 s), then follows the pointer; tag value updates live |
| card hover / press | lift −2 px + border → `--accent` + deeper tinted shadow; signature handle slides 38 → 70 %; arrow nudges 3 px toward end; press `scale(.99)` |
| ledge controls | press: `translateY(3px)` and the ledge collapses (`--t-fast`) |
| handles in plots | halo 0.16 → 0.30, scale 1.08 while dragging; value tag follows with no transition (it must be exact) |
| readouts | keep the existing key-remount pop but shorten to 120 ms and `scale 0.94 → 1` (today 0.88 at 180 ms flutters during a drag) |
| quiz | wrong: `.anim-wiggle` once; correct: `.anim-pop`; progress segments animate `background-color` 220 ms |
| finished signature | `stroke-dasharray` draw-in, 900 ms |
| top bar | `data-scrolled` → background/border fade 220 ms |
| **never** | infinite loops (`.anim-bob` removed), parallax, 3-D tilt, cursor trails, confetti |
| reduced motion | the existing global `prefers-reduced-motion` override stays; additionally `useReducedMotion()` gates the stagger, the hero sweep and the draw-in |

---

## 8. RTL / bilingual rules (don't get these wrong)

- All layout with logical properties (`ps/pe/ms/me/start/end`, `text-start`). The card's
  arrow button is at the **end** side in both directions; the coin at the **start**.
- Slider fill gradient flips `90deg ↔ 270deg` under `[dir='rtl']` (§5.5 #6). Range inputs
  themselves already mirror with `dir`.
- The `.elev-2::before` paint stripe flips its gradient angle in RTL so `--accent` is at the
  start edge in both directions.
- `--light-x` puts the page's single light at the start corner (§3.1).
- Numbers: coins, readouts, value tags, axis labels, choice letters (`A B C D` only — Hebrew
  letters stay in the RTL flow) are `.num`/`.readout` LTR islands. A Hebrew chip that merely
  contains digits (curriculum badge, question count, `שאלה 1 מ-4`) is **not** wrapped LTR as a
  whole.
- Signatures and the hero curve do **not** mirror (a graph's x-axis is LTR in Israeli
  textbooks too). The explorer SVGs are already LTR; keep `direction: ltr` on the plot well.
- No `uppercase`, no `tracking-*` anywhere (§4). Labels get their role from the chip shape.
- Every new string (`aria-label` for the card link, the FAB label, choice letters are
  generated, "Done" exists) goes in both `locales/{he,en}.json`. New keys this spec needs:
  `home.startAria` (`התחלה: {{title}}` / `Start: {{title}}`), `home.reviewAria`
  (`חזרה על השיעור: {{title}}` / `Review: {{title}}`), `hero.signatureHint`
  (`הזיזו את האצבע על הגרף` / `Slide your finger along the graph` — shown as a 12.5 px
  `--muted` caption under the hero panel on touch devices only, `@media (hover: none)`).

---

## 9. Shared vs subject-specific — the explicit split

| layer | shared (identical in both apps) | per subject |
|---|---|---|
| tokens | §2.4 non-color tokens, `@theme inline` mapping, elevation classes, `.ledge`, slider CSS, body/graph-paper background, type scale | §2.1 / §2.2 / §2.2a palette blocks (`--accent*`, `--accent-2*`, `--hue-shadow`, `--glow`, `--grid`, series, surfaces) |
| components | `Card`, `Button`, `Icon` (same file contents), `Shell`, `Quiz`, `FeedbackWidget`, `HeroSignature`, `LessonSignature` *renderer* | `heroCurve.ts` (which real function + tag text), the `LessonSignature` *mapping* from explorer kind → drawing (different kinds per subject, §5.3 table), `Logo.tsx`, `favicon.svg` |
| content | — | all copy (already per subject) |
| home | hero structure, card anatomy, reveal | Math's topic sections (§5.4); Physics has none |
| explorers | wrapper (`bench`), readout tiles, segmented control, plot grid, handle + value tag, slider fill | the explorers' own math and state (untouched) |

Rule for the implementer: after finishing one app, `diff` the SKIN BASE blocks and the shared
component files between `apps/math/src`, `apps/physics/src`, and `apps/chemistry/src`; any
difference must be explainable by the right-hand column above. Chemistry's `LessonSignature`
mapping and `heroCurve.ts` are the per-subject column, not a fork of the renderer.

---

## 10. Ban list (for this skin — mirrors HUB_LLD §7 where it applies to subject apps)

- Sparkles/✦, lightbulbs, five-point-star bullets, trophies, speech bubbles, brains, robots,
  "AI/smart/adaptive" copy; emoji as icons; the → character as an arrow.
- Pure-white cards on a near-white page with a grey drop shadow (the thing being replaced).
- Dotted/noise wallpaper; more than one texture (graph paper is the one); radial color blobs
  behind glass; gradient-filled headline text; mesh/aurora backgrounds.
- Mascots, cartoon illustration, 3-D glass objects, isometric scenes, stock photos.
- Ledges thicker than 3 px (2 px inside segmented controls); radii above 20 px; more than one
  display size per screen; a third decorative hue.
- `opacity-50` as a disabled style; `uppercase`/`tracking-*` on labels; `--accent-2` as text
  on a light surface; `--good-fill` as text on white.
- Infinite animation of any kind; hover effects that only exist on desktop *and* carry
  meaning (every hover state has a non-hover equivalent: the handle's static position, the
  arrow button's presence).
- XP, streaks, badges, leaderboards, "level up" — the done-state is a check coin, nothing more.
- Any claim that the apps are free forever (not touched here, but don't add copy).

---

## 11. Files to touch, implementation order, acceptance

### 11.1 Files (per app, same list for `apps/math` and `apps/physics`)

```
src/styles.css                          tokens §2, background §3.1, elevation §3.2, ledge §3.3, slider §5.5, type §4
src/components/ui/Card.tsx              variant: 'well' | 'card' | 'bench'
src/components/ui/Button.tsx            variants §3.3, sizes, disabled
src/components/ui/Icon.tsx              icon set §6 (supports an optional second child element)
src/components/Logo.tsx                 §6 subject mark
public/favicon.svg                      §6 (Math: path ∫; Physics: align Logo to it)
src/components/HeroSignature.tsx        new, §5.2 (shared renderer)
src/components/LessonSignature.tsx      new, §5.3 (shared renderer + per-subject kind map)
src/<math|physics>/heroCurve.ts         new, §5.2 (per subject)
src/app/Shell.tsx                       §5.1 top bar, remove .sky-bg, main padding §5.9
src/features/home/HomePage.tsx          §5.2 hero, §5.3 cards, §5.4 topics (Math)
src/features/lesson/LessonPage.tsx      §5.6
src/components/Quiz.tsx                 §5.7
src/components/FeedbackWidget.tsx       §5.8
src/components/*Explorer*.tsx, MotionScrubber.tsx   §5.5 wrapper/grid/tag/slider-fill only
src/i18n/locales/{he,en}.json           §8 new keys
index.html                              theme-color metas → new --bg values (#eaeffc / #0a1024; #f5ecfb / #140a28)
```

Then `npm run check` in each app and commit the rebuilt `docs/subjects/<subject>/` with the
source (CLAUDE.md rule 4). Work on a branch, open a PR (rule 3).

### 11.2 Order (each step leaves a working app)

1. Tokens + background + elevation + ledge + Button/Card/Icon. Remove `.sky-bg`. Fix the
   FAB clearance and the `data-fab-avoid` observer. (Immediately fixes §0 #3, #7-contrast, #8.)
2. Home: hero (text + `HeroSignature`), lesson cards with coins, `LessonSignature`, arrow
   button, reveal. Topic header fix (Math). (Fixes §0 #1, #2, #4, #5, #6.)
3. Lesson page: header coin, prose measure, key points, nav.
4. Explorers: `bench` wrapper, plot grid, readout tiles, segmented, value tags, slider fill.
5. Quiz: progress segments, letter coins, states, finished state.
6. Top bar, feedback sheet restyle, logos/favicons, `index.html` theme-colors.
7. Diff the shared files between the two apps (§9 rule), run `npm run check`, build both.

### 11.3 Acceptance checklist (check every item at 390 × 844 and 1440 × 900, HE and EN, light and dark)

- [ ] Home, phone: eyebrow + h1 (exactly two lines in both languages) + lede + hero signature
      panel + the first lesson card's header row are visible without scrolling at 390 × 844.
- [ ] Home: every lesson card shows a signature drawn from its own first explorer; the handle
      dot sits on the curve; hover slides it; no card exceeds 2 title lines.
- [ ] Hero signature responds to pointer/finger along x; vertical page scroll still works on
      touch; the value tag shows the real function's value; the load sweep runs once and not
      under `prefers-reduced-motion`.
- [ ] No pure-white-on-near-white card with a grey shadow remains; light mode cards show a
      visibly hue-tinted shadow; dark mode cards show the inset top highlight.
- [ ] Full-page screenshot in dark mode shows **no horizontal band** where the background
      changes (background painted on `html`/`body`, not fixed).
- [ ] Graph paper visible in the top ~520 px only, faded out below; no dots/blobs anywhere.
- [ ] Primary buttons: 3 px ledge, collapses on press; none shorter than 36 px on a phone;
      disabled Check uses surface-3/muted, not transparency.
- [ ] FAB is an envelope; it never overlaps the quiz action row, the lesson nav or a card
      (scroll the quiz into view and confirm the FAB hides; scroll away and it returns).
- [ ] Explorer panel is the most elevated surface on the lesson page and carries the paint
      stripe; plot has a grid; each handle shows a value tag that stays inside the plot;
      slider fill is on the correct side in RTL.
- [ ] Quiz: progress segments; HE choices lettered א ב ג ד, EN A B C D; wrong answer wiggles
      once; finished state draws the lesson signature; no trophy.
- [ ] Contrast (spot-check with any WCAG tool): `--muted` on `--bg` ≥ 4.5; `--good` and
      `--critical` *text* on white ≥ 4.5; no `--accent-2` text on a light surface; top-bar
      language label ≥ 4.5.
- [ ] No `uppercase`/`tracking-*` classes remain in either app (grep).
- [ ] No horizontal overflow at 390 px in either language; numbers/formulas/value tags are LTR
      inside Hebrew; Hebrew chips with digits read in the right word order.
- [ ] `diff -r apps/math/src/components/ui apps/physics/src/components/ui` is empty, and the
      same diff against `apps/chemistry/src/components/ui` is empty; the SKIN BASE blocks of
      the three `styles.css` files are identical; `npm run check` passes in each app that
      changed; rebuilt `docs/subjects/` output for those apps is committed.
