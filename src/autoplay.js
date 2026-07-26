import { rowDuration, TILE, JUMP_ROWS } from './config.js';
import { JUMP } from './levelkit.js';

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
    const cols = [];
    for (let d = -portee; d <= portee; d++) cols.push(c + d);
    cols.sort((a, b) => Math.abs(a - 3) - Math.abs(b - 3));
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
  const barre = (row, x) => world.movers.some((m) => !m.solid && m.row === row
    && Math.abs(x - world.moverX(m, row * rd)) < m.halfW + 0.9);
  for (let r = 0; r < chemin.length; r++) {
    const c = Math.round(chemin[r]);
    if (!barre(r, colX(c))) continue;
    for (const d of [-1, 1, -2, 2]) {
      if (track.grid.isSafe(r, c + d) && !barre(r, colX(c + d))) {
        chemin[r] = c + d;
        break;
      }
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
