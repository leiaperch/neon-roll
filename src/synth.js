import { Banque } from './instruments.js';

/**
 * Chaîne audio et séquenceur.
 *
 * Les instruments acoustiques sont des mémoires tampons calculées par
 * `instruments.js` et jouées par un lecteur : c'est ce qui leur donne un
 * timbre d'instrument plutôt que d'oscillateur. Le reste de la chaîne fait ce
 * que ferait un studio : une caisse de résonance pour les cordes frottées, un
 * ampli et un haut-parleur pour la guitare électrique, une réverbération de
 * salle commune à tout le monde.
 *
 * Seules les pistes électroniques utilisent encore des oscillateurs, parce que
 * c'est justement leur matériau.
 */

const LOOKAHEAD = 0.14;
const TICK = 25;
const MASTER_LEVEL = 0.62;

export const mtof = (midi) => 440 * Math.pow(2, (midi - 69) / 12);

export const GAMMES = {
  mineur: [0, 2, 3, 5, 7, 8, 10],
  majeur: [0, 2, 4, 5, 7, 9, 11],
  blues: [0, 3, 5, 6, 7, 10],
  mixolydien: [0, 2, 4, 5, 7, 9, 10],
  phrygien: [0, 1, 3, 5, 7, 8, 10],
};

export class Synth {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.running = false;
    this.pattern = null;
    this.stepDuration = 0.25;
    this.totalSteps = 0;
    this.startTime = 0;
    this.nextStep = 0;
    this.timer = null;
  }

  async init() {
    if (this.ctx) {
      await this._resume();
      return;
    }
    const Ctx = window.AudioContext || window.webkitAudioContext;
    this.ctx = new Ctx();
    await this._resume();

    const comp = this.ctx.createDynamicsCompressor();
    comp.threshold.value = -12;
    comp.ratio.value = 5;
    comp.attack.value = 0.004;
    comp.release.value = 0.22;

    // Trois étages : toutes les voix arrivent sur `master`, `mix` équilibre les
    // pistes entre elles (une batterie de metal ne pèse pas comme un clavecin),
    // `sortie` porte le volume général et la coupure du son.
    this.master = this.ctx.createGain();
    this.mix = this.ctx.createGain();
    this.sortie = this.ctx.createGain();
    this.sortie.gain.value = MASTER_LEVEL;
    this.master.connect(this.mix).connect(this.sortie).connect(comp).connect(this.ctx.destination);

    // Bus « ducké » : tout ce qui tient une note passe par là, et la grosse
    // caisse le fait plonger à chaque frappe. C'est la respiration qui fait
    // qu'un morceau sonne produit plutôt que superposé.
    this.duck = this.ctx.createGain();
    this.duck.gain.value = 1;
    this.duck.connect(this.master);

    this.banque = new Banque(this.ctx);
    this.reverb = this._reverb();
    this.echo = this._echo();
    this.corpsCordes = this._corps([[280, 2.4, 0.5], [460, 3.2, 0.4], [740, 2.6, 0.28], [1300, 2, 0.18]]);
    this.ampli = this._ampli();
    this.bruitBuffer = this._bruit();
  }

  async _resume() {
    if (this.ctx.state !== 'suspended') return;
    try {
      await this.ctx.resume();
    } catch {
      /* contexte non reprenable */
    }
  }

  _bruit() {
    const len = Math.floor(this.ctx.sampleRate * 0.6);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    let s = 1337;
    for (let i = 0; i < len; i++) {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      d[i] = s / 0x3fffffff - 1;
    }
    return buf;
  }

  _reverb() {
    const sr = this.ctx.sampleRate;
    const len = Math.floor(sr * 1.7);
    const buf = this.ctx.createBuffer(2, len, sr);
    let s = 991;
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) {
        s = (s * 1103515245 + 12345) & 0x7fffffff;
        d[i] = (s / 0x3fffffff - 1) * Math.pow(1 - i / len, 2.8);
      }
    }
    const conv = this.ctx.createConvolver();
    conv.buffer = buf;
    const wet = this.ctx.createGain();
    wet.gain.value = 0.5;
    const send = this.ctx.createGain();
    send.connect(conv).connect(wet).connect(this.master);
    return send;
  }

  _echo() {
    const delay = this.ctx.createDelay(2);
    delay.delayTime.value = 0.3;
    const fb = this.ctx.createGain();
    fb.gain.value = 0.3;
    const wet = this.ctx.createGain();
    wet.gain.value = 0.32;
    delay.connect(fb).connect(delay);
    delay.connect(wet).connect(this.master);
    this.echoNode = delay;
    return delay;
  }

  /** Caisse de résonance : quelques formants en parallèle du son direct. */
  _corps(formants) {
    const entree = this.ctx.createGain();
    const sortie = this.ctx.createGain();
    sortie.gain.value = 0.9;
    const direct = this.ctx.createGain();
    direct.gain.value = 0.62;
    entree.connect(direct).connect(sortie);
    for (const [f, q, g] of formants) {
      const bp = this.ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = f;
      bp.Q.value = q;
      const gain = this.ctx.createGain();
      gain.gain.value = g;
      entree.connect(bp).connect(gain).connect(sortie);
    }
    sortie.connect(this.master);
    this.send(sortie, 0.22, this.reverb);
    return entree;
  }

  /** Ampli guitare : saturation puis haut-parleur, qui coupe les aigus durs. */
  _ampli() {
    const shaper = this.ctx.createWaveShaper();
    const n = 1024;
    const courbe = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const x = (i / (n - 1)) * 2 - 1;
      courbe[i] = Math.tanh(x * 3.6);
    }
    shaper.curve = courbe;
    shaper.oversample = '4x';

    const presence = this.ctx.createBiquadFilter();
    presence.type = 'peaking';
    presence.frequency.value = 1900;
    presence.gain.value = 4;
    presence.Q.value = 1.1;

    const hp = this.ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 90;

    const cab = this.ctx.createBiquadFilter();
    cab.type = 'lowpass';
    cab.frequency.value = 3600;
    cab.Q.value = 0.9;

    const entree = this.ctx.createGain();
    entree.gain.value = 3.4;
    entree.connect(shaper).connect(presence).connect(hp).connect(cab).connect(this.master);
    this.send(cab, 0.12, this.reverb);
    return entree;
  }

  send(node, amount, bus) {
    const g = this.ctx.createGain();
    g.gain.value = amount;
    node.connect(g).connect(bus);
  }

  setEchoTime(s) {
    if (this.echoNode) this.echoNode.delayTime.value = s;
  }

  setMuted(muted) {
    this.muted = muted;
    if (this.sortie) this.sortie.gain.value = muted ? 0 : MASTER_LEVEL;
  }

  /** Prépare les timbres d'une piste avant qu'elle ne démarre. */
  load(track) {
    this.pattern = track.pattern;
    this.stepDuration = 60 / (track.bpm * track.rowsPerBeat);
    this.totalSteps = track.totalRows;
    this.setEchoTime(this.stepDuration * (track.echoSteps || 3));
    // Équilibre entre pistes : une batterie de metal ne pèse pas comme un
    // clavecin, les niveaux sont mesurés au rendu hors ligne piste par piste.
    if (this.mix) this.mix.gain.value = track.mix === undefined ? 1 : track.mix;
    if (this.banque) this.banque.preparer(track.instruments || [], track.percussions || []);
  }

  start(fromStep = 0) {
    if (!this.ctx || !this.pattern) return;
    this.stop();
    this.nextStep = fromStep;
    this.startTime = this.ctx.currentTime + 0.12 - fromStep * this.stepDuration;
    this.running = true;
    this._schedule();
    this.timer = setInterval(() => this._schedule(), TICK);
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.running = false;
  }

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

  // ---------- Instruments à hauteur ----------

  /**
   * Joue une note d'un instrument de la banque.
   * `dur` est la durée tenue ; les cordes pincées s'éteignent d'elles-mêmes,
   * l'enveloppe ne fait que les étouffer si on écrit une note courte.
   */
  note(nom, t, midi, dur, {
    level = 0.5, dest = null, vibrato = 0, vibratoRate = 5.4, retard = 0.08,
    coupe = 0, attaque = 0.004,
  } = {}) {
    if (!this.banque) return;
    const e = this.banque.echantillon(nom, midi);
    if (!e) return;
    const src = this.ctx.createBufferSource();
    src.buffer = e.buffer;
    src.playbackRate.value = e.rate;

    const g = this.ctx.createGain();
    const fin = t + dur;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(level, t + attaque);
    g.gain.setValueAtTime(level, Math.max(t + attaque, fin - 0.01));
    g.gain.exponentialRampToValueAtTime(0.0001, fin + retard);

    let sortie = src;
    if (coupe > 0) {
      const lp = this.ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = coupe;
      src.connect(lp);
      sortie = lp;
    }
    sortie.connect(g).connect(dest || this.master);

    if (vibrato > 0 && src.detune) {
      // Le vibrato est appliqué en lecture, pas gravé dans le timbre : il suit
      // donc la note, et une même mémoire tampon sert à toutes les hauteurs.
      const lfo = this.ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = vibratoRate;
      const depth = this.ctx.createGain();
      depth.gain.setValueAtTime(0.0001, t);
      depth.gain.linearRampToValueAtTime(vibrato, t + Math.min(0.35, dur * 0.6));
      lfo.connect(depth).connect(src.detune);
      lfo.start(t);
      lfo.stop(fin + retard + 0.05);
    }

    src.start(t);
    src.stop(fin + retard + 0.06);
  }

  /** Accord plaqué ou gratté, selon l'écart demandé entre les cordes. */
  accord(nom, t, midis, dur, opts = {}) {
    const gratte = opts.gratte || 0;
    midis.forEach((midi, i) => {
      this.note(nom, t + i * gratte, midi, dur - i * gratte, opts);
    });
  }

  // Cordes frottées : elles passent par la caisse de résonance.
  violon(t, midi, dur, opts = {}) {
    this.note('violon', t, midi, dur, {
      level: 0.4, vibrato: 22, attaque: 0.06, dest: this.corpsCordes, ...opts,
    });
  }

  violoncelle(t, midi, dur, opts = {}) {
    this.note('violoncelle', t, midi, dur, {
      level: 0.4, vibrato: 16, attaque: 0.08, dest: this.corpsCordes, ...opts,
    });
  }

  // Cordes pincées.
  guitare(t, midi, dur, opts = {}) {
    this.note('guitareDouce', t, midi, dur, { level: 0.42, ...opts });
  }

  contrebasse(t, midi, dur, opts = {}) {
    this.note('contrebasse', t, midi, dur, { level: 0.55, ...opts });
  }

  clavecin(t, midi, dur, opts = {}) {
    this.note('clavecin', t, midi, dur, { level: 0.4, ...opts });
  }

  harmonica(t, midi, dur, opts = {}) {
    this.note('harmonica', t, midi, dur, { level: 0.3, vibrato: 14, attaque: 0.03, ...opts });
  }

  orgue(t, midi, dur, opts = {}) {
    this.note('orgue', t, midi, dur, { level: 0.26, attaque: 0.03, ...opts });
  }

  /** Guitare électrique : la corde pincée traverse l'ampli. */
  electrique(t, midi, dur, { level = 0.3, mute = false, gratte = 0.008, notes = null } = {}) {
    const liste = notes || [midi];
    liste.forEach((n, i) => {
      this.note('guitare', t + i * gratte, n, mute ? Math.min(dur, 0.11) : dur, {
        level: level * (mute ? 1.1 : 1),
        dest: this.ampli,
        coupe: mute ? 1500 : 0,
        retard: mute ? 0.03 : 0.12,
      });
    });
  }

  /** Accord de quinte, le matériau de base du riff saturé. */
  puissance(t, midi, dur, opts = {}) {
    this.electrique(t, midi, dur, { ...opts, notes: [midi, midi + 7, midi + 12] });
  }

  // ---------- Percussions ----------

  frappe(nom, t, { level = 0.7, rate = 1, dest = null } = {}) {
    if (!this.banque) return;
    const buf = this.banque.percussion(nom);
    if (!buf) return;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    src.playbackRate.value = rate;
    const g = this.ctx.createGain();
    g.gain.value = level;
    src.connect(g).connect(dest || this.master);
    src.start(t);
  }

  grosseCaisse(t, o = {}) { this.frappe('grosseCaisse', t, { level: 0.85, ...o }); }
  caisseClaire(t, o = {}) { this.frappe('caisseClaire', t, { level: 0.5, ...o }); }
  balai(t, o = {}) { this.frappe('balai', t, { level: 0.3, ...o }); }
  charleston(t, o = {}) { this.frappe(o.ouvert ? 'charlestonOuvert' : 'charleston', t, { level: 0.22, ...o }); }
  ride(t, o = {}) { this.frappe('ride', t, { level: 0.2, ...o }); }
  crash(t, o = {}) { this.frappe('crash', t, { level: 0.32, ...o }); }
  tom(t, o = {}) { this.frappe(o.aigu ? 'tomAigu' : 'tomGrave', t, { level: 0.45, ...o }); }

  // ---------- Voix électroniques, pour les pistes qui en vivent ----------

  _env(t, peak, attack, decay, dest) {
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

  _filtre(type, freq, q = 1) {
    const f = this.ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    return f;
  }

  /** Kick de boîte à rythmes : une sinusoïde qui plonge, et le bus qui cède. */
  kickMachine(t, { level = 0.95, from = 175, to = 42, decay = 0.26, duck = 0.3 } = {}) {
    const g = this._env(t, level, 0.004, decay);
    const o = this._osc('sine', from, t, t + decay + 0.1);
    o.frequency.setValueAtTime(from, t);
    o.frequency.exponentialRampToValueAtTime(to, t + decay * 0.5);
    o.connect(g);
    this.ducker(t, duck);
  }

  /** Creuse le bus tenu, puis le laisse remonter. */
  ducker(t, profondeur = 0.3, remontee = 0.24) {
    if (!this.duck) return;
    const g = this.duck.gain;
    g.cancelScheduledValues(t);
    g.setValueAtTime(profondeur, t);
    g.linearRampToValueAtTime(1, t + remontee);
  }

  /**
   * Supersaw : sept dents de scie désaccordées autour de la note, plus une
   * sinusoïde une octave dessous. C'est le timbre de l'EDM des années 2010,
   * et il ne s'obtient pas autrement : c'est le battement entre les voix
   * désaccordées qui fait toute la largeur du son.
   */
  supersaw(t, midi, dur, {
    level = 0.14, ecart = 16, voix = 7, sub = 0.5, coupe = 5000, dest = null,
  } = {}) {
    const f = mtof(midi);
    const g = this._env(t, level, 0.012, dur, dest || this.duck);
    const lp = this._filtre('lowpass', coupe, 0.8);
    for (let i = 0; i < voix; i++) {
      const detune = ((i - (voix - 1) / 2) / ((voix - 1) / 2)) * ecart;
      const o = this._osc('sawtooth', f, t, t + dur + 0.08, detune);
      const v = this.ctx.createGain();
      v.gain.value = 1 / Math.sqrt(voix);
      o.connect(v).connect(lp);
    }
    lp.connect(g);
    if (sub > 0) {
      const sg = this._env(t, level * sub, 0.008, dur, dest || this.duck);
      this._osc('sine', f / 2, t, t + dur + 0.08).connect(sg);
    }
    this.send(g, 0.18, this.reverb);
  }

  /**
   * Pincement de synthé : filtre qui se referme vite sur une dent de scie.
   * C'est le contrechant des accords, il occupe les croches laissées libres.
   */
  pincement(t, midi, dur, { level = 0.16, ouverture = 5200, fermeture = 420 } = {}) {
    const g = this._env(t, level, 0.004, dur, this.duck);
    const lp = this._filtre('lowpass', ouverture, 6);
    lp.frequency.setValueAtTime(ouverture, t);
    lp.frequency.exponentialRampToValueAtTime(fermeture, t + Math.min(dur, 0.25));
    for (const d of [-8, 8]) this._osc('sawtooth', mtof(midi), t, t + dur + 0.06, d).connect(lp);
    lp.connect(g);
    this.send(g, 0.2, this.reverb);
  }

  /**
   * Roulement de caisse claire qui accélère : la montée obligatoire avant un
   * drop. `division` est le nombre de frappes par croche.
   */
  rouleau(t, croche, { depart = 1, arrivee = 4, level = 0.3 } = {}) {
    const division = Math.round(depart + (arrivee - depart));
    for (let i = 0; i < division; i++) {
      const quand = t + (i * croche) / division;
      this.clap(quand, { level: level * (0.5 + (i / division) * 0.5) });
    }
  }

  clap(t, { level = 0.3 } = {}) {
    for (const [offset, mul] of [[0, 0.6], [0.012, 0.8], [0.026, 1]]) {
      const g = this._env(t + offset, level * mul, 0.002, 0.12);
      const s = this.ctx.createBufferSource();
      s.buffer = this.bruitBuffer;
      s.connect(this._filtre('bandpass', 1700, 0.7)).connect(g);
      s.start(t + offset);
      s.stop(t + offset + 0.2);
    }
  }

  /** Basse à filtre résonant, signature de la techno. */
  basse(t, midi, dur, { level = 0.28, cutoff = 900, floor = 220, q = 9, type = 'sawtooth' } = {}) {
    const g = this._env(t, level, 0.006, dur, this.duck);
    const lp = this._filtre('lowpass', cutoff, q);
    lp.frequency.setValueAtTime(cutoff, t);
    lp.frequency.exponentialRampToValueAtTime(floor, t + dur);
    this._osc(type, mtof(midi), t, t + dur + 0.05).connect(lp).connect(g);
  }

  /** Voix à impulsion : le timbre des consoles 8 bits. */
  puce(t, midi, dur, { level = 0.13, duty = 0.5, vibrato = 0 } = {}) {
    const f = mtof(midi);
    const g = this._env(t, level, 0.002, dur);
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

  bruitPuce(t, { level = 0.2, decay = 0.08, aigu = 6000 } = {}) {
    const g = this._env(t, level, 0.002, decay);
    const s = this.ctx.createBufferSource();
    s.buffer = this.bruitBuffer;
    s.playbackRate.value = 1.6;
    s.connect(this._filtre('highpass', aigu)).connect(g);
    s.start(t);
    s.stop(t + decay + 0.1);
  }

  nappe(t, midi, dur, { level = 0.09, type = 'sawtooth' } = {}) {
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(level, t + dur * 0.35);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    const lp = this._filtre('lowpass', 1600);
    for (const d of [-11, 11]) this._osc(type, mtof(midi), t, t + dur + 0.1, d).connect(lp);
    lp.connect(g).connect(this.duck);
    this.send(g, 0.3, this.reverb);
  }

  stab(t, midis, dur, { level = 0.09, echo = 0.35 } = {}) {
    const g = this._env(t, level, 0.004, dur, this.duck);
    const lp = this._filtre('lowpass', 2800, 2);
    for (const midi of midis) this._osc('sawtooth', mtof(midi), t, t + dur + 0.05, 6).connect(lp);
    lp.connect(g);
    if (echo > 0) this.send(g, echo, this.echo);
  }

  montee(t, dur, { level = 0.14 } = {}) {
    const g = this._env(t, level, dur * 0.9, dur * 0.1);
    const bp = this._filtre('bandpass', 400, 3);
    bp.frequency.setValueAtTime(400, t);
    bp.frequency.exponentialRampToValueAtTime(6000, t + dur);
    const s = this.ctx.createBufferSource();
    s.buffer = this.bruitBuffer;
    s.loop = true;
    s.connect(bp).connect(g);
    s.start(t);
    s.stop(t + dur + 0.05);
  }

  // ---------- Effets de jeu ----------

  ramassage(index = 0) {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    const midi = 84 + [0, 4, 7, 11, 12][index % 5];
    if (this.banque && this.banque.pitches.has('clavecin')) this.note('clavecin', t, midi, 0.25, { level: 0.22 });
    else this.puce(t, midi, 0.16, { level: 0.14 });
  }

  fanfare() {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    const nom = this.banque && this.banque.pitches.has('clavecin') ? 'clavecin' : null;
    [0, 4, 7, 12].forEach((semi, i) => {
      if (nom) this.note(nom, t + i * 0.07, 72 + semi, 0.7, { level: 0.26 });
      else this.puce(t + i * 0.07, 72 + semi, 0.5, { level: 0.16 });
    });
  }

  mort() {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    const g = this._env(t, 0.3, 0.005, 0.55);
    const o = this._osc('sawtooth', 320, t, t + 0.7);
    o.frequency.exponentialRampToValueAtTime(48, t + 0.5);
    o.connect(this._filtre('lowpass', 900)).connect(g);
  }
}
