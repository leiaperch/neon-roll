/**
 * Constantes géométriques partagées. Tout ce qui touche au rythme dépend en
 * revanche du morceau : chaque piste a son tempo, donc sa vitesse de défilement.
 * Une ligne de carte vaut toujours une subdivision musicale, quelle que soit
 * la piste, ce qui garde la synchronisation vraie par construction.
 */

export const COLS = 7;
export const TILE = 2; // largeur d'une colonne et profondeur d'une ligne
export const TRACK_HALF = ((COLS - 1) / 2) * TILE;

export const BALL_RADIUS = 0.55;
export const BALL_Y = BALL_RADIUS;
// Le déplacement latéral doit permettre de changer de colonne entre deux
// croches consécutives, sinon un « boum boum » du lead ne peut pas devenir
// deux esquives. Deux unités à cette vitesse prennent 0,05 s.
export const MAX_LATERAL_SPEED = 38;
export const CONVEYOR_PUSH = 5.5; // poussée latérale d'un tapis, en unités/s

export const BLOCK_SIZE = 1.55;
export const BLOCK_HEIGHT = 1.55;

export const JUMP_ROWS = 5; // portée d'un tremplin, en lignes
export const JUMP_HEIGHT = 1.9; // apex : passe au-dessus des trous, pas des blocs

export const FALL_DEATH_Y = -3.5;
export const PICKUP_RADIUS = 1.1;
export const CROWN_PICKUP_RADIUS = 1.3;

/** Durée d'une ligne, en secondes, pour un morceau donné. */
export const rowDuration = (bpm, rowsPerBeat) => 60 / (bpm * rowsPerBeat);

/** Vitesse de défilement induite : le tempo pilote la difficulté. */
export const trackSpeed = (bpm, rowsPerBeat) => TILE / rowDuration(bpm, rowsPerBeat);

/** La caméra recule quand ça va vite, pour garder le temps de réaction constant. */
export const cameraDistance = (speed) => 7.4 + speed * 0.32;
