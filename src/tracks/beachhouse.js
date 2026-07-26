import { piste, sectionsEDM, motifEDM } from './kit.js';

/**
 * Face A, piste 1. House de plage en do majeur, 108 BPM.
 *
 * La plus lente et la plus douce du disque : grosse caisse ronde, thème joué
 * à la lame de bois, accords majeurs. C'est la piste d'entrée, celle où on
 * apprend le geste sans être puni.
 */

const BASSE = [41, 41, 45, 45, 43, 43, 48, 48];
const ACCORDS = [
  [65, 69, 72], [65, 69, 72], [69, 72, 76], [69, 72, 76],
  [67, 71, 74], [67, 71, 74], [64, 67, 72], [64, 67, 72],
];

const HOOK = [
  [[0, 84, 1], [1, 86, 1], [3, 88, 2], [6, 86, 1], [7, 84, 1]],
  [[0, 81, 2], [3, 84, 1], [4, 86, 3]],
  [[0, 84, 1], [1, 86, 1], [3, 89, 2], [6, 88, 1], [7, 86, 1]],
  [[0, 84, 4], [5, 81, 3]],
  [[0, 86, 1], [1, 88, 1], [3, 91, 2], [6, 88, 1], [7, 86, 1]],
  [[0, 84, 2], [3, 86, 1], [4, 88, 3]],
  [[0, 88, 1], [1, 86, 1], [3, 84, 2], [6, 81, 2]],
  [[0, 79, 3], [4, 81, 4]],
];

const CONTRE = [
  [[2, 72, 1], [5, 76, 1]], [[2, 72, 1], [5, 77, 1]],
  [[2, 76, 1], [5, 79, 1]], [[2, 76, 1], [5, 72, 1]],
  [[2, 74, 1], [5, 79, 1]], [[2, 74, 1], [5, 71, 1]],
  [[2, 72, 1], [5, 76, 1]], [[2, 72, 1], [5, 79, 1]],
];

const ACCENTS = [
  [0, 3, 6], [0, 3, 4], [0, 3, 6], [0, 5],
  [0, 3, 6], [0, 3, 4], [0, 3, 6], [0, 4],
];

export default piste({
  id: 'beachhouse',
  face: 'A',
  index: 1,
  title: 'Marée Basse',
  genre: 'Beach house',
  tagline: 'Une lame de bois, quatre accords majeurs, aucune urgence.',
  bpm: 108,
  rowsPerBeat: 2,
  echoSteps: 3,
  mix: 1.15,
  bars: 32,
  instruments: ['marimba'],
  percussions: ['charleston', 'charlestonOuvert', 'crash'],
  ACCENTS,

  palette: {
    skyTop: 0x1e5f8a,
    skyBottom: 0xffd9a0,
    fog: 0x4c93a8,
    floors: [0xfff0cf, 0xffe1ad, 0xf7d199],
    block: 0xff7a59,
    accent: 0x00b8a9,
    neon: 0xfffbe8,
    decor: 0x2e8b93,
    ball: 0xffffff,
  },

  sections: sectionsEDM({ variante: 'trou', respiration: 'tapis', dur: 'bloc' }),

  /** Parasols et pontons de bois, très espacés pour laisser voir la mer. */
  decor(stage) {
    const { rows, box, neon, colX, TILE } = stage;
    const bois = this.palette.decor;
    for (let row = 5; row < rows; row += 12) {
      const z = row * TILE;
      for (const side of [-1, 1]) {
        const x = side * (colX(6) + 4.5);
        box(x, 2.2, z, 0.3, 4.4, 0.3, bois);
        neon(x, 4.5, z, 4.4, 0.35, 4.4, this.palette.block);
        neon(x, 4.85, z, 2.2, 0.3, 2.2, this.palette.neon);
      }
    }
    // Ponton qui longe la piste, planche par planche.
    for (let row = 0; row < rows; row += 2) {
      const z = row * TILE;
      for (const side of [-1, 1]) {
        box(side * (colX(6) + 2.3), -0.55, z, 2.6, 0.5, TILE * 0.8, bois);
      }
    }
  },

  pattern: motifEDM({ ACCORDS, BASSE, HOOK, CONTRE, style: 'tropical', ecart: 10 }),
});
