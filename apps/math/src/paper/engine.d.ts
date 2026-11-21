// Types for the global that engine.js defines. Spec: BACKGROUND_LLD.md §5.1, §6, R7.2 and R8.1.
// This file is per app (the engine itself is byte-identical across apps; these types are not synced).

export interface Pen {
  /** 0..1 through the drawing phase; 1 while held, fading, and in a still frame. */
  readonly t: number;
  /** Seconds, for a slow loop (a sliding tangent); 9 in a still frame. */
  readonly now: number;
  readonly still: boolean;
  /** hw / hh of this napkin (about 1.2-1.6): a circle needs w-extent = u-extent x aspect to look round. Not in the spec's list: needed for R7.3's circles, ellipse and squares. */
  readonly aspect: number;
  /** This napkin's inks; which token is "0" rotates per napkin. */
  ink(i: 0 | 1 | 2): string;
  /** `--paper-text`. */
  readonly text: string;
  /** Width at the nearest size, min 1.2 px. */
  style(colour: string, widthPx: number, alpha?: number): void;
  /** w = fn(u), drawn up to `part`; steps <= 56. `dashed` (an addition to the spec's list, for M7's derivative) draws it dashed. */
  curve(fn: (u: number) => number, u0: number, u1: number, part?: number, steps?: number, dashed?: boolean): void;
  /** A parametric curve (u(s), w(s)) for s in s0..s1, drawn up to `part`; steps <= 56. For circles, ellipses, sideways curves. */
  para(fu: (s: number) => number, fw: (s: number) => number, s0: number, s1: number, part?: number, steps?: number, dashed?: boolean): void;
  seg(u0: number, w0: number, u1: number, w1: number): void;
  dash(u0: number, w0: number, u1: number, w1: number): void;
  arrow(u0: number, w0: number, u1: number, w1: number): void;
  /** Axis-aligned bar: 8 projected points, filled at alpha `fill`, outlined. */
  quad(u0: number, w0: number, u1: number, w1: number, fill: number): void;
  /** The region between the curve and a baseline: a number (horizontal line at that w) or a second curve w = base(u) (an addition to the spec, for M15). */
  area(fn: (u: number) => number, u0: number, u1: number, base: number | ((u: number) => number), fill: number): void;
  dot(u: number, w: number, rPx: number, filled?: boolean): void;
  /** An atom: napkin-coloured disc, coloured rim, optional letter. */
  disc(u: number, w: number, rPx: number, colour: string, letter?: string): void;
  /** An angle mark, r in u units; angles run counter-clockwise on screen. */
  arc(u: number, w: number, r: number, a0: number, a1: number): void;
  /** em = letter height in u units; ax, ay = anchor 0..1 (default 0.5, 0.5). */
  label(markup: string, u: number, w: number, em: number, opts?: { colour?: string; ax?: number; ay?: number; alpha?: number }): void;
}

/** The families of Math's catalog (R7.3): the scheduler never puts two of one family next to each other. */
export type Family = 'INT' | 'DER' | 'EXT' | 'ALG' | 'TRIG' | 'EXP' | 'ABS' | 'GEO' | 'SER';

export interface Payload {
  /** 'M1' ... as in BACKGROUND_LLD.md §10 and R7.3. */
  id: string;
  tier: 'A' | 'B';
  family: Family;
  /** Called once per frame for a visible napkin, after its grid. Pure: the same pen.t and pen.now give the same picture. */
  draw(pen: Pen): void;
  /** Recomputes every number the payload states from the subject's own functions. */
  check(): boolean;
}

export interface PaperOptions {
  /** page: one fixed full-viewport canvas behind the whole page (Revision 2). x: a stage band; y: a gutter (Revision 1). */
  flow: 'x' | 'y' | 'page';
  kind?: 'napkins' | 'bubbles';
  payloads?: Payload[];
  /** Napkins. Omitted on a page flow: the engine's table by viewport width (6 / 7 / 9 / 11). */
  count?: number;
  /** Family list for label sprites. */
  font: string;
  /** Seeds the placement and the shuffle bag, so the still frame is the same on every load. */
  seed?: number;
  /** Debug: every napkin carries payloads[only]. */
  only?: number;
}
export interface PaperHandle {
  canvas: HTMLCanvasElement;
  refresh(): void;
  destroy(): void;
}
export type MotionState = 'on' | 'calm' | 'off';

declare global {
  var AcademyPaper: {
    mount(host: HTMLElement, options: PaperOptions): PaperHandle;
    /** Reads localStorage 'academy:paper-motion', default 'on'. */
    motion(): MotionState;
    /** Persists, applies to every mounted canvas. */
    setMotion(state: MotionState): void;
    /** True only while frames are actually being drawn. */
    moving(): boolean;
    /** False when BACKGROUND_LLD.md §8.3 forces a still frame. */
    canMove(): boolean;
    /** The quality level the governor has reached: 0 (full) .. 5 (a still frame for the session). */
    level(): 0 | 1 | 2 | 3 | 4 | 5;
    /** motion()/moving()/canMove()/level() changed. */
    onChange(cb: () => void): () => void;
    /** Debug: requestAnimationFrame callbacks the engine has run, and canvases it has drawn. */
    readonly _frames: number;
    readonly _draws: number;
    /** Debug: restart the record of time spent inside draw() (kept always). */
    _profile(on?: boolean): void;
    _times(): number[];
    /** Debug: jump to a quality level without storing it; switch the governor off; flat paper without turn or tilt. */
    _setLevel(n: number): void;
    _governor(on: boolean): void;
    _flat(on: boolean): void;
  };
}
