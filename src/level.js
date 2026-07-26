/**
 * Niveau 01, écrit comme une carte ASCII. Une ligne = une croche de musique,
 * 7 caractères = les 7 colonnes de la piste. 256 lignes = 32 mesures = 60 s
 * à 128 BPM. Le fichier ne dépend de rien : il est validé aussi bien par le
 * jeu que par `npm run validate`.
 *
 *   .  vide (trou mortel)
 *   #  sol
 *   X  sol + bloc à esquiver
 *   o  sol + diamant
 *   ^  sol + tremplin (saut de JUMP_ROWS lignes)
 *   *  sol + checkpoint (toute la ligne)
 *   ~  sol + barre balayeuse (va-et-vient sur toute la largeur)
 *   =  sol + bloc coulissant (va-et-vient lent autour de sa colonne)
 */

/** Doit rester aligné sur JUMP_ROWS de config.js (level.js reste sans import). */
const JUMP_ROWS_FOR_VALIDATION = 5;

export const VOID = '.';
export const FLOOR = '#';
export const BLOCK = 'X';
export const DIAMOND = 'o';
export const JUMP = '^';
export const CHECKPOINT = '*';
export const SWEEPER = '~';
export const SLIDER = '=';

/** Caractères sur lesquels la bille tient debout. */
export const SOLID = new Set([FLOOR, BLOCK, DIAMOND, JUMP, CHECKPOINT, SWEEPER, SLIDER]);

const MAP = `
#######
#######
###o###
#######
#######
###o###
#######
#######
.#####.
.#####.
.##o##.
.#####.
.#####.
.##o##.
.#####.
.#####.
.#####.
.##X##.
.#####.
.##o##.
.##X##.
.#####.
.##o##.
.#####.
.##*##.
.#####.
.##X##.
.#####.
.#X.X#.
.#####.
.##o##.
.#####.
.#####.
.#####.
.#o.o#.
.#####.
.##X##.
.#####.
.#X.X#.
.#####.
.#####.
..####.
..###..
.o###..
..###..
..##X..
..###..
.o###..
..###..
..####.
.o####.
..####.
..#####
...####
...##o#
...####
...####
..#####
.######
#######
###~###
#######
###o###
#######
#######
###~###
#######
#######
###~###
#######
##o.o##
#######
.#####.
.#####.
.##.##.
.#####.
.#.#.#.
.#####.
.##.##.
.#####.
.##*##.
.#####.
.X###X.
.#####.
.##X##.
.#####.
.X#.#X.
.#####.
.##o##.
.#X#X#.
.#####.
.##X##.
.#####.
.#X#X#.
.#####.
.##o##.
.#####.
..###..
...#...
...#...
...#o..
...#...
...#...
..###..
..###..
..#.#..
..#.#..
..o.o..
..#.#..
..#.#..
..o.o..
..###..
..###..
.#####.
.##^##.
.......
.......
.......
.......
.##o##.
.#####.
.#####.
.##o##.
.#####.
.#####.
.##*##.
.#####.
.#####.
#######
#X###X#
#######
###X###
#######
#X###X#
#######
##o.o##
#######
##X#X##
#######
#X#X#X#
#######
##X#X##
#######
###o###
#######
###~###
#######
#######
###~###
#######
###~###
#######
.#####.
.##=##.
.#####.
.#####.
.##=##.
.#####.
.##o##.
.#####.
.#####.
.#X#X#.
.#####.
.##~##.
.#####.
.#X#X#.
.#####.
.##o##.
.#.#.#.
.#####.
.#.#.#.
.#####.
.##*##.
.#####.
.#.#.#.
.#####.
.#####.
.X#.#X.
.#####.
.#.#.#.
.#####.
.X#.#X.
.#####.
.##o##.
.##o##.
.#X#X#.
.#####.
.#####.
.#X#X#.
.#####.
.##~##.
.#####.
..###..
..###..
.###...
.###...
###....
###....
o##....
###....
###....
.###...
..###..
...###.
....###
....###
....o##
....###
....###
...###.
..###..
.###...
..###..
...###.
....###
...###.
..###..
.#####.
#######
###*###
#######
##X#X##
#######
###o###
#######
#X#X#X#
#######
##X#X##
#######
#X#X#X#
#######
###~###
#######
##.#.##
#######
#.#.#.#
#######
##.#.##
#######
##o.o##
.#####.
.#####.
.##^##.
.......
.......
.......
.......
.##o##.
.#####.
.#####.
.##o##.
.#####.
.##o##.
.#####.
.#####.
.#####.
`;

export const ROWS = MAP.trim().split('\n').map((r) => r.trim());

export const TOTAL_ROWS = ROWS.length;

/** Caractère d'une case, `VOID` hors piste. */
export function cellAt(row, col) {
  if (row < 0 || row >= TOTAL_ROWS || col < 0 || col >= 7) return VOID;
  return ROWS[row][col];
}

export function isSolid(row, col) {
  return SOLID.has(cellAt(row, col));
}

/** Lignes portant un checkpoint, dans l'ordre. */
export function checkpointRows() {
  const out = [];
  for (let r = 0; r < TOTAL_ROWS; r++) {
    if (ROWS[r].includes(CHECKPOINT)) out.push(r);
  }
  return out;
}

/**
 * Vérifie que la carte est jouable : lignes de 7 caractères, et au moins un
 * chemin où la bille ne change jamais de plus d'une colonne par ligne.
 * Renvoie la liste des problèmes (vide si tout va bien).
 */
export function validate() {
  const errors = [];
  ROWS.forEach((row, i) => {
    if (row.length !== 7) errors.push(`ligne ${i} : ${row.length} caractères au lieu de 7`);
    for (const ch of row) {
      if (!SOLID.has(ch) && ch !== VOID) errors.push(`ligne ${i} : caractère inconnu "${ch}"`);
    }
  });
  if (errors.length) return errors;

  const safe = (r, c) => isSolid(r, c) && cellAt(r, c) !== BLOCK;

  // Colonnes atteignables au sol sur la ligne courante.
  let ground = new Set();
  for (let c = 0; c < 7; c++) if (safe(0, c)) ground.add(c);
  if (!ground.size) {
    errors.push('ligne 0 : aucune case de départ');
    return errors;
  }
  // Sauts en cours : clé "ligneAtterrissage:colonne".
  let airborne = new Set();

  for (let r = 1; r < TOTAL_ROWS; r++) {
    const nextGround = new Set();
    const nextAir = new Set();

    for (const c of ground) {
      if (cellAt(r - 1, c) === JUMP) {
        // La bille décolle : elle survole les lignes intermédiaires et peut
        // dériver de trois colonnes au maximum pendant le vol.
        const land = r - 1 + JUMP_ROWS_FOR_VALIDATION;
        for (let d = -3; d <= 3; d++) {
          const col = c + d;
          if (col >= 0 && col < 7) nextAir.add(`${land}:${col}`);
        }
        continue;
      }
      for (let d = -1; d <= 1; d++) if (safe(r, c + d)) nextGround.add(c + d);
    }
    for (const key of airborne) {
      const [land, col] = key.split(':').map(Number);
      if (land === r) {
        if (safe(r, col)) nextGround.add(col);
      } else {
        nextAir.add(key);
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
