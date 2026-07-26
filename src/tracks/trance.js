import { piste, sectionsEDM, motifEDM } from './kit.js';

/**
 * Face B, piste 3. Trance en ré mineur, 136 BPM.
 *
 * Le crochet avance par longues notes séparées de silences, donc les portes
 * arrivent par paires bien détachées : c'est la piste où le geste est le plus
 * lisible, et celle où le pont s'entend le mieux.
 */

const BASSE = [50, 50, 46, 46, 41, 41, 48, 48];
const ACCORDS = [
  [62, 65, 69], [62, 65, 69], [58, 62, 65], [58, 62, 65],
  [60, 65, 69], [60, 65, 69], [64, 67, 72], [64, 67, 72],
];

/**
 * Crochet en arche, dessiné presque entièrement par degrés conjoints : le
 * seul grand saut est celui qui atteint le sommet à la sixième mesure, et il
 * est aussitôt comblé par la descente qui suit, comme le veut la convention.
 */
/** Même principe : une cellule qui revient, et une seule chute différente. */
const CELLULE = [
  [[0, 86, 3], [3, 84, 1], [4, 86, 4]],
  [[0, 84, 2], [2, 81, 2], [4, 79, 4]],
];
const PONT = [
  [[0, 81, 3], [3, 82, 1], [4, 84, 4]],
  [[0, 82, 2], [2, 81, 2], [4, 77, 4]],
];
const CHUTE = [
  [[0, 86, 3], [3, 84, 1], [4, 89, 4]], // le sommet, atteint une seule fois
  [[0, 86, 4], [4, 81, 4]],
];
const HOOK = [
  CELLULE[0], CELLULE[1], CELLULE[0], CELLULE[1],
  PONT[0], PONT[1], CHUTE[0], CHUTE[1],
];

const CONTRE = [
  [[2, 74, 1], [6, 77, 1]], [[2, 77, 1], [6, 74, 1]],
  [[2, 70, 1], [6, 74, 1]], [[2, 74, 1], [6, 70, 1]],
  [[2, 72, 1], [6, 77, 1]], [[2, 77, 1], [6, 72, 1]],
  [[2, 76, 1], [6, 79, 1]], [[2, 72, 1], [6, 67, 1]],
];

const ACCENTS = [
  [0, 3, 4], [0, 2, 4], [0, 3, 4], [0, 2, 4],
  [0, 3, 4, 6], [0, 2, 4], [0, 3, 4], [0, 2, 4, 6],
];

export default piste({
  id: 'trance',
  face: 'B',
  index: 5,
  title: 'Ascension',
  genre: 'Trance',
  tagline: 'Deux notes tenues, et tout le reste qui monte dessous.',
  bpm: 136,
  rowsPerBeat: 2,
  echoSteps: 3,
  mix: 1.05,
  bars: 32,
  instruments: ['violon', 'violoncelle'],
  percussions: ['charleston', 'charlestonOuvert', 'crash'],
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

  sections: sectionsEDM({ variante: 'piston', respiration: 'calme', dur: 'faisceau' }),

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
      neon(0, 8.5, row * TILE, (colX(6) + 4) * 2, 0.3, 0.3, this.palette.neon);
    }
  },

  pattern: motifEDM({ batterie: 'trance', ACCORDS, BASSE, HOOK, CONTRE, ecart: 20, sub: 0.6 }),
});
