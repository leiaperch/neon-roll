import { piste, sectionsEDM, motifEDM } from './kit.js';

/**
 * Face B, piste 5. Big room en sol mineur, 156 BPM, la fin du disque.
 *
 * La plus rapide, donc la plus exigeante. Le crochet est réduit à trois notes
 * et une chute, parce qu'à cette vitesse il faut pouvoir l'anticiper sans y
 * penser : plus le tempo monte, plus la mélodie doit être simple.
 */

const BASSE = [43, 43, 39, 39, 46, 46, 41, 41];
const ACCORDS = [
  [58, 62, 67], [58, 62, 67], [63, 67, 70], [63, 67, 70],
  [58, 62, 65], [58, 62, 65], [60, 65, 69], [60, 65, 69],
];

/**
 * Crochet en gradins : chaque paire de mesures monte d'un cran, le sommet
 * tombe à la sixième, puis la ligne retombe d'un bloc. À ce tempo la mélodie
 * doit être anticipable sans y penser, donc peu de notes et des degrés
 * conjoints entre elles.
 */
/** Trois notes martelées et une tenue : à ce tempo il n'en faut pas plus. */
const CELLULE = [
  [[0, 74, 2], [2, 74, 1], [3, 75, 1], [4, 77, 4]],
  [[0, 75, 2], [2, 74, 2], [4, 70, 4]],
];
const PONT = [
  [[0, 70, 2], [2, 72, 2], [4, 74, 4]],
  [[0, 72, 2], [2, 74, 2], [4, 75, 4]],
];
const CHUTE = [
  [[0, 74, 2], [2, 74, 1], [3, 75, 1], [4, 82, 4]],
  [[0, 79, 4], [4, 74, 4]],
];
const HOOK = [
  CELLULE[0], CELLULE[1], CELLULE[0], CELLULE[1],
  PONT[0], PONT[1], CHUTE[0], CHUTE[1],
];

const CONTRE = [
  [[6, 91, 1]], [[6, 89, 1]], [[6, 94, 1]], [[6, 91, 1]],
  [[6, 89, 1]], [[6, 86, 1]], [[6, 93, 1]], [[6, 91, 1]],
];

const ACCENTS = [
  [0, 2, 4], [0, 2, 4], [0, 2, 4], [0, 2, 4, 6],
  [0, 2, 4], [0, 2, 4], [0, 2, 4, 6], [0, 2, 4],
];

export default piste({
  id: 'bigroom',
  face: 'B',
  index: 9,
  title: 'Grand Format',
  genre: 'Big room',
  tagline: 'Trois notes, un drop, et plus le temps de réfléchir.',
  bpm: 156,
  rowsPerBeat: 2,
  echoSteps: 2,
  mix: 1,
  bars: 32,
  instruments: ['violoncelle'],
  percussions: ['charleston', 'charlestonOuvert', 'crash'],
  ACCENTS,

  palette: {
    skyTop: 0x102a4a,
    skyBottom: 0x39e6c0,
    fog: 0x1b4a6b,
    floors: [0xf2f5d0, 0xdce8b4, 0xc4dba0],
    block: 0xff5a3c,
    accent: 0x00d9a0,
    neon: 0xfaffd6,
    decor: 0x1e5c72,
    ball: 0xffffff,
  },

  sections: sectionsEDM({ variante: 'trou', respiration: 'calme', dur: 'bloc' }),

  decor(stage) {
    const { rows, box, neon, colX, TILE } = stage;
    const bleu = this.palette.decor;
    for (let row = 2; row < rows; row += 5) {
      const z = row * TILE;
      for (const side of [-1, 1]) {
        const x = side * (colX(6) + 3.2);
        box(x, 1.4, z, 0.4, 2.8, 0.4, bleu);
        neon(x, 2.9, z, 1.2, 0.24, 0.4, this.palette.accent);
      }
    }
    for (let row = 0; row < rows; row += 20) {
      const z = row * TILE;
      box(0, 9, z, (colX(6) + 5) * 2, 1.1, 1.6, bleu);
      neon(0, 8.3, z, (colX(6) + 4) * 2, 0.26, 0.6, this.palette.neon);
    }
  },

  pattern: motifEDM({ batterie: 'bigroom', ACCORDS, BASSE, HOOK, CONTRE, ecart: 22, sub: 0.7 }),
});
