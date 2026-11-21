// Types for the global that engine.js defines. Spec: BACKGROUND_LLD.md §5.1 and §6.
// This file is per app (the engine itself is byte-identical across apps; these types are not synced).

export interface Pen {
  /** 0..1 through the drawing phase; 1 while held, fading, and in a still frame. */
  readonly t: number;
  /** Seconds, for a slow loop (a sliding tangent); 9 in a still frame. */
  readonly now: number;
  readonly still: boolean;
  /** This napkin's inks; which token is "0" rotates per napkin. */
  ink(i: 0 | 1 | 2): string;
  /** `--paper-text`. */
  readonly text: string;
  /** Width at the nearest size, min 1.2 px. */
  style(colour: string, widthPx: number, alpha?: number): void;
  /** w = fn(u), drawn up to `part`; steps <= 56. `dashed` (an addition to the spec's list, for M7's derivative) draws it dashed. */
  curve(fn: (u: number) => number, u0: number, u1: number, part?: number, steps?: number, dashed?: boolean): void;
  seg(u0: number, w0: number, u1: number, w1: number): void;
  dash(u0: number, w0: number, u1: number, w1: number): void;
  arrow(u0: number, w0: number, u1: number, w1: number): void;
  /** Axis-aligned bar: 8 projected points, filled at alpha `fill`, outlined. */
  quad(u0: number, w0: number, u1: number, w1: number, fill: number): void;
  /** The region between the curve and a baseline. */
  area(fn: (u: number) => number, u0: number, u1: number, wBase: number, fill: number): void;
  dot(u: number, w: number, rPx: number, filled?: boolean): void;
  /** An atom: napkin-coloured disc, coloured rim, optional letter. */
  disc(u: number, w: number, rPx: number, colour: string, letter?: string): void;
  /** An angle mark, r in u units; angles run counter-clockwise on screen. */
  arc(u: number, w: number, r: number, a0: number, a1: number): void;
  /** em = letter height in u units; ax, ay = anchor 0..1 (default 0.5, 0.5). */
  label(markup: string, u: number, w: number, em: number, opts?: { colour?: string; ax?: number; ay?: number; alpha?: number }): void;
}

export interface Payload {
  /** 'M1' ... as in BACKGROUND_LLD.md §10. */
  id: string;
  tier: 'A' | 'B';
  /** Called once per frame for a visible napkin, after its grid. Pure: the same pen.t and pen.now give the same picture. */
  draw(pen: Pen): void;
  /** Recomputes every number the payload states from the subject's own functions. */
  check(): boolean;
}

export interface PaperOptions {
  /** stage: napkins travel along x. gutter: along y. */
  flow: 'x' | 'y';
  kind?: 'napkins' | 'bubbles';
  payloads?: Payload[];
  count: number;
  /** Family list for label sprites. */
  font: string;
  /** So the two gutters do not show the same napkins. */
  seed?: number;
  /** Debug: every napkin carries payloads[only]. */
  only?: number;
}
export interface PaperHandle {
  canvas: HTMLCanvasElement;
  refresh(): void;
  destroy(): void;
}
export type MotionState = 'on' | 'off';

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
    /** motion()/moving()/canMove() changed. */
    onChange(cb: () => void): () => void;
    /** Debug: requestAnimationFrame callbacks the engine has run, and canvases it has drawn. */
    readonly _frames: number;
    readonly _draws: number;
    /** Debug: time spent inside draw(), per drawn frame, since _profile(true). */
    _profile(on: boolean): void;
    _times(): number[];
  };
}
