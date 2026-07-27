import { rowDuration, TILE, JUMP_ROWS, BALL_RADIUS } from './config.js';
import { JUMP, riserUp, laserBank, sensBalayage } from './levelkit.js';

/**
 * Pilote automatique de vérification. Il calcule le chemin le plus central
 * puis joue la piste image par image avec une horloge simulée, ce qui permet
 * de prouver qu'une piste est franchissable sans y jouer à la main.
 *
 * Le modèle de joueur est volontairement réaliste : il anticipe d'une ligne
 * pour esquiver, mais ne revient jamais sur une colonne encore dangereuse.
 * Sans cette seconde règle il coupe les angles et meurt là où un humain passe.
 */

const colX = (col) => (col - 3) * TILE;

/**
 * Contrôle de cohérence entre ce qui est affiché et ce qui tue.
 *
 * Les deux passages injouables rencontrés jusqu'ici venaient de là : un
 * obstacle animé sur l'horloge continue, mais dont la collision consulte
 * l'état de sa ligne. L'écart rend l'obstacle invisible ou fantôme, et aucun
 * validateur de chemin ne peut le voir puisque la carte, elle, est correcte.
 *
 * On vérifie donc, pour chaque obstacle à état, que le rendu au moment précis
 * du passage de la bille correspond à la règle de collision.
 */
export function coherence(world, track) {
  const rd = rowDuration(track.bpm, track.rowsPerBeat);
  const ecarts = [];

  for (const r of world.risers || []) {
    const attendu = riserUp(r.row, track.rowsPerBeat) ? 1 : 0;
    // On regarde un peu avant et un peu après : la bille traverse la zone.
    for (const decalage of [-0.3, 0, 0.3]) {
      const affiche = world.riserHeight((r.row + decalage) * rd);
      const sorti = affiche > 0.5 ? 1 : 0;
      if (sorti !== attendu) {
        ecarts.push(`piston ligne ${r.row} (${decalage}) : affiché ${affiche.toFixed(2)}, mortel ${attendu}`);
        break;
      }
    }
  }

  for (const l of world.lasers || []) {
    const attendu = laserBank(l.row, track.rowsPerBeat);
    if (l.bank !== attendu) ecarts.push(`faisceau ligne ${l.row} : affiché ${l.bank}, mortel ${attendu}`);
  }

  for (const m of world.movers || []) {
    if (m.type !== '~') continue;
    const x = world.moverX(m, m.row * rd);
    const attendu = sensBalayage(m.row) > 0 ? 1 : -1;
    if (Math.sign(x - m.anchorX) !== attendu) {
      ecarts.push(`balayeuse ligne ${m.row} : côté ${Math.sign(x - m.anchorX)}, attendu ${attendu}`);
    }
  }

  return ecarts;
}

/**
 * Audit de difficulté.
 *
 * Le validateur prouve qu'un chemin existe et le pilote prouve qu'une machine
 * le parcourt ; ni l'un ni l'autre ne dit qu'un humain le peut. Cet audit
 * mesure ce qu'on exige réellement du joueur : la vitesse latérale imposée
 * entre deux obstacles, et le nombre d'esquives par seconde.
 *
 * Le seuil de vitesse est volontairement bien sous le plafond de la bille :
 * atteindre le plafond signifie qu'il faut un geste parfait, sans marge.
 */
export function audit(track, plafond = 26) {
  const rd = rowDuration(track.bpm, track.rowsPerBeat);
  const chemin = findPath(track);
  if (!chemin) return { piste: track.id, erreur: 'aucun chemin' };
  const ZONE = 0.32;

  const dures = [];
  for (let r = 0; r < track.totalRows; r++) {
    const ligne = track.rows[r];
    const laser = ligne.includes('L');
    const bloc = [...ligne].some((c) => c === 'X')
      || (ligne.includes('B') && Math.floor(r / track.rowsPerBeat) % 2 === 1);
    const trou = [...ligne].filter((c) => c === '.').length > 2 && !ligne.includes('P');
    if (laser || bloc || trou) dures.push(r);
  }

  const excessifs = [];
  let pire = 0;
  for (let i = 1; i < dures.length; i++) {
    const a = dures[i - 1];
    const b = dures[i];
    const ca = Math.round(chemin[a]);
    const cb = Math.round(chemin[b]);
    if (ca === cb) continue;
    const temps = (b - a - 2 * ZONE) * rd;
    const vitesse = temps <= 0 ? Infinity : (Math.abs(cb - ca) * TILE) / temps;
    if (vitesse > pire) pire = vitesse;
    if (vitesse > plafond) {
      excessifs.push(`lignes ${a}→${b} (${Math.round((b / track.totalRows) * 100)} %) : ${Math.round(vitesse)} u/s`);
    }
  }
  return {
    piste: track.id,
    pireVitesse: Math.round(pire),
    plafond,
    passagesExcessifs: excessifs,
  };
}

/** Chemin colonne par colonne, en préférant le centre. */
export function findPath(track) {
  const { grid, totalRows: N } = track;
  const key = (r, c) => r * 10 + c;
  const parent = new Map();
  const file = [];
  for (let c = 0; c < 7; c++) {
    if (grid.isSafe(0, c)) {
      parent.set(key(0, c), null);
      file.push([0, c]);
    }
  }
  let but = null;
  for (let i = 0; i < file.length && !but; i++) {
    const [r, c] = file[i];
    if (r >= N - 1) {
      but = [r, c];
      break;
    }
    const saute = grid.cellAt(r, c) === JUMP;
    const nr = saute ? r + JUMP_ROWS : r + 1;
    const portee = saute ? 3 : 1;
    // On préfère continuer tout droit, puis s'écarter le moins possible.
    // Chercher le centre à tout prix fabrique des zigzags que personne ne
    // ferait, et fausse toute mesure de difficulté.
    const cols = [];
    for (let d = -portee; d <= portee; d++) cols.push(c + d);
    cols.sort((a, b) => (Math.abs(a - c) - Math.abs(b - c)) * 10 + (Math.abs(a - 3) - Math.abs(b - 3)));
    for (const nc of cols) {
      if (nr > N - 1 || !grid.isSafe(nr, nc) || parent.has(key(nr, nc))) continue;
      parent.set(key(nr, nc), [r, c]);
      file.push([nr, nc]);
    }
  }
  if (!but) return null;

  const chemin = new Array(N).fill(3);
  const points = [];
  let noeud = but;
  while (noeud) {
    points.push(noeud);
    noeud = parent.get(key(noeud[0], noeud[1]));
  }
  points.reverse();
  for (let i = 0; i < points.length; i++) {
    const [r, c] = points[i];
    chemin[r] = c;
    if (i + 1 < points.length) {
      const [r2, c2] = points[i + 1];
      for (let rr = r + 1; rr < r2; rr++) chemin[rr] = c + ((c2 - c) * (rr - r)) / (r2 - r);
    }
  }
  return chemin;
}

/** Écarte le chemin des obstacles mobiles, à leur position au passage. */
function eviterMobiles(chemin, track, world, rd) {
  // Un obstacle mobile est large en profondeur : il menace aussi les lignes
  // voisines, pas seulement la sienne. Ne regarder que sa propre ligne laisse
  // passer des trajectoires qui le percutent juste avant ou juste après.
  /**
   * Une colonne est-elle barrée par un mobile au moment du passage ?
   *
   * Le seuil est celui de la collision réelle, plus une petite marge. Une
   * marge fixe et généreuse paraît prudente, mais elle est calibrée sur les
   * mobiles larges : appliquée à un mobile étroit, elle rejette des colonnes
   * pourtant sûres, pousse la trajectoire trop loin, et fabrique une
   * contradiction avec la porte suivante. Le chemin devient alors
   * infranchissable alors que le niveau, lui, est correct.
   */
  const barre = (row, x) => world.movers.some((m) => {
    if (m.solid || Math.abs(m.row - row) > 1) return false;
    const e = world.moverEmprise(m, row * rd);
    return Math.abs(x - e.x) < e.halfW + BALL_RADIUS * 0.7 + 0.2;
  });
  for (let r = 0; r < chemin.length; r++) {
    const c = Math.round(chemin[r]);
    if (!barre(r, colX(c))) continue;
    // On esquive du côté où va la suite du chemin. Choisir toujours la gauche
    // paraît anodin, mais si la ligne suivante impose la droite, on fabrique
    // un saut de deux colonnes que la passe de recollage défait ensuite en
    // ramenant la trajectoire dans l'obstacle qu'on venait d'éviter.
    const suivante = Math.round(chemin[Math.min(chemin.length - 1, r + 1)]);
    const precedente = Math.round(chemin[Math.max(0, r - 1)]);
    const vise = (suivante + precedente) / 2;
    const candidats = [-1, 1, -2, 2]
      .sort((a, b) => Math.abs(c + a - vise) - Math.abs(c + b - vise));
    for (const d of candidats) {
      if (track.grid.isSafe(r, c + d) && !barre(r, colX(c + d))) {
        chemin[r] = c + d;
        break;
      }
    }
  }

  // Recollage : décaler une ligne peut rendre le saut depuis la précédente
  // impossible. On rapproche les voisines tant qu'elles restent sûres, sinon
  // le chemin promet un déplacement que la bille ne peut pas faire.
  for (let passe = 0; passe < 3; passe++) {
    for (let r = 1; r < chemin.length; r++) {
      const avant = Math.round(chemin[r - 1]);
      const ici = Math.round(chemin[r]);
      if (Math.abs(ici - avant) <= 1) continue;
      const vers = avant + Math.sign(ici - avant);
      // Les deux branches vérifient les mobiles. Sans cette vérification, le
      // recollage ramenait la trajectoire dans l'obstacle que l'évitement
      // venait tout juste de contourner : lisser un saut ne doit jamais se
      // payer d'une collision.
      if (track.grid.isSafe(r - 1, vers) && !barre(r - 1, colX(vers))) chemin[r - 1] = vers;
      else if (track.grid.isSafe(r, vers) && !barre(r, colX(vers))) chemin[r] = vers;
    }
  }
  return chemin;
}

/** Joue une piste entière et renvoie le compte rendu. */
export function autoplay(game, world, input, track) {
  const rd = rowDuration(track.bpm, track.rowsPerBeat);
  game.load(track);
  const chemin = findPath(track);
  if (!chemin) return { piste: track.id, etat: 'aucun chemin' };
  eviterMobiles(chemin, track, world, rd);

  /**
   * Modèle de joueur : viser la porte de la ligne la plus proche, et ne partir
   * vers la suivante qu'une fois sa zone de collision franchie.
   *
   * Les deux moitiés de la règle comptent autant l'une que l'autre. Partir
   * trop tôt, c'est revenir dans un obstacle qu'on n'a pas fini de dépasser ;
   * partir trop tard, c'est-à-dire attendre d'être arrivé sur la ligne
   * suivante, c'est ne plus avoir le temps de traverser quand les portes
   * s'enchaînent.
   */
  const ZONE = 0.32; // demi-profondeur de collision, en lignes
  const viser = (rowF) => {
    const r = Math.max(0, Math.min(track.totalRows - 1, Math.round(rowF)));
    if (rowF <= r + ZONE) return Math.round(chemin[r]);
    return Math.round(chemin[Math.min(track.totalRows - 1, r + 1)]);
  };

  const vrai = game.synth;
  let t = 0;
  game.synth = {
    time: 0, muted: false, load() {}, stop() {}, setMuted() {},
    ramassage() {}, fanfare() {}, mort() {},
    start(step) { t = step * rd; this.time = t; },
  };
  game.start(true);

  const dt = 1 / 60;
  const limite = 60 * (track.totalRows * rd + 15);
  let frames = 0;
  while (frames < limite && game.state === 'playing') {
    input.targetX = colX(viser(t / rd));
    game.update(dt);
    t += dt;
    game.synth.time = t;
    frames++;
  }
  const compte = {
    piste: track.id,
    etat: game.state,
    pourcent: Math.round(game.progress * 100),
    cause: game.deathCause || null,
    ligne: game.player.row,
    diamants: `${game.diamonds}/${game.totalDiamonds}`,
    couronnes: `${game.crowns}/${game.totalCrowns}`,
    secondes: +(frames / 60).toFixed(1),
  };
  game.synth = vrai;
  return compte;
}
