import { GAMMES } from '../synth.js';

/**
 * Face B, piste 3. La mineur pour puce sonore.
 *
 * Ici les oscillateurs sont le sujet, pas un pis-aller : trois voix à
 * impulsion et une voie de bruit, comme la puce d'origine. Ce qui change,
 * c'est que le thème est écrit mesure par mesure au lieu d'être un arpège
 * calculé, avec une vraie montée sur les deux dernières mesures de chaque
 * phrase de huit.
 */

const BASSE = [45, 45, 41, 41, 48, 48, 43, 43];
const ACCORDS = [
  [69, 72, 76], [69, 72, 76], [65, 69, 72], [65, 69, 72],
  [64, 67, 72], [64, 67, 72], [67, 71, 74], [67, 71, 74],
];

/**
 * Le thème est bâti comme une chanson : le crochet de deux mesures est joué,
 * rejoué à l'identique, remplacé par un pont, puis rejoué une dernière fois
 * avec une autre chute. Deux mesures qui reviennent trois fois sur huit, c'est
 * ce qui fait qu'on ressort en le fredonnant.
 *
 * [croche, note, durée]. Les silences comptent autant que les notes.
 */
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

/** Mesure du cycle de huit vers la phrase à jouer : A A B A'. */
const THEME = [
  CROCHET[0], CROCHET[1], CROCHET[0], CROCHET[1],
  PONT[0], PONT[1], CROCHET_FIN[0], CROCHET_FIN[1],
];

/** Contre-chant grave, une note tenue par demi-mesure. */
const CONTRE = [
  [[0, 64, 4], [4, 67, 4]], [], [[0, 65, 4], [4, 69, 4]], [],
  [[0, 67, 4], [4, 72, 4]], [], [[0, 62, 4], [4, 67, 4]], [],
];

export default {
  id: 'chiptune',
  face: 'B',
  index: 3,
  title: 'Cartouche 03',
  genre: 'Chiptune',
  tagline: 'Trois voix, une voie de bruit, aucune excuse.',
  bpm: 150,
  rowsPerBeat: 2,
  echoSteps: 3,
  mix: 1.8,
  scale: GAMMES.mineur,
  scaleRoot: 81,
  instruments: [],
  percussions: [],

  palette: {
    skyTop: 0x100428,
    skyBottom: 0x3a0d6b,
    fog: 0x1a0736,
    floors: [0x2de1c2, 0x1fb8a0, 0x27cbb0],
    block: 0xff2e88,
    accent: 0xffe23d,
    neon: 0x8cff3d,
    decor: 0x6a1fb0,
    ball: 0xffffff,
  },

  phrases: {
    boot: `
      #######
      #######
      ###o###
      #######
      #######
      ###o###
      #######
      #######`,
    pixels: `
      .#####.
      .#.#.#.
      .#####.
      .#.#.#.
      .#####.
      .#.#.#.
      .#####.
      .##o##.`,
    damier: `
      .#####.
      .##.##.
      .#####.
      .#.#.#.
      .#####.
      .##.##.
      .#####.
      .##o##.`,
    risers: `
      .#####.
      .#B#B#.
      .#####.
      .##B##.
      .#####.
      .#B#B#.
      .#####.
      .##o##.`,
    tunnel: `
      ..###..
      ..###..
      ..#o#..
      ..###..
      ..###..
      ..###..
      ..#o#..
      ..###..`,
    zigzag: `
      .#####.
      .##X##.
      .#####.
      .#X#X#.
      .#####.
      .##X##.
      .#####.
      .##o##.`,
    tapis: `
      .#####.
      .#>>>#.
      .#####.
      .#<<<#.
      .#####.
      .#>>>#.
      .#####.
      .##o##.`,
    save: `
      .##*##.
      .#####.
      .#####.
      .##o##.
      .#####.
      .#####.
      .#####.
      .#####.`,
    warp: `
      .#####.
      .#####.
      .##^##.
      .......
      .......
      .......
      .......
      .##o##.`,
    bonus: `
      ..###..
      ..#Q#..
      ..###..
      .#####.
      .#####.
      .##o##.
      .#####.
      .#####.`,
    boss: `
      #######
      #X###X#
      #######
      ##B#B##
      #######
      #X###X#
      #######
      ##o.o##`,
    boss2: `
      #######
      ##X#X##
      #######
      #B#B#B#
      #######
      ##X#X##
      #######
      ###Q###`,
    escalier: `
      .#####.
      ..####.
      ..####.
      ...###.
      ...###.
      ..####.
      ..####.
      .#####.`,
    fin: `
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
    'boot', 'pixels', 'damier', 'save',
    'zigzag', 'tapis', 'pixels:m', 'escalier',
    'risers', 'tunnel', 'bonus', 'save',
    'warp', 'damier:m', 'zigzag:m', 'tapis:m',
    'boss', 'risers:m', 'escalier:m', 'save',
    'pixels', 'tunnel', 'boss2', 'damier',
    'zigzag', 'tapis', 'risers', 'save',
    'boss', 'boss2:m', 'pixels:m', 'escalier',
    'warp', 'tunnel', 'damier', 'fin',
  ],

  decor(stage) {
    const { rows, box, neon, colX, TILE } = stage;
    const carte = this.palette.decor;
    const piste = this.palette.neon;
    for (let row = 0; row < rows; row += 4) {
      const z = row * TILE;
      for (const side of [-1, 1]) {
        const x = side * (colX(6) + 3);
        box(x, -0.4, z, 5.5, 0.5, 3.2, carte);
        neon(x, -0.1, z, 4.6, 0.08, 0.16, piste);
        if ((row / 4) % 3 === 0) {
          box(x, 0.5, z, 2.2, 1.2, 1.4, 0x14061f);
          for (let i = -1; i <= 1; i++) neon(x + i * 0.7, 0.02, z + 0.85, 0.28, 0.1, 0.5, this.palette.accent);
        } else if ((row / 4) % 3 === 1) {
          box(x, 0.9, z, 1, 2, 1, 0x2a0a44);
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
    const finale = bar >= 32;

    // Voie de bruit : la batterie de la puce.
    if (!intro && !rupture) {
      if (inBar % 4 === 0) s.kickMachine(t, { level: 0.45, from: 210, to: 55, decay: 0.13 });
      if (inBar === 4) s.bruitPuce(t, { level: 0.3, decay: 0.12, aigu: 2400 });
      if (inBar % 2 === 1) s.bruitPuce(t, { level: 0.1, decay: 0.03 });
    }

    // Basse : croches, avec une octave sur la fin de mesure.
    if (!intro && !rupture) {
      const octave = inBar >= 6 ? 12 : 0;
      s.puce(t, basse - 12 + octave, croche * 0.45, { level: 0.24, duty: 0.25 });
    }

    // Accompagnement : accord brisé en doubles croches, deux notes par ligne.
    if (!rupture) {
      for (let i = 0; i < 2; i++) {
        const note = accord[(inBar * 2 + i) % accord.length] + (seconde ? 12 : 0);
        s.puce(t + (i * croche) / 2, note, croche / 2, {
          level: intro ? 0.07 : 0.1, duty: i === 0 ? 0.125 : 0.5,
        });
      }
    }

    // Thème. Il n'entre qu'à la fin de l'intro, doublé à l'octave au final.
    if (!intro || bar === 3) {
      for (const [pas, note, duree] of THEME[mesure]) {
        if (pas !== inBar) continue;
        s.puce(t, note, duree * croche * 0.95, { level: 0.2, duty: 0.5, vibrato: finale ? 4 : 0 });
        if (finale) s.puce(t, note - 12, duree * croche * 0.9, { level: 0.1, duty: 0.25 });
      }
    }

    // Contre-chant, une voix de plus dans la seconde moitié.
    if (seconde && !rupture) {
      for (const [pas, note, duree] of CONTRE[mesure]) {
        if (pas === inBar) s.puce(t, note, duree * croche * 0.9, { level: 0.09, duty: 0.5 });
      }
    }

    // Rupture : tout se tait sauf une montée, puis la reprise frappe.
    if (rupture && inBar === 0) s.montee(t, croche * 8, { level: 0.12 });
    if (bar === 22 && inBar === 0) s.bruitPuce(t, { level: 0.4, decay: 0.5, aigu: 1200 });
  },
};
