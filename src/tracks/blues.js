import { SCALES, degree } from '../synth.js';

/**
 * Face A, piste 1. Blues lent en mi, structure de douze mesures jouée deux
 * fois. Le tempo bas rend la piste large et roulante : c'est la piste
 * d'apprentissage, les tapis roulants y remplacent les pièges rapides.
 */

const E = 40, A = 45, B = 47;
// Grille de douze mesures, une fondamentale par mesure.
const GRILLE = [E, E, E, E, A, A, E, E, B, A, E, B];
// Ligne de basse qui marche : degrés parcourus sur les quatre temps.
const MARCHE = [0, 4, 7, 9];

export default {
  id: 'blues',
  face: 'A',
  index: 1,
  title: 'Poussière de Delta',
  genre: 'Blues',
  tagline: 'Douze mesures, une route qui ne presse personne.',
  bpm: 84,
  rowsPerBeat: 2,
  echoSteps: 3,
  scale: SCALES.blues,
  scaleRoot: 76,

  palette: {
    skyTop: 0x140c20,
    skyBottom: 0x7a3a1e,
    fog: 0x2a1410,
    floors: [0xc99a5e, 0xdcb277, 0xa87c47],
    block: 0x3b2418,
    accent: 0xffb45c,
    neon: 0xffd9a0,
    decor: 0x2a1a14,
    ball: 0xf3e6d2,
  },

  phrases: {
    intro: `
      #######
      #######
      ###o###
      #######
      #######
      ###o###
      #######
      #######`,
    intro2: `
      .#####.
      .#####.
      .##o##.
      .#####.
      .#####.
      .##o##.
      .#####.
      .#####.`,
    open: `
      .#####.
      .#####.
      .#####.
      .##o##.
      .#####.
      .#####.
      .#####.
      .##o##.`,
    slalomA: `
      .#####.
      .##X##.
      .#####.
      .#X#X#.
      .#####.
      .##X##.
      .#####.
      .##o##.`,
    slalomB: `
      .#####.
      .X###X.
      .#####.
      .##X##.
      .#####.
      .X###X.
      .#####.
      .##o##.`,
    drift: `
      .#####.
      .#>>>#.
      .#####.
      .#>>>#.
      .#####.
      .#<<<#.
      .#####.
      .#<<<#.`,
    holes: `
      .#####.
      .##.##.
      .#####.
      .#.#.#.
      .#####.
      .##.##.
      .#####.
      .##o##.`,
    stopA: `
      .##*##.
      .#####.
      .#####.
      .##o##.
      .#####.
      .#####.
      .##X##.
      .#####.`,
    stopB: `
      .##*##.
      .#####.
      .##X##.
      .#####.
      .#X#X#.
      .#####.
      .##o##.
      .#####.`,
    turn: `
      .#####.
      ..####.
      ..####.
      ..#####
      ...####
      ...####
      ....###
      ....###`,
    gapA: `
      .#####.
      .#####.
      .##^##.
      .......
      .......
      .......
      .......
      .##o##.`,
    landing: `
      .#####.
      .#####.
      .##Q##.
      .#####.
      .#####.
      .#####.
      .##o##.
      .#####.`,
    posts: `
      ..###..
      ..###..
      ..#Q#..
      ..###..
      ..###..
      ..#o#..
      ..###..
      ..###..`,
    outro: `
      .#####.
      .#####.
      .##Q##.
      .#####.
      .#####.
      .#####.
      .#####.
      .#####.`,
  },

  arrangement: [
    'intro', 'intro2', 'open', 'slalomA',
    'drift', 'open', 'holes', 'stopA',
    'slalomA:m', 'turn', 'turn:m', 'open',
    'gapA', 'landing', 'drift:m', 'stopB',
    'slalomB', 'holes:m', 'turn:m', 'posts',
    'slalomB:m', 'drift', 'open', 'outro',
  ],

  /** Poteaux télégraphiques et broussailles le long du bas-côté. */
  decor(stage) {
    const { rows, box, colX, TILE } = stage;
    const c = this.palette.decor;
    for (let row = 6; row < rows; row += 8) {
      const side = (row / 8) % 2 === 0 ? -1 : 1;
      const x = side * (colX(6) + 5.5);
      const z = row * TILE;
      box(x, 3.4, z, 0.42, 6.8, 0.42, c);
      box(x, 6.1, z, 3.2, 0.28, 0.28, c);
      // Le câble rejoint le poteau suivant du même côté.
      box(x, 5.9, z + 8 * TILE, 0.1, 0.1, 16 * TILE, c);
    }
    for (let row = 3; row < rows; row += 5) {
      const side = row % 10 < 5 ? -1 : 1;
      const x = side * (colX(6) + 2.6 + (row % 3) * 0.5);
      box(x, 0.45, row * TILE, 1.5, 0.9, 1.5, 0x4a3a22);
    }
  },

  /**
   * Batterie aux balais, contrebasse qui marche, guitare qui commente.
   * Le ternaire est obtenu en repoussant les contretemps d'un tiers de temps,
   * sans toucher à la grille des lignes : le niveau reste binaire, la musique
   * balance.
   */
  pattern(step, t, s) {
    const bar = Math.floor(step / 8);
    const inBar = step % 8;
    const beat = Math.floor(inBar / 2);
    const offbeat = inBar % 2 === 1;
    const swing = offbeat ? s.stepDuration / 3 : 0;
    const tt = t + swing;
    const root = GRILLE[bar % 12];
    const cycle = Math.floor(bar / 12);
    const dernier = bar >= 20;

    if (!offbeat) {
      if (beat === 0 || beat === 2) s.kick(t, { level: 0.62, from: 130, to: 46 });
      if (beat === 1 || beat === 3) s.brush(t, { level: 0.26 });
      // Contrebasse : une note par temps, elle marche vers l'accord suivant.
      const suivant = GRILLE[(bar + 1) % 12];
      const note = beat === 3 && suivant !== root
        ? suivant - 1 + (suivant > root ? 0 : 2) // approche chromatique
        : root + MARCHE[beat];
      s.upright(t, note, s.stepDuration * 1.7, { level: 0.32 });
    }
    s.ride(tt, { level: offbeat ? 0.07 : 0.11 });

    // Accord de guitare sur les contretemps de deux et quatre.
    if (offbeat && (beat === 1 || beat === 3)) {
      for (const semi of [0, 4, 10]) {
        s.lead(tt, root + 24 + semi, s.stepDuration * 0.8,
          { level: 0.055, type: 'sawtooth', cutoff: 1700, echo: 0.12 });
      }
    }

    // Orgue en tenue à partir du deuxième tour.
    if (cycle >= 1 && inBar === 0) {
      s.organ(t, root + 12, s.stepDuration * 8, { level: 0.055 });
      s.organ(t, root + 19, s.stepDuration * 8, { level: 0.04 });
    }

    // Traits de guitare en fin de phrase, là où la grille respire.
    const lick = [0, 2, 3, 2, 0, 5, 3, 0];
    if ((bar % 4 === 3 || dernier) && inBar >= 2) {
      const midi = degree(SCALES.blues, root + 24, lick[inBar] + (dernier ? 3 : 0));
      s.guitar(tt, midi, s.stepDuration * 0.9, { level: 0.1, power: false });
    }
    if (bar % 12 === 11 && inBar === 6) s.crash(t, { level: 0.16 });
  },
};
