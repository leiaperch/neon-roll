import { piste, sectionsEDM, motifEDM } from './kit.js';

/**
 * Face B, piste 8. Hardstyle en sol dièse mineur, 152 BPM.
 *
 * La grosse caisse occupe tout le temps : attaque courte puis queue accordée
 * qui descend, saturée. Entre deux frappes, la basse inversée enfle et se
 * coupe net, ce qui donne le rebond caractéristique du genre. Le thème, lui,
 * reste en longues notes euphoriques : c'est le contraste qui fait tenir.
 */

const BASSE = [44, 44, 40, 40, 47, 47, 42, 42];
const ACCORDS = [
  [68, 71, 75], [68, 71, 75], [64, 68, 71], [64, 68, 71],
  [71, 75, 78], [71, 75, 78], [66, 69, 73], [66, 69, 73],
];

/** Longues notes tenues, cellule répétée : le contraste avec la caisse. */
const CELLULE = [
  [[0, 80, 3], [3, 82, 1], [4, 80, 4]],
  [[0, 82, 2], [2, 80, 2], [4, 75, 4]],
];
const PONT = [
  [[0, 75, 2], [2, 78, 2], [4, 80, 4]],
  [[0, 78, 2], [2, 80, 2], [4, 82, 4]],
];
const CHUTE = [
  [[0, 80, 3], [3, 82, 1], [4, 87, 4]],
  [[0, 85, 4], [4, 80, 4]],
];
const HOOK = [
  CELLULE[0], CELLULE[1], CELLULE[0], CELLULE[1],
  PONT[0], PONT[1], CHUTE[0], CHUTE[1],
];

const CONTRE = [
  [[6, 92, 1]], [[6, 92, 1]], [[6, 95, 1]], [[6, 92, 1]],
  [[6, 97, 1]], [[6, 92, 1]], [[6, 97, 1]], [[6, 92, 1]],
];

const ACCENTS = [
  [0, 3, 4], [0, 2, 4], [0, 3, 4], [0, 2, 4],
  [0, 3, 4, 6], [0, 2, 4], [0, 3, 4], [0, 2, 4, 6],
];

export default piste({
  id: 'hardstyle',
  face: 'B',
  index: 8,
  title: 'Contrecoup',
  genre: 'Hardstyle',
  tagline: 'La caisse prend toute la place, la basse remplit les trous.',
  bpm: 152,
  rowsPerBeat: 2,
  echoSteps: 2,
  mix: 0.85,
  bars: 32,
  instruments: [],
  percussions: ['charleston', 'charlestonOuvert', 'crash'],
  ACCENTS,

  palette: {
    skyTop: 0x2a0f52,
    skyBottom: 0xff5ea8,
    fog: 0x5c2178,
    floors: [0xf0e6ff, 0xd9c4f7, 0xc0a8ea],
    block: 0x1a0033,
    accent: 0xffd12e,
    neon: 0xffffff,
    decor: 0x3d1466,
    ball: 0xffffff,
  },

  sections: sectionsEDM({ variante: 'faisceau', respiration: 'calme', dur: 'bloc' }),

  /** Piliers massifs et rampes lumineuses, resserrés : le couloir se ferme. */
  decor(stage) {
    const { rows, box, neon, colX, TILE } = stage;
    const pierre = this.palette.decor;
    for (let row = 2; row < rows; row += 4) {
      const z = row * TILE;
      for (const side of [-1, 1]) {
        const x = side * (colX(6) + 3);
        box(x, 3.5, z, 2.6, 7, 2.2, pierre);
        neon(x, 7.2, z, 2.8, 0.3, 2.4, this.palette.accent);
      }
    }
    for (let row = 0; row < rows; row += 8) {
      neon(0, 9.4, row * TILE, (colX(6) + 4) * 2, 0.34, 0.5, this.palette.neon);
    }
  },

  pattern: motifEDM({ batterie: 'hardstyle', ACCORDS, BASSE, HOOK, CONTRE, style: 'hardstyle', ecart: 26, sub: 0.7 }),
});
