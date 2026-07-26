import { GAMMES } from '../synth.js';

/**
 * Face B, piste 5. Mi phrygien, deux guitares et une double pédale.
 *
 * Le riff est écrit corde par corde : chaque croche porte sa note et son
 * étouffement de paume, parce que c'est l'alternance entre étouffé et ouvert
 * qui fait le riff, pas la note elle-même. Le pont confie le thème à un
 * violoncelle, puis les guitares le reprennent à l'unisson.
 *
 * C'est la piste la plus rapide du disque : le tempo pilote la vitesse de
 * défilement, donc les figures de la carte sont écrites large.
 */

// Fondamentale par mesure, sur huit mesures. La seconde mineure est la couleur
// du mode phrygien, la quinte diminuée arrive à la sixième mesure.
const GRILLE = [40, 40, 41, 40, 40, 45, 46, 41];

/**
 * Riffs, une mesure de croches : [croche, note, étouffée].
 * Une note étouffée claque et s'arrête, une note ouverte sonne.
 */
const RIFFS = {
  A: [[0, 40, 0], [1, 40, 1], [2, 40, 1], [3, 41, 0], [4, 40, 1], [5, 40, 1], [6, 38, 0], [7, 40, 1]],
  B: [[0, 40, 1], [1, 40, 1], [2, 43, 0], [3, 41, 0], [4, 40, 1], [5, 40, 1], [6, 45, 0], [7, 44, 0]],
  C: [[0, 40, 0], [2, 41, 0], [4, 43, 0], [6, 40, 0]],
  D: [[0, 40, 1], [1, 40, 1], [2, 40, 1], [3, 40, 1], [4, 46, 0], [6, 45, 0]],
};
const SUITE = ['A', 'A', 'B', 'A', 'A', 'B', 'D', 'C'];

/**
 * Thème du pont, quatre mesures : deux notes tenues et une chute. Il revient
 * identique à la fin, joué par les guitares à l'unisson, et c'est lui qu'on
 * doit avoir en tête en reposant le téléphone.
 */
const THEME = [
  [[0, 64, 3], [3, 65, 1], [4, 67, 4]],
  [[0, 65, 2], [2, 64, 2], [4, 60, 4]],
  [[0, 64, 3], [3, 65, 1], [4, 70, 4]],
  [[0, 68, 2], [2, 67, 2], [4, 64, 4]],
];

/**
 * Chant du solo. Quatre mesures bâties sur le même geste : une note attaquée
 * et tenue, une inflexion, une chute. La phrase se répète en changeant sa
 * dernière note, comme une question puis sa réponse.
 *
 * Le trait rapide n'arrive qu'une fois, en fin de phrase. Une gamme jouée en
 * continu n'est pas un solo, c'est un exercice : elle n'a ni respiration ni
 * note d'arrivée, donc rien à retenir.
 */
const CHANT_SOLO = [
  [[0, 76, 3], [3, 77, 1], [4, 79, 4]],
  [[0, 77, 2], [2, 76, 2], [4, 72, 4]],
  [[0, 76, 3], [3, 77, 1], [4, 81, 4]],
  [[0, 79, 2], [2, 77, 1], [3, 76, 1], [4, 74, 2], [6, 76, 2]],
];

/** Le trait, une seule fois, sur le dernier temps de la phrase. */
const TRAIT = [76, 77, 79, 81, 83, 84, 83, 81];

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
  mix: 0.32,
  scale: GAMMES.phrygien,
  scaleRoot: 76,
  instruments: ['guitare', 'contrebasse', 'violoncelle'],
  percussions: ['grosseCaisse', 'caisseClaire', 'ride', 'crash', 'charleston', 'tomGrave', 'tomAigu'],

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

  decor(stage) {
    const { rows, box, neon, colX, TILE } = stage;
    const fer = this.palette.decor;
    for (let row = 3; row < rows; row += 6) {
      const z = row * TILE;
      const side = (row / 3) % 2 === 0 ? -1 : 1;
      const x = side * (colX(6) + 3);
      box(x, 1.1, z, 0.3, 2.2, 0.3, fer);
      box(x, 2.4, z, 2.1, 0.9, 2.1, fer);
      neon(x, 2.95, z, 1.6, 0.3, 1.6, this.palette.block);
      neon(x, 3.2, z, 0.9, 0.3, 0.9, this.palette.accent);
    }
    for (let row = 0; row < rows; row += 12) {
      const z = row * TILE;
      for (const side of [-1, 1]) {
        const x = side * (colX(6) + 6.5);
        box(x, 4, z, 1.6, 8, 1.6, fer);
        box(0, 7.6, z, (colX(6) + 6.5) * 2, 0.22, 0.22, fer);
        for (let i = -2; i <= 2; i++) box(i * 3.2, 6.9, z, 0.16, 1.4, 0.16, fer);
      }
    }
  },

  pattern(step, t, s) {
    const bar = Math.floor(step / 8);
    const inBar = step % 8;
    const mesure = bar % 8;
    const croche = s.stepDuration;
    const fondamentale = GRILLE[mesure];

    const intro = bar < 1;
    const pont = bar >= 16 && bar < 20; // le violoncelle porte le thème
    const solo = (bar >= 12 && bar < 14) || (bar >= 24 && bar < 26);
    const fin = bar >= 38;

    // --- Batterie ---
    if (!intro && !pont && !fin) {
      s.grosseCaisse(t, { level: 0.62 });
      s.grosseCaisse(t + croche / 2, { level: 0.5 }); // double pédale
    } else if (pont && inBar % 2 === 0) {
      s.grosseCaisse(t, { level: 0.8 });
    }
    if (!intro && (inBar === 2 || inBar === 6)) s.caisseClaire(t, { level: 0.42 });
    if (!intro && !pont) s.ride(t, { level: 0.13 });
    if (inBar === 0 && mesure === 0) s.crash(t, { level: 0.28 });
    // Relance aux toms à la fin des sections de huit mesures.
    if (mesure === 7 && inBar >= 4 && !intro) {
      s.tom(t, { aigu: inBar < 6, level: 0.4 });
    }

    // --- Guitares ---
    if (!intro) {
      if (pont) {
        // Accords tenus, la place est laissée au thème.
        if (inBar % 4 === 0) s.puissance(t, fondamentale - 12, croche * 3.6, { level: 0.26 });
      } else {
        const riff = RIFFS[SUITE[mesure]];
        for (const [pas, note, etouffee] of riff) {
          if (pas !== inBar) continue;
          const duree = etouffee ? croche * 0.5 : croche * 1.5;
          s.puissance(t, note - 12, duree, { level: etouffee ? 0.24 : 0.3, mute: Boolean(etouffee) });
        }
      }
    }

    // --- Basse : elle double le riff une octave plus bas, sur les temps ---
    if (!intro && inBar % 2 === 0) {
      s.contrebasse(t, fondamentale - 24, croche * 1.9, { level: 0.42, dest: s.ampli });
    }

    // --- Thème du pont, puis repris à l'unisson par les guitares ---
    if (pont) {
      for (const [pas, note, duree] of THEME[(bar - 16) % 4]) {
        if (pas !== inBar) continue;
        s.violoncelle(t, note - 12, duree * croche, { level: 0.42 });
        s.violoncelle(t, note - 24, duree * croche, { level: 0.24 });
      }
    }
    if (fin) {
      for (const [pas, note, duree] of THEME[(bar - 38) % 4]) {
        if (pas === inBar) s.electrique(t, note, duree * croche, { level: 0.26 });
      }
    }

    // --- Solo : le chant d'abord, le trait seulement pour conclure ---
    if (solo) {
      const mesureSolo = bar % 2 === 0 ? 0 : 1;
      for (const [pas, note, duree] of CHANT_SOLO[mesureSolo + (bar >= 24 ? 2 : 0)]) {
        if (pas === inBar) s.electrique(t, note, duree * croche, { level: 0.22 });
      }
      if (mesureSolo === 1 && inBar === 6) {
        for (let i = 0; i < 8; i++) {
          s.electrique(t + (i * croche) / 4, TRAIT[i], croche / 3, { level: 0.18 });
        }
      }
    }
  },
};
