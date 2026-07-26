import { piste, surPas, plan } from './kit.js';

/**
 * Face B, piste 4. La mineur pour puce sonore.
 *
 * Trois voix à impulsion et une voie de bruit. Le crochet de deux mesures est
 * joué, rejoué à l'identique, remplacé par un pont, puis rejoué avec une autre
 * chute : deux mesures qui reviennent trois fois sur huit, c'est ce qui fait
 * qu'on ressort en le fredonnant.
 */

const BASSE = [45, 45, 41, 41, 48, 48, 43, 43];
const ACCORDS = [
  [69, 72, 76], [69, 72, 76], [65, 69, 72], [65, 69, 72],
  [64, 67, 72], [64, 67, 72], [67, 71, 74], [67, 71, 74],
];

const CROCHET = [
  [[0, 81, 1], [1, 81, 1], [2, 84, 2], [4, 86, 1], [5, 84, 1], [6, 81, 2]],
  [[0, 79, 2], [2, 81, 4], [6, 76, 2]],
];
const CROCHET_FIN = [
  [[0, 81, 1], [1, 81, 1], [2, 84, 2], [4, 86, 1], [5, 88, 1], [6, 89, 2]],
  [[0, 88, 4], [4, 86, 2], [6, 84, 2]],
];
const PONT = [
  [[0, 77, 2], [2, 79, 2], [4, 81, 3]],
  [[0, 76, 2], [2, 74, 2], [4, 72, 3]],
];
const HOOK = [
  CROCHET[0], CROCHET[1], CROCHET[0], CROCHET[1],
  PONT[0], PONT[1], CROCHET_FIN[0], CROCHET_FIN[1],
];

/** Le crochet attaque sur deux croches collées, puis relance sur la seconde
 *  moitié : c'est ce dessin qui devient une double porte puis une porte. */
const ACCENTS = [
  [0, 1, 4], [0, 2, 6], [0, 1, 4], [0, 2, 6],
  [0, 2, 4], [0, 2, 4], [0, 1, 4, 6], [0, 4, 6],
];

export default piste({
  id: 'chiptune',
  face: 'B',
  index: 4,
  title: 'Cartouche 03',
  genre: 'Chiptune',
  tagline: 'Trois voix, une voie de bruit, aucune excuse.',
  bpm: 150,
  rowsPerBeat: 2,
  echoSteps: 3,
  mix: 1.8,
  bars: 32,
  instruments: [],
  percussions: [],
  ACCENTS,

  palette: {
    skyTop: 0x2a1170,
    skyBottom: 0x7be0ff,
    fog: 0x4a2ba0,
    floors: [0x3ef0c8, 0x2ed3b0, 0x59ffd8],
    block: 0xff3d8a,
    accent: 0xffe23d,
    neon: 0xaaff4d,
    decor: 0x8a3ddd,
    ball: 0xffffff,
  },

  sections: plan([
    [4, { mode: 'calme', largeur: 5 }],
    [1, { mode: 'halte' }],
    [3, { mode: 'bloc', largeur: 5, porte: 1 }],
    [4, { mode: 'piston', largeur: 5, porte: 1 }],
    [1, { mode: 'halte' }],
    [3, { mode: 'trou', largeur: 5, porte: 1 }],
    [1, { mode: 'saut', couronne: true }],
    [3, { mode: 'bloc', largeur: 7, porte: 1 }],
    [1, { mode: 'halte' }],
    [3, { mode: 'tapis', largeur: 5, couronne: true }],
    [4, { mode: 'bloc', largeur: 5, porte: 0 }],
    [1, { mode: 'halte' }],
    [2, { mode: 'piston', largeur: 7, porte: 0 }],
    [1, { mode: 'calme', largeur: 5, couronne: true }],
  ]),

  decor(stage) {
    const { rows, box, neon, colX, TILE } = stage;
    const carte = this.palette.decor;
    for (let row = 0; row < rows; row += 4) {
      const z = row * TILE;
      for (const side of [-1, 1]) {
        const x = side * (colX(6) + 3);
        box(x, -0.4, z, 5.5, 0.5, 3.2, carte);
        neon(x, -0.1, z, 4.6, 0.08, 0.16, this.palette.neon);
        if ((row / 4) % 3 === 0) {
          box(x, 0.5, z, 2.2, 1.2, 1.4, 0x3a1080);
          for (let i = -1; i <= 1; i++) neon(x + i * 0.7, 0.02, z + 0.85, 0.28, 0.1, 0.5, this.palette.accent);
        } else if ((row / 4) % 3 === 1) {
          box(x, 0.9, z, 1, 2, 1, 0x5a1fb0);
          neon(x, 1.95, z, 1.05, 0.14, 1.05, this.palette.block);
        }
      }
    }
  },

  pattern(step, t, s) {
    const bar = Math.floor(step / 8);
    const inBar = step % 8;
    const mesure = bar % 8;
    const croche = s.stepDuration;
    const accord = ACCORDS[mesure];
    const basse = BASSE[mesure];
    const intro = bar < 4;
    const rupture = bar >= 20 && bar < 22;
    const seconde = bar >= 16;
    const finale = bar >= 28;

    if (!intro && !rupture) {
      if (inBar % 4 === 0) s.kickMachine(t, { level: 0.45, from: 210, to: 55, decay: 0.13 });
      if (inBar === 4) s.bruitPuce(t, { level: 0.3, decay: 0.12, aigu: 2400 });
      if (inBar % 2 === 1) s.bruitPuce(t, { level: 0.1, decay: 0.03 });
      s.puce(t, basse - 12 + (inBar >= 6 ? 12 : 0), croche * 0.45, { level: 0.24, duty: 0.25 });
    }

    if (!rupture) {
      for (let i = 0; i < 2; i++) {
        const note = accord[(inBar * 2 + i) % accord.length] + (seconde ? 12 : 0);
        s.puce(t + (i * croche) / 2, note, croche / 2, {
          level: intro ? 0.07 : 0.1, duty: i === 0 ? 0.125 : 0.5,
        });
      }
    }

    if (!intro || bar === 3) {
      surPas(HOOK[mesure], inBar, (note, duree) => {
        s.puce(t, note, duree * croche * 0.95, { level: 0.2, duty: 0.5, vibrato: finale ? 4 : 0 });
        if (finale) s.puce(t, note - 12, duree * croche * 0.9, { level: 0.1, duty: 0.25 });
      });
    }

    if (rupture && inBar === 0) s.montee(t, croche * 8, { level: 0.12 });
    if (bar === 22 && inBar === 0) s.bruitPuce(t, { level: 0.4, decay: 0.5, aigu: 1200 });
  },
});
