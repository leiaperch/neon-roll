/**
 * Banc de voix WebAudio. Rien n'est chargé : chaque instrument est synthétisé,
 * ce qui laisse au séquenceur une horloge parfaitement fiable et permet à
 * chaque piste d'avoir sa propre instrumentation sans multiplier les fichiers.
 *
 * Les motifs des pistes reçoivent cet objet et appellent les voix avec un
 * temps absolu ; le séquenceur programme toujours en avance sur l'horloge.
 */

const LOOKAHEAD = 0.14; // secondes d'avance de programmation
const TICK = 25; // ms entre deux réveils du programmateur
const MASTER_LEVEL = 0.5; // réglé au rendu hors ligne, au-delà ça écrête

/** Numéro MIDI vers fréquence. 69 = la 440. */
export const mtof = (midi) => 440 * Math.pow(2, (midi - 69) / 12);

/** Degré d'une gamme vers numéro MIDI, en débordant sur les octaves. */
export function degree(scale, root, index) {
  const n = scale.length;
  const octave = Math.floor(index / n);
  return root + scale[((index % n) + n) % n] + octave * 12;
}

export const SCALES = {
  mineur: [0, 2, 3, 5, 7, 8, 10],
  majeur: [0, 2, 4, 5, 7, 9, 11],
  blues: [0, 3, 5, 6, 7, 10],
  mixolydien: [0, 2, 4, 5, 7, 9, 10],
  phrygien: [0, 1, 3, 5, 7, 8, 10],
};

export class Synth {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.muted = false;
    this.startTime = 0;
    this.nextStep = 0;
    this.timer = null;
    this.running = false;
    this.pattern = null;
    this.stepDuration = 0.25;
    this.totalSteps = 0;
  }

  /** À appeler depuis un geste utilisateur (contrainte iOS et Android). */
  async init() {
    if (this.ctx) {
      await this._resume();
      return;
    }
    const Ctx = window.AudioContext || window.webkitAudioContext;
    this.ctx = new Ctx();
    await this._resume();

    const comp = this.ctx.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.ratio.value = 6;
    comp.attack.value = 0.003;
    comp.release.value = 0.25;

    this.master = this.ctx.createGain();
    this.master.gain.value = MASTER_LEVEL;
    this.master.connect(comp).connect(this.ctx.destination);

    this.reverb = this._makeReverb();
    this.echo = this._makeEcho();
    this.drive = this._makeDrive();
    this.noiseBuffer = this._makeNoise();
  }

  /** `resume` échoue sur un contexte hors ligne ou fermé : on l'ignore. */
  async _resume() {
    if (this.ctx.state !== 'suspended') return;
    try {
      await this.ctx.resume();
    } catch {
      /* contexte non reprenable, la lecture restera muette */
    }
  }

  _makeNoise() {
    const len = Math.floor(this.ctx.sampleRate * 0.6);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    let seed = 1337;
    for (let i = 0; i < len; i++) {
      // Bruit déterministe : le rendu sonore est le même à chaque partie.
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      data[i] = seed / 0x3fffffff - 1;
    }
    return buf;
  }

  /** Réverbération courte, obtenue par une réponse impulsionnelle synthétique. */
  _makeReverb() {
    const sr = this.ctx.sampleRate;
    const len = Math.floor(sr * 1.6);
    const buf = this.ctx.createBuffer(2, len, sr);
    let seed = 991;
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) {
        seed = (seed * 1103515245 + 12345) & 0x7fffffff;
        const noise = seed / 0x3fffffff - 1;
        d[i] = noise * Math.pow(1 - i / len, 2.6);
      }
    }
    const conv = this.ctx.createConvolver();
    conv.buffer = buf;
    const wet = this.ctx.createGain();
    wet.gain.value = 0.5;
    const send = this.ctx.createGain();
    send.gain.value = 1;
    send.connect(conv).connect(wet).connect(this.master);
    return send;
  }

  _makeEcho() {
    const delay = this.ctx.createDelay(2);
    delay.delayTime.value = 0.3;
    const fb = this.ctx.createGain();
    fb.gain.value = 0.33;
    const wet = this.ctx.createGain();
    wet.gain.value = 0.36;
    delay.connect(fb).connect(delay);
    delay.connect(wet).connect(this.master);
    this.echoNode = delay;
    return delay;
  }

  /** Saturation par table d'onde, pour les guitares et les basses agressives. */
  _makeDrive() {
    const shaper = this.ctx.createWaveShaper();
    const n = 1024;
    const curve = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const x = (i / (n - 1)) * 2 - 1;
      curve[i] = Math.tanh(x * 4.2);
    }
    shaper.curve = curve;
    shaper.oversample = '2x';
    return shaper;
  }

  setEchoTime(seconds) {
    if (this.echoNode) this.echoNode.delayTime.value = seconds;
  }

  setMuted(muted) {
    this.muted = muted;
    if (this.master) this.master.gain.value = muted ? 0 : MASTER_LEVEL;
  }

  /** Charge le motif d'une piste. `pattern(step, t, synth)` est appelé par pas. */
  load(track) {
    this.pattern = track.pattern;
    this.stepDuration = 60 / (track.bpm * track.rowsPerBeat);
    this.totalSteps = track.totalRows;
    this.setEchoTime(this.stepDuration * (track.echoSteps || 3));
  }

  /** Démarre (ou reprend) la lecture à partir d'un pas donné. */
  start(fromStep = 0) {
    if (!this.ctx || !this.pattern) return;
    this.stop();
    this.nextStep = fromStep;
    this.startTime = this.ctx.currentTime + 0.08 - fromStep * this.stepDuration;
    this.running = true;
    this._schedule();
    this.timer = setInterval(() => this._schedule(), TICK);
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.running = false;
  }

  /** Temps musical écoulé. Horloge maîtresse de tout le jeu. */
  get time() {
    if (!this.ctx || !this.running) return 0;
    return this.ctx.currentTime - this.startTime;
  }

  _schedule() {
    if (!this.running) return;
    const horizon = this.ctx.currentTime + LOOKAHEAD;
    while (this.startTime + this.nextStep * this.stepDuration < horizon) {
      const t = this.startTime + this.nextStep * this.stepDuration;
      if (t >= this.ctx.currentTime - 0.05) {
        try {
          this.pattern(this.nextStep, t, this);
        } catch {
          /* un motif fautif ne doit pas arrêter la partie */
        }
      }
      this.nextStep++;
      if (this.nextStep > this.totalSteps + 16) {
        this.running = false;
        break;
      }
    }
  }

  // ---- Utilitaires d'enveloppe et de routage ----

  _gain(t, peak, attack, decay, dest) {
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
    g.connect(dest || this.master);
    return g;
  }

  _osc(type, freq, t, stop, detune = 0) {
    const o = this.ctx.createOscillator();
    o.type = type;
    o.frequency.value = freq;
    o.detune.value = detune;
    o.start(t);
    o.stop(stop);
    return o;
  }

  _noise(t, stop, rate = 1) {
    const s = this.ctx.createBufferSource();
    s.buffer = this.noiseBuffer;
    s.playbackRate.value = rate;
    s.start(t);
    s.stop(stop);
    return s;
  }

  _filter(type, freq, q = 1) {
    const f = this.ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    return f;
  }

  send(node, amount, bus) {
    const g = this.ctx.createGain();
    g.gain.value = amount;
    node.connect(g).connect(bus);
  }

  // ---- Percussions ----

  kick(t, { level = 0.95, from = 165, to = 44, decay = 0.22 } = {}) {
    const g = this._gain(t, level, 0.004, decay);
    const o = this._osc('sine', from, t, t + decay + 0.1);
    o.frequency.setValueAtTime(from, t);
    o.frequency.exponentialRampToValueAtTime(to, t + decay * 0.5);
    o.connect(g);
  }

  snare(t, { level = 0.4, tone = 210, bright = 1400, decay = 0.16 } = {}) {
    const g = this._gain(t, level, 0.003, decay);
    this._noise(t, t + decay + 0.1).connect(this._filter('highpass', bright)).connect(g);
    const bg = this._gain(t, level * 0.4, 0.003, decay * 0.55);
    this._osc('triangle', tone, t, t + decay).connect(bg);
  }

  /** Caisse claire jouée aux balais : bruit filtré, sans corps. */
  brush(t, { level = 0.2, decay = 0.19 } = {}) {
    const g = this._gain(t, level, 0.02, decay);
    this._noise(t, t + decay + 0.1, 0.6).connect(this._filter('bandpass', 2400, 0.8)).connect(g);
    this.send(g, 0.18, this.reverb);
  }

  hat(t, { level = 0.2, open = false } = {}) {
    const decay = open ? 0.22 : 0.045;
    const g = this._gain(t, level, 0.002, decay);
    this._noise(t, t + decay + 0.1, 1.7).connect(this._filter('highpass', 7200)).connect(g);
  }

  ride(t, { level = 0.14 } = {}) {
    const g = this._gain(t, level, 0.004, 0.5);
    this._noise(t, t + 0.6, 1.2).connect(this._filter('bandpass', 5200, 1.6)).connect(g);
    this.send(g, 0.25, this.reverb);
  }

  clap(t, { level = 0.32 } = {}) {
    // Trois rebonds serrés, ce qui donne le claquement caractéristique.
    for (const [offset, mul] of [[0, 0.6], [0.012, 0.8], [0.026, 1]]) {
      const g = this._gain(t + offset, level * mul, 0.002, 0.12);
      this._noise(t + offset, t + offset + 0.2, 1.1).connect(this._filter('bandpass', 1700, 0.7)).connect(g);
    }
    const tail = this._gain(t + 0.03, level * 0.5, 0.004, 0.22);
    this._noise(t + 0.03, t + 0.3, 0.9).connect(this._filter('bandpass', 1500, 0.5)).connect(tail);
  }

  tom(t, { midi = 45, level = 0.4, decay = 0.24 } = {}) {
    const f = mtof(midi);
    const g = this._gain(t, level, 0.004, decay);
    const o = this._osc('sine', f, t, t + decay + 0.1);
    o.frequency.exponentialRampToValueAtTime(f * 0.6, t + decay);
    o.connect(g);
  }

  crash(t, { level = 0.3 } = {}) {
    const g = this._gain(t, level, 0.005, 1.1);
    this._noise(t, t + 1.3, 1.4).connect(this._filter('highpass', 4200)).connect(g);
    this.send(g, 0.3, this.reverb);
  }

  // ---- Voix mélodiques ----

  bass(t, midi, dur, { level = 0.3, type = 'sawtooth', cutoff = 1100, floor = 260, q = 6 } = {}) {
    const f = mtof(midi);
    const g = this._gain(t, level, 0.006, dur);
    const lp = this._filter('lowpass', cutoff, q);
    lp.frequency.setValueAtTime(cutoff, t);
    lp.frequency.exponentialRampToValueAtTime(floor, t + dur);
    this._osc(type, f, t, t + dur + 0.05).connect(lp).connect(g);
  }

  /** Contrebasse pincée : attaque courte, corps sourd, ce qui « marche ». */
  upright(t, midi, dur, { level = 0.34 } = {}) {
    const f = mtof(midi);
    const g = this._gain(t, level, 0.01, dur * 0.9);
    const lp = this._filter('lowpass', 420, 2);
    this._osc('triangle', f, t, t + dur).connect(lp).connect(g);
    const click = this._gain(t, level * 0.3, 0.002, 0.05);
    this._noise(t, t + 0.08, 0.8).connect(this._filter('bandpass', 900, 1)).connect(click);
  }

  lead(t, midi, dur, { level = 0.14, type = 'square', echo = 0.35, cutoff = 3200 } = {}) {
    const f = mtof(midi);
    const g = this._gain(t, level, 0.004, dur);
    const lp = this._filter('lowpass', cutoff);
    for (const d of [-7, 7]) this._osc(type, f, t, t + dur + 0.05, d).connect(lp);
    lp.connect(g);
    if (echo > 0) this.send(g, echo, this.echo);
  }

  /** Guitare saturée : deux oscillateurs dans la table de saturation. */
  guitar(t, midi, dur, { level = 0.24, power = true, mute = false } = {}) {
    const f = mtof(midi);
    const pre = this.ctx.createGain();
    pre.gain.value = 2.2;
    const g = this._gain(t, level, 0.003, mute ? Math.min(dur, 0.09) : dur);
    const lp = this._filter('lowpass', mute ? 1800 : 2600, 1.2);
    const notes = power ? [0, 7, 12] : [0];
    for (const semi of notes) {
      this._osc('sawtooth', f * Math.pow(2, semi / 12), t, t + dur + 0.05, semi === 0 ? -5 : 5).connect(pre);
    }
    pre.connect(this.drive).connect(lp).connect(g);
  }

  /** Clavecin : pincement bref et brillant, sans dynamique, comme l'instrument. */
  pluck(t, midi, dur, { level = 0.17 } = {}) {
    const f = mtof(midi);
    const g = this._gain(t, level, 0.002, Math.min(dur, 0.5));
    const bp = this._filter('bandpass', f * 2.4, 1.1);
    this._osc('sawtooth', f, t, t + dur + 0.05).connect(bp);
    this._osc('square', f * 2, t, t + dur + 0.05, 6).connect(bp);
    bp.connect(g);
    this.send(g, 0.22, this.reverb);
  }

  /** Orgue additif : quatre partiels, attaque nette, tenue plate. */
  organ(t, midi, dur, { level = 0.13 } = {}) {
    const f = mtof(midi);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(level, t + 0.03);
    g.gain.setValueAtTime(level, t + dur * 0.8);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    g.connect(this.master);
    for (const [mul, amp] of [[1, 1], [2, 0.5], [3, 0.28], [4, 0.16]]) {
      const v = this.ctx.createGain();
      v.gain.value = amp;
      this._osc('sine', f * mul, t, t + dur + 0.1).connect(v).connect(g);
    }
    this.send(g, 0.3, this.reverb);
  }

  /** Voix à impulsion, largeur variable : le timbre des consoles 8 bits. */
  chip(t, midi, dur, { level = 0.13, duty = 0.5, vibrato = 0 } = {}) {
    const f = mtof(midi);
    const g = this._gain(t, level, 0.002, dur);
    // Une impulsion s'obtient en soustrayant deux dents de scie décalées.
    const a = this._osc('sawtooth', f, t, t + dur + 0.05);
    const b = this._osc('sawtooth', f, t, t + dur + 0.05);
    const inv = this.ctx.createGain();
    inv.gain.value = -1;
    const delay = this.ctx.createDelay(0.05);
    delay.delayTime.value = duty / f;
    a.connect(g);
    b.connect(delay).connect(inv).connect(g);
    if (vibrato > 0) {
      const lfo = this._osc('sine', 6, t, t + dur + 0.05);
      const depth = this.ctx.createGain();
      depth.gain.value = vibrato;
      lfo.connect(depth);
      depth.connect(a.frequency);
      depth.connect(b.frequency);
    }
  }

  pad(t, midi, dur, { level = 0.1, type = 'sawtooth' } = {}) {
    const f = mtof(midi);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(level, t + dur * 0.35);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    const lp = this._filter('lowpass', 1500);
    for (const d of [-11, 11]) this._osc(type, f, t, t + dur + 0.1, d).connect(lp);
    lp.connect(g).connect(this.master);
    this.send(g, 0.35, this.reverb);
  }

  /** Nappe de cordes frottées, attaque lente et vibrato léger. */
  strings(t, midi, dur, { level = 0.09 } = {}) {
    const f = mtof(midi);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(level, t + Math.min(0.25, dur * 0.4));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    const lp = this._filter('lowpass', 2200);
    for (const d of [-9, 4, 9]) this._osc('sawtooth', f, t, t + dur + 0.1, d).connect(lp);
    lp.connect(g).connect(this.master);
    this.send(g, 0.4, this.reverb);
  }

  /** Glissando de bruit, pour annoncer une rupture. */
  riser(t, dur, { level = 0.16 } = {}) {
    const g = this._gain(t, level, dur * 0.9, dur * 0.1);
    const bp = this._filter('bandpass', 400, 3);
    bp.frequency.setValueAtTime(400, t);
    bp.frequency.exponentialRampToValueAtTime(6000, t + dur);
    this._noise(t, t + dur + 0.05, 1).connect(bp).connect(g);
  }

  // ---- Effets de jeu, hors séquence ----

  pickup(index = 0, scale = SCALES.majeur, root = 84) {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    const midi = degree(scale, root, index % 8);
    const g = this._gain(t, 0.2, 0.003, 0.16);
    const o = this._osc('triangle', mtof(midi), t, t + 0.25);
    o.frequency.exponentialRampToValueAtTime(mtof(midi + 7), t + 0.09);
    o.connect(g);
    this.send(g, 0.25, this.reverb);
  }

  fanfare() {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    [0, 4, 7, 12].forEach((semi, i) => {
      this.pluck(t + i * 0.07, 72 + semi, 0.6, { level: 0.2 });
    });
  }

  death() {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    const g = this._gain(t, 0.34, 0.005, 0.55);
    const o = this._osc('sawtooth', 320, t, t + 0.7);
    o.frequency.exponentialRampToValueAtTime(48, t + 0.5);
    o.connect(this._filter('lowpass', 900)).connect(g);
  }
}
