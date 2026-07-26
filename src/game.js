import {
  COLS, TILE, TRACK_HALF, BALL_RADIUS, BALL_Y, MAX_LATERAL_SPEED,
  BLOCK_SIZE, BLOCK_HEIGHT, JUMP_ROWS, JUMP_HEIGHT, ROW_DURATION,
  FALL_DEATH_Y, DIAMOND_PICKUP_RADIUS,
} from './config.js';
import {
  TOTAL_ROWS, cellAt, isSolid, checkpointRows, BLOCK, DIAMOND, JUMP, CHECKPOINT,
} from './level.js';

const GRAVITY = 34;
const SUPPORT_TOLERANCE = TILE * 0.5 + BALL_RADIUS * 0.45;
const BLOCK_HALF_X = BLOCK_SIZE / 2 + BALL_RADIUS * 0.7;
// Volontairement inférieur à une demi-ligne (TILE / 2) : sinon deux obstacles
// consécutifs se recouvrent en profondeur et ne laissent aucun couloir pour
// se déplacer latéralement.
const BLOCK_HALF_Z = Math.min(TILE * 0.48, BLOCK_SIZE / 2 + BALL_RADIUS * 0.35);

export const STATE = {
  MENU: 'menu',
  PLAYING: 'playing',
  DYING: 'dying',
  WON: 'won',
};

const colX = (col) => (col - (COLS - 1) / 2) * TILE;

export class Game {
  constructor(world, input, music, ui) {
    this.world = world;
    this.input = input;
    this.music = music;
    this.ui = ui;

    this.checkpoints = [0, ...checkpointRows()];
    this.state = STATE.MENU;
    this.checkpointIndex = 0;
    this.diamonds = 0;
    this.bestProgress = 0;
    this.attempts = 0;
    this.shake = 0;
    this.deathTimer = 0;

    this.player = {
      x: 0, y: BALL_Y, z: 0, row: 0,
      vy: 0, grounded: true, jumping: false, falling: false,
    };
  }

  get startRow() {
    return this.checkpoints[this.checkpointIndex];
  }

  /** (Re)lance la partie depuis le dernier checkpoint atteint. */
  start(fromScratch = false) {
    if (fromScratch) {
      this.checkpointIndex = 0;
      this.diamonds = 0;
      this.bestProgress = 0;
      this.attempts = 0;
      for (const d of this.world.diamonds) d.taken = false;
    }
    this.attempts++;
    const row = this.startRow;
    const p = this.player;
    p.x = 0;
    p.y = BALL_Y;
    p.z = row * TILE;
    p.row = row;
    p.vy = 0;
    p.grounded = true;
    p.jumping = false;
    p.falling = false;
    this.jumpFromRow = -1;
    this.shake = 0;
    this.deathTimer = 0;

    this.input.reset(0);
    this.music.start(row);
    this.state = STATE.PLAYING;
    this.ui.setState(this);
  }

  update(dt) {
    const p = this.player;
    this.input.update(dt);
    if (this.shake > 0) this.shake = Math.max(0, this.shake - dt * 1.8);

    if (this.state === STATE.PLAYING) {
      this._advance(dt);
      this._collide();
    } else if (this.state === STATE.DYING) {
      // La bille continue sa chute pendant que la caméra tremble.
      p.vy -= GRAVITY * dt;
      p.y += p.vy * dt;
      this.deathTimer += dt;
      if (this.deathTimer > 0.85 && !this.ui.overlayVisible) this.ui.showDeath(this);
    }

    this.world.update(this.music.time, p);
    this.world.updateCamera(p, this.shake);
    this.ui.updateHud(this);
  }

  _advance(dt) {
    const p = this.player;
    const t = this.music.time;

    // L'avancée découle strictement de l'horloge musicale.
    const rowFloat = t / ROW_DURATION;
    p.z = rowFloat * TILE;
    const previousRow = p.row;
    p.row = Math.round(rowFloat);

    // Déplacement latéral bridé, pour que le contrôle reste lisible.
    const dx = this.input.targetX - p.x;
    const step = MAX_LATERAL_SPEED * dt;
    p.x += Math.abs(dx) <= step ? dx : Math.sign(dx) * step;
    p.x = Math.max(-TRACK_HALF - TILE * 0.35, Math.min(TRACK_HALF + TILE * 0.35, p.x));

    if (p.row >= TOTAL_ROWS - 1) {
      this._win();
      return;
    }

    // Franchissement de checkpoint.
    for (let i = this.checkpointIndex + 1; i < this.checkpoints.length; i++) {
      if (p.row >= this.checkpoints[i] && previousRow < this.checkpoints[i]) {
        this.checkpointIndex = i;
        this.ui.flashCheckpoint();
      }
    }

    // Tremplin : déclenché à l'entrée de la ligne, atterrissage calé sur JUMP_ROWS.
    if (!p.jumping && p.row !== previousRow) {
      const col = this._nearestSolidCol(p.row);
      if (col !== null && cellAt(p.row, col) === JUMP) {
        p.jumping = true;
        p.falling = false;
        this.jumpFromRow = p.row;
      }
    }

    if (p.jumping) {
      const progress = (rowFloat - this.jumpFromRow) / JUMP_ROWS;
      if (progress >= 1) {
        p.jumping = false;
        p.y = BALL_Y;
        p.grounded = true;
      } else {
        // Parabole normalisée : 0 au décollage, 0 à l'atterrissage.
        p.y = BALL_Y + 4 * JUMP_HEIGHT * progress * (1 - progress);
        p.grounded = false;
      }
    } else if (p.falling) {
      p.vy -= GRAVITY * dt;
      p.y += p.vy * dt;
      if (p.y < FALL_DEATH_Y) this._die('trou');
    } else {
      p.y = BALL_Y;
      p.grounded = true;
    }
  }

  /** Colonne solide la plus proche sous la bille, null si elle est dans le vide. */
  _nearestSolidCol(row) {
    let best = null;
    let bestDist = Infinity;
    const p = this.player;
    for (let col = 0; col < COLS; col++) {
      if (!isSolid(row, col)) continue;
      const d = Math.abs(p.x - colX(col));
      if (d < bestDist) {
        bestDist = d;
        best = col;
      }
    }
    return bestDist <= SUPPORT_TOLERANCE ? best : null;
  }

  _collide() {
    const p = this.player;
    if (this.state !== STATE.PLAYING) return;

    // Blocs fixes des lignes voisines.
    if (p.y < BLOCK_HEIGHT + BALL_RADIUS * 0.5) {
      for (let r = p.row - 1; r <= p.row + 1; r++) {
        const dz = Math.abs(p.z - r * TILE);
        if (dz > BLOCK_HALF_Z) continue;
        for (let col = 0; col < COLS; col++) {
          if (cellAt(r, col) !== BLOCK) continue;
          if (Math.abs(p.x - colX(col)) < BLOCK_HALF_X) {
            this._die('bloc');
            return;
          }
        }
      }
      // Obstacles mobiles, testés à leur position réelle du moment.
      for (const m of this.world.movers) {
        const dz = Math.abs(p.z - m.row * TILE);
        if (dz > m.halfD + BALL_RADIUS * 0.6) continue;
        if (Math.abs(p.x - m.x) < m.halfW + BALL_RADIUS * 0.7) {
          this._die('obstacle');
          return;
        }
      }
    }

    // Diamants.
    for (let i = 0; i < this.world.diamonds.length; i++) {
      const d = this.world.diamonds[i];
      if (d.taken) continue;
      if (Math.abs(d.z - p.z) < DIAMOND_PICKUP_RADIUS && Math.abs(d.x - p.x) < DIAMOND_PICKUP_RADIUS) {
        d.taken = true;
        this.diamonds++;
        this.music.sfxPickup(this.diamonds);
      }
    }

    // Sol : dès qu'aucune colonne ne soutient la bille, elle bascule dans le vide.
    if (!p.jumping) {
      const support = this._nearestSolidCol(p.row);
      if (support === null) {
        if (!p.falling) {
          p.falling = true;
          p.grounded = false;
          p.vy = -2;
        }
      } else if (p.falling) {
        p.falling = false;
        p.y = BALL_Y;
        p.vy = 0;
      }
    }
  }

  _die(cause) {
    if (this.state !== STATE.PLAYING) return;
    this.state = STATE.DYING;
    this.deathCause = cause;
    this.deathTimer = 0;
    this.shake = 1;
    this.player.vy = cause === 'trou' ? this.player.vy : 4;
    this.bestProgress = Math.max(this.bestProgress, this.progress);
    this.music.stop();
    this.music.sfxDeath();
  }

  _win() {
    this.state = STATE.WON;
    this.bestProgress = 1;
    this.music.stop();
    this.ui.showWin(this);
  }

  get progress() {
    return Math.max(0, Math.min(1, this.player.row / (TOTAL_ROWS - 1)));
  }

  get totalDiamonds() {
    return this.world.diamonds.length;
  }
}
