import { composeFromMusic } from '../composer.js';

/**
 * Outillage commun aux pistes.
 *
 * Une piste électronique décrit son crochet, ses accents et son plan ; la
 * carte se déduit des accents. Les accents sont la ossature rythmique du
 * lead, c'est-à-dire ce qu'on taperait dans les mains en écoutant : pas
 * chaque note, mais celles qui tombent. Ce sont elles qui deviennent des
 * portes, donc des mouvements de doigt.
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

/** Plan de sections : petite aide pour ne pas répéter les bornes. */
export function plan(entrees) {
  let curseur = 0;
  return entrees.map(([longueur, section]) => {
    const bloc = { from: curseur, to: curseur + longueur - 1, ...section };
    curseur += longueur;
    return bloc;
  });
}
