import { piste, sectionsEDM, motifEDM } from './kit.js';

/**
 * Face B, piste 10. Hard dance en la mineur, 162 BPM, la nouvelle fin du
 * disque.
 *
 * Tout y roule : des roues en groupe qu'il faut enfiler, des marteaux qui
 * balaient, des presses. À ce tempo le thème se réduit à deux notes tenues et
 * une chute, parce qu'il faut pouvoir l'anticiper sans y penser.
 */

const BASSE = [45, 45, 41, 41, 48, 48, 43, 43];
const ACCORDS = [
  [69, 72, 76], [69, 72, 76], [65, 69, 72], [65, 69, 72],
  [64, 67, 72], [64, 67, 72], [67, 71, 74], [67, 71, 74],
];

const CELLULE = [
  [[0, 81, 4], [4, 79, 4]],
  [[0, 77, 2], [2, 79, 2], [4, 76, 4]],
];
const PONT = [
  [[0, 76, 4], [4, 77, 4]],
  [[0, 79, 2], [2, 77, 2], [4, 72, 4]],
];
const CHUTE = [
  [[0, 81, 4], [4, 84, 4]],
  [[0, 84, 2], [2, 81, 2], [4, 76, 4]],
];
const HOOK = [
  CELLULE[0], CELLULE[1], CELLULE[0], CELLULE[1],
  PONT[0], PONT[1], CHUTE[0], CHUTE[1],
];

const CONTRE = [
  [[6, 88, 1]], [[6, 84, 1]], [[6, 89, 1]], [[6, 84, 1]],
  [[6, 91, 1]], [[6, 88, 1]], [[6, 86, 1]], [[6, 81, 1]],
];

/** Peu d'attaques : à ce tempo, chacune coûte cher. */
const ACCENTS = [
  [0, 4], [0, 2, 4], [0, 4], [0, 2, 4],
  [0, 4, 6], [0, 2, 4], [0, 4], [0, 2, 4, 6],
];

export default piste({
  id: 'roulement',
  face: 'B',
  index: 10,
  title: 'Roulement',
  genre: 'Hard dance',
  tagline: 'Tout roule, et rien ne vous attend.',
  bpm: 162,
  rowsPerBeat: 2,
  echoSteps: 2,
  mix: 0.95,
  bars: 32,
  instruments: [],
  percussions: ['charleston', 'charlestonOuvert', 'crash', 'tomGrave', 'tomAigu'],
  ACCENTS,

  palette: {
    skyTop: 0x0f1d3d,
    skyBottom: 0xff7a4d,
    fog: 0x33305c,
    floors: [0xe4e9f5, 0xccd4e8, 0xb2bcd6],
    block: 0xff3f6b,
    accent: 0x2ee8c0,
    neon: 0xffffff,
    decor: 0x27356b,
    ball: 0xffffff,
  },

  sections: sectionsEDM({ variante: 'roue', respiration: 'spinner', dur: 'scie' }),

  /** Arceaux rapprochés : à cette vitesse, ils donnent la sensation d'élan. */
  decor(stage) {
    const { rows, box, neon, colX, TILE } = stage;
    const bleu = this.palette.decor;
    for (let row = 0; row < rows; row += 3) {
      const z = row * TILE;
      for (const side of [-1, 1]) {
        const x = side * (colX(6) + 2.6);
        box(x, 3, z, 0.4, 6, 0.4, bleu);
      }
      if (row % 6 === 0) {
        box(0, 6.2, z, (colX(6) + 2.6) * 2, 0.4, 0.5, bleu);
        neon(0, 5.9, z, (colX(6) + 1.5) * 2, 0.2, 0.35, this.palette.accent);
      }
    }
  },

  pattern: motifEDM({ batterie: 'hardstyle', ACCORDS, BASSE, HOOK, CONTRE, style: 'hardstyle', ecart: 24, sub: 0.7 }),
});
