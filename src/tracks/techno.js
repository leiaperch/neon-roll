import { SCALES, degree } from '../synth.js';

/**
 * Face B, piste 4. Fa dièse mineur, quatre temps au sol. La piste répète les
 * mêmes figures en les décalant d'une colonne, comme le motif répète la même
 * mesure en changeant un filtre : la difficulté monte sans rien annoncer.
 */

const FS = 42;
const GRILLE = [FS, FS, FS, FS, FS - 2, FS - 2, FS + 3, FS + 1];

export default {
  id: 'techno',
  face: 'B',
  index: 4,
  title: 'Sous-sol, 4 h',
  genre: 'Techno',
  tagline: 'La même mesure, jusqu’à ce qu’elle devienne autre chose.',
  bpm: 132,
  rowsPerBeat: 2,
  echoSteps: 3,
  scale: SCALES.mineur,
  scaleRoot: 78,

  palette: {
    skyTop: 0x000000,
    skyBottom: 0x101018,
    fog: 0x07070c,
    floors: [0x1e1e26, 0x2a2a36, 0x16161c],
    block: 0xf2f2f2,
    accent: 0x00e5ff,
    neon: 0xffffff,
    decor: 0x0c0c12,
    ball: 0xdfefff,
  },

  phrases: {
    entree: `
      #######
      #######
      ###o###
      #######
      #######
      ###o###
      #######
      #######`,
    boucle: `
      .#####.
      .##X##.
      .#####.
      .#####.
      .##X##.
      .#####.
      .#####.
      .##o##.`,
    boucle2: `
      .#####.
      .#X#X#.
      .#####.
      .#####.
      .#X#X#.
      .#####.
      .#####.
      .##o##.`,
    balayage: `
      .#####.
      .##~##.
      .#####.
      .#####.
      .##~##.
      .#####.
      .#####.
      .##o##.`,
    coulisse: `
      .#####.
      .##=##.
      .#####.
      .#####.
      .##=##.
      .#####.
      .#####.
      .##o##.`,
    faisceaux: `
      .#####.
      .##o##.
      .LLLLL.
      .#####.
      .#####.
      .LLLLL.
      .#####.
      .#####.`,
    faisceauxSerres: `
      .#####.
      .LLLLL.
      .#####.
      .LLLLL.
      .#####.
      .LLLLL.
      .#####.
      .##o##.`,
    creux: `
      .#####.
      .##.##.
      .#####.
      .#.#.#.
      .#####.
      .##.##.
      .#####.
      .##o##.`,
    corridor: `
      ..###..
      ..###..
      ..###..
      ..#o#..
      ..###..
      ..###..
      ..###..
      ..#o#..`,
    decalage: `
      .#####.
      ..####.
      ..####.
      ...###.
      ...###.
      ..####.
      ..####.
      .#####.`,
    arret: `
      .##*##.
      .#####.
      .#####.
      .##o##.
      .#####.
      .#####.
      .#####.
      .#####.`,
    montee: `
      .#####.
      .#####.
      .##^##.
      .......
      .......
      .......
      .......
      .##Q##.`,
    prime: `
      ..###..
      ..#Q#..
      ..###..
      .#####.
      .#####.
      .##o##.
      .#####.
      .#####.`,
    drop: `
      #######
      #X###X#
      #######
      ###~###
      #######
      #X###X#
      #######
      ##o.o##`,
    dropDur: `
      #######
      ##X#X##
      #######
      #X#X#X#
      #######
      ##X#X##
      #######
      ###Q###`,
    sortie: `
      .#####.
      .#####.
      .##o##.
      .#####.
      .#####.
      .#####.
      .#####.
      .#####.`,
  },

  arrangement: [
    'entree', 'boucle', 'boucle', 'arret',
    'boucle2', 'balayage', 'boucle:m', 'decalage',
    'faisceaux', 'coulisse', 'corridor', 'arret',
    'creux', 'balayage:m', 'boucle2:m', 'decalage:m',
    'drop', 'boucle2', 'faisceaux', 'arret',
    'montee', 'prime', 'coulisse:m', 'creux:m',
    'faisceauxSerres', 'balayage', 'corridor', 'arret',
    'drop', 'dropDur', 'boucle2:m', 'balayage:m',
    'faisceauxSerres', 'creux', 'boucle', 'sortie',
  ],

  /** Piles d'enceintes et tours de structure, éclairées par en dessous. */
  decor(stage) {
    const { rows, box, neon, colX, TILE } = stage;
    const noir = this.palette.decor;
    for (let row = 2; row < rows; row += 8) {
      const z = row * TILE;
      for (const side of [-1, 1]) {
        const x = side * (colX(6) + 3.4);
        for (let i = 0; i < 3; i++) box(x, 1 + i * 2, z, 3.4, 1.9, 2.4, noir);
        neon(x, 0.02, z, 3.6, 0.1, 2.6, this.palette.accent);
        // Membranes, en relief sur la face avant.
        for (let i = 0; i < 3; i++) box(x - side * 1.75, 1 + i * 2, z, 0.12, 1.3, 1.6, 0x1c1c26);
      }
    }
    for (let row = 6; row < rows; row += 16) {
      const z = row * TILE;
      for (const side of [-1, 1]) {
        const x = side * (colX(6) + 1.6);
        box(x, 5, z, 0.24, 10, 0.24, noir);
        box(x, 9.9, z, 1.6, 0.5, 0.5, noir);
        neon(x, 9.6, z, 0.8, 0.2, 0.35, this.palette.accent);
      }
    }
  },

  /** Grosse caisse au sol, clap décalé, basse acide et nappe de stab. */
  pattern(step, t, s) {
    const bar = Math.floor(step / 8);
    const inBar = step % 8;
    const root = GRILLE[bar % 8];
    const intro = bar < 4;
    const pause = bar >= 20 && bar < 22;
    const drop = bar >= 16 && bar < 20;
    const final = bar >= 32;

    if (!pause) {
      if (inBar % 2 === 0) s.kick(t, { level: 0.95, from: 175, to: 42, decay: 0.26 });
      if (inBar % 2 === 1) s.hat(t, { level: intro ? 0.14 : 0.2, open: inBar % 4 === 3 });
      if ((inBar === 4 || inBar === 12 % 8) && !intro) s.clap(t, { level: 0.3 });
    } else if (inBar % 2 === 1) {
      s.hat(t, { level: 0.12, open: true });
    }

    // Basse acide : filtre qui s'ouvre puis se referme sur la mesure.
    if (!intro && !pause) {
      const ouverture = 500 + Math.abs(4 - inBar) * 420 + (drop || final ? 900 : 0);
      const octave = inBar === 3 || inBar === 7 ? 12 : 0;
      s.bass(t, root - 12 + octave, s.stepDuration * 0.9,
        { level: 0.28, cutoff: ouverture, floor: 220, q: 9 });
    }

    // Stab : un accord bref sur les contretemps, avec écho.
    if ((drop || final || bar % 4 === 3) && (inBar === 3 || inBar === 5)) {
      for (const semi of [0, 3, 7]) {
        s.lead(t, root + 24 + semi, s.stepDuration * 0.5,
          { level: 0.075, type: 'sawtooth', cutoff: 2600, echo: 0.4 });
      }
    }

    // Nappe présente partout sauf pendant la rupture, où le bruit monte.
    if (inBar === 0 && !drop) s.pad(t, root + 12, s.stepDuration * 8, { level: pause ? 0.12 : 0.06 });
    if (pause && inBar === 0) s.riser(t, s.stepDuration * 8, { level: 0.14 });
    if (bar === 22 && inBar === 0) s.crash(t, { level: 0.3 });

    // Motif d'aigus qui n'apparaît qu'après la moitié du morceau.
    if (bar >= 24 && inBar % 2 === 1) {
      const midi = degree(SCALES.mineur, root + 36, (inBar + bar) % 5);
      s.lead(t, midi, s.stepDuration * 0.4, { level: 0.05, type: 'square', cutoff: 4200, echo: 0.5 });
    }
  },
};
