import {
  COLS, TILE, TRACK_HALF, BALL_RADIUS, BALL_Y, MAX_LATERAL_SPEED, CONVEYOR_PUSH,
  BLOCK_SIZE, BLOCK_HEIGHT, JUMP_ROWS, JUMP_HEIGHT, FALL_DEATH_Y,
  PICKUP_RADIUS, CROWN_PICKUP_RADIUS, rowDuration,
} from './config.js';
import {
  BLOCK, JUMP, CHECKPOINT, LASER, RISER, BELT_R, BELT_L,
  laserBank, riserUp, checkpointRows,
} from './levelkit.js';
import { colX } from './world.js';

const GRAVITY = 34;
const SUPPORT_TOLERANCE = TILE * 0.5 + BALL_RADIUS * 0.45;
const BLOCK_HALF_X = BLOCK_SIZE / 2 + BALL_RADIUS * 0.7;
/**
 * Profondeur de collision, volontairement plus courte que le bloc visible.
 *
 * Deux obstacles sur des lignes voisines laissent une fenêtre de
 * `1 - 2 × halfZ` ligne pour changer de colonne. À 0,48 ligne cette fenêtre
 * tombe à 0,04 ligne, c'est-à-dire rien : les portes rapprochées deviennent
 * infranchissables quelle que soit la vitesse du doigt. À 0,31 ligne il reste
 * 0,38 ligne, largement de quoi passer.
 */
const BLOCK_HALF_Z = TILE * 0.31;
const LASER_HALF_Z = TILE * 0.28;
const LASER_FREE_X = TILE * 0.5 - BALL_RADIUS * 0.5; // demi-largeur de la colonne centrale

export const STATE = {
  MENU: 'menu',
  PLAYING: 'playing',
  DYING: 'dying',
  WON: 'won',
};

export const CAUSES = {
  trou: 'Tombée dans le vide',
  bloc: 'Percutée par un bloc',
  obstacle: 'Fauchée par un obstacle',
  laser: 'Coupée par un faisceau',
  piston: 'Écrasée par un piston',
};

export class Game {
  constructor(world, input, synth, ui, save) {
    this.world = world;
    this.input = input;
    this.synth = synth;
    this.ui = ui;
    this.save = save;
    this.state = STATE.MENU;
    this.track = null;
    this.player = {
      x: 0, y: BALL_Y, z: 0, row: 0,
      vy: 0, grounded: true, jumping: false, falling: false,
    };
  }

  /** Charge une piste : décor, obstacles et horloge musicale. */
  load(track) {
    this.track = track;
    this.rowDuration = rowDuration(track.bpm, track.rowsPerBeat);
    this.checkpoints = [0, ...checkpointRows(track.rows)];
    this.world.load(track);
    this.synth.load(track);
    this.checkpointIndex = 0;
    this.diamonds = 0;
    this.crowns = 0;
    this.bestProgress = 0;
    this.attempts = 0;
    this.shake = 0;
    this.deathTimer = 0;
    this.state = STATE.MENU;
  }

  get startRow() {
    return this.checkpoints[this.checkpointIndex];
  }

  /** (Re)lance la partie, depuis le début ou depuis le dernier checkpoint. */
  start(fromScratch = false) {
    if (fromScratch) {
      this.checkpointIndex = 0;
      this.diamonds = 0;
      this.crowns = 0;
      this.bestProgress = 0;
      this.attempts = 0;
      for (const d of this.world.diamonds) d.taken = false;
      for (const c of this.world.crowns) c.taken = false;
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
    this.deathCause = null;

    this.input.reset(0);
    this.synth.start(row);
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
      p.vy -= GRAVITY * dt;
      p.y += p.vy * dt;
      this.deathTimer += dt;
      if (this.deathTimer > 0.85 && !this.ui.overlayVisible) this.ui.showDeath(this);
    }

    this.world.update(this.synth.time, p);
    this.world.updateCamera(p, this.shake);
    this.ui.updateHud(this);
  }

  _advance(dt) {
    const p = this.player;
    const { grid, totalRows, rowsPerBeat } = this.track;
    const t = this.synth.time;

    const rowFloat = t / this.rowDuration;
    p.z = rowFloat * TILE;
    const previousRow = p.row;
    p.row = Math.round(rowFloat);

    // Tapis roulant : il déplace la bille et la consigne du doigt avec elle,
    // sinon le contrôle se battrait contre la poussée.
    const sous = this._nearestSolidCol(p.row);
    if (sous !== null && !p.jumping) {
      const ch = grid.cellAt(p.row, sous);
      if (ch === BELT_R || ch === BELT_L) {
        const push = (ch === BELT_R ? 1 : -1) * CONVEYOR_PUSH * dt;
        p.x += push;
        this.input.nudge(push);
      }
    }

    const dx = this.input.targetX - p.x;
    const step = MAX_LATERAL_SPEED * dt;
    p.x += Math.abs(dx) <= step ? dx : Math.sign(dx) * step;
    const limite = TRACK_HALF + TILE * 0.35;
    p.x = Math.max(-limite, Math.min(limite, p.x));

    if (p.row >= totalRows - 1) {
      this._win();
      return;
    }

    for (let i = this.checkpointIndex + 1; i < this.checkpoints.length; i++) {
      if (p.row >= this.checkpoints[i] && previousRow < this.checkpoints[i]) {
        this.checkpointIndex = i;
        this.ui.flashCheckpoint();
      }
    }

    if (!p.jumping && p.row !== previousRow) {
      const col = this._nearestSolidCol(p.row);
      if (col !== null && grid.cellAt(p.row, col) === JUMP) {
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

  /** Colonne fixe la plus proche sous la bille, null si elle est dans le vide. */
  _nearestSolidCol(row) {
    const { grid } = this.track;
    let best = null;
    let bestDist = Infinity;
    for (let col = 0; col < COLS; col++) {
      if (!grid.isSolid(row, col) || grid.cellAt(row, col) === 'P') continue;
      const d = Math.abs(this.player.x - colX(col));
      if (d < bestDist) {
        bestDist = d;
        best = col;
      }
    }
    return bestDist <= SUPPORT_TOLERANCE ? best : null;
  }

  /** Une plateforme mobile porte-t-elle la bille en ce moment ? */
  _onPlatform() {
    const p = this.player;
    for (const m of this.world.movers) {
      if (!m.solid) continue;
      if (p.row < m.row || p.row > m.rowEnd) continue;
      if (Math.abs(p.x - m.x) < m.halfW + BALL_RADIUS * 0.4) return true;
    }
    return false;
  }

  _collide() {
    const p = this.player;
    const { grid, rowsPerBeat } = this.track;
    if (this.state !== STATE.PLAYING) return;

    if (p.y < BLOCK_HEIGHT + BALL_RADIUS * 0.5) {
      for (let r = p.row - 1; r <= p.row + 1; r++) {
        const dz = Math.abs(p.z - r * TILE);
        if (dz > BLOCK_HALF_Z) continue;
        for (let col = 0; col < COLS; col++) {
          const ch = grid.cellAt(r, col);
          if (Math.abs(p.x - colX(col)) >= BLOCK_HALF_X) continue;
          if (ch === BLOCK) return this._die('bloc');
          // Le piston est évalué à l'heure d'arrivée sur sa ligne, comme le
          // fait le validateur : ce que la carte promet est ce qui se produit.
          if (ch === RISER && riserUp(r, rowsPerBeat)) return this._die('piston');
        }
      }
      for (const m of this.world.movers) {
        if (m.solid) continue;
        if (Math.abs(p.z - m.row * TILE) > m.halfD + BALL_RADIUS * 0.6) continue;
        if (Math.abs(p.x - m.x) < m.halfW + BALL_RADIUS * 0.7) return this._die('obstacle');
      }
    }

    // Faisceaux : toute la hauteur, un saut ne sauve pas.
    for (const l of this.world.lasers) {
      if (Math.abs(p.z - l.z) > LASER_HALF_Z) continue;
      const gauche = laserBank(l.row, rowsPerBeat) === 'gauche';
      if (gauche ? p.x < -LASER_FREE_X : p.x > LASER_FREE_X) return this._die('laser');
    }

    for (let i = 0; i < this.world.diamonds.length; i++) {
      const d = this.world.diamonds[i];
      if (d.taken) continue;
      if (Math.abs(d.z - p.z) < PICKUP_RADIUS && Math.abs(d.x - p.x) < PICKUP_RADIUS) {
        d.taken = true;
        this.diamonds++;
        this.synth.ramassage(this.diamonds);
      }
    }
    for (const c of this.world.crowns) {
      if (c.taken) continue;
      if (Math.abs(c.z - p.z) < CROWN_PICKUP_RADIUS && Math.abs(c.x - p.x) < CROWN_PICKUP_RADIUS) {
        c.taken = true;
        this.crowns++;
        this.synth.fanfare();
        this.ui.flashCrown(this.crowns);
      }
    }

    if (!p.jumping) {
      const porte = this._nearestSolidCol(p.row) !== null || this._onPlatform();
      if (!porte) {
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
    return undefined;
  }

  _die(cause) {
    if (this.state !== STATE.PLAYING) return;
    this.state = STATE.DYING;
    this.deathCause = cause;
    this.deathTimer = 0;
    this.shake = 1;
    if (cause !== 'trou') this.player.vy = 4;
    this.bestProgress = Math.max(this.bestProgress, this.progress);
    this.synth.stop();
    this.synth.mort();
    this._persist(false);
  }

  _win() {
    this.state = STATE.WON;
    this.bestProgress = 1;
    this.synth.stop();
    this.synth.fanfare();
    this._persist(true);
    this.ui.showWin(this);
  }

  _persist(cleared) {
    this.save.merge(this.track.id, {
      best: this.bestProgress,
      crowns: this.crowns,
      diamonds: this.diamonds,
      cleared,
    });
  }

  get progress() {
    return Math.max(0, Math.min(1, this.player.row / (this.track.totalRows - 1)));
  }

  get totalDiamonds() {
    return this.world.diamonds.length;
  }

  get totalCrowns() {
    return this.world.crowns.length;
  }
}
