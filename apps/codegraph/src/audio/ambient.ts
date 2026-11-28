/**
 * A small generative ambient pad — a calm, open chord with a slow "breathing" filter sweep —
 * synthesized entirely with the Web Audio API. No audio file to source, license, or ship.
 * Must be started from a real user gesture (the toggle click itself) per browser autoplay
 * policy; there is nothing to resume automatically on load.
 */
export class AmbientPad {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private nodes: OscillatorNode[] = [];

  start(): void {
    if (this.ctx) return;
    const ctx = new AudioContext();

    const master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
    master.gain.linearRampToValueAtTime(0.045, ctx.currentTime + 2.5);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 900;
    filter.connect(master);

    // An open, calm chord (A2, E3, A3, C#4) — sine waves only, gently detuned for warmth.
    const freqs = [110, 164.81, 220, 277.18];
    const nodes = freqs.map((f, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = f;
      osc.detune.value = (i % 2 === 0 ? -1 : 1) * 4;
      const gain = ctx.createGain();
      gain.gain.value = 1 / freqs.length;
      osc.connect(gain);
      gain.connect(filter);
      osc.start();
      return osc;
    });

    // A very slow LFO on the filter cutoff so the pad breathes instead of sitting static.
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.045;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 300;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();
    nodes.push(lfo);

    this.ctx = ctx;
    this.master = master;
    this.nodes = nodes;
  }

  stop(): void {
    const ctx = this.ctx;
    const master = this.master;
    const nodes = this.nodes;
    if (!ctx || !master) return;
    master.gain.linearRampToValueAtTime(0, ctx.currentTime + 1);
    setTimeout(() => {
      nodes.forEach((n) => n.stop());
      void ctx.close();
    }, 1100);
    this.ctx = null;
    this.master = null;
    this.nodes = [];
  }
}
