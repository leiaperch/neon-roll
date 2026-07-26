import { piste, surPas, plan } from './kit.js';

/**
 * Face B, piste 3. Trance en ré mineur.
 *
 * Un arpège continu par-dessous, un thème très tenu par-dessus, et des cordes
 * qui doublent le thème dans la dernière partie. Le lead avance par longues
 * notes séparées de silences, donc les portes arrivent par paires bien
 * détachées : c'est la piste où le geste est le plus lisible.
 */

const BASSE = [50, 50, 46, 46, 43, 43, 45, 45];
const ARPEGE = [
  [62, 65, 69, 74], [62, 65, 69, 74], [58, 62, 65, 70], [58, 62, 65, 70],
  [55, 58, 62, 67], [55, 58, 62, 67], [57, 60, 64, 69], [57, 60, 64, 69],
];

/** Thème : deux notes tenues et une chute, repris quatre fois sur huit. */
const CROCHET = [
  [[0, 81, 3], [4, 84, 4]],
  [[0, 86, 2], [3, 84, 1], [4, 81, 4]],
];
const CROCHET_HAUT = [
  [[0, 86, 3], [4, 89, 4]],
  [[0, 88, 2], [3, 86, 1], [4, 81, 4]],
];
const HOOK = [
  CROCHET[0], CROCHET[1], CROCHET[0], CROCHET[1],
  CROCHET_HAUT[0], CROCHET_HAUT[1], CROCHET[0], CROCHET[1],
];

const ACCENTS = [
  [0, 4], [0, 3, 4], [0, 4], [0, 3, 4],
  [0, 4, 6], [0, 3, 4], [0, 4], [0, 3, 4, 6],
];

export default piste({
  id: 'trance',
  face: 'B',
  index: 3,
  title: 'Ascension',
  genre: 'Trance',
  tagline: 'Deux notes tenues, et tout le reste qui monte dessous.',
  bpm: 138,
  rowsPerBeat: 2,
  echoSteps: 3,
  mix: 1.25,
  bars: 32,
  instruments: ['violon', 'violoncelle', 'clavecin'],
  percussions: ['charleston', 'charlestonOuvert', 'crash', 'caisseClaire'],
  ACCENTS,

  palette: {
    skyTop: 0x3a1b6e,
    skyBottom: 0xffb3e6,
    fog: 0x6b3a9c,
    floors: [0xe8dcff, 0xd2c0ff, 0xbba6f7],
    block: 0x2ad4c8,
    accent: 0xff6ec7,
    neon: 0xfff0ff,
    decor: 0x8b5ad6,
    ball: 0xffffff,
  },

  sections: plan([
    [4, { mode: 'calme', largeur: 5 }],
    [1, { mode: 'halte' }],
    [3, { mode: 'bloc', largeur: 5, porte: 1 }],
    [4, { mode: 'piston', largeur: 5, porte: 1 }],
    [1, { mode: 'halte' }],
    [3, { mode: 'faisceau', largeur: 5 }],
    [1, { mode: 'saut', couronne: true }],
    [3, { mode: 'bloc', largeur: 7, porte: 1 }],
    [1, { mode: 'halte' }],
    [3, { mode: 'trou', largeur: 5, porte: 1, couronne: true }],
    [4, { mode: 'bloc', largeur: 5, porte: 0 }],
    [1, { mode: 'halte' }],
    [2, { mode: 'piston', largeur: 7, porte: 0 }],
    [1, { mode: 'calme', largeur: 5, couronne: true }],
  ]),

  decor(stage) {
    const { rows, box, neon, colX, TILE } = stage;
    const violet = this.palette.decor;
    for (let row = 3; row < rows; row += 6) {
      const z = row * TILE;
      const hauteur = 4 + ((row / 6) % 4) * 2.5;
      for (const side of [-1, 1]) {
        const x = side * (colX(6) + 3.6 + ((row / 6) % 3));
        box(x, hauteur / 2, z, 2.4, hauteur, 2.4, violet);
        neon(x, hauteur + 0.2, z, 2.6, 0.22, 2.6, this.palette.accent);
      }
    }
    for (let row = 0; row < rows; row += 16) {
      const z = row * TILE;
      neon(0, 8.5, z, (colX(6) + 4) * 2, 0.3, 0.3, this.palette.neon);
    }
  },

  pattern(step, t, s) {
    const bar = Math.floor(step / 8);
    const inBar = step % 8;
    const mesure = bar % 8;
    const croche = s.stepDuration;
    const basse = BASSE[mesure];
    const arpege = ARPEGE[mesure];
    const intro = bar < 4;
    const pont = bar >= 18 && bar < 21;
    const plein = bar >= 12;

    if (!pont) {
      if (inBar % 2 === 0) s.kickMachine(t, { level: 0.85, from: 190, to: 44 });
      if (inBar % 2 === 1) s.charleston(t, { level: 0.18, ouvert: inBar % 4 === 3 });
      if (!intro && inBar === 4) s.clap(t, { level: 0.24 });
    }
    if ((bar === 12 || bar === 21) && inBar === 0) s.crash(t, { level: 0.28 });

    // Arpège continu, quatre notes par ligne : le moteur du morceau.
    if (!pont) {
      for (let i = 0; i < 2; i++) {
        const note = arpege[(inBar * 2 + i) % 4] + (plein ? 12 : 0);
        s.puce(t + (i * croche) / 2, note, croche / 2, { level: intro ? 0.06 : 0.08, duty: 0.35 });
      }
    }
    if (!intro && !pont && inBar % 2 === 0) {
      s.basse(t, basse - 12, croche * 1.7, { level: 0.26, cutoff: 900, floor: 220, q: 5 });
    }

    // Thème : nappe large, doublée par les cordes après le pont.
    if (!intro) {
      surPas(HOOK[mesure], inBar, (note, duree) => {
        s.stab(t, [note, note + 7], duree * croche * 0.9, { level: pont ? 0.14 : 0.1, echo: 0.5 });
        if (bar >= 21) s.violon(t, note, duree * croche, { level: 0.3 });
      });
    }
    if (inBar === 0) {
      s.nappe(t, basse, croche * 8, { level: pont ? 0.14 : 0.07 });
      if (pont) s.violoncelle(t, basse, croche * 8, { level: 0.34 });
    }
    if (bar === 20 && inBar === 0) s.montee(t, croche * 8, { level: 0.14 });
  },
});
