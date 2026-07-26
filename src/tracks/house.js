import { piste, sectionsEDM, motifEDM } from './kit.js';

/**
 * Face A, piste 1. House filtrée en la mineur, 118 BPM.
 *
 * La plus lente du disque, donc la plus large : c'est la piste où on apprend
 * le geste. Le crochet tient en deux mesures et revient tout le temps.
 */

const BASSE = [45, 45, 41, 41, 48, 48, 43, 43];
const ACCORDS = [
  [69, 72, 76], [69, 72, 76], [65, 69, 72], [65, 69, 72],
  [64, 67, 72], [64, 67, 72], [67, 71, 74], [67, 71, 74],
];

const HOOK = [
  [[0, 81, 2], [2, 84, 1], [3, 86, 1], [6, 84, 2]],
  [[0, 86, 2], [2, 84, 1], [3, 81, 1], [4, 79, 4]],
  [[0, 81, 2], [2, 84, 1], [3, 86, 1], [6, 84, 2]],
  [[0, 86, 2], [2, 84, 1], [3, 81, 1], [4, 79, 4]],
  [[0, 81, 2], [2, 84, 1], [3, 88, 1], [6, 89, 2]],
  [[0, 88, 4], [4, 84, 2], [6, 81, 2]],
  [[0, 81, 2], [2, 84, 1], [3, 86, 1], [6, 84, 2]],
  [[0, 79, 2], [2, 81, 2], [4, 84, 4]],
];

const CONTRE = [
  [[1, 72, 1], [5, 76, 1]], [[1, 72, 1], [5, 74, 1]],
  [[1, 69, 1], [5, 72, 1]], [[1, 69, 1], [5, 72, 1]],
  [[1, 72, 1], [5, 76, 1]], [[1, 72, 1], [5, 79, 1]],
  [[1, 74, 1], [5, 71, 1]], [[1, 72, 1], [5, 76, 1]],
];

/** Les croches 2 et 3 portent le « boum boum » : deux portes de suite. */
const ACCENTS = [
  [0, 2, 3, 6], [0, 2, 4], [0, 2, 3, 6], [0, 2, 4],
  [0, 2, 3, 6], [0, 4, 6], [0, 2, 3, 6], [0, 2, 4],
];

export default piste({
  id: 'house',
  face: 'A',
  index: 1,
  title: 'Boule à Facettes',
  genre: 'French house',
  tagline: 'Quatre accords, un filtre, et rien à prouver.',
  bpm: 118,
  rowsPerBeat: 2,
  echoSteps: 3,
  mix: 1.05,
  bars: 32,
  instruments: [],
  percussions: ['charleston', 'charlestonOuvert', 'crash'],
  ACCENTS,

  palette: {
    skyTop: 0x2b1b5e,
    skyBottom: 0xff9a6b,
    fog: 0x5b3a72,
    floors: [0xffd9a8, 0xffc48c, 0xf5b07a],
    block: 0xd6376b,
    accent: 0xffe066,
    neon: 0xfff3c4,
    decor: 0x7a3d84,
    ball: 0xfffaf0,
  },

  sections: sectionsEDM({ variante: 'trou', respiration: 'tapis', dur: 'bloc' }),

  /** Mâts et boules à facettes, espacés : le ciel est le vrai décor. */
  decor(stage) {
    const { rows, box, neon, colX, TILE } = stage;
    const mat = this.palette.decor;
    for (let row = 6; row < rows; row += 16) {
      const z = row * TILE;
      for (const side of [-1, 1]) {
        const x = side * (colX(6) + 4);
        box(x, 3.5, z, 0.34, 7, 0.34, mat);
        neon(x, 7.6, z, 1.5, 1.5, 1.5, this.palette.neon);
        neon(x, 7.6, z, 1.9, 0.2, 1.9, this.palette.accent);
      }
    }
    for (let row = 0; row < rows; row += 3) {
      const z = row * TILE;
      for (const side of [-1, 1]) {
        box(side * (colX(6) + 2.2), -0.5, z, 2.4, 1, TILE * 1.6, mat);
      }
    }
  },

  pattern: motifEDM({ ACCORDS, BASSE, HOOK, CONTRE, ecart: 14 }),
});
