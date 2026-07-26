import { BPM, STEP_DURATION } from './config.js';

/**
 * Séquenceur WebAudio. Tout est synthétisé à la volée : aucun fichier audio,
 * donc rien à charger et une horloge parfaitement fiable. Le temps musical
 * (`time`) est l'unique horloge du jeu, ce qui garantit que les obstacles
 * tombent exactement sur les temps.
 */

// Réglé au rendu hors ligne : au-delà, la somme des voix écrête en sortie.
const MASTER_LEVEL = 0.5;

const LOOKAHEAD = 0.12; // secondes d'avance de programmation
const TICK = 25; // ms entre deux réveils du programmateur

// Gamme de la mélodie : la mineur naturel, sur trois octaves utiles.
const NOTE = (semitonesFromA2) => 110 * Math.pow(2, semitonesFromA2 / 12);
const SCALE = [0, 2, 3, 5, 7, 8, 10]; // degrés du mode mineur

// Progression sur 4 mesures : Am - F - C - G (fondamentales en demi-tons).
const PROGRESSION = [0, -4, 3, -2];

/** Motifs de croches (8 par mesure) déclinés selon la section. */
const ARPEGGIO = [0, 2, 4, 2, 5, 4, 2, 0];

export class Music {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.delay = null;
    this.noiseBuffer = null;
    this.startTime = 0;
    this.nextStep = 0;
    this.timer = null;
    this.running = false;
    this.muted = false;
  }

  /** À appeler depuis un geste utilisateur (contrainte iOS/Android). */
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

    // Écho pointé sur la croche, utilisé par le lead.
    this.delay = this.ctx.createDelay(1);
    this.delay.delayTime.value = STEP_DURATION * 1.5;
    const fb = this.ctx.createGain();
    fb.gain.value = 0.34;
    const wet = this.ctx.createGain();
    wet.gain.value = 0.4;
    this.delay.connect(fb).connect(this.delay);
    this.delay.connect(wet).connect(this.master);

    this.noiseBuffer = this._makeNoise();
  }

  /** `resume` échoue sur un contexte hors ligne ou déjà fermé : on l'ignore. */
  async _resume() {
    if (this.ctx.state !== 'suspended') return;
    try {
      await this.ctx.resume();
    } catch {
      /* contexte non reprenable, la lecture restera muette */
    }
  }

  _makeNoise() {
    const len = Math.floor(this.ctx.sampleRate * 0.5);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    let seed = 1337;
    for (let i = 0; i < len; i++) {
      // Bruit déterministe : le rendu sonore ne change pas d'une partie à l'autre.
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      data[i] = (seed / 0x3fffffff) - 1;
    }
    return buf;
  }

  /** Démarre (ou reprend) la lecture à partir d'une croche donnée. */
  start(fromStep = 0) {
    if (!this.ctx) return;
    this.stop();
    this.nextStep = fromStep;
    this.startTime = this.ctx.currentTime + 0.08 - fromStep * STEP_DURATION;
    this.running = true;
    this._schedule();
    this.timer = setInterval(() => this._schedule(), TICK);
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.running = false;
  }

  setMuted(muted) {
    this.muted = muted;
    if (this.master) this.master.gain.value = muted ? 0 : MASTER_LEVEL;
  }

  /** Temps musical écoulé, en secondes. Horloge maîtresse du jeu. */
  get time() {
    if (!this.ctx || !this.running) return 0;
    return this.ctx.currentTime - this.startTime;
  }

  _schedule() {
    if (!this.running) return;
    const horizon = this.ctx.currentTime + LOOKAHEAD;
    while (this.startTime + this.nextStep * STEP_DURATION < horizon) {
      this._playStep(this.nextStep, this.startTime + this.nextStep * STEP_DURATION);
      this.nextStep++;
      if (this.nextStep > 300) break; // au-delà du niveau, on laisse mourir
    }
  }

  /** Une croche du morceau : 8 croches par mesure, 32 mesures au total. */
  _playStep(step, t) {
    if (t < this.ctx.currentTime - 0.05) return;
    const inBar = step % 8;
    const bar = Math.floor(step / 8);
    const root = PROGRESSION[bar % 4];

    const intro = bar < 4;
    const breakdown = bar >= 12 && bar < 16;
    const finale = bar >= 28;
    const full = !intro && !breakdown;

    // Batterie
    if (full && inBar % 2 === 0) this._kick(t);
    if (full && (inBar === 4 || (bar >= 16 && inBar === 12 % 8))) this._snare(t);
    if (bar >= 16 && inBar === 4) this._snare(t);
    if (!breakdown) this._hat(t, inBar % 2 === 0 ? 0.16 : 0.26);
    if (finale && inBar === 7) this._snare(t + STEP_DURATION * 0.5, 0.5);

    // Basse : croches sur la fondamentale, avec une octave à la fin de mesure.
    if (full) {
      const oct = inBar === 6 || inBar === 7 ? 12 : 0;
      this._bass(t, NOTE(root + oct), STEP_DURATION * 0.9);
    }

    // Nappe : une tenue par mesure, présente partout sauf au drop final.
    if (inBar === 0) {
      const dur = STEP_DURATION * 8;
      this._pad(t, NOTE(root + 12), dur, intro || breakdown ? 0.16 : 0.09);
      this._pad(t, NOTE(root + 12 + SCALE[2]), dur, intro || breakdown ? 0.12 : 0.07);
    }

    // Lead : arpège du mode mineur, plus dense à partir de la seconde moitié.
    const leadOn = !intro && (bar >= 16 ? true : inBar % 2 === 0);
    if (leadOn || breakdown) {
      const deg = ARPEGGIO[(inBar + bar) % 8];
      const semis = root + 24 + SCALE[deg % 7] + (deg >= 7 ? 12 : 0);
      this._lead(t, NOTE(semis), STEP_DURATION * 0.7, breakdown ? 0.1 : 0.14);
    }
  }

  _env(node, t, peak, attack, decay) {
    const g = node.gain;
    g.setValueAtTime(0.0001, t);
    g.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t + attack);
    g.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  }

  _kick(t) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(160, t);
    osc.frequency.exponentialRampToValueAtTime(44, t + 0.11);
    this._env(gain, t, 0.9, 0.004, 0.22);
    osc.connect(gain).connect(this.master);
    osc.start(t);
    osc.stop(t + 0.3);
  }

  _snare(t, level = 0.42) {
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const hp = this.ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 1400;
    const gain = this.ctx.createGain();
    this._env(gain, t, level, 0.003, 0.16);
    src.connect(hp).connect(gain).connect(this.master);
    src.start(t);
    src.stop(t + 0.25);

    const body = this.ctx.createOscillator();
    const bg = this.ctx.createGain();
    body.type = 'triangle';
    body.frequency.setValueAtTime(210, t);
    this._env(bg, t, level * 0.4, 0.003, 0.09);
    body.connect(bg).connect(this.master);
    body.start(t);
    body.stop(t + 0.15);
  }

  _hat(t, level) {
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    src.playbackRate.value = 1.7;
    const hp = this.ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 7000;
    const gain = this.ctx.createGain();
    this._env(gain, t, level, 0.002, 0.045);
    src.connect(hp).connect(gain).connect(this.master);
    src.start(t);
    src.stop(t + 0.1);
  }

  _bass(t, freq, dur) {
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = freq;
    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(1100, t);
    lp.frequency.exponentialRampToValueAtTime(280, t + dur);
    lp.Q.value = 6;
    const gain = this.ctx.createGain();
    this._env(gain, t, 0.3, 0.006, dur);
    osc.connect(lp).connect(gain).connect(this.master);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  _lead(t, freq, dur, level) {
    const gain = this.ctx.createGain();
    this._env(gain, t, level, 0.004, dur);
    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 3200;
    for (const detune of [-7, 7]) {
      const osc = this.ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.value = freq;
      osc.detune.value = detune;
      osc.connect(lp);
      osc.start(t);
      osc.stop(t + dur + 0.05);
    }
    lp.connect(gain);
    gain.connect(this.master);
    gain.connect(this.delay);
  }

  _pad(t, freq, dur, level) {
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(level, t + dur * 0.35);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 1500;
    for (const detune of [-11, 11]) {
      const osc = this.ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = freq;
      osc.detune.value = detune;
      osc.connect(lp);
      osc.start(t);
      osc.stop(t + dur + 0.1);
    }
    lp.connect(gain).connect(this.master);
  }

  /** Effets de jeu, hors séquence. */
  sfxPickup(index = 0) {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    const semis = 24 + SCALE[index % 7] + 12;
    osc.frequency.setValueAtTime(NOTE(semis), t);
    osc.frequency.exponentialRampToValueAtTime(NOTE(semis + 7), t + 0.09);
    this._env(gain, t, 0.22, 0.003, 0.16);
    osc.connect(gain).connect(this.master);
    osc.start(t);
    osc.stop(t + 0.25);
  }

  sfxDeath() {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(50, t + 0.5);
    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 900;
    this._env(gain, t, 0.35, 0.005, 0.5);
    osc.connect(lp).connect(gain).connect(this.master);
    osc.start(t);
    osc.stop(t + 0.6);
  }
}

export const BEAT_DURATION = 60 / BPM;
