/**
 * Fabrique d'instruments. Rien n'est chargé depuis un fichier : chaque timbre
 * est calculé échantillon par échantillon au démarrage, puis joué par un
 * lecteur de mémoire tampon.
 *
 * C'est la différence avec un oscillateur filtré. Une dent de scie passée dans
 * un passe-bas sonne toujours « synthé », quelle que soit la note écrite. Une
 * corde pincée simulée par une ligne à retard qui s'amortit sonne comme une
 * corde, parce que c'est le même phénomène physique : une onde qui fait des
 * allers-retours en perdant ses aigus plus vite que ses graves.
 */

/** Générateur pseudo-aléatoire déterministe : le timbre ne change jamais. */
function bruit(graine) {
  let s = graine >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return (s / 4294967296) * 2 - 1;
  };
}

/** Enlève la composante continue et normalise à un niveau donné. */
function normaliser(out, cible = 0.85) {
  let moyenne = 0;
  for (let i = 0; i < out.length; i++) moyenne += out[i];
  moyenne /= out.length;
  let crete = 0;
  for (let i = 0; i < out.length; i++) {
    out[i] -= moyenne;
    const v = Math.abs(out[i]);
    if (v > crete) crete = v;
  }
  if (crete > 0) {
    const g = cible / crete;
    for (let i = 0; i < out.length; i++) out[i] *= g;
  }
  return out;
}

/** Fondu de fin, pour qu'aucune mémoire tampon ne se termine par un clic. */
function fondu(out, sr, duree = 0.03) {
  const n = Math.min(out.length, Math.floor(sr * duree));
  for (let i = 0; i < n; i++) out[out.length - 1 - i] *= i / n;
  return out;
}

/**
 * Corde pincée, algorithme de Karplus-Strong.
 *
 * Une ligne à retard de longueur sr/f contient l'onde qui parcourt la corde.
 * À chaque tour on la filtre légèrement : les harmoniques aigus disparaissent
 * avant le fondamental, exactement comme sur une vraie corde. L'excitation de
 * départ décide du caractère : bruit sourd pour un doigt, claquement brillant
 * pour un plectre ou un bec de clavecin.
 */
export function cordePincee(sr, freq, {
  duree = 2.4, tenue = 0.996, amorti = 0.42, brillance = 0.5,
  plectre = 0.26, graine = 7,
} = {}) {
  const N = Math.max(2, Math.round(sr / freq));
  const out = new Float32Array(Math.floor(sr * duree));
  const ligne = new Float32Array(N);
  const rnd = bruit(graine);

  // Excitation : bruit d'autant plus sourd que la brillance est faible.
  let e = 0;
  for (let i = 0; i < N; i++) {
    e = e * (1 - brillance) + rnd() * brillance;
    ligne[i] = e;
  }
  // Position du plectre : un peigne qui éteint les harmoniques dont le nœud
  // tombe sous le point d'attaque. C'est ce qui distingue un jeu près du
  // chevalet d'un jeu près du manche.
  const d = Math.max(1, Math.round(N * plectre));
  for (let i = N - 1; i >= d; i--) ligne[i] -= ligne[i - d] * 0.8;

  let idx = 0;
  let precedent = 0;
  for (let i = 0; i < out.length; i++) {
    const courant = ligne[idx];
    out[i] = courant;
    precedent = courant * (1 - amorti) + precedent * amorti; // passe-bas de boucle
    ligne[idx] = precedent * tenue;
    idx = (idx + 1) % N;
  }
  return fondu(normaliser(out), sr);
}

/**
 * Corde frottée, synthèse additive.
 *
 * Le mouvement de Helmholtz d'un archet produit une onde proche d'une dent de
 * scie, donc des harmoniques en 1/n. Le réalisme ne vient pas de là mais de ce
 * qu'on ajoute autour : une attaque progressive, un bruit d'archet, et surtout
 * une dérive lente et indépendante de chaque harmonique, qui empêche le son
 * d'être figé comme un oscillateur.
 */
export function cordeFrottee(sr, freq, {
  duree = 2.6, harmoniques = 26, attaque = 0.085, souffle = 0.05, graine = 11,
} = {}) {
  const out = new Float32Array(Math.floor(sr * duree));
  const rnd = bruit(graine);
  const nombre = Math.min(harmoniques, Math.floor(sr / 2.2 / freq));
  const amp = new Float32Array(nombre + 1);
  const phase = new Float32Array(nombre + 1);
  const derive = new Float32Array(nombre + 1);
  const vitesse = new Float32Array(nombre + 1);
  for (let h = 1; h <= nombre; h++) {
    amp[h] = 1 / Math.pow(h, 1.08);
    phase[h] = rnd() * Math.PI;
    derive[h] = 0.1 + Math.abs(rnd()) * 0.16;
    vitesse[h] = 3.5 + Math.abs(rnd()) * 5.5; // Hz, dérive propre à l'harmonique
  }
  const w = (2 * Math.PI * freq) / sr;
  let souffleEtat = 0;

  for (let i = 0; i < out.length; i++) {
    const t = i / sr;
    const enveloppe = t < attaque
      ? Math.pow(t / attaque, 1.6)
      : 1 - Math.min(1, Math.max(0, (t - duree + 0.35) / 0.35)) * 0.35;
    let v = 0;
    for (let h = 1; h <= nombre; h++) {
      const vie = 1 + derive[h] * Math.sin(2 * Math.PI * vitesse[h] * t + phase[h]);
      v += amp[h] * vie * Math.sin(h * w * i + phase[h]);
    }
    // Bruit d'archet : passe-bande grossier, présent surtout à l'attaque.
    souffleEtat = souffleEtat * 0.86 + rnd() * 0.14;
    v += souffleEtat * souffle * (t < attaque * 2 ? 2.2 : 0.7);
    out[i] = v * enveloppe;
  }
  return fondu(normaliser(out, 0.8), sr);
}

/**
 * Anche libre : harmonica, accordéon. Harmoniques impairs dominants et légère
 * instabilité de hauteur, qui donne le côté soufflé.
 */
export function anche(sr, freq, { duree = 2, graine = 23, souffle = 0.06 } = {}) {
  const out = new Float32Array(Math.floor(sr * duree));
  const rnd = bruit(graine);
  const nombre = Math.min(18, Math.floor(sr / 2.2 / freq));
  let phase = 0;
  let air = 0;
  for (let i = 0; i < out.length; i++) {
    const t = i / sr;
    const env = t < 0.045 ? t / 0.045 : 1;
    // Instabilité lente de la lame, plus une modulation rapide très faible.
    const detune = 1 + 0.0016 * Math.sin(2 * Math.PI * 4.7 * t) + 0.0006 * Math.sin(2 * Math.PI * 11 * t);
    phase += (2 * Math.PI * freq * detune) / sr;
    let v = 0;
    for (let h = 1; h <= nombre; h += 1) {
      const impair = h % 2 === 1;
      v += ((impair ? 1 : 0.34) / Math.pow(h, 1.15)) * Math.sin(h * phase);
    }
    air = air * 0.9 + rnd() * 0.1;
    out[i] = (v + air * souffle) * env;
  }
  return fondu(normaliser(out, 0.8), sr);
}

/**
 * Tuyau d'orgue : harmoniques entiers stables, plus un chuintement d'attaque.
 * Le timbre dépend du jeu choisi, ici un principal avec sa quinte.
 */
export function tuyau(sr, freq, { duree = 2.2, graine = 31 } = {}) {
  const out = new Float32Array(Math.floor(sr * duree));
  const rnd = bruit(graine);
  const partiels = [[1, 1], [2, 0.42], [3, 0.26], [4, 0.16], [6, 0.09], [8, 0.05]];
  let air = 0;
  for (let i = 0; i < out.length; i++) {
    const t = i / sr;
    const env = t < 0.06 ? Math.pow(t / 0.06, 0.7) : 1;
    let v = 0;
    for (const [h, a] of partiels) {
      if (h * freq > sr / 2.2) continue;
      v += a * Math.sin((2 * Math.PI * h * freq * i) / sr);
    }
    air = air * 0.82 + rnd() * 0.18;
    out[i] = (v + air * (t < 0.09 ? 0.35 : 0.05)) * env;
  }
  return fondu(normaliser(out, 0.8), sr);
}

// ---------- Percussions ----------

/** Grosse caisse acoustique : membrane qui descend, plus l'attaque de la mailloche. */
export function grosseCaisse(sr, { duree = 0.55, graine = 41 } = {}) {
  const out = new Float32Array(Math.floor(sr * duree));
  const rnd = bruit(graine);
  let clic = 0;
  for (let i = 0; i < out.length; i++) {
    const t = i / sr;
    const f = 52 + 105 * Math.exp(-t * 42);
    const env = Math.exp(-t * 7.5);
    clic = clic * 0.72 + rnd() * 0.28;
    const attaque = clic * Math.exp(-t * 220) * 0.5;
    out[i] = (Math.sin(2 * Math.PI * f * t) * env + attaque) * 0.95;
  }
  return fondu(normaliser(out, 0.95), sr, 0.01);
}

/**
 * Caisse claire : deux modes de peau accordés, plus le timbre qui grésille en
 * dessous. C'est ce grésillement qui manque à un simple bruit filtré.
 */
export function caisseClaire(sr, { duree = 0.45, graine = 53, timbre = 1 } = {}) {
  const out = new Float32Array(Math.floor(sr * duree));
  const rnd = bruit(graine);
  let bp = 0;
  let bp2 = 0;
  for (let i = 0; i < out.length; i++) {
    const t = i / sr;
    const peau = (Math.sin(2 * Math.PI * 188 * t) * 0.6 + Math.sin(2 * Math.PI * 331 * t) * 0.4)
      * Math.exp(-t * 26);
    const n = rnd();
    bp = bp * 0.55 + n * 0.45; // bruit clair
    bp2 = bp2 * 0.93 + n * 0.07; // bruit sourd
    const grelot = (bp - bp2) * Math.exp(-t * 15) * timbre;
    out[i] = peau * 0.7 + grelot * 0.75;
  }
  return fondu(normaliser(out, 0.9), sr, 0.01);
}

/** Balai : le même instrument, frotté au lieu d'être frappé. */
export function balai(sr, { duree = 0.5, graine = 59 } = {}) {
  const out = new Float32Array(Math.floor(sr * duree));
  const rnd = bruit(graine);
  let bp = 0;
  for (let i = 0; i < out.length; i++) {
    const t = i / sr;
    const n = rnd();
    bp = bp * 0.66 + n * 0.34;
    const env = Math.min(1, t / 0.02) * Math.exp(-t * 11);
    out[i] = bp * env * (0.7 + 0.3 * Math.sin(2 * Math.PI * 40 * t));
  }
  return fondu(normaliser(out, 0.7), sr, 0.02);
}

/**
 * Cymbale : partiels inharmoniques nombreux. Le rapport entre les modes n'est
 * pas entier, ce qui donne le côté métallique qu'un bruit filtré n'a jamais.
 */
export function cymbale(sr, { duree = 1.8, graine = 67, base = 320, modes = 9, eclat = 1 } = {}) {
  const out = new Float32Array(Math.floor(sr * duree));
  const rnd = bruit(graine);
  const ratios = [1, 1.41, 1.93, 2.37, 3.11, 3.79, 4.61, 5.43, 6.77];
  let hp = 0;
  let prev = 0;
  for (let i = 0; i < out.length; i++) {
    const t = i / sr;
    let v = 0;
    for (let m = 0; m < modes; m++) {
      const f = base * ratios[m % ratios.length] * (1 + m * 0.013);
      v += Math.sin(2 * Math.PI * f * t + m) / (m + 2);
    }
    const n = rnd();
    hp = n - prev + hp * 0.72; // passe-haut grossier
    prev = n;
    const env = Math.exp(-t * (2.4 / eclat));
    out[i] = (v * 0.55 + hp * 0.45) * env;
  }
  return fondu(normaliser(out, 0.75), sr, 0.05);
}

/** Tom : membrane accordée, glissando descendant court. */
export function tom(sr, { duree = 0.6, graine = 71, hauteur = 150 } = {}) {
  const out = new Float32Array(Math.floor(sr * duree));
  const rnd = bruit(graine);
  let n = 0;
  for (let i = 0; i < out.length; i++) {
    const t = i / sr;
    const f = hauteur * (1 + 0.35 * Math.exp(-t * 25));
    n = n * 0.8 + rnd() * 0.2;
    out[i] = (Math.sin(2 * Math.PI * f * t) + n * Math.exp(-t * 90) * 0.4) * Math.exp(-t * 9);
  }
  return fondu(normaliser(out, 0.9), sr, 0.01);
}

/**
 * Catalogue. Chaque entrée sait fabriquer son timbre et pour quelles hauteurs
 * de référence : on génère une mémoire tampon par octave, la lecture ajuste
 * ensuite finement la vitesse. Une seule mémoire étirée sur quatre octaves
 * déformerait la durée d'extinction jusqu'à l'invraisemblable.
 */
export const CATALOGUE = {
  guitare: {
    refs: [40, 52, 64, 76],
    faire: (sr, f) => cordePincee(sr, f, { duree: 2.6, tenue: 0.9965, amorti: 0.38, brillance: 0.62, plectre: 0.22 }),
  },
  guitareDouce: {
    refs: [40, 52, 64],
    faire: (sr, f) => cordePincee(sr, f, { duree: 2.8, tenue: 0.997, amorti: 0.55, brillance: 0.35, plectre: 0.34 }),
  },
  contrebasse: {
    refs: [28, 40, 52],
    faire: (sr, f) => cordePincee(sr, f, { duree: 2.2, tenue: 0.9955, amorti: 0.74, brillance: 0.22, plectre: 0.4, graine: 13 }),
  },
  clavecin: {
    refs: [45, 57, 69, 81],
    faire: (sr, f) => cordePincee(sr, f, { duree: 1.8, tenue: 0.9925, amorti: 0.2, brillance: 0.85, plectre: 0.14, graine: 17 }),
  },
  violon: {
    refs: [55, 67, 79],
    faire: (sr, f) => cordeFrottee(sr, f, { duree: 2.6, harmoniques: 28, attaque: 0.075 }),
  },
  violoncelle: {
    refs: [36, 48, 60],
    faire: (sr, f) => cordeFrottee(sr, f, { duree: 2.8, harmoniques: 30, attaque: 0.11, souffle: 0.04 }),
  },
  harmonica: {
    refs: [60, 72, 84],
    faire: (sr, f) => anche(sr, f, { duree: 1.8 }),
  },
  orgue: {
    refs: [36, 48, 60, 72],
    faire: (sr, f) => tuyau(sr, f, { duree: 2.2 }),
  },
};

export const PERCUSSIONS = {
  grosseCaisse: (sr) => grosseCaisse(sr),
  caisseClaire: (sr) => caisseClaire(sr),
  balai: (sr) => balai(sr),
  charleston: (sr) => cymbale(sr, { duree: 0.32, base: 640, modes: 7, eclat: 0.35, graine: 83 }),
  charlestonOuvert: (sr) => cymbale(sr, { duree: 0.9, base: 620, modes: 8, eclat: 0.9, graine: 89 }),
  ride: (sr) => cymbale(sr, { duree: 2.2, base: 430, modes: 9, eclat: 1.6, graine: 97 }),
  crash: (sr) => cymbale(sr, { duree: 2.8, base: 380, modes: 9, eclat: 2.2, graine: 101 }),
  tomGrave: (sr) => tom(sr, { hauteur: 110 }),
  tomAigu: (sr) => tom(sr, { hauteur: 178, graine: 73 }),
};

/**
 * Banque : fabrique et conserve les mémoires tampons demandées.
 * `preparer` est appelé au chargement d'une piste, pour que rien ne soit
 * calculé pendant qu'on joue.
 */
export class Banque {
  constructor(ctx) {
    this.ctx = ctx;
    this.pitches = new Map(); // nom -> [{midi, buffer}]
    this.percussions = new Map();
  }

  preparer(instruments = [], percussions = []) {
    const sr = this.ctx.sampleRate;
    for (const nom of instruments) {
      if (this.pitches.has(nom)) continue;
      const def = CATALOGUE[nom];
      if (!def) continue;
      this.pitches.set(nom, def.refs.map((midi) => ({
        midi,
        buffer: this._versBuffer(def.faire(sr, 440 * Math.pow(2, (midi - 69) / 12))),
      })));
    }
    for (const nom of percussions) {
      if (this.percussions.has(nom) || !PERCUSSIONS[nom]) continue;
      this.percussions.set(nom, this._versBuffer(PERCUSSIONS[nom](sr)));
    }
  }

  _versBuffer(data) {
    const buffer = this.ctx.createBuffer(1, data.length, this.ctx.sampleRate);
    buffer.copyToChannel(data, 0);
    return buffer;
  }

  /** Mémoire de référence la plus proche, et le rapport de lecture à appliquer. */
  echantillon(nom, midi) {
    const liste = this.pitches.get(nom);
    if (!liste) return null;
    let choix = liste[0];
    for (const e of liste) {
      if (Math.abs(e.midi - midi) < Math.abs(choix.midi - midi)) choix = e;
    }
    return { buffer: choix.buffer, rate: Math.pow(2, (midi - choix.midi) / 12) };
  }

  percussion(nom) {
    return this.percussions.get(nom) || null;
  }
}
