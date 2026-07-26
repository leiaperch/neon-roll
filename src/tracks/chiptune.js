import { SCALES, degree } from '../synth.js';

/**
 * Face B, piste 3. La mineur, ondes carrées et bruit blanc. Tout est carré :
 * les trous en damier, les blocs qui sortent sur le temps, les couleurs.
 */

const A = 45;
const GRILLE = [A, A, A + 5, A + 5, A + 3, A + 3, A + 7, A + 7];
const ARPEGE = [0, 2, 4, 7, 9, 7, 4, 2];

export default {
  id: 'chiptune',
  face: 'B',
  index: 3,
  title: 'Cartouche 03',
  genre: 'Chiptune',
  tagline: 'Quatre voix, aucune excuse.',
  bpm: 150,
  rowsPerBeat: 2,
  echoSteps: 3,
  scale: SCALES.mineur,
  scaleRoot: 81,

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

  /** Pistes de circuit imprimé et composants le long de la carte. */
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
          // Composant : un boîtier noir et ses broches.
          box(x, 0.5, z, 2.2, 1.2, 1.4, 0x14061f);
          for (let i = -1; i <= 1; i++) neon(x + i * 0.7, 0.02, z + 0.85, 0.28, 0.1, 0.5, this.palette.accent);
        } else if ((row / 4) % 3 === 1) {
          box(x, 0.9, z, 1, 2, 1, 0x2a0a44); // condensateur
          neon(x, 1.95, z, 1.05, 0.14, 1.05, this.palette.block);
        }
      }
    }
  },

  /** Trois voix mélodiques et une voie de bruit, comme la puce d'origine. */
  pattern(step, t, s) {
    const bar = Math.floor(step / 8);
    const inBar = step % 8;
    const root = GRILLE[bar % 8];
    const quart = s.stepDuration / 2;
    const intro = bar < 4;
    const boss = bar >= 16 && bar < 20;
    const finale = bar >= 32;

    // Voie de bruit : grosse caisse et caisse claire simulées.
    if (!intro) {
      if (inBar % 4 === 0) s.kick(t, { level: 0.8, from: 220, to: 55, decay: 0.14 });
      if (inBar === 4) s.snare(t, { level: 0.34, bright: 2600, decay: 0.1 });
      if (inBar % 2 === 1) s.hat(t, { level: 0.14 });
    } else if (inBar % 2 === 0) {
      s.hat(t, { level: 0.1 });
    }

    // Basse en impulsion étroite, deux notes par ligne.
    if (!intro) {
      for (const [off, semi] of [[0, 0], [quart, inBar % 2 === 0 ? 0 : 12]]) {
        s.chip(t + off, root - 12 + semi, s.stepDuration * 0.45, { level: 0.15, duty: 0.25 });
      }
    }

    // Arpège rapide : quatre notes par ligne, c'est la signature du format.
    const vitesse = boss || finale ? 4 : 2;
    for (let i = 0; i < vitesse; i++) {
      const index = ARPEGE[(inBar * vitesse + i) % 8] + (boss ? 7 : 0);
      const midi = degree(SCALES.mineur, root + 24, index);
      s.chip(t + (i * s.stepDuration) / vitesse, midi, s.stepDuration / vitesse,
        { level: 0.075, duty: i % 2 ? 0.5 : 0.125 });
    }

    // Contre-chant tenu, une note par demi-mesure.
    if (inBar % 4 === 0 && !intro) {
      const midi = degree(SCALES.mineur, root + 12, inBar === 0 ? 4 : 2);
      s.chip(t, midi, s.stepDuration * 3.6, { level: 0.06, duty: 0.5, vibrato: 5 });
    }
  },
};
