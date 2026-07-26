import { piste, sectionsEDM, motifEDM } from './kit.js';

/**
 * Face A, piste 2. Techno claire en fa dièse mineur, 126 BPM.
 *
 * Une seule cellule mélodique, répétée sans relâche et transposée quand
 * l'accord bouge : c'est l'obstination qui fait entrer le motif. La carte
 * suit exactement ses attaques, donc la piste devient aussi obsédante.
 */

const BASSE = [42, 42, 38, 38, 45, 45, 40, 40];
const ACCORDS = [
  [66, 69, 73], [66, 69, 73], [62, 66, 69], [62, 66, 69],
  [64, 69, 73], [64, 69, 73], [64, 68, 71], [64, 68, 71],
];

/** La cellule, transposée avec l'accord et conclue une mesure sur huit. */
const HOOK = [
  [[2, 78, 1], [3, 78, 1], [5, 81, 1], [6, 78, 2]],
  [[2, 78, 1], [3, 78, 1], [5, 81, 1], [6, 85, 2]],
  [[2, 74, 1], [3, 74, 1], [5, 78, 1], [6, 74, 2]],
  [[2, 74, 1], [3, 74, 1], [5, 78, 1], [6, 81, 2]],
  [[2, 76, 1], [3, 76, 1], [5, 81, 1], [6, 76, 2]],
  [[2, 76, 1], [3, 76, 1], [5, 81, 1], [6, 85, 2]],
  [[2, 76, 1], [3, 76, 1], [5, 79, 1], [6, 76, 2]],
  [[0, 79, 2], [3, 76, 1], [4, 71, 4]],
];

const CONTRE = [
  [[1, 85, 1], [7, 81, 1]], [[1, 85, 1], [7, 78, 1]],
  [[1, 81, 1], [7, 78, 1]], [[1, 81, 1], [7, 74, 1]],
  [[1, 85, 1], [7, 81, 1]], [[1, 88, 1], [7, 85, 1]],
  [[1, 83, 1], [7, 79, 1]], [[1, 83, 1], [7, 76, 1]],
];

const ACCENTS = [
  [2, 3, 5], [2, 3, 6], [2, 3, 5], [2, 3, 6],
  [2, 3, 5], [2, 3, 6], [2, 3, 5], [0, 3, 4],
];

export default piste({
  id: 'techno',
  face: 'A',
  index: 3,
  title: 'Sous-sol, 4 h',
  genre: 'Techno',
  tagline: 'La même mesure, jusqu’à ce qu’elle devienne autre chose.',
  bpm: 126,
  rowsPerBeat: 2,
  echoSteps: 3,
  mix: 1.05,
  bars: 32,
  instruments: ['violon', 'violoncelle'],
  percussions: ['charleston', 'charlestonOuvert', 'crash'],
  ACCENTS,

  palette: {
    skyTop: 0x1a2b6b,
    skyBottom: 0x4fd6ff,
    fog: 0x2c4a8c,
    floors: [0xdfe9ff, 0xc4d6f7, 0xa9c1ef],
    block: 0xff4d7d,
    accent: 0x00c2ff,
    neon: 0xffffff,
    decor: 0x2f4694,
    ball: 0xffffff,
  },

  sections: sectionsEDM({ variante: 'balayeuse', respiration: 'calme', dur: 'bloc' }),

  decor(stage) {
    const { rows, box, neon, colX, TILE } = stage;
    const bleu = this.palette.decor;
    for (let row = 2; row < rows; row += 8) {
      const z = row * TILE;
      for (const side of [-1, 1]) {
        const x = side * (colX(6) + 3.4);
        for (let i = 0; i < 3; i++) box(x, 1 + i * 2, z, 3.4, 1.9, 2.4, bleu);
        neon(x, 0.02, z, 3.6, 0.1, 2.6, this.palette.accent);
      }
    }
    for (let row = 6; row < rows; row += 12) {
      const z = row * TILE;
      for (const side of [-1, 1]) {
        const x = side * (colX(6) + 1.6);
        box(x, 5, z, 0.24, 10, 0.24, bleu);
        neon(x, 9.6, z, 1.4, 0.3, 0.35, this.palette.accent);
      }
    }
  },

  pattern: motifEDM({ ACCORDS, BASSE, HOOK, CONTRE, ecart: 18 }),
});
