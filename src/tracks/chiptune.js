import { piste, surPas, sectionsEDM, phaseDe } from './kit.js';

/**
 * Face B, piste 4. La mineur pour puce sonore, 148 BPM.
 *
 * Seule piste à garder ses oscillateurs bruts : ici c'est le sujet, pas un
 * pis-aller. Elle suit la même structure de festival que les autres, montée,
 * drop, pont, mais avec trois voix à impulsion et une voie de bruit.
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

const ACCENTS = [
  [0, 1, 4], [0, 2, 6], [0, 1, 4], [0, 2, 6],
  [0, 2, 4], [0, 2, 4], [0, 1, 4, 6], [0, 4, 6],
];

export default piste({
  id: 'chiptune',
  face: 'B',
  index: 7,
  title: 'Cartouche 03',
  genre: 'Chiptune',
  tagline: 'Trois voix, une voie de bruit, aucune excuse.',
  bpm: 148,
  rowsPerBeat: 2,
  echoSteps: 3,
  mix: 1.35,
  bars: 32,
  instruments: [],
  percussions: ['charleston', 'crash'],
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

  sections: sectionsEDM({ variante: 'piston', respiration: 'tapis', dur: 'bloc' }),

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
    const phase = phaseDe(bar);
    const accord = ACCORDS[mesure];
    const basse = BASSE[mesure];
    const drop = phase === 'drop' || phase === 'drop2';
    const monte = phase === 'montee' || phase === 'montee2';

    // Voie de bruit et grosse caisse, avec la coupure d'avant-drop.
    if (phase !== 'pont') {
      const coupe = monte && bar % 4 === 3 && inBar >= 4;
      if (inBar % 4 === 0 && !coupe) s.kickMachine(t, { level: 0.5, from: 210, to: 55, decay: 0.13 });
      // Bruit de claire sur le backbeat, deux et quatre : la puce n'a qu'une
      // voie de bruit, elle imite le kit avec ce qu'elle a.
      if ((inBar === 2 || inBar === 6) && phase !== 'intro') {
        s.bruitPuce(t, { level: 0.32, decay: 0.12, aigu: 2400 });
      }
      if (inBar % 2 === 1) s.bruitPuce(t, { level: 0.1, decay: 0.03 });
    }
    if ((bar === 8 || bar === 24) && inBar === 0) s.crash(t, { level: 0.3 });
    if (monte && bar % 4 >= 2 && inBar % 2 === 0) {
      const serre = bar % 4 === 3 ? 4 : 2;
      for (let i = 0; i < serre; i++) {
        s.bruitPuce(t + (i * croche) / serre, { level: 0.16, decay: 0.04, aigu: 3200 });
      }
    }

    // Basse en impulsion étroite.
    if (phase !== 'pont' && phase !== 'intro') {
      s.puce(t, basse - 12 + (inBar >= 6 ? 12 : 0), croche * 0.45, { level: 0.24, duty: 0.25 });
    }

    // Accompagnement en doubles croches.
    if (phase !== 'pont') {
      for (let i = 0; i < 2; i++) {
        const note = accord[(inBar * 2 + i) % accord.length] + (drop ? 12 : 0);
        s.puce(t + (i * croche) / 2, note, croche / 2, {
          level: phase === 'intro' ? 0.07 : 0.1, duty: i === 0 ? 0.125 : 0.5,
        });
      }
    } else if (inBar % 2 === 0) {
      s.puce(t, accord[(inBar >> 1) % accord.length], croche * 2, { level: 0.09, duty: 0.5 });
    }

    // Le crochet, doublé à l'octave sur les drops.
    if (phase !== 'intro' || bar === 3) {
      surPas(HOOK[mesure], inBar, (note, duree) => {
        s.puce(t, note, duree * croche * 0.95, { level: 0.2, duty: 0.5, vibrato: drop ? 4 : 0 });
        if (drop) s.puce(t, note - 12, duree * croche * 0.9, { level: 0.09, duty: 0.25 });
      });
    }

    if (monte && bar % 4 === 3 && inBar === 0) s.montee(t, croche * 8, { level: 0.14 });
  },
});
