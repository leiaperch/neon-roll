import { SCALES } from '../synth.js';

/**
 * Face A, piste 2. Ré mineur, clavecin et orgue. La piste est bâtie en
 * symétries : phrases jouées puis rejouées en miroir, comme un sujet et sa
 * réponse. Les grilles dorées et les plateformes remplacent la violence.
 */

const D = 38;
// Huit mesures, une fondamentale par mesure, cadence finale sur la dominante.
const GRILLE = [D, D + 5, D + 7, D, D + 3, D + 10, D + 5, D + 7];
const ARPEGE = [0, 2, 4, 7, 4, 2, 4, 2]; // degrés parcourus par le clavecin

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
  scale: SCALES.mineur,
  scaleRoot: 74,

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

  /** Colonnades cannelées et arches, disposées en vis-à-vis. */
  decor(stage) {
    const { rows, box, neon, colX, TILE } = stage;
    const pierre = this.palette.decor;
    const or = this.palette.accent;
    for (let row = 4; row < rows; row += 8) {
      const z = row * TILE;
      for (const side of [-1, 1]) {
        const x = side * (colX(6) + 3.2);
        box(x, 0.35, z, 2.2, 0.7, 2.2, pierre); // socle
        for (let i = 0; i < 3; i++) box(x, 3.2, z, 1.1 - i * 0.05, 5.2, 1.1 - i * 0.05, pierre);
        box(x, 5.95, z, 1.9, 0.5, 1.9, pierre); // chapiteau
        neon(x, 6.3, z, 1.2, 0.16, 1.2, or);
      }
      // Une arche sur deux enjambe la piste.
      if ((row / 8) % 2 === 1) {
        box(0, 7.1, z, (colX(6) + 3.2) * 2, 0.55, 1.1, pierre);
        neon(0, 6.75, z, (colX(6) + 2.6) * 2, 0.14, 0.5, or);
      }
    }
  },

  /**
   * Clavecin en doubles croches (deux notes par ligne), orgue en pédale,
   * cordes qui doublent le sujet dans la seconde moitié.
   */
  pattern(step, t, s) {
    const bar = Math.floor(step / 8);
    const inBar = step % 8;
    const root = GRILLE[bar % 8];
    const moitie = s.stepDuration / 2;
    const seconde = bar >= 14;
    const finale = bar >= 25;

    // Pédale d'orgue : une tenue par mesure.
    if (inBar === 0) {
      s.organ(t, root - 12, s.stepDuration * 8, { level: 0.09 });
      if (seconde) s.organ(t, root - 5, s.stepDuration * 8, { level: 0.05 });
    }

    // Sujet au clavecin, en doubles croches.
    const deg = ARPEGE[inBar];
    const dir = bar % 2 === 0 ? 1 : -1;
    for (const [offset, saut] of [[0, 0], [moitie, dir]]) {
      const index = deg + saut;
      const octave = inBar >= 4 ? 12 : 0;
      const midi = root + 24 + octave + SCALES.mineur[((index % 7) + 7) % 7] + Math.floor(index / 7) * 12;
      s.pluck(t + offset, midi, s.stepDuration * 0.9, { level: finale ? 0.2 : 0.16 });
    }

    // Réponse une octave plus bas, décalée d'une mesure sur deux.
    if (seconde && inBar % 2 === 0) {
      const index = ARPEGE[(inBar + 4) % 8];
      const midi = root + 12 + SCALES.mineur[index % 7] + Math.floor(index / 7) * 12;
      s.pluck(t + moitie, midi, s.stepDuration * 0.8, { level: 0.1 });
    }

    // Cordes : la basse continue, puis le dessus dans la dernière partie.
    if (inBar === 0) s.strings(t, root, s.stepDuration * 8, { level: seconde ? 0.09 : 0.06 });
    if (finale && inBar === 4) s.strings(t, root + 19, s.stepDuration * 4, { level: 0.07 });

    // Aucune batterie : la pulsation vient du clavecin lui-même.
    if (bar % 8 === 7 && inBar === 7) s.pluck(t, root + 36, s.stepDuration * 2, { level: 0.14 });
  },
};
