import { piste, surPas, plan } from './kit.js';

/**
 * Face A, piste 1. House filtrée en la mineur.
 *
 * La plus lente du disque, donc la plus large : c'est la piste où on apprend
 * le geste. Le crochet est court et revient tout le temps, la guitare pincée
 * passe dans un filtre qui s'ouvre, et la basse joue les silences.
 */

const BASSE = [45, 45, 50, 50, 43, 43, 48, 48];
const ACCORDS = [
  [64, 67, 72, 76], [64, 67, 72, 76], [62, 65, 69, 74], [62, 65, 69, 74],
  [62, 67, 71, 77], [62, 67, 71, 77], [64, 67, 71, 76], [64, 67, 71, 76],
];

/** Le crochet : deux mesures, rejouées telles quelles. */
const CROCHET = [
  [[0, 81, 1], [2, 84, 1], [3, 86, 1], [6, 84, 2]],
  [[0, 81, 1], [2, 79, 1], [4, 76, 4]],
];
const CROCHET_FIN = [
  [[0, 81, 1], [2, 84, 1], [3, 86, 1], [6, 88, 2]],
  [[0, 89, 2], [4, 86, 2], [6, 84, 2]],
];
const HOOK = [
  CROCHET[0], CROCHET[1], CROCHET[0], CROCHET[1],
  CROCHET[0], CROCHET[1], CROCHET_FIN[0], CROCHET_FIN[1],
];

/**
 * Accents : ce qu'on taperait dans les mains. Les mesures 0, 2 et 4 portent
 * un « boum boum » sur les croches 2 et 3, qui devient deux portes de suite.
 */
const ACCENTS = [
  [0, 2, 3, 6], [0, 2, 4], [0, 2, 3, 6], [0, 4],
  [0, 2, 3, 6], [0, 2, 4], [0, 2, 3, 6], [0, 4, 6],
];

export default piste({
  id: 'house',
  face: 'A',
  index: 1,
  title: 'Boule à Facettes',
  genre: 'French house',
  tagline: 'Quatre accords, un filtre, et rien à prouver.',
  bpm: 118,
  rowsPerBeat: 2,
  echoSteps: 3,
  mix: 1.15,
  bars: 32,
  instruments: ['guitare', 'orgue'],
  percussions: ['grosseCaisse', 'charleston', 'charlestonOuvert', 'caisseClaire', 'crash'],
  ACCENTS,

  palette: {
    skyTop: 0x2b1b5e,
    skyBottom: 0xff9a6b,
    fog: 0x5b3a72,
    floors: [0xffd9a8, 0xffc48c, 0xf5b07a],
    block: 0xd6376b,
    accent: 0xffe066,
    neon: 0xfff3c4,
    decor: 0x7a3d84,
    ball: 0xfffaf0,
  },

  sections: plan([
    [4, { mode: 'calme', largeur: 5 }],
    [1, { mode: 'halte' }],
    [3, { mode: 'bloc', largeur: 5, porte: 1 }],
    [4, { mode: 'trou', largeur: 5, porte: 1 }],
    [1, { mode: 'halte' }],
    [3, { mode: 'bloc', largeur: 7, porte: 1 }],
    [1, { mode: 'saut', couronne: true }],
    [3, { mode: 'tapis', largeur: 5 }],
    [1, { mode: 'halte' }],
    [3, { mode: 'bloc', largeur: 5, porte: 0, couronne: true }],
    [4, { mode: 'faisceau', largeur: 5 }],
    [1, { mode: 'halte' }],
    [2, { mode: 'bloc', largeur: 7, porte: 0 }],
    [1, { mode: 'calme', largeur: 5, couronne: true }],
  ]),

  /**
   * Mâts et boules à facettes, espacés : le ciel de fin de journée est le
   * vrai décor, il ne faut pas l'encombrer.
   */
  decor(stage) {
    const { rows, box, neon, colX, TILE } = stage;
    const mat = this.palette.decor;
    for (let row = 6; row < rows; row += 16) {
      const z = row * TILE;
      for (const side of [-1, 1]) {
        const x = side * (colX(6) + 4);
        box(x, 3.5, z, 0.34, 7, 0.34, mat);
        neon(x, 7.6, z, 1.5, 1.5, 1.5, this.palette.neon);
        neon(x, 7.6, z, 1.9, 0.2, 1.9, this.palette.accent);
      }
    }
    // Podium bas qui court le long de la piste, il donne la vitesse.
    for (let row = 0; row < rows; row += 3) {
      const z = row * TILE;
      for (const side of [-1, 1]) {
        box(side * (colX(6) + 2.2), -0.5, z, 2.4, 1, TILE * 1.6, mat);
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
    const pont = bar >= 20 && bar < 22;
    const plein = bar >= 12;

    // Batterie : quatre au sol, charleston ouvert sur les contretemps.
    if (!pont) {
      if (inBar % 2 === 0) s.grosseCaisse(t, { level: 0.7 });
      if (inBar % 2 === 1) s.charleston(t, { level: 0.22, ouvert: inBar % 4 === 3 });
      if (!intro && inBar === 4) s.caisseClaire(t, { level: 0.3 });
    }
    if ((bar === 12 || bar === 22) && inBar === 0) s.crash(t, { level: 0.26 });

    // Basse : elle laisse le premier temps à la grosse caisse.
    if (!intro && !pont && [1, 3, 4, 6, 7].includes(inBar)) {
      s.basse(t, basse - 12 + (inBar === 7 ? 12 : 0), croche * 0.8, {
        level: 0.28, cutoff: 1100, floor: 260, q: 4,
      });
    }

    // Accord de guitare pincée sur les contretemps : le geste de la house.
    if (!intro && inBar % 2 === 1) {
      s.accord('guitare', t, accord, croche * 0.9, {
        level: pont ? 0.3 : 0.2, gratte: 0.01, coupe: plein ? 4200 : 1800,
      });
    }
    if (inBar === 0) s.orgue(t, basse - 12, croche * 8, { level: pont ? 0.16 : 0.09 });

    // Le crochet, toujours le même, une octave plus haut au dernier tiers.
    if (!intro) {
      surPas(HOOK[mesure], inBar, (note, duree) => {
        s.stab(t, [note + (bar >= 24 ? 12 : 0)], duree * croche * 0.9, { level: 0.11, echo: 0.35 });
        s.puce(t, note - 12, duree * croche * 0.5, { level: 0.05, duty: 0.3 });
      });
    }
    if (pont && inBar === 0) s.montee(t, croche * 8, { level: 0.1 });
  },
});
