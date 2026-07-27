import {
  VOID, FLOOR, BLOCK, DIAMOND, CROWN, JUMP, CHECKPOINT,
  SWEEPER, LASER, RISER, BELT_R, BELT_L,
  MARTEAU, PRESSE, ROUE, SPINNER, SCIE, sensBalayage,
} from './levelkit.js';

/**
 * Génération de la carte à partir de la musique.
 *
 * C'est le principe du jeu : la piste ne se contente pas d'être calée sur le
 * tempo, elle est **dessinée par le lead**. Chaque attaque du crochet devient
 * une porte, et la porte se déplace d'une colonne à chaque attaque. Si
 * l'instrumental fait « boum boum », il y a deux portes coup sur coup, donc
 * deux esquives. Rien à synchroniser à la main : la carte est une conséquence
 * de la mélodie.
 *
 * Ce que la piste garde d'écrit à la main, c'est son plan : quelle section est
 * calme, laquelle est un mur de blocs, où sont les checkpoints, les sauts et
 * les couronnes.
 */

/** Colonnes utilisables selon la largeur de piste demandée. */
const bords = (largeur) => {
  const demi = Math.floor(largeur / 2);
  return { min: 3 - demi, max: 3 + demi };
};

/**
 * Filtre humain.
 *
 * La bille change de colonne en un vingtième de seconde, mais un joueur ne
 * décide pas à cette vitesse : il tient deux à trois changements de voie par
 * seconde, avec de brèves pointes. Sans cette limite le générateur produit
 * des couloirs corrects sur le papier et infaisables à la main, parce que le
 * lead, lui, peut très bien attaquer six fois par mesure.
 *
 * On garde donc toutes les attaques dans la musique, et on ne retient comme
 * portes que celles qu'un joueur peut réellement enchaîner. Une paire collée
 * reste autorisée quand le tempo le permet, parce que c'est elle qui donne la
 * sensation de « boum boum », mais elle est suivie d'un repos.
 */
function filtreHumain(attaques, minEcart, paireAutorisee, reposApresPaire, largeurPorte) {
  const portes = [];
  let precedent = -99;
  let taillePaire = 0;
  for (const row of attaques) {
    const ecart = row - precedent;
    // Une porte d'une seule colonne demande de viser juste, pas seulement
    // d'aller vite. La coller à la précédente cumule vitesse et précision et
    // rend le passage infaisable : chacune des deux contraintes est tenable,
    // leur produit ne l'est pas.
    const etroite = largeurPorte(row) === 0 || largeurPorte(precedent) === 0;
    const collee = ecart === 1 && paireAutorisee && taillePaire < 2 && !etroite;
    const requis = taillePaire >= 2 ? reposApresPaire : minEcart;
    if (!collee && ecart < requis) continue;
    taillePaire = collee ? taillePaire + 1 : 1;
    portes.push(row);
    precedent = row;
  }
  return portes;
}

/** Section active pour une mesure donnée. */
function sectionDe(sections, bar) {
  for (const s of sections) if (bar >= s.from && bar <= s.to) return s;
  return { mode: 'calme', largeur: 5 };
}

export function composeFromMusic(track) {
  const { bars, sections, rowsPerBeat, bpm } = track;
  const dureeLigne = 60 / (bpm * rowsPerBeat);
  // Deux portes consécutives doivent laisser au moins un quart de seconde,
  // c'est le rythme qu'un joueur soutient. La paire collée n'est tolérée que
  // si une ligne dure déjà presque autant.
  const minEcart = Math.max(1, Math.ceil(0.25 / dureeLigne));
  // La paire collée est ce qui donne le « boum boum », mais elle ne laisse
  // qu'une fraction de ligne pour traverser. Le seuil est calé sur l'audit :
  // en dessous, la vitesse latérale exigée dépasse ce qu'on peut demander
  // avec de la marge.
  const paireAutorisee = dureeLigne >= 0.215;
  const reposApresPaire = Math.max(minEcart, Math.ceil(0.45 / dureeLigne));

  // Les attaques sont filtrées sur toute la piste et non mesure par mesure :
  // une porte en fin de mesure et une autre au début de la suivante sont
  // aussi rapprochées que deux portes au sein d'une même mesure.
  const attaques = [];
  for (let bar = 0; bar < bars; bar++) {
    for (const pas of track.accents(bar)) attaques.push(bar * 8 + pas);
  }
  const largeurPorte = (row) => {
    const s = sectionDe(sections, Math.floor(row / 8));
    return s.porte === undefined ? 1 : s.porte;
  };
  const portes = new Set(
    filtreHumain(attaques, minEcart, paireAutorisee, reposApresPaire, largeurPorte));

  const rows = [];
  let colonne = 3;
  let sens = 1;
  let compteurDiamant = 0;

  for (let bar = 0; bar < bars; bar++) {
    const section = sectionDe(sections, bar);
    const largeur = section.largeur || 5;
    const { min, max } = bords(largeur);
    const porte = section.porte === undefined ? 1 : section.porte;
    const bond = section.bond || 1;
    const premierePorte = [0, 1, 2, 3, 4, 5, 6, 7].find((p) => portes.has(bar * 8 + p));
    // La largeur de piste change d'une section à l'autre : si la porte se
    // trouvait sur une colonne qui vient de disparaître, on la ramène dans la
    // piste avant de continuer.
    colonne = Math.max(min, Math.min(max, colonne));

    // Mesure de saut : tremplin sur la première attaque, puis le vide.
    if (section.mode === 'saut') {
      for (let pas = 0; pas < 8; pas++) {
        const ligne = new Array(7).fill(VOID);
        if (pas <= 2) for (let c = min; c <= max; c++) ligne[c] = FLOOR;
        if (pas === 2) ligne[colonne] = JUMP;
        if (pas === 7) {
          for (let c = min; c <= max; c++) ligne[c] = FLOOR;
          ligne[colonne] = section.couronne ? CROWN : DIAMOND;
        }
        rows.push(ligne.join(''));
      }
      continue;
    }

    for (let pas = 0; pas < 8; pas++) {
      const ligne = new Array(7).fill(VOID);
      for (let c = min; c <= max; c++) ligne[c] = FLOOR;

      // Une mesure de checkpoint doit être un répit : on y pose la porte du
      // niveau, pas des obstacles.
      const repos = section.mode === 'calme' || section.mode === 'halte';
      const attaque = portes.has(bar * 8 + pas);
      if (attaque && !repos) {
        // La porte se déplace : c'est ce déplacement qui oblige à jouer.
        let cible = colonne + sens * bond;
        if (cible < min || cible > max) {
          sens = -sens;
          cible = colonne + sens * bond;
        }
        cible = Math.max(min, Math.min(max, cible));

        for (let c = min; c <= max; c++) {
          if (Math.abs(c - cible) <= porte) continue;
          if (section.mode === 'trou') ligne[c] = VOID;
          else if (section.mode === 'piston') ligne[c] = RISER;
          else if (section.mode === 'presse') ligne[c] = PRESSE;
          else if (section.mode === 'scie') ligne[c] = SCIE;
          else ligne[c] = BLOCK;
        }
        // Le faisceau barre une moitié entière : il ne se pose pas colonne
        // par colonne, on le place sur toute la ligne.
        if (section.mode === 'faisceau') {
          // Le faisceau barre une moitié entière de piste, mais laisse toujours
          // la colonne centrale libre : c'est elle la porte, quel que soit le
          // côté allumé.
          for (let c = min; c <= max; c++) ligne[c] = LASER;
          colonne = 3;
        }
        // Barre, marteau et roues partagent la même logique : un mobile posé
        // sur la ligne, et la porte placée du côté qu'il ne couvre pas.
        // Le spinner est le seul mobile à laisser deux refuges, un de chaque
        // côté de son moyeu : il ne peut donc jamais mettre la porte hors de
        // portée, contrairement au marteau ou à la barre.
        if (section.mode === 'spinner' && pas === premierePorte) {
          for (let c = min; c <= max; c++) ligne[c] = FLOOR;
          ligne[3] = SPINNER;
          cible = colonne === 3 ? Math.min(max, colonne + 1) : colonne;
        }
        const mobiles = { balayeuse: SWEEPER, marteau: MARTEAU, roue: ROUE };
        if (mobiles[section.mode] && pas === premierePorte) {
          // Le mobile couvre une moitié de piste au moment du passage, donc la
          // porte doit être de l'autre côté. Mais on ne l'y téléporte pas : si
          // la voie est trop loin, le niveau exigerait de traverser plusieurs
          // colonnes en une ligne, ce qui est impossible quelle que soit la
          // vitesse. Dans ce cas on renonce au mobile et on pose des blocs.
          const refuge = sensBalayage(bar * 8 + pas) > 0 ? min + 1 : max - 1;
          if (Math.abs(refuge - colonne) <= 1) {
            for (let c = min; c <= max; c++) ligne[c] = FLOOR;
            ligne[3] = mobiles[section.mode];
            cible = refuge;
          }
        }
        colonne = cible;

        // Un diamant sur deux portes : ramasser, c'est jouer dans le temps.
        compteurDiamant++;
        if (compteurDiamant % 2 === 0 && ligne[colonne] === FLOOR) ligne[colonne] = DIAMOND;
      } else if (section.mode === 'tapis' && pas % 2 === 0) {
        // Le tapis pousse pendant les silences : il faut tenir la trajectoire.
        const sensTapis = bar % 2 === 0 ? BELT_R : BELT_L;
        for (let c = min; c <= max; c++) ligne[c] = sensTapis;
      }

      if (section.mode === 'halte' && pas === 0) ligne[3] = CHECKPOINT;
      if (section.couronne && pas === 4 && ligne[colonne] === FLOOR) ligne[colonne] = CROWN;
      rows.push(ligne.join(''));
    }
  }
  return rows;
}
