import { GAMMES } from '../synth.js';

/**
 * Face B, piste 4. Fa dièse mineur, quatre temps au sol.
 *
 * La machine tient le rythme, mais les cordes tiennent la mélodie : le pont
 * confie la progression à un violoncelle et un violon, et c'est eux qui
 * ramènent le morceau après la rupture. La piste répète les mêmes figures en
 * les décalant, comme le motif répète la même mesure en ouvrant un filtre.
 */

const BASSE = [42, 42, 38, 38, 45, 45, 40, 40];
const ACCORDS = [
  [61, 66, 69], [61, 66, 69], [62, 66, 69], [62, 66, 69],
  [61, 64, 69], [61, 64, 69], [59, 64, 68], [59, 64, 68],
];
/** Rythme de basse : croches jouées, croches tues. Le silence fait le groove. */
const RYTHME_BASSE = [0, 3, 4, 6, 7];
/**
 * La cellule d'aigus, une mesure. Elle ne change jamais de rythme : elle est
 * seulement transposée quand l'accord bouge, et sa dernière note tombe une
 * mesure sur quatre. C'est la répétition obstinée qui fait entrer le motif, pas
 * la variation.
 */
const CELLULE = [[2, 78, 1], [3, 78, 1], [5, 81, 1], [6, 78, 2]];
const CELLULE_FIN = [[2, 78, 1], [3, 78, 1], [5, 76, 1], [6, 73, 3]];
/** Transposition par mesure, elle suit la basse. */
const TRANSPO = [0, 0, -4, -4, 3, 3, -2, -2];

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
  mix: 1.3,
  scale: GAMMES.mineur,
  scaleRoot: 78,
  instruments: ['violon', 'violoncelle'],
  percussions: ['charleston', 'charlestonOuvert', 'crash', 'caisseClaire'],

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

  decor(stage) {
    const { rows, box, neon, colX, TILE } = stage;
    const noir = this.palette.decor;
    for (let row = 2; row < rows; row += 8) {
      const z = row * TILE;
      for (const side of [-1, 1]) {
        const x = side * (colX(6) + 3.4);
        for (let i = 0; i < 3; i++) box(x, 1 + i * 2, z, 3.4, 1.9, 2.4, noir);
        neon(x, 0.02, z, 3.6, 0.1, 2.6, this.palette.accent);
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

  pattern(step, t, s) {
    const bar = Math.floor(step / 8);
    const inBar = step % 8;
    const mesure = bar % 8;
    const croche = s.stepDuration;
    const basse = BASSE[mesure];
    const accord = ACCORDS[mesure];

    const intro = bar < 4;
    const pont = bar >= 20 && bar < 22; // les cordes prennent la main
    const drop = bar >= 16 && bar < 20;
    const final = bar >= 32;

    // --- Machine ---
    if (!pont) {
      if (inBar % 2 === 0) s.kickMachine(t, { level: 0.9 });
      if (inBar % 2 === 1) s.charleston(t, { level: intro ? 0.14 : 0.2, ouvert: inBar % 4 === 3 });
      if (inBar === 4 && !intro) s.clap(t, { level: 0.28 });
      if (inBar === 4 && (drop || final)) s.caisseClaire(t, { level: 0.22 });
    } else if (inBar % 2 === 1) {
      s.charleston(t, { level: 0.1, ouvert: true });
    }
    if ((bar === 16 || bar === 22 || bar === 32) && inBar === 0) s.crash(t, { level: 0.3 });

    // --- Basse : rythme troué, filtre qui s'ouvre sur la mesure ---
    if (!intro && !pont && RYTHME_BASSE.includes(inBar)) {
      const ouverture = 480 + Math.abs(4 - inBar) * 420 + (drop || final ? 1000 : 0);
      const octave = inBar === 7 ? 12 : 0;
      s.basse(t, basse - 12 + octave, croche * (inBar === 6 ? 1.6 : 0.85), {
        level: 0.3, cutoff: ouverture, floor: 200, q: 9,
      });
    }

    // --- Cordes : nappe discrète, puis seules au pont ---
    if (inBar === 0) {
      if (pont) {
        s.violoncelle(t, basse, croche * 8, { level: 0.36 });
        s.violon(t, accord[1] + 12, croche * 8, { level: 0.3 });
        s.violon(t, accord[2] + 12, croche * 8, { level: 0.22 });
      } else if (!drop && !intro) {
        s.violoncelle(t, basse, croche * 8, { level: 0.16 });
      }
    }
    if (pont && inBar === 4) s.violon(t, accord[2] + 19, croche * 4, { level: 0.26 });

    // --- Accord plaqué sur les contretemps ---
    if (!intro && !pont && (inBar === 3 || inBar === 5)) {
      s.stab(t, accord, croche * 0.5, { level: drop || final ? 0.11 : 0.075, echo: 0.4 });
    }

    // --- Cellule d'aigus, à partir du drop : toujours la même, transposée ---
    if ((drop || bar >= 24) && !pont) {
      const cellule = mesure === 7 ? CELLULE_FIN : CELLULE;
      for (const [pas, note, duree] of cellule) {
        if (pas === inBar) {
          s.stab(t, [note + TRANSPO[mesure]], duree * croche * 0.8, { level: 0.09, echo: 0.5 });
        }
      }
    }

    if (bar === 21 && inBar === 4) s.montee(t, croche * 12, { level: 0.13 });
  },
};
