import { piste, sectionsEDM, motifEDM } from './kit.js';

/**
 * Face B, piste 6. Future bass en do mineur, 145 BPM.
 *
 * Des accords larges qui enflent, un thème doublé une octave au-dessus par un
 * pincement filtré, et des attaques groupées par deux. La carte hérite de ce
 * groupement : les portes arrivent en paires serrées.
 */

const BASSE = [48, 48, 44, 44, 51, 51, 46, 46];
const ACCORDS = [
  [63, 67, 70], [63, 67, 70], [68, 72, 75], [68, 72, 75],
  [63, 67, 70], [63, 67, 70], [65, 70, 74], [65, 70, 74],
];

/** Cellule répétée, pont, chute plus haute : la forme qui se retient. */
const CELLULE = [
  [[0, 79, 2], [2, 79, 1], [3, 77, 1], [4, 79, 4]],
  [[0, 77, 2], [2, 75, 2], [4, 72, 4]],
];
const PONT = [
  [[0, 75, 2], [2, 77, 2], [4, 79, 4]],
  [[0, 79, 2], [2, 77, 2], [4, 75, 4]],
];
const CHUTE = [
  [[0, 79, 2], [2, 79, 1], [3, 77, 1], [4, 84, 4]],
  [[0, 82, 4], [4, 79, 4]],
];
const HOOK = [
  CELLULE[0], CELLULE[1], CELLULE[0], CELLULE[1],
  PONT[0], PONT[1], CHUTE[0], CHUTE[1],
];

const CONTRE = [
  [[6, 91, 1]], [[6, 87, 1]], [[6, 96, 1]], [[6, 91, 1]],
  [[6, 94, 1]], [[6, 87, 1]], [[6, 98, 1]], [[6, 91, 1]],
];

const ACCENTS = [
  [0, 2, 3], [0, 2, 4], [0, 2, 3], [0, 2, 4],
  [0, 2, 3, 6], [0, 2, 4], [0, 2, 3, 6], [0, 4],
];

export default piste({
  id: 'futurebass',
  face: 'B',
  index: 6,
  title: 'Guimauve',
  genre: 'Future bass',
  tagline: 'Des accords qui enflent, et deux portes à chaque fois.',
  bpm: 145,
  rowsPerBeat: 2,
  echoSteps: 3,
  mix: 1.05,
  bars: 32,
  instruments: [],
  percussions: ['charleston', 'charlestonOuvert', 'crash'],
  ACCENTS,

  palette: {
    skyTop: 0x3d2a7a,
    skyBottom: 0xffc2e8,
    fog: 0x7a5aad,
    floors: [0xfff0fa, 0xffd6ef, 0xf5bde2],
    block: 0x00c2b8,
    accent: 0xff87c3,
    neon: 0xfffdf5,
    decor: 0x9a6ed6,
    ball: 0xffffff,
  },

  sections: sectionsEDM({ variante: 'piston', respiration: 'tapis', dur: 'canon' }),

  /** Nuages géométriques flottants, très clairs, posés loin de la piste. */
  decor(stage) {
    const { rows, box, colX, TILE } = stage;
    const nuage = 0xffffff;
    for (let row = 2; row < rows; row += 7) {
      const z = row * TILE;
      const haut = 6 + ((row / 7) % 3) * 2;
      for (const side of [-1, 1]) {
        const x = side * (colX(6) + 5 + ((row / 7) % 2) * 1.6);
        box(x, haut, z, 4.4, 1.2, 2.6, nuage);
        box(x - 1.2, haut + 0.9, z, 2.4, 1.1, 2.2, nuage);
        box(x + 1.3, haut + 0.7, z, 2, 0.9, 1.8, nuage);
      }
    }
    for (let row = 0; row < rows; row += 4) {
      for (const side of [-1, 1]) {
        box(side * (colX(6) + 2.4), -0.6, row * TILE, 2.6, 1.2, TILE * 2, this.palette.decor);
      }
    }
  },

  pattern: motifEDM({ batterie: 'trap', ACCORDS, BASSE, HOOK, CONTRE, style: 'futurebass', ecart: 24, sub: 0.6 }),
});
