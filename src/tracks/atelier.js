import { piste, sectionsEDM, motifEDM } from './kit.js';

/**
 * Face A, piste 5. Techno industrielle en mi mineur, 134 BPM.
 *
 * La piste des mécaniques : marteaux qui balaient à l'horizontale, presses qui
 * s'abattent d'en haut, roues qui traversent en groupe. Le morceau est bâti
 * autour d'une cellule courte et martelée, parce que la piste demande déjà
 * beaucoup d'attention.
 */

const BASSE = [40, 40, 43, 43, 38, 38, 45, 45];
const ACCORDS = [
  [64, 67, 71], [64, 67, 71], [67, 70, 74], [67, 70, 74],
  [62, 65, 69], [62, 65, 69], [64, 69, 72], [64, 69, 72],
];

const CELLULE = [
  [[0, 76, 2], [2, 76, 1], [3, 74, 1], [4, 76, 4]],
  [[0, 74, 2], [2, 71, 2], [4, 67, 4]],
];
const PONT = [
  [[0, 71, 2], [2, 74, 2], [4, 76, 4]],
  [[0, 76, 2], [2, 74, 2], [4, 71, 4]],
];
const CHUTE = [
  [[0, 76, 2], [2, 76, 1], [3, 74, 1], [4, 79, 4]],
  [[0, 79, 4], [4, 76, 4]],
];
const HOOK = [
  CELLULE[0], CELLULE[1], CELLULE[0], CELLULE[1],
  PONT[0], PONT[1], CHUTE[0], CHUTE[1],
];

const CONTRE = [
  [[6, 83, 1]], [[6, 79, 1]], [[6, 86, 1]], [[6, 82, 1]],
  [[6, 81, 1]], [[6, 77, 1]], [[6, 84, 1]], [[6, 79, 1]],
];

const ACCENTS = [
  [0, 2, 3, 6], [0, 2, 4], [0, 2, 3, 6], [0, 2, 4],
  [0, 2, 3, 6], [0, 4, 6], [0, 2, 3, 6], [0, 2, 4],
];

export default piste({
  id: 'atelier',
  face: 'A',
  index: 5,
  title: 'Atelier',
  genre: 'Techno indus',
  tagline: 'Des marteaux, des presses, et le mauvais moment pour hésiter.',
  bpm: 134,
  rowsPerBeat: 2,
  echoSteps: 3,
  mix: 1.05,
  bars: 32,
  instruments: [],
  percussions: ['charleston', 'charlestonOuvert', 'crash', 'tomGrave', 'tomAigu'],
  ACCENTS,

  palette: {
    skyTop: 0x1b2430,
    skyBottom: 0xffb066,
    fog: 0x4a4436,
    floors: [0xd8d2c4, 0xc0b9a8, 0xa8a08e],
    block: 0xe8532e,
    accent: 0xffc233,
    neon: 0xfff4d6,
    decor: 0x3b3a3a,
    ball: 0xffffff,
  },

  sections: sectionsEDM({ variante: 'marteau', respiration: 'roue', dur: 'scie' }),

  /** Ponts roulants et caisses empilées, très près de la piste. */
  decor(stage) {
    const { rows, box, neon, colX, TILE } = stage;
    const fer = this.palette.decor;
    for (let row = 3; row < rows; row += 6) {
      const z = row * TILE;
      for (const side of [-1, 1]) {
        const x = side * (colX(6) + 4);
        const hauteur = 2 + ((row / 6) % 3);
        box(x, hauteur / 2, z, 3, hauteur, 2.6, fer);
        neon(x, hauteur + 0.12, z, 2.4, 0.16, 2.2, this.palette.accent);
      }
    }
    for (let row = 0; row < rows; row += 10) {
      const z = row * TILE;
      for (const side of [-1, 1]) box(side * (colX(6) + 2.4), 6, z, 0.5, 12, 0.5, fer);
      box(0, 11.4, z, (colX(6) + 2.4) * 2, 0.8, 1.2, fer);
      neon(0, 10.9, z, (colX(6) + 1) * 2, 0.2, 0.5, this.palette.block);
    }
  },

  pattern: motifEDM({ batterie: 'techno', ACCORDS, BASSE, HOOK, CONTRE, ecart: 18 }),
});
