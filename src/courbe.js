import { TILE } from './config.js';

/**
 * Courbe de la piste.
 *
 * Le jeu ne connaît que deux grandeurs : la distance parcourue le long de la
 * piste, et l'écart latéral par rapport à son axe. Toute la logique, collisions
 * comprises, vit dans ce repère. La courbe ne fait que traduire ce repère en
 * coordonnées du monde, ce qui permet de faire tourner et monter la piste sans
 * toucher à une seule règle de jeu.
 *
 * Elle est échantillonnée ligne par ligne et intégrée : le cap tourne d'un
 * petit angle à chaque ligne, la position suit. C'est ce qui garantit une
 * trajectoire continue, sans cassure aux jonctions.
 */

/** Profil déterministe : mêmes virages et mêmes pentes à chaque partie. */
function profil(graine) {
  let s = (graine * 2654435761) >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export class Courbe {
  /**
   * @param {number} lignes  nombre de lignes de la piste
   * @param {object} options amplitude des virages et des pentes
   */
  constructor(lignes, {
    // Le virage est un cap visé, en radians : c'est le changement de direction
    // qui se voit, bien plus que la dérive latérale accumulée. La pente est une
    // hauteur visée, en unités de monde.
    graine = 1, virage = 0.34, pente = 3.2, longueurVirage = 22, longueurPente = 30,
  } = {}) {
    const rnd = profil(graine);
    this.points = new Array(lignes + 2);

    let x = 0;
    let z = 0;
    let y = 0;
    let cap = 0;

    // Consignes de virage et de pente, tirées une fois puis tenues sur
    // plusieurs lignes : sans cette persistance la piste serpenterait au lieu
    // de tourner franchement.
    let consigneCap = 0;
    let consigneY = 0;
    let resteVirage = 0;
    let restePente = 0;

    for (let row = 0; row <= lignes + 1; row++) {
      if (resteVirage <= 0) {
        resteVirage = longueurVirage * (0.6 + rnd());
        // Une consigne sur trois est nulle : la piste doit aussi savoir aller
        // tout droit, sinon elle ne fait que tourner et on perd le repère.
        consigneCap = rnd() < 0.34 ? 0 : (rnd() < 0.5 ? -virage : virage);
      }
      if (restePente <= 0) {
        restePente = longueurPente * (0.6 + rnd());
        consigneY = rnd() < 0.4 ? 0 : (rnd() < 0.5 ? -pente : pente) * (0.5 + rnd());
      }
      resteVirage--;
      restePente--;

      // Le cap et la hauteur sont lissés vers leur consigne, jamais imposés :
      // une dérivée discontinue se verrait comme un angle vif dans le sol.
      cap += (consigneCap - cap) * 0.09;
      y += (consigneY - y) * 0.06;

      this.points[row] = { x, y, z, cap };
      x += Math.sin(cap) * TILE;
      z += Math.cos(cap) * TILE;
    }
  }

  /** Position et cap à une distance donnée, exprimée en lignes. */
  a(ligne) {
    const n = this.points.length - 1;
    const i = Math.max(0, Math.min(n - 1, Math.floor(ligne)));
    const f = Math.max(0, Math.min(1, ligne - i));
    const a = this.points[i];
    const b = this.points[i + 1];
    return {
      x: a.x + (b.x - a.x) * f,
      y: a.y + (b.y - a.y) * f,
      z: a.z + (b.z - a.z) * f,
      cap: a.cap + (b.cap - a.cap) * f,
    };
  }

  /**
   * Traduit un point du repère de jeu vers le monde.
   * @param {number} ligne    distance parcourue, en lignes
   * @param {number} lateral  écart par rapport à l'axe, en unités
   * @param {number} hauteur  hauteur au-dessus du sol de la piste
   */
  monde(ligne, lateral, hauteur = 0) {
    const p = this.a(ligne);
    // La normale latérale est perpendiculaire au cap, dans le plan horizontal.
    return {
      x: p.x + Math.cos(p.cap) * lateral,
      y: p.y + hauteur,
      z: p.z - Math.sin(p.cap) * lateral,
      cap: p.cap,
    };
  }
}
