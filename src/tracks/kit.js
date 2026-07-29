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
/**
 * Plan de sections.
 *
 * La difficulté ne monte pas en accélérant le rythme des esquives, qui est
 * borné par ce qu'un joueur peut soutenir, mais en jouant sur trois autres
 * leviers : l'enjeu, avec des trous où l'erreur est fatale au lieu d'être un
 * simple choc ; l'amplitude, avec des portes qui traversent deux colonnes
 * d'un coup ; et la précision, avec des passages où la porte ne fait plus
 * qu'une colonne de large.
 */
export function sectionsEDM({ dur = 'bloc', variante = 'trou', respiration = 'tapis' } = {}) {
  return plan([
    // Deux mesures d'installation, pas trois : au-delà, l'ouverture est vide
    // assez longtemps pour qu'on la ressente comme un temps mort.
    [2, { mode: 'calme', largeur: 5 }],
    [1, { mode: 'bloc', largeur: 5, porte: 1 }],
    [1, { mode: 'halte' }],
    [4, { mode: 'bloc', largeur: 5, porte: 1 }],
    [4, { mode: variante, largeur: 5, porte: 1 }],
    [1, { mode: 'halte' }],
    [3, { mode: 'trou', largeur: 5, porte: 1 }],
    [1, { mode: 'saut', couronne: true }],
    [3, { mode: respiration, largeur: 5 }],
    [3, { mode: 'bloc', largeur: 7, porte: 1, bond: 2 }], // grandes traversées
    [1, { mode: 'halte' }],
    [4, { mode: dur, largeur: 5, porte: 0, couronne: true }], // porte d'une colonne
    [3, { mode: variante, largeur: 7, porte: 1, bond: 2 }],
    [1, { mode: 'calme', largeur: 5, couronne: true }],
  ]);
}

/**
 * Motif commun. Chaque piste fournit sa grille, son crochet et sa couleur ;
 * la production, elle, est la même partout : sidechain sur la grosse caisse,
 * supersaw sur le lead, montées à la caisse claire, drop qui tombe sur le
 * premier temps.
 */
/**
 * Vocabulaire de batteries.
 *
 * Une mesure vaut huit croches, donc le temps `n` tombe sur `inBar = n * 2` :
 * le premier temps en 0, le deuxième en 2, le troisième en 4, le quatrième
 * en 6. Le backbeat du 4/4 est sur les temps deux et quatre, donc en 2 et 6.
 * Le poser en 4 revient à jouer une caisse claire sur le trois, c'est-à-dire
 * un feeling en demi-temps, ce qui n'est pas la même musique.
 *
 * Chaque genre a sa signature rythmique et ce sont ces différences, plus que
 * les timbres, qui font qu'on reconnaît un style en deux secondes.
 */
const BATTERIES = {
  /** Quatre au sol arrondi, shaker continu, backbeat léger. */
  tropical(s, t, inBar, croche, c) {
    if (inBar % 2 === 0 && !c.coupe) {
      s.kickMachine(t, { level: 0.7, from: 150, to: 48, decay: 0.22, clic: 0.25, duck: 0.42 });
    }
    if (!c.intro && (inBar === 2 || inBar === 6)) s.clap(t, { level: 0.16, longueur: 0.8 });
    // Shaker : deux coups par croche, c'est lui qui donne le balancement.
    if (!c.pont) {
      s.shaker(t, { level: 0.07 });
      s.shaker(t + croche / 2, { level: 0.11 });
    }
    if (inBar === 7) s.charleston(t, { level: 0.14, ouvert: true });
  },

  /** House : charleston ouvert sur chaque contretemps, c'est la signature. */
  house(s, t, inBar, croche, c) {
    if (inBar % 2 === 0 && !c.coupe) s.kickMachine(t, { level: c.drop ? 0.92 : 0.8 });
    if (inBar % 2 === 1) s.charleston(t, { level: 0.2, ouvert: true });
    if (!c.intro && (inBar === 2 || inBar === 6)) s.clap(t, { level: c.drop ? 0.2 : 0.15 });
    if (c.drop) s.charleston(t + croche / 2, { level: 0.06, rate: 1.8 });
  },

  /** Techno : minimale et hypnotique, la claire n'arrive que sur le quatre. */
  techno(s, t, inBar, croche, c) {
    if (inBar % 2 === 0 && !c.coupe) s.kickMachine(t, { level: 0.88 });
    if (inBar % 2 === 1) s.charleston(t, { level: 0.16 });
    if (!c.intro && inBar === 6) s.clap(t, { level: 0.17, longueur: 0.7 });
    // Contretemps métallique sur les croches 3 et 5 : le grain du genre.
    if (c.drop && (inBar === 3 || inBar === 5)) s.caisseClaire(t, { level: 0.1, rate: 1.7 });
  },

  /** Festival : backbeat franc, charleston ouvert, relance aux toms. */
  festival(s, t, inBar, croche, c) {
    if (inBar % 2 === 0 && !c.coupe) s.kickMachine(t, { level: c.drop ? 0.95 : 0.8 });
    if (inBar % 2 === 1) s.charleston(t, { level: c.intro ? 0.13 : 0.19, ouvert: inBar % 4 === 3 });
    if (!c.intro && (inBar === 2 || inBar === 6)) s.clap(t, { level: c.drop ? 0.21 : 0.15 });
    if (c.derniereMesure && inBar >= 6) s.tom(t, { aigu: inBar === 7, level: 0.26 });
  },

  /** Trance : charleston ouvert sur tous les contretemps, roulis en montée. */
  trance(s, t, inBar, croche, c) {
    if (inBar % 2 === 0 && !c.coupe) s.kickMachine(t, { level: 0.9, from: 190, to: 44 });
    if (inBar % 2 === 1) s.charleston(t, { level: 0.21, ouvert: true });
    if (!c.intro && (inBar === 2 || inBar === 6)) s.clap(t, { level: 0.18 });
    if (c.monte) s.charleston(t + croche / 2, { level: 0.1, rate: 1.6 });
  },

  /**
   * Trap : demi-temps. La caisse claire ne tombe que sur le troisième temps
   * et la grosse caisse est syncopée, donc la pulsation paraît deux fois plus
   * lente alors que le tempo n'a pas bougé. C'est le groove de la future bass.
   */
  trap(s, t, inBar, croche, c) {
    if (!c.coupe && (inBar === 0 || inBar === 3 || inBar === 6)) {
      s.kickMachine(t, { level: 0.9, decay: 0.3 });
    }
    // Claire de trap : courte et brillante, jouée plus haut que nature. Une
    // claire acoustique pleine, avec son timbre qui traîne, sonne faux ici.
    if (!c.intro && inBar === 4) {
      s.caisseClaire(t, { level: 0.22, rate: 1.25 });
      s.clap(t, { level: 0.12, longueur: 0.6 });
    }
    // Charleston en doubles croches, avec un triolet de temps en temps.
    const debits = inBar === 5 ? 3 : 2;
    for (let i = 0; i < debits; i++) {
      s.charleston(t + (i * croche) / debits, { level: i === 0 ? 0.16 : 0.09 });
    }
  },

  /** Hardstyle : la caisse occupe tout, donc presque plus de cymbales. */
  hardstyle(s, t, inBar, croche, c) {
    if (inBar % 2 === 0 && !c.coupe) {
      s.kickMachine(t, { level: 0.95, from: 210, to: 46, decay: 0.16, queue: croche * 1.4, duck: 0.18 });
    }
    if (!c.drop && inBar % 2 === 1) s.charleston(t, { level: 0.14 });
    if (!c.intro && inBar === 6 && !c.drop) s.clap(t, { level: 0.16, longueur: 0.7 });
  },

  /** Big room : backbeat large et roulement de claire avant chaque drop. */
  bigroom(s, t, inBar, croche, c) {
    if (inBar % 2 === 0 && !c.coupe) s.kickMachine(t, { level: 0.95 });
    if (inBar % 2 === 1) s.charleston(t, { level: 0.17, ouvert: inBar === 7 });
    // Clap devant, claire courte derrière juste pour le corps : en big room
    // la claire acoustique seule sonne trop naturelle et prend trop de place.
    if (!c.intro && (inBar === 2 || inBar === 6)) {
      s.clap(t, { level: 0.2 });
      s.caisseClaire(t, { level: 0.12, rate: 1.2 });
    }
  },
};

/**
 * Harmonise une note du crochet avec les notes de l'accord situées juste
 * au-dessus.
 *
 * C'est la signature du lead de festival : la mélodie n'est pas jouée seule
 * mais empilée en accord qui la suit note à note, ce qui la rend énorme sans
 * rien changer à la ligne. Une note seule, même en supersaw, sonne mince à
 * côté.
 */
function harmoniser(note, accord, voix = 3) {
  const classes = accord.map((n) => ((n % 12) + 12) % 12);
  const notes = [note];
  for (let candidat = note + 1; candidat <= note + 12 && notes.length < voix; candidat++) {
    if (classes.includes(((candidat % 12) + 12) % 12)) notes.push(candidat);
  }
  return notes;
}

export function motifEDM({
  ACCORDS, BASSE, HOOK, CONTRE, sub = 0.5, ecart = 16, style = 'festival',
  batterie = 'festival', leadAccords = true, leadGrave = false, arpege = false,
}) {
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

    // --- Batterie, propre au genre ---
    if (phase !== 'pont') {
      // La dernière mesure d'une montée coupe la grosse caisse : le vide
      // avant le drop est ce qui fait tomber le drop.
      const contexte = {
        phase, drop, monte, derniereMesure,
        intro: phase === 'intro',
        pont: false,
        coupe: monte && derniereMesure && inBar >= 4,
      };
      (BATTERIES[batterie] || BATTERIES.festival)(s, t, inBar, croche, contexte);
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

    // --- Arpège continu en doubles croches ---
    // La techno mélodique tient sur ce mouvement perpétuel : la pulsation
    // reste hypnotique, mais quelque chose avance en permanence dessous.
    if (arpege && phase !== 'intro') {
      for (let i = 0; i < 2; i++) {
        const note = accord[(inBar * 2 + i) % accord.length] + (drop ? 12 : 0);
        s.pincement(t + (i * croche) / 2, note, croche / 2, {
          level: drop ? 0.09 : 0.06, ouverture: drop ? 5200 : 2400, fermeture: 500,
        });
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
        } else if (leadGrave) {
          // Future house : le lead est dans le grave. C'est la basse qui porte
          // la mélodie, avec un filtre résonant qui lui donne son mordant
          // métallique, et un pincement court une octave au-dessus pour
          // qu'elle reste lisible.
          s.basse(t, note - 24, duree * croche * 0.8, {
            level: 0.34, cutoff: 2600, floor: 320, q: 12,
          });
          s.pincement(t, note - 12, duree * croche * 0.6, { level: 0.1, ouverture: 4200 });
        } else if (leadAccords) {
          // Lead en accords : la mélodie est empilée avec les notes de
          // l'accord au-dessus, et doublée une octave dessous pour le poids.
          // La mélodie domine largement, l'harmonie ne fait qu'épaissir.
          // À niveaux proches l'accord noie la ligne et on n'entend plus de
          // thème, seulement une masse.
          const empile = harmoniser(note, accord);
          empile.forEach((n, i) => {
            s.supersaw(t, n, duree * croche * 0.95, {
              level: i === 0 ? 0.17 : 0.035, ecart, sub: i === 0 ? sub : 0, coupe: 7000,
            });
          });
          s.supersaw(t, note - 12, duree * croche * 0.9, { level: 0.05, ecart: ecart * 0.6, sub: 0 });
        } else {
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
