import { GAMMES } from '../synth.js';

/**
 * Face A, piste 1. Blues lent en mi, grille de douze mesures jouée deux fois.
 *
 * Rien n'est calculé : la ligne de contrebasse marche note à note vers
 * l'accord suivant, le chant de l'harmonica est écrit mesure par mesure en
 * question et réponse, et la guitare répond sur les contretemps de deux et
 * quatre. Le ternaire vient d'un décalage d'un tiers de temps appliqué aux
 * contretemps, sans toucher à la grille des lignes : le niveau reste binaire,
 * la musique balance.
 */

// Grille de douze mesures, une fondamentale par mesure.
const GRILLE = [40, 40, 40, 40, 45, 45, 40, 40, 47, 45, 40, 47];

/**
 * Contrebasse. Une note par temps, écrite pour arriver sur la fondamentale
 * suivante, avec les approches chromatiques de fin de mesure.
 */
const MARCHE = [
  [40, 44, 47, 50], [52, 50, 47, 44], [40, 44, 47, 50], [52, 51, 49, 46],
  [45, 49, 52, 55], [57, 55, 52, 49], [40, 44, 47, 50], [52, 50, 48, 46],
  [47, 51, 54, 57], [45, 49, 52, 55], [40, 44, 47, 50], [47, 46, 45, 44],
];

/** Voicings sans fondamentale : tierce et septième suffisent à dire l'accord. */
const COMP = { 40: [56, 62], 45: [61, 67], 47: [63, 69] };

/**
 * Le chant suit la forme du blues : une phrase, la même phrase, puis une
 * conclusion. Le crochet de deux mesures est rejoué à l'identique sur le
 * quatrième degré, et c'est cette répétition qui le rend mémorable. Les
 * mesures vides sont voulues : c'est là que la guitare répond.
 *
 * Gamme de mi blues : mi sol la si bémol si ré. [croche, note, durée].
 */
const CROCHET = [
  [[3, 71, 1], [4, 74, 1], [5, 76, 3]], // levée de deux notes puis note tenue
  [[0, 76, 1], [1, 74, 1], [2, 71, 2], [6, 67, 2]], // la réponse redescend
];

/** Réponse de la guitare, dans les deux mesures où le chant se tait. */
const REPONSE = [
  [[2, 64, 1], [3, 67, 1], [4, 70, 1], [5, 71, 2]],
  [[0, 67, 2], [4, 64, 2]],
];

/** Les quatre dernières mesures, les seules qui ne se répètent pas. */
const CONCLUSION = [
  [[0, 83, 2], [2, 81, 1], [3, 79, 1], [4, 76, 3]],
  [[0, 74, 2], [2, 71, 2], [4, 67, 3]],
  [[0, 64, 3], [4, 67, 1], [5, 64, 3]],
  [[0, 71, 1], [1, 70, 1], [2, 69, 1], [3, 67, 1], [4, 64, 4]],
];

/** Mesure du cycle de douze vers la phrase jouée, et par quelle voix. */
function phraseDe(mesure) {
  if (mesure < 2) return { notes: CROCHET[mesure], chant: true };
  if (mesure < 4) return { notes: REPONSE[mesure - 2], chant: false };
  if (mesure < 6) return { notes: CROCHET[mesure - 4], chant: true };
  if (mesure < 8) return { notes: REPONSE[mesure - 6], chant: false };
  return { notes: CONCLUSION[mesure - 8], chant: true };
}

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
  mix: 1.0,
  scale: GAMMES.blues,
  scaleRoot: 76,
  instruments: ['harmonica', 'guitare', 'contrebasse', 'orgue'],
  percussions: ['grosseCaisse', 'balai', 'caisseClaire', 'ride', 'crash'],

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
      box(x, 5.9, z + 8 * TILE, 0.1, 0.1, 16 * TILE, c);
    }
    for (let row = 3; row < rows; row += 5) {
      const side = row % 10 < 5 ? -1 : 1;
      const x = side * (colX(6) + 2.6 + (row % 3) * 0.5);
      box(x, 0.45, row * TILE, 1.5, 0.9, 1.5, 0x4a3a22);
    }
  },

  pattern(step, t, s) {
    const bar = Math.floor(step / 8);
    const inBar = step % 8;
    const beat = Math.floor(inBar / 2);
    const contretemps = inBar % 2 === 1;
    const tt = contretemps ? t + s.stepDuration / 3 : t; // balancement ternaire
    const mesure = bar % 12;
    const tour = Math.floor(bar / 12);
    const fondamentale = GRILLE[mesure];
    const croche = s.stepDuration;

    // Batterie : caisse claire aux balais au premier tour, frappée au second.
    if (!contretemps) {
      if (beat === 0 || beat === 2) s.grosseCaisse(t, { level: 0.6 });
      if (beat === 1 || beat === 3) {
        if (tour === 0) s.balai(t, { level: 0.34 });
        else s.caisseClaire(t, { level: 0.34 });
      }
      s.contrebasse(t, MARCHE[mesure][beat], croche * 1.8, { level: 0.5 });
    }
    s.ride(tt, { level: contretemps ? 0.09 : 0.15 });
    if (mesure === 0 && inBar === 0 && tour > 0) s.crash(t, { level: 0.24 });

    // Guitare : accord sur les contretemps de deux et quatre.
    if (contretemps && (beat === 1 || beat === 3)) {
      s.accord('guitare', tt, COMP[fondamentale], croche * 1.1, { level: 0.16, gratte: 0.012 });
    }

    // Orgue : tenue par mesure, seulement au second tour.
    if (tour > 0 && inBar === 0) {
      s.orgue(t, fondamentale + 12, croche * 8, { level: 0.1 });
      s.orgue(t, fondamentale + 22, croche * 8, { level: 0.07 });
    }

    // Le chant passe de l'harmonica à la guitare au second tour, une octave
    // plus bas : même mélodie, autre voix, comme dans un vrai chorus.
    const { notes, chant } = phraseDe(mesure);
    for (const [pas, note, duree] of notes) {
      if (pas !== inBar) continue;
      const quand = pas % 2 === 1 ? t + croche / 3 : t;
      if (chant && tour === 0) s.harmonica(quand, note, duree * croche, { level: 0.32 });
      else s.electrique(quand, note - 12, duree * croche, { level: chant ? 0.26 : 0.2 });
    }
  },
};
