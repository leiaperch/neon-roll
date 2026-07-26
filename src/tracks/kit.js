import { composeFromMusic } from '../composer.js';

/**
 * Outillage commun aux pistes.
 *
 * Une piste décrit son crochet, ses accents et son plan ; la carte se déduit
 * des accents. Les accents sont l'ossature rythmique du lead, c'est-à-dire ce
 * qu'on taperait dans les mains en écoutant : pas chaque note, mais celles qui
 * tombent. Ce sont elles qui deviennent des portes, donc des mouvements de
 * doigt.
 */
export function piste(def) {
  return {
    ...def,
    accents(bar) {
      return def.ACCENTS[bar % def.ACCENTS.length];
    },
    compose() {
      return composeFromMusic(this);
    },
  };
}

/** Joue les notes d'une phrase qui tombent sur la croche courante. */
export function surPas(table, inBar, jouer) {
  for (const [pas, note, duree] of table) {
    if (pas === inBar) jouer(note, duree);
  }
}

export function plan(entrees) {
  let curseur = 0;
  return entrees.map(([longueur, section]) => {
    const bloc = { from: curseur, to: curseur + longueur - 1, ...section };
    curseur += longueur;
    return bloc;
  });
}

/**
 * Structure en trente-deux mesures, celle de l'EDM de festival : on pose,
 * on monte, on lâche, on respire, on remonte plus haut, on lâche plus fort.
 * C'est cette forme qui rend un morceau accrocheur, bien avant les notes.
 */
export function phaseDe(bar) {
  if (bar < 4) return 'intro';
  if (bar < 8) return 'montee';
  if (bar < 16) return 'drop';
  if (bar < 20) return 'pont';
  if (bar < 24) return 'montee2';
  return 'drop2';
}

/**
 * Sections du niveau calées sur ces phases : le mur arrive avec le drop, la
 * piste s'ouvre pendant le pont, et le saut tombe sur la reprise.
 */
export function sectionsEDM({ dur = 'bloc', variante = 'trou', respiration = 'tapis' } = {}) {
  return plan([
    [4, { mode: 'calme', largeur: 5 }],
    [3, { mode: 'bloc', largeur: 5, porte: 1 }],
    [1, { mode: 'halte' }],
    [4, { mode: 'bloc', largeur: 5, porte: 1 }],
    [4, { mode: variante, largeur: 5, porte: 1 }],
    [1, { mode: 'halte' }],
    [3, { mode: respiration, largeur: 5 }],
    [3, { mode: 'bloc', largeur: 7, porte: 1 }],
    [1, { mode: 'saut', couronne: true }],
    [4, { mode: dur, largeur: 5, porte: 1, couronne: true }],
    [3, { mode: variante, largeur: 7, porte: 1 }],
    [1, { mode: 'calme', largeur: 5, couronne: true }],
  ]);
}

/**
 * Motif commun. Chaque piste fournit sa grille, son crochet et sa couleur ;
 * la production, elle, est la même partout : sidechain sur la grosse caisse,
 * supersaw sur le lead, montées à la caisse claire, drop qui tombe sur le
 * premier temps.
 */
export function motifEDM({ ACCORDS, BASSE, HOOK, CONTRE, sub = 0.5, ecart = 16, style = 'festival' }) {
  const tropical = style === 'tropical';
  const hardstyle = style === 'hardstyle';
  const futurebass = style === 'futurebass';

  return function pattern(step, t, s) {
    const bar = Math.floor(step / 8);
    const inBar = step % 8;
    const mesure = bar % 8;
    const croche = s.stepDuration;
    const phase = phaseDe(bar);
    const accord = ACCORDS[mesure % ACCORDS.length];
    const basse = BASSE[mesure % BASSE.length];
    const drop = phase === 'drop' || phase === 'drop2';
    const monte = phase === 'montee' || phase === 'montee2';
    const derniereMesure = (bar % 4) === 3;

    // --- Batterie ---
    if (phase !== 'pont') {
      // La dernière mesure d'une montée coupe la grosse caisse : le vide
      // avant le drop est ce qui fait tomber le drop.
      const coupe = monte && derniereMesure && inBar >= 4;
      if (inBar % 2 === 0 && !coupe) {
        if (hardstyle) {
          // Grosse caisse à queue accordée : elle occupe tout le temps.
          s.kickMachine(t, { level: 0.95, from: 210, to: 46, decay: 0.16, queue: croche * 1.4, duck: 0.18 });
        } else if (tropical) {
          s.kickMachine(t, { level: 0.7, from: 150, to: 48, decay: 0.22, clic: 0.25, duck: 0.42 });
        } else {
          s.kickMachine(t, { level: drop ? 0.95 : 0.8 });
        }
      }
      if (inBar % 2 === 1) {
        s.charleston(t, { level: phase === 'intro' ? 0.13 : 0.19, ouvert: inBar % 4 === 3 });
      }
      if (inBar === 4 && phase !== 'intro') s.clap(t, { level: drop ? 0.32 : 0.24 });
      // Contretemps du hardstyle : la basse enfle entre deux frappes.
      if (hardstyle && drop && inBar % 2 === 1) {
        s.basseInverse(t, basse - 12, croche * 0.92, { level: 0.28 });
      }
    } else if (inBar % 4 === 0) {
      s.charleston(t, { level: 0.1, ouvert: true });
    }
    if ((bar === 8 || bar === 24) && inBar === 0) s.crash(t, { level: 0.34 });

    // --- Montée : roulement qui se resserre, puis bruit qui monte ---
    if (monte) {
      const avance = (bar % 4) + inBar / 8; // 0 à 4 sur la montée
      if (inBar % 2 === 0 && avance >= 2) {
        s.rouleau(t, croche, { arrivee: avance >= 3.5 ? 4 : 2, level: 0.22 });
      }
      if (bar % 4 === 3 && inBar === 0) s.montee(t, croche * 8, { level: 0.16 });
    }

    // --- Basse : sub tenu sous le drop, absente au pont ---
    if (phase !== 'pont' && phase !== 'intro' && !hardstyle) {
      if (inBar % 2 === 0) {
        s.basse(t, basse - 12, croche * 1.7, {
          level: drop ? 0.3 : 0.22, cutoff: drop ? 1400 : 700, floor: 200, q: 5,
        });
      }
      if (drop && inBar % 2 === 1) {
        s.basse(t, basse, croche * 0.5, { level: 0.14, cutoff: 2200, floor: 500, q: 8 });
      }
    }

    // --- Accords ---
    if (drop) {
      // Nappe supersaw sur chaque temps : le mur de son du drop.
      if (inBar % 2 === 0) {
        for (const note of accord) {
          s.supersaw(t, note, croche * 1.9, { level: 0.075, ecart, sub: 0, coupe: 6000 });
        }
      }
    } else if (phase === 'pont') {
      if (inBar === 0) {
        for (const note of accord) s.supersaw(t, note, croche * 8, { level: 0.06, ecart: 10, sub: 0, coupe: 2600 });
      }
      if (inBar % 2 === 1) s.pincement(t, accord[inBar % accord.length] + 12, croche, { level: 0.1 });
    } else if (inBar % 2 === 1) {
      s.pincement(t, accord[(inBar >> 1) % accord.length], croche * 0.9, {
        level: 0.12, ouverture: phase === 'intro' ? 1600 : 3600,
      });
    }

    // --- Le crochet ---
    const ligne = HOOK[mesure % HOOK.length];
    if (drop) {
      surPas(ligne, inBar, (note, duree) => {
        if (tropical) {
          // Lame de bois doublée d'un souffle de supersaw : chaud, pas dur.
          s.marimba(t, note, duree * croche, { level: 0.4 });
          s.supersaw(t, note - 12, duree * croche * 0.9, { level: 0.05, ecart: 8, sub: 0, coupe: 3200 });
        } else {
          // Doublé à l'octave, c'est ce qui rend un thème inoubliable.
          s.supersaw(t, note, duree * croche * 0.95, { level: 0.13, ecart, sub, coupe: 7000 });
          s.supersaw(t, note - 12, duree * croche * 0.9, { level: 0.05, ecart: ecart * 0.6, sub: 0 });
        }
        if (futurebass) s.pincement(t, note + 12, duree * croche * 0.6, { level: 0.07, ouverture: 7000 });
      });
    } else if (phase === 'pont') {
      // Au pont il reste seul, joué doucement : on l'entend enfin en entier.
      surPas(ligne, inBar, (note, duree) => {
        s.pincement(t, note, duree * croche, { level: 0.16, ouverture: 3000, fermeture: 700 });
      });
    } else if (monte) {
      surPas(ligne, inBar, (note, duree) => {
        s.supersaw(t, note, duree * croche * 0.8, { level: 0.07, ecart: 8, sub: 0, coupe: 3000 });
      });
    }

    // --- Contre-chant, seulement au second drop ---
    if (phase === 'drop2' && CONTRE) {
      surPas(CONTRE[mesure % CONTRE.length], inBar, (note, duree) => {
        s.pincement(t, note, duree * croche * 0.9, { level: 0.1, ouverture: 6000 });
      });
    }
  };
}
