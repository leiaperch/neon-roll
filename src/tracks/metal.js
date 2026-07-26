import { SCALES, degree } from '../synth.js';

/**
 * Face B, piste 5. Mi phrygien, guitare en palm mute et double pédale. C'est
 * la piste la plus rapide du disque : le tempo pilote la vitesse de
 * défilement, donc les figures sont écrites large, un obstacle toutes les
 * deux lignes, sinon il n'y a plus le temps de lire.
 */

const E = 40;
// Riff en huit mesures : la quinte diminuée arrive à la sixième.
const GRILLE = [E, E, E + 1, E, E, E + 5, E + 6, E + 1];

export default {
  id: 'metal',
  face: 'B',
  index: 5,
  title: 'Enclume',
  genre: 'Metal',
  tagline: 'Un riff, une double pédale, aucune place pour hésiter.',
  bpm: 176,
  rowsPerBeat: 2,
  echoSteps: 2,
  scale: SCALES.phrygien,
  scaleRoot: 76,

  palette: {
    skyTop: 0x0a0203,
    skyBottom: 0x4a0c06,
    fog: 0x1a0604,
    floors: [0x2b2b30, 0x3a3a41, 0x232328],
    block: 0xff4a12,
    accent: 0xff8a1e,
    neon: 0xffc247,
    decor: 0x141216,
    ball: 0xd8d8e0,
  },

  phrases: {
    ouverture: `
      #######
      #######
      ###o###
      #######
      #######
      ###o###
      #######
      #######`,
    riff: `
      #######
      #######
      ##X#X##
      #######
      #######
      ##X#X##
      #######
      ###o###`,
    riff2: `
      #######
      #######
      #X###X#
      #######
      #######
      ###X###
      #######
      ###o###`,
    marteau: `
      .#####.
      .#####.
      .##~##.
      .#####.
      .#####.
      .##~##.
      .#####.
      .##o##.`,
    enclume: `
      .#####.
      .#####.
      .#B#B#.
      .#####.
      .#####.
      .##B##.
      .#####.
      .##o##.`,
    faille: `
      .#####.
      .#####.
      .##.##.
      .#####.
      .#####.
      .#.#.#.
      .#####.
      .##o##.`,
    passage: `
      ..###..
      ..###..
      ..###..
      ..#o#..
      ..###..
      ..###..
      ..###..
      ..###..`,
    virage: `
      .#####.
      .#####.
      ..####.
      ..####.
      ...###.
      ...###.
      ..####.
      ..####.`,
    forge: `
      .##*##.
      .#####.
      .#####.
      .##o##.
      .#####.
      .#####.
      .#####.
      .#####.`,
    envol: `
      .#####.
      .#####.
      .##^##.
      .......
      .......
      .......
      .......
      .##Q##.`,
    butin: `
      ..###..
      ..###..
      ..#Q#..
      ..###..
      .#####.
      .##o##.
      .#####.
      .#####.`,
    breakdown: `
      #######
      #######
      #X#X#X#
      #######
      #######
      ##X#X##
      #######
      ##o.o##`,
    breakdown2: `
      #######
      #######
      ##B#B##
      #######
      #######
      #B#B#B#
      #######
      ###Q###`,
    solo: `
      .#####.
      .#####.
      .#X#X#.
      .#####.
      .#####.
      .X#.#X.
      .#####.
      .##o##.`,
    fin: `
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
    'ouverture', 'riff', 'riff', 'forge',
    'riff2', 'marteau', 'riff:m', 'faille',
    'enclume', 'passage', 'virage', 'forge',
    'riff2:m', 'solo', 'faille:m', 'marteau:m',
    'breakdown', 'breakdown', 'enclume:m', 'forge',
    'envol', 'butin', 'riff', 'virage:m',
    'solo:m', 'marteau', 'passage', 'forge',
    'breakdown2', 'breakdown:m', 'riff2', 'faille',
    'enclume', 'solo', 'virage', 'forge',
    'breakdown2:m', 'marteau:m', 'riff:m', 'fin',
  ],

  /** Braseros, chaînes et enclumes le long de la forge. */
  decor(stage) {
    const { rows, box, neon, colX, TILE } = stage;
    const fer = this.palette.decor;
    for (let row = 3; row < rows; row += 6) {
      const z = row * TILE;
      const side = (row / 3) % 2 === 0 ? -1 : 1;
      const x = side * (colX(6) + 3);
      // Brasero : trépied, cuve, braises.
      box(x, 1.1, z, 0.3, 2.2, 0.3, fer);
      box(x, 2.4, z, 2.1, 0.9, 2.1, fer);
      neon(x, 2.95, z, 1.6, 0.3, 1.6, this.palette.block);
      neon(x, 3.2, z, 0.9, 0.3, 0.9, this.palette.accent);
    }
    for (let row = 0; row < rows; row += 12) {
      const z = row * TILE;
      for (const side of [-1, 1]) {
        const x = side * (colX(6) + 6.5);
        box(x, 4, z, 1.6, 8, 1.6, fer); // pilier
        // Chaîne suspendue entre deux piliers.
        box(0, 7.6, z, (colX(6) + 6.5) * 2, 0.22, 0.22, fer);
        for (let i = -2; i <= 2; i++) box(i * 3.2, 6.9, z, 0.16, 1.4, 0.16, fer);
      }
    }
  },

  /**
   * Guitare étouffée en croches, double pédale continue, caisse claire sur les
   * temps faibles. Le breakdown coupe la double pédale pour laisser le riff
   * respirer, comme le niveau ouvre la piste au même endroit.
   */
  pattern(step, t, s) {
    const bar = Math.floor(step / 8);
    const inBar = step % 8;
    const root = GRILLE[bar % 8];
    const intro = bar < 1;
    const breakdown = (bar >= 16 && bar < 18) || (bar >= 28 && bar < 30);
    const solo = (bar >= 12 && bar < 14) || (bar >= 24 && bar < 26);
    const fin = bar >= 39;

    // Double pédale : deux coups par ligne, sauf dans le breakdown.
    if (!intro && !breakdown && !fin) {
      s.kick(t, { level: 0.7, from: 150, to: 48, decay: 0.09 });
      s.kick(t + s.stepDuration / 2, { level: 0.6, from: 150, to: 48, decay: 0.09 });
    } else if (breakdown && inBar % 2 === 0) {
      s.kick(t, { level: 0.95, from: 170, to: 40, decay: 0.2 });
    }
    if (!intro && (inBar === 2 || inBar === 6)) s.snare(t, { level: 0.42, tone: 240, bright: 1900 });
    if (!intro && !breakdown) s.ride(t, { level: 0.07 });
    if (inBar === 0 && bar % 8 === 0) s.crash(t, { level: 0.26 });

    // Riff : croches étouffées sur la corde grave, ouvertes en fin de mesure.
    if (!intro) {
      const ouverte = inBar === 6 || inBar === 7;
      const note = breakdown && inBar % 2 === 1 ? root - 12 : root - 12 + (inBar === 5 ? 3 : 0);
      s.guitar(t, note, s.stepDuration * (ouverte ? 1.6 : 0.9), {
        level: breakdown ? 0.3 : 0.22,
        power: true,
        mute: !ouverte && !breakdown,
      });
    }

    // Basse doublée à l'octave inférieure, elle tient le bas du spectre.
    if (!intro && inBar % 2 === 0) {
      s.bass(t, root - 24, s.stepDuration * 1.8, { level: 0.26, cutoff: 700, floor: 180, q: 3 });
    }

    // Solo : gamme phrygienne rapide, quatre notes par ligne.
    if (solo || fin) {
      for (let i = 0; i < 4; i++) {
        const index = (inBar * 4 + i + bar) % 9;
        const midi = degree(SCALES.phrygien, root + 24, index);
        s.lead(t + (i * s.stepDuration) / 4, midi, s.stepDuration / 3,
          { level: 0.09, type: 'sawtooth', cutoff: 3600, echo: 0.25 });
      }
    }

    // Nappe sombre, une tenue par mesure, pour le poids.
    if (inBar === 0 && !intro) s.pad(t, root - 12, s.stepDuration * 8, { level: 0.05, type: 'sawtooth' });
  },
};
