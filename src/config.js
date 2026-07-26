/**
 * Constantes partagées. Toute la géométrie du jeu et toute la musique
 * dérivent de ces valeurs : une ligne de niveau vaut exactement une croche,
 * donc la piste est synchronisée à la musique par construction.
 */

export const BPM = 128;
export const ROWS_PER_BEAT = 2; // une ligne = une croche
export const ROW_DURATION = 60 / (BPM * ROWS_PER_BEAT); // secondes par ligne
export const STEP_DURATION = ROW_DURATION; // idem côté séquenceur

export const COLS = 7;
export const TILE = 2; // largeur d'une colonne et profondeur d'une ligne
export const TRACK_HALF = ((COLS - 1) / 2) * TILE; // x de la colonne extrême
export const SPEED = TILE / ROW_DURATION; // unités par seconde (8.53)

export const BALL_RADIUS = 0.55;
export const BALL_Y = BALL_RADIUS;
export const MAX_LATERAL_SPEED = 22; // unités/s, bride le déplacement au doigt
export const DRAG_SENSITIVITY = 0.055; // unités de monde par pixel

export const BLOCK_SIZE = 1.55;
export const BLOCK_HEIGHT = 1.55;

export const JUMP_ROWS = 5; // portée d'un tremplin, en lignes
export const JUMP_HEIGHT = 1.9; // apex : passe au-dessus des trous, pas des blocs

// Périodes longues volontairement : la bille traverse une ligne en 0,23 s et
// reste dans sa zone de collision environ 0,27 s. Un va-et-vient rapide ne
// laisserait aucun côté sûr au moment du passage.
export const SWEEPER_PERIOD_BEATS = 6; // aller-retour d'une barre balayeuse
export const SLIDER_PERIOD_BEATS = 6;

export const FALL_DEATH_Y = -3.5;
export const DIAMOND_PICKUP_RADIUS = 1.1;

/** Palette par section de 32 lignes (une section = 4 mesures). */
export const SECTIONS = [
  { floor: 0x5a76c8, accent: 0x4de2f0, block: 0xff4d6d },
  { floor: 0x6a5fc4, accent: 0x7cf6b0, block: 0xff9f1c },
  { floor: 0x4a8ba6, accent: 0xffd166, block: 0xef476f },
  { floor: 0x3a7f9c, accent: 0x9d8cff, block: 0x06d6a0 },
  { floor: 0x7a5296, accent: 0xff8fd0, block: 0x4cc9f0 },
  { floor: 0x5468b4, accent: 0x8ef0ff, block: 0xff5d8f },
  { floor: 0x8a5c92, accent: 0xffe066, block: 0x5fd3f3 },
  { floor: 0x466190, accent: 0x9dfff0, block: 0xff6b6b },
];

export const SKY_TOP = 0x070a1c;
export const SKY_BOTTOM = 0x1d2a5c;
export const FOG_COLOR = 0x0b1130;
export const FOG_NEAR = 40;
export const FOG_FAR = 96;
