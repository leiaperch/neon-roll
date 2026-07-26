import {
  VOID, FLOOR, BLOCK, DIAMOND, CROWN, JUMP, CHECKPOINT,
  SWEEPER, LASER, RISER, BELT_R, BELT_L, sensBalayage,
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
 * Deux attaques trop rapprochées deviennent injouables quand le tempo monte :
 * la bille met environ un dixième de seconde à changer de colonne. On garde
 * l'attaque et on saute la porte, la musique n'est pas altérée.
 */
function espacer(accents, minEcart) {
  const gardees = [];
  let precedent = -99;
  for (const pas of accents) {
    if (pas - precedent < minEcart) continue;
    gardees.push(pas);
    precedent = pas;
  }
  return gardees;
}

/** Section active pour une mesure donnée. */
function sectionDe(sections, bar) {
  for (const s of sections) if (bar >= s.from && bar <= s.to) return s;
  return { mode: 'calme', largeur: 5 };
}

export function composeFromMusic(track) {
  const { bars, sections, rowsPerBeat, bpm } = track;
  const dureeLigne = 60 / (bpm * rowsPerBeat);
  // Une esquive d'une colonne demande environ un dixième de seconde. En dessous
  // de 160 BPM deux croches consécutives restent jouables, donc un « boum
  // boum » donne bien deux portes. Au-delà, on espace d'une croche.
  const minEcart = dureeLigne >= 0.19 ? 1 : 2;

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
    const accents = espacer(track.accents(bar), minEcart);
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
      const attaque = accents.includes(pas);
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
        if (section.mode === 'balayeuse' && pas === accents[0]) {
          for (let c = min; c <= max; c++) ligne[c] = FLOOR;
          ligne[3] = SWEEPER;
          // La barre couvre une moitié de piste au moment du passage : la
          // porte doit se trouver de l'autre côté, sinon le niveau demande
          // d'être exactement là où la barre arrive.
          cible = sensBalayage(bar * 8 + pas) > 0 ? min + 1 : max - 1;
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
