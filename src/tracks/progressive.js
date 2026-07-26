import { piste, sectionsEDM, motifEDM } from './kit.js';

/**
 * Face A, piste 4. Progressive house en ré mineur, 132 BPM.
 *
 * La piste de festival par excellence : un thème court en croches serrées,
 * un drop qui empile supersaws et sub, et une carte qui devient un mur au
 * moment exact où le thème repart.
 */

const BASSE = [50, 50, 46, 46, 41, 41, 48, 48];
const ACCORDS = [
  [62, 65, 69], [62, 65, 69], [58, 62, 65], [58, 62, 65],
  [60, 65, 69], [60, 65, 69], [64, 67, 72], [64, 67, 72],
];

/**
 * Crochet en arche : la ligne monte par degrés conjoints, culmine une seule
 * fois à la sixième mesure sur les trois quarts de la phrase, puis redescend.
 *
 * Les deux principes viennent du skill de composition. D'abord le climax
 * unique placé aux deux tiers, approché par degrés et suivi d'une descente :
 * sans descente ce n'est pas un sommet, c'est un plateau. Ensuite la
 * proportion de degrés conjoints : enchaîner des sauts dans la même direction
 * dessine l'accord et non une mélodie, c'est ce que faisaient mes crochets
 * arpégés.
 */
const HOOK = [
  [[0, 81, 1], [1, 81, 1], [2, 83, 2], [4, 84, 1], [6, 83, 2]],
  [[0, 81, 2], [2, 79, 2], [4, 81, 4]],
  [[0, 83, 1], [1, 83, 1], [2, 84, 2], [4, 86, 1], [6, 84, 2]],
  [[0, 83, 2], [2, 81, 2], [4, 84, 4]],
  [[0, 84, 1], [1, 86, 1], [2, 87, 2], [4, 86, 1], [6, 84, 2]],
  [[0, 86, 2], [2, 88, 2], [4, 89, 4]], // climax : la seule fois qu'on va si haut
  [[0, 88, 1], [1, 86, 1], [2, 84, 2], [4, 83, 1], [6, 81, 2]],
  [[0, 79, 2], [2, 78, 2], [4, 74, 4]], // la descente qui fait du sommet un sommet
];

const CONTRE = [
  [[3, 93, 1], [7, 89, 1]], [[3, 93, 1], [7, 86, 1]],
  [[3, 89, 1], [7, 86, 1]], [[3, 89, 1], [7, 82, 1]],
  [[3, 96, 1], [7, 93, 1]], [[3, 96, 1], [7, 89, 1]],
  [[3, 91, 1], [7, 88, 1]], [[3, 88, 1], [7, 84, 1]],
];

/** Trois attaques collées en début de mesure : le mur du drop. */
const ACCENTS = [
  [0, 1, 2, 4], [0, 2, 4], [0, 1, 2, 4], [0, 2, 4],
  [0, 1, 2, 4], [0, 2, 4], [0, 1, 2, 4], [0, 2, 4],
];

export default piste({
  id: 'progressive',
  face: 'A',
  index: 4,
  title: 'Grand Angle',
  genre: 'EDM',
  tagline: 'Un thème de dix notes, et tout le reste au service du drop.',
  bpm: 132,
  rowsPerBeat: 2,
  echoSteps: 3,
  mix: 1,
  bars: 32,
  instruments: [],
  percussions: ['charleston', 'charlestonOuvert', 'crash'],
  ACCENTS,

  palette: {
    skyTop: 0x241a6b,
    skyBottom: 0xff8fb1,
    fog: 0x5a3a8c,
    floors: [0xffe3f0, 0xf5cbe4, 0xe6b3d6],
    block: 0x3b2fd6,
    accent: 0xffd447,
    neon: 0xffffff,
    decor: 0x4b3aa8,
    ball: 0xffffff,
  },

  sections: sectionsEDM({ variante: 'faisceau', respiration: 'calme', dur: 'bloc' }),

  /** Portiques de scène et projecteurs, en enfilade. */
  decor(stage) {
    const { rows, box, neon, colX, TILE } = stage;
    const structure = this.palette.decor;
    for (let row = 4; row < rows; row += 8) {
      const z = row * TILE;
      for (const side of [-1, 1]) {
        const x = side * (colX(6) + 2.6);
        box(x, 5, z, 0.5, 10, 0.5, structure);
        for (let i = 0; i < 3; i++) neon(x, 3 + i * 2.6, z, 1, 0.4, 0.6, this.palette.accent);
      }
      box(0, 10.2, z, (colX(6) + 2.6) * 2, 0.6, 0.6, structure);
      neon(0, 9.8, z, (colX(6) + 1.5) * 2, 0.25, 0.4, this.palette.neon);
    }
  },

  pattern: motifEDM({ batterie: 'festival', ACCORDS, BASSE, HOOK, CONTRE, ecart: 20, sub: 0.6 }),
});
