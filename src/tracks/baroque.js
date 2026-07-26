import { GAMMES } from '../synth.js';

/**
 * Face A, piste 2. Ré mineur pour clavecin, violon, violoncelle et orgue.
 *
 * La pièce est construite comme une fugue courte : un sujet exposé au
 * clavecin, sa réponse à la quinte, puis l'entrée successive du violon et du
 * violoncelle, des épisodes en accords brisés, et un retour du sujet en
 * imitation serrée avant la cadence. La piste suit la même logique de
 * symétries, phrases jouées puis reprises en miroir.
 */

// Huit mesures, une fondamentale par mesure : Dm Gm A Dm Bb F Gm A7.
const BASSE = [50, 43, 45, 50, 46, 41, 43, 45];

/** Notes de l'accord de chaque mesure, pour la basse continue du clavecin. */
const ACCORDS = [
  [62, 65, 69, 74], [62, 67, 70, 74], [61, 64, 69, 73], [62, 65, 69, 74],
  [62, 65, 70, 74], [60, 65, 69, 72], [62, 67, 70, 74], [60, 64, 69, 73],
];
const BRISE = [0, 2, 1, 3, 2, 1, 0, 2];

/**
 * Le sujet, deux mesures. Il a un rythme avant d'avoir des notes : une longue,
 * deux brèves, une longue. C'est ce dessin rythmique qu'on reconnaît quand il
 * revient au violon, au violoncelle, puis en imitation serrée. Une suite de
 * croches égales, elle, ne se reconnaît pas.
 *
 * [croche, note, durée en croches].
 */
const SUJET = [
  [[0, 74, 2], [2, 76, 1], [3, 77, 1], [4, 79, 2], [6, 77, 2]],
  [[0, 76, 1], [1, 74, 1], [2, 73, 2], [4, 74, 4]],
];

/** La réponse, à la quinte, ajustée pour rester dans le mode. */
const REPONSE = [
  [[0, 81, 2], [2, 83, 1], [3, 84, 1], [4, 86, 2], [6, 84, 2]],
  [[0, 83, 1], [1, 81, 1], [2, 79, 2], [4, 81, 4]],
];

/** Contre-sujet : il occupe les silences du sujet, jamais ses temps forts. */
const CONTRE = [
  [[0, 69, 2], [2, 72, 2], [4, 71, 1], [5, 69, 1], [6, 67, 2]],
  [[0, 65, 2], [2, 67, 2], [4, 69, 4]],
];

/** Marche du violoncelle dans les épisodes : croches conjointes. */
const MARCHE = [
  [50, 52, 53, 55, 57, 55, 53, 52],
  [43, 45, 47, 48, 50, 48, 47, 45],
];

/** Joue les notes d'une phrase qui tombent sur la croche courante. */
function phrase(table, mesure, inBar, jouer) {
  for (const [pas, note, duree] of table[mesure % table.length]) {
    if (pas === inBar) jouer(note, duree);
  }
}

export default {
  id: 'baroque',
  face: 'A',
  index: 2,
  title: 'Cabinet des Miroirs',
  genre: 'Baroque',
  tagline: 'Un sujet, sa réponse, et beaucoup trop de dorures.',
  bpm: 100,
  rowsPerBeat: 2,
  echoSteps: 4,
  mix: 1.7,
  scale: GAMMES.mineur,
  scaleRoot: 74,
  instruments: ['clavecin', 'violon', 'violoncelle', 'orgue'],
  percussions: [],

  palette: {
    skyTop: 0x0d1410,
    skyBottom: 0x2c4436,
    fog: 0x16221c,
    floors: [0xe6ddc6, 0xcfc3a6, 0xb9a97f],
    block: 0x2f4034,
    accent: 0xd9a441,
    neon: 0xffd98a,
    decor: 0xe8e0cb,
    ball: 0xfff6e0,
  },

  phrases: {
    portique: `
      #######
      #######
      ###o###
      #######
      #######
      ###o###
      #######
      #######`,
    galerie: `
      .#####.
      .#####.
      .X###X.
      .#####.
      .#####.
      .X###X.
      .#####.
      .##o##.`,
    miroir: `
      .#####.
      .#X#X#.
      .#####.
      .X#.#X.
      .#####.
      .#X#X#.
      .#####.
      .##o##.`,
    grille: `
      .#####.
      .##o##.
      .LLLLL.
      .#####.
      .##o##.
      .LLLLL.
      .#####.
      .#####.`,
    grilleSerree: `
      .#####.
      .#X#X#.
      .#####.
      .LLLLL.
      .#####.
      .#X#X#.
      .#####.
      .LLLLL.`,
    passerelle: `
      ..###..
      ..###..
      ..#o#..
      ..###..
      ..###..
      ..#o#..
      ..###..
      ..###..`,
    pont: `
      .#####.
      ..###..
      ...P...
      ...P...
      ...P...
      ...P...
      ..###..
      .#####.`,
    degres: `
      .#####.
      ..####.
      ..####.
      ...###.
      ...###.
      ..####.
      ..####.
      .#####.`,
    halte: `
      .##*##.
      .#####.
      .#####.
      .##o##.
      .#####.
      .#####.
      .#####.
      .#####.`,
    saut: `
      .#####.
      .#####.
      .##^##.
      .......
      .......
      .......
      .......
      .##Q##.`,
    couronne: `
      ..###..
      ..#Q#..
      ..###..
      .#####.
      .#####.
      .##o##.
      .#####.
      .#####.`,
    cadence: `
      .#####.
      .#X#X#.
      .#####.
      .##Q##.
      .#####.
      .#####.
      .#####.
      .#####.`,
    coda: `
      #######
      #######
      ###o###
      #######
      #######
      #######
      #######
      #######`,
  },

  arrangement: [
    'portique', 'galerie', 'miroir', 'halte',
    'grille', 'degres', 'degres:m', 'galerie:m',
    'miroir:m', 'passerelle', 'couronne', 'halte',
    'pont', 'grille', 'galerie', 'miroir',
    'saut', 'degres:m', 'grilleSerree', 'halte',
    'pont', 'passerelle', 'miroir:m', 'galerie:m',
    'grilleSerree', 'cadence', 'portique', 'coda',
  ],

  decor(stage) {
    const { rows, box, neon, colX, TILE } = stage;
    const pierre = this.palette.decor;
    const or = this.palette.accent;
    for (let row = 4; row < rows; row += 8) {
      const z = row * TILE;
      for (const side of [-1, 1]) {
        const x = side * (colX(6) + 3.2);
        box(x, 0.35, z, 2.2, 0.7, 2.2, pierre);
        for (let i = 0; i < 3; i++) box(x, 3.2, z, 1.1 - i * 0.05, 5.2, 1.1 - i * 0.05, pierre);
        box(x, 5.95, z, 1.9, 0.5, 1.9, pierre);
        neon(x, 6.3, z, 1.2, 0.16, 1.2, or);
      }
      if ((row / 8) % 2 === 1) {
        box(0, 7.1, z, (colX(6) + 3.2) * 2, 0.55, 1.1, pierre);
        neon(0, 6.75, z, (colX(6) + 2.6) * 2, 0.14, 0.5, or);
      }
    }
  },

  /**
   * Exposition (0-11), épisodes (12-19), imitation serrée (20-25), cadence.
   * Chaque voix entre à son tour, c'est ce qui donne la sensation de fugue.
   */
  pattern(step, t, s) {
    const bar = Math.floor(step / 8);
    const inBar = step % 8;
    const croche = s.stepDuration;
    const accord = ACCORDS[bar % 8];
    const basse = BASSE[bar % 8];

    const exposition = bar < 12;
    const episode = bar >= 12 && bar < 20;
    const serre = bar >= 20 && bar < 26;
    const cadence = bar >= 26;

    // --- Clavecin ---
    if (bar < 2) {
      phrase(SUJET, bar, inBar, (n, d) => s.clavecin(t, n, d * croche * 0.95, { level: 0.4 }));
    } else if (bar < 4) {
      phrase(REPONSE, bar, inBar, (n, d) => s.clavecin(t, n, d * croche * 0.95, { level: 0.4 }));
    } else if (exposition || episode) {
      // Basse continue en accords brisés, avec la fondamentale sur les temps.
      const note = accord[BRISE[inBar]];
      s.clavecin(t, note, croche * 0.9, { level: 0.26 });
      if (inBar % 4 === 0) s.clavecin(t, basse + 12, croche * 2, { level: 0.2 });
    } else if (serre) {
      phrase(SUJET, bar, inBar, (n, d) => s.clavecin(t, n, d * croche * 0.95, { level: 0.36 }));
    } else if (cadence) {
      if (inBar % 2 === 0) s.accord('clavecin', t, accord, croche * 2, { level: 0.3, gratte: 0.014 });
      if (bar === 27 && inBar >= 4) {
        // Trille final entre la sensible et la tonique.
        s.clavecin(t, inBar % 2 === 0 ? 73 : 74, croche * 0.5, { level: 0.28 });
        s.clavecin(t + croche / 2, inBar % 2 === 0 ? 74 : 73, croche * 0.5, { level: 0.24 });
      }
    }

    // --- Violon : entre à la mesure 4, prend le sujet à l'octave ---
    if (bar >= 4 && bar < 6) {
      phrase(SUJET, bar, inBar, (n, d) => s.violon(t, n + 12, d * croche * 1.05, { level: 0.34 }));
    } else if (bar >= 6 && bar < 12) {
      phrase(CONTRE, bar, inBar, (n, d) => s.violon(t, n + 12, d * croche, { level: 0.28 }));
    } else if (episode && inBar % 2 === 0) {
      // Tenues expressives sur les temps, deux notes de l'accord.
      s.violon(t, accord[3] + (bar % 2 === 0 ? 0 : 3), croche * 2, { level: 0.26 });
    } else if (serre && bar >= 21) {
      // Imitation : le violon reprend le sujet une mesure après le clavecin.
      phrase(SUJET, bar - 1, inBar, (n, d) => s.violon(t, n + 12, d * croche, { level: 0.3 }));
    } else if (cadence && inBar === 0) {
      s.violon(t, bar === 26 ? 81 : 86, croche * 8, { level: 0.32 });
    }

    // --- Violoncelle : entre à la mesure 8 ---
    if (bar >= 8 && bar < 10) {
      phrase(SUJET, bar, inBar, (n, d) => s.violoncelle(t, n - 24, d * croche * 1.05, { level: 0.34 }));
    } else if (episode) {
      // Marche continue : c'est la basse qui tient l'épisode debout.
      s.violoncelle(t, MARCHE[bar % MARCHE.length][inBar] - 12, croche * 1.05, { level: 0.24 });
    } else if (bar >= 10 && inBar === 0) {
      s.violoncelle(t, basse - 12, croche * 8, { level: 0.32 });
    }

    // --- Orgue : pédale, à partir de l'entrée du violoncelle ---
    if (bar >= 8 && inBar === 0) {
      s.orgue(t, basse - 12, croche * 8, { level: cadence ? 0.2 : 0.13 });
      if (bar >= 20) s.orgue(t, basse - 5, croche * 8, { level: 0.09 });
    }
  },
};
