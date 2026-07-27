/**
 * Vocabulaire des cartes et outillage de composition.
 *
 * Une piste ne s'écrit pas d'un bloc : on écrit des phrases de huit lignes
 * (une mesure) et on les arrange, exactement comme le morceau qui les
 * accompagne. Répéter une phrase à l'identique puis en miroir donne la même
 * sensation qu'un refrain, et ça reste entièrement écrit à la main.
 *
 * Ce fichier ne dépend de rien pour rester exécutable en ligne de commande.
 */

export const VOID = '.';
export const FLOOR = '#';
export const BLOCK = 'X';
export const DIAMOND = 'o';
export const CROWN = 'Q';
export const JUMP = '^';
export const CHECKPOINT = '*';
export const SWEEPER = '~';
export const SLIDER = '=';
export const LASER = 'L';
export const RISER = 'B';
export const BELT_R = '>';
export const BELT_L = '<';
export const PLATFORM = 'P';
export const MARTEAU = 'H'; // bras qui balaie à l'horizontale depuis un côté
export const PRESSE = 'V'; // masse qui s'abat verticalement sur trois colonnes
export const ROUE = 'O'; // roues qui traversent en groupe, décalées

export const JUMP_ROWS = 5; // doit rester aligné sur config.js

/** Cases sur lesquelles la bille tient debout (le bloc porte, mais tue). */
export const SOLID = new Set([
  FLOOR, BLOCK, DIAMOND, CROWN, JUMP, CHECKPOINT,
  SWEEPER, SLIDER, LASER, RISER, BELT_R, BELT_L,
  MARTEAU, PRESSE, ROUE,
]);

export const ALL_CELLS = new Set([...SOLID, VOID, PLATFORM]);

/** Miroir d'une ligne : les tapis roulants changent aussi de sens. */
const MIRROR_MAP = { [BELT_R]: BELT_L, [BELT_L]: BELT_R };
const mirrorLine = (line) => [...line].reverse().map((c) => MIRROR_MAP[c] || c).join('');

/**
 * Développe un arrangement en carte complète.
 * Chaque entrée vaut `nom` ou `nom:m` pour la version en miroir.
 */
export function compose(phrases, arrangement) {
  const rows = [];
  for (const entry of arrangement) {
    const [name, flag] = String(entry).split(':');
    const block = phrases[name];
    if (block === undefined) throw new Error(`phrase inconnue : ${name}`);
    let lines = block.trim().split('\n').map((l) => l.trim());
    if (flag === 'm') lines = lines.map(mirrorLine);
    rows.push(...lines);
  }
  return rows;
}

/**
 * Le laser barre une moitié de la piste, l'autre moitié à la mesure suivante ;
 * la colonne centrale reste toujours libre. Alterné sur le temps, ça se lit de
 * loin et ça reste toujours franchissable.
 */
export function laserBank(row, rowsPerBeat) {
  return Math.floor(row / rowsPerBeat) % 2 === 0 ? 'gauche' : 'droite';
}

export function laserBlocks(row, rowsPerBeat, col) {
  const bank = laserBank(row, rowsPerBeat);
  return bank === 'gauche' ? col < 3 : col > 3;
}

/**
 * Côté vers lequel une barre balayeuse est poussée au moment où la bille
 * atteint sa ligne. Déduit de la ligne seule, pour que la génération de la
 * carte et le rendu tombent forcément d'accord.
 */
export const sensBalayage = (row) => (Math.floor(row / 2) % 2 === 0 ? 1 : -1);

/**
 * La presse est en bas sur la parité inverse du piston : les deux obstacles
 * se répondent au lieu de battre ensemble, ce qui les rend distinguables
 * quand une piste utilise les deux.
 */
export function presseBasse(row, rowsPerBeat) {
  return Math.floor(row / rowsPerBeat) % 2 === 0;
}

/** Le bloc surgissant est sorti un temps sur deux. */
export function riserUp(row, rowsPerBeat) {
  return Math.floor(row / rowsPerBeat) % 2 === 1;
}

/** Une case tue-t-elle la bille qui s'y trouve au moment du passage ? */
export function isLethal(cell, row, col, rowsPerBeat) {
  if (cell === BLOCK) return true;
  if (cell === LASER) return laserBlocks(row, rowsPerBeat, col);
  if (cell === RISER) return riserUp(row, rowsPerBeat);
  if (cell === PRESSE) return presseBasse(row, rowsPerBeat);
  // Le marteau et les roues sont des mobiles : leur côté sûr est calculé par
  // le générateur, qui y place la porte. Ils portent donc, comme la barre.
  return false;
}

/** Fabrique l'accès aux cases d'une carte développée. */
export function makeGrid(rows, rowsPerBeat) {
  const total = rows.length;
  const cellAt = (row, col) => {
    if (row < 0 || row >= total || col < 0 || col > 6) return VOID;
    return rows[row][col];
  };
  // La plateforme mesure trois colonnes et oscille d'une colonne : seule sa
  // colonne d'ancrage est portée en permanence. Le validateur s'en tient donc
  // à celle-ci, quand le jeu, lui, reste plus tolérant sur les bords.
  const isSolid = (row, col) => SOLID.has(cellAt(row, col)) || cellAt(row, col) === PLATFORM;
  const isSafe = (row, col) =>
    isSolid(row, col) && !isLethal(cellAt(row, col), row, col, rowsPerBeat);
  return { rows, total, cellAt, isSolid, isSafe };
}

/**
 * Vérifie qu'une carte est jouable : lignes de sept caractères, caractères
 * connus, et existence d'un chemin où la bille ne se déplace jamais de plus
 * d'une colonne par ligne, sauts compris.
 */
export function validateMap(rows, rowsPerBeat) {
  const errors = [];
  rows.forEach((row, i) => {
    if (row.length !== 7) errors.push(`ligne ${i} : ${row.length} caractères au lieu de 7`);
    for (const ch of row) if (!ALL_CELLS.has(ch)) errors.push(`ligne ${i} : caractère inconnu "${ch}"`);
  });
  if (errors.length) return errors;

  const g = makeGrid(rows, rowsPerBeat);
  let ground = new Set();
  for (let c = 0; c < 7; c++) if (g.isSafe(0, c)) ground.add(c);
  if (!ground.size) return ['ligne 0 : aucune case de départ'];
  let airborne = new Set();

  for (let r = 1; r < g.total; r++) {
    const nextGround = new Set();
    const nextAir = new Set();
    for (const c of ground) {
      if (g.cellAt(r - 1, c) === JUMP) {
        const land = r - 1 + JUMP_ROWS;
        for (let d = -3; d <= 3; d++) {
          if (c + d >= 0 && c + d < 7) nextAir.add(`${land}:${c + d}`);
        }
        continue;
      }
      for (let d = -1; d <= 1; d++) if (g.isSafe(r, c + d)) nextGround.add(c + d);
    }
    for (const k of airborne) {
      const [land, col] = k.split(':').map(Number);
      if (land === r) {
        if (g.isSafe(r, col)) nextGround.add(col);
      } else {
        nextAir.add(k);
      }
    }
    ground = nextGround;
    airborne = nextAir;
    if (!ground.size && !airborne.size) {
      errors.push(`ligne ${r} : plus aucun chemin praticable`);
      break;
    }
  }
  return errors;
}

/** Développe une piste et y attache sa grille. Point d'entrée du jeu. */
export function buildTrack(track) {
  // Une piste décrit soit des phrases arrangées à la main, soit un plan dont
  // la carte se déduit des attaques du lead.
  const rows = track.phrases
    ? compose(track.phrases, track.arrangement)
    : track.compose();
  const compte = (ch) => rows.reduce((n, line) => n + [...line].filter((c) => c === ch).length, 0);
  return {
    ...track,
    rows,
    totalRows: rows.length,
    crownCount: compte(CROWN),
    diamondCount: compte(DIAMOND),
    grid: makeGrid(rows, track.rowsPerBeat),
  };
}

export function checkpointRows(rows) {
  const out = [];
  rows.forEach((line, i) => {
    if (line.includes(CHECKPOINT)) out.push(i);
  });
  return out;
}
