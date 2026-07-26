import { piste, surPas, plan } from './kit.js';

/**
 * Face B, piste 5. Drum and bass en sol mineur, la fin du disque.
 *
 * La plus rapide, donc la plus exigeante : à ce tempo la bille couvre onze
 * unités par seconde, et une esquive demande un dixième de seconde. Le
 * générateur espace donc les portes d'une croche, sans toucher au morceau :
 * la batterie garde ses doubles croches, la carte non.
 */

const BASSE = [43, 43, 46, 46, 41, 41, 48, 48];
const ACCORDS = [
  [58, 62, 67], [58, 62, 67], [58, 62, 65], [58, 62, 65],
  [60, 65, 69], [60, 65, 69], [59, 62, 67], [59, 62, 67],
];

/** Thème : de longues notes tenues au-dessus d'une batterie très découpée. */
const CROCHET = [
  [[0, 79, 4], [4, 82, 3]],
  [[0, 77, 2], [2, 79, 2], [4, 74, 4]],
];
const CROCHET_HAUT = [
  [[0, 86, 4], [4, 84, 3]],
  [[0, 82, 2], [2, 79, 2], [4, 77, 4]],
];
const HOOK = [
  CROCHET[0], CROCHET[1], CROCHET[0], CROCHET[1],
  CROCHET_HAUT[0], CROCHET_HAUT[1], CROCHET[0], CROCHET[1],
];

const ACCENTS = [
  [0, 4], [0, 2, 4], [0, 4], [0, 2, 4],
  [0, 4, 6], [0, 2, 4], [0, 4], [0, 2, 4, 6],
];

export default piste({
  id: 'dnb',
  face: 'B',
  index: 5,
  title: 'Course de Nuit',
  genre: 'Drum and bass',
  tagline: 'Onze unités par seconde. Bonne chance.',
  bpm: 172,
  rowsPerBeat: 2,
  echoSteps: 3,
  mix: 1.1,
  bars: 32,
  instruments: ['violoncelle'],
  percussions: ['grosseCaisse', 'caisseClaire', 'charleston', 'charlestonOuvert', 'crash', 'ride'],
  ACCENTS,

  palette: {
    skyTop: 0x102a4a,
    skyBottom: 0x39e6c0,
    fog: 0x1b4a6b,
    floors: [0xf2f5d0, 0xdce8b4, 0xc4dba0],
    block: 0xff5a3c,
    accent: 0x00d9a0,
    neon: 0xfaffd6,
    decor: 0x1e5c72,
    ball: 0xffffff,
  },

  sections: plan([
    [4, { mode: 'calme', largeur: 5 }],
    [1, { mode: 'halte' }],
    [3, { mode: 'bloc', largeur: 5, porte: 1 }],
    [4, { mode: 'trou', largeur: 5, porte: 1 }],
    [1, { mode: 'halte' }],
    [3, { mode: 'balayeuse', largeur: 5, porte: 1 }],
    [1, { mode: 'saut', couronne: true }],
    [3, { mode: 'bloc', largeur: 7, porte: 1 }],
    [1, { mode: 'halte' }],
    [3, { mode: 'faisceau', largeur: 5, couronne: true }],
    [4, { mode: 'bloc', largeur: 5, porte: 1 }],
    [1, { mode: 'halte' }],
    [2, { mode: 'trou', largeur: 7, porte: 1 }],
    [1, { mode: 'calme', largeur: 5, couronne: true }],
  ]),

  decor(stage) {
    const { rows, box, neon, colX, TILE } = stage;
    const bleu = this.palette.decor;
    for (let row = 2; row < rows; row += 5) {
      const z = row * TILE;
      for (const side of [-1, 1]) {
        const x = side * (colX(6) + 3.2);
        // Balises de bord de piste, qui défilent vite et donnent la vitesse.
        box(x, 1.4, z, 0.4, 2.8, 0.4, bleu);
        neon(x, 2.9, z, 1.2, 0.24, 0.4, this.palette.accent);
      }
    }
    for (let row = 0; row < rows; row += 20) {
      const z = row * TILE;
      box(0, 9, z, (colX(6) + 5) * 2, 1.1, 1.6, bleu);
      neon(0, 8.3, z, (colX(6) + 4) * 2, 0.26, 0.6, this.palette.neon);
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
    const pont = bar >= 18 && bar < 21;
    const plein = bar >= 12;

    // Batterie coupée : grosse caisse sur 1 et sur la levée de 3, caisse
    // claire sur 2 et 4. C'est ce décalage qui fait courir le morceau.
    if (!pont) {
      if (inBar === 0) s.grosseCaisse(t, { level: 0.8 });
      if (inBar === 5) s.grosseCaisse(t, { level: 0.6 });
      if (inBar === 2 || inBar === 6) s.caisseClaire(t, { level: 0.4 });
      if (!intro) s.charleston(t, { level: inBar % 2 ? 0.16 : 0.1, ouvert: inBar === 7 });
      if (plein && inBar === 3) s.caisseClaire(t, { level: 0.2, rate: 1.3 });
    } else if (inBar % 2 === 0) {
      s.ride(t, { level: 0.14 });
    }
    if ((bar === 12 || bar === 21) && inBar === 0) s.crash(t, { level: 0.3 });

    // Basse tenue, très grave : elle occupe tout l'espace sous la batterie.
    if (!intro && !pont && (inBar === 0 || inBar === 4)) {
      s.basse(t, basse - 24, croche * 3.6, {
        level: 0.32, cutoff: plein ? 620 : 420, floor: 160, q: 6, type: 'sawtooth',
      });
    }

    if (!intro) {
      surPas(HOOK[mesure], inBar, (note, duree) => {
        s.stab(t, [note, note + 5], duree * croche * 0.9, { level: pont ? 0.15 : 0.1, echo: 0.45 });
        if (bar >= 21) s.violoncelle(t, note - 24, duree * croche, { level: 0.3 });
      });
    }
    if (inBar === 0) s.nappe(t, accord[0] - 12, croche * 8, { level: pont ? 0.14 : 0.06 });
    if (bar === 20 && inBar === 0) s.montee(t, croche * 8, { level: 0.14 });
  },
});
