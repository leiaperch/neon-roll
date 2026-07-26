import { piste, surPas, plan } from './kit.js';

/**
 * Face A, piste 2. Techno claire en fa dièse mineur.
 *
 * Une seule cellule mélodique, répétée sans relâche et transposée quand
 * l'accord bouge : c'est l'obstination qui fait entrer le motif. La carte
 * suit exactement ses attaques, donc la piste devient aussi obsédante que
 * le morceau.
 */

const BASSE = [42, 42, 38, 38, 45, 45, 40, 40];
const ACCORDS = [
  [61, 66, 69], [61, 66, 69], [62, 66, 69], [62, 66, 69],
  [61, 64, 69], [61, 64, 69], [59, 64, 68], [59, 64, 68],
];
const TRANSPO = [0, 0, -4, -4, 3, 3, -2, -2];

const CELLULE = [[2, 78, 1], [3, 78, 1], [5, 81, 1], [6, 78, 2]];
const CELLULE_FIN = [[2, 78, 1], [3, 78, 1], [5, 76, 1], [6, 73, 3]];
const HOOK = [
  CELLULE, CELLULE, CELLULE, CELLULE,
  CELLULE, CELLULE, CELLULE, CELLULE_FIN,
];

/** Les deux croches serrées du milieu de mesure sont le « boum boum ». */
const ACCENTS = [
  [2, 3, 5], [2, 3, 6], [2, 3, 5], [2, 3, 6],
  [2, 3, 5], [2, 3, 6], [2, 3, 5], [0, 2, 3, 6],
];

export default piste({
  id: 'techno',
  face: 'A',
  index: 2,
  title: 'Sous-sol, 4 h',
  genre: 'Techno',
  tagline: 'La même mesure, jusqu’à ce qu’elle devienne autre chose.',
  bpm: 128,
  rowsPerBeat: 2,
  echoSteps: 3,
  mix: 1.2,
  bars: 32,
  instruments: ['violon', 'violoncelle'],
  percussions: ['charleston', 'charlestonOuvert', 'crash', 'caisseClaire'],
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

  sections: plan([
    [4, { mode: 'calme', largeur: 5 }],
    [1, { mode: 'halte' }],
    [3, { mode: 'bloc', largeur: 5, porte: 1 }],
    [4, { mode: 'balayeuse', largeur: 5, porte: 1 }],
    [1, { mode: 'halte' }],
    [3, { mode: 'bloc', largeur: 7, porte: 1 }],
    [4, { mode: 'faisceau', largeur: 5 }],
    [1, { mode: 'halte' }],
    [1, { mode: 'saut', couronne: true }],
    [3, { mode: 'trou', largeur: 5, porte: 1 }],
    [3, { mode: 'bloc', largeur: 7, porte: 0, couronne: true }],
    [1, { mode: 'halte' }],
    [2, { mode: 'bloc', largeur: 5, porte: 0 }],
    [1, { mode: 'calme', largeur: 5, couronne: true }],
  ]),

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

  pattern(step, t, s) {
    const bar = Math.floor(step / 8);
    const inBar = step % 8;
    const mesure = bar % 8;
    const croche = s.stepDuration;
    const basse = BASSE[mesure];
    const accord = ACCORDS[mesure];
    const intro = bar < 4;
    const pont = bar >= 20 && bar < 22;
    const plein = bar >= 12;

    if (!pont) {
      if (inBar % 2 === 0) s.kickMachine(t, { level: 0.85 });
      if (inBar % 2 === 1) s.charleston(t, { level: intro ? 0.15 : 0.2, ouvert: inBar % 4 === 3 });
      if (!intro && inBar === 4) s.clap(t, { level: 0.28 });
    } else if (inBar % 2 === 1) {
      s.charleston(t, { level: 0.1, ouvert: true });
    }
    if ((bar === 12 || bar === 22) && inBar === 0) s.crash(t, { level: 0.28 });

    if (!intro && !pont && [0, 3, 4, 6, 7].includes(inBar)) {
      s.basse(t, basse - 12 + (inBar === 7 ? 12 : 0), croche * 0.85, {
        level: 0.28, cutoff: 480 + Math.abs(4 - inBar) * 420 + (plein ? 900 : 0), floor: 200, q: 9,
      });
    }

    // Cordes : nappe discrète, seules au pont.
    if (inBar === 0) {
      if (pont) {
        s.violoncelle(t, basse, croche * 8, { level: 0.36 });
        s.violon(t, accord[1] + 12, croche * 8, { level: 0.3 });
      } else if (!intro) {
        s.violoncelle(t, basse, croche * 8, { level: 0.14 });
      }
    }

    if (!intro && !pont) {
      surPas(HOOK[mesure], inBar, (note, duree) => {
        s.stab(t, [note + TRANSPO[mesure]], duree * croche * 0.8, { level: 0.1, echo: 0.45 });
      });
    }
    if (pont && inBar === 4) s.montee(t, croche * 12, { level: 0.12 });
  },
});
