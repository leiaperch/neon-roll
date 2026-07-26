import { TRACK_HALF, TILE } from './config.js';

const LIMIT = TRACK_HALF + TILE * 0.35;
const KEY_SPEED = 18; // unités/s au clavier

/**
 * Contrôle unique : on glisse le doigt horizontalement. Le rapport
 * pixels → unités est calé sur la largeur de l'écran, donc un balayage
 * d'environ 70 % de l'écran traverse toute la piste, quel que soit le téléphone.
 */
export class Input {
  constructor(element) {
    this.element = element;
    this.targetX = 0;
    this.dragging = false;
    this.startPointerX = 0;
    this.startTargetX = 0;
    this.keys = new Set();
    this.onFirstTouch = null;
    this._computeRatio();

    element.addEventListener('pointerdown', this._down, { passive: false });
    window.addEventListener('pointermove', this._move, { passive: false });
    window.addEventListener('pointerup', this._up);
    window.addEventListener('pointercancel', this._up);
    window.addEventListener('keydown', this._keydown);
    window.addEventListener('keyup', this._keyup);
    window.addEventListener('resize', () => this._computeRatio());
  }

  _computeRatio() {
    this.ratio = (LIMIT * 2) / (window.innerWidth * 0.7);
  }

  _down = (e) => {
    e.preventDefault();
    this.dragging = true;
    this.startPointerX = e.clientX;
    this.startTargetX = this.targetX;
    if (this.onFirstTouch) this.onFirstTouch();
  };

  _move = (e) => {
    if (!this.dragging) return;
    e.preventDefault();
    const dx = (e.clientX - this.startPointerX) * this.ratio;
    this.targetX = clamp(this.startTargetX + dx);
  };

  _up = () => {
    this.dragging = false;
  };

  _keydown = (e) => {
    if (['ArrowLeft', 'ArrowRight', 'a', 'd', 'q'].includes(e.key)) this.keys.add(e.key);
  };

  _keyup = (e) => {
    this.keys.delete(e.key);
  };

  /** Le clavier n'existe que pour tester au bureau ; le tactile reste maître. */
  update(dt) {
    let dir = 0;
    if (this.keys.has('ArrowLeft') || this.keys.has('a') || this.keys.has('q')) dir -= 1;
    if (this.keys.has('ArrowRight') || this.keys.has('d')) dir += 1;
    if (dir !== 0) this.targetX = clamp(this.targetX + dir * KEY_SPEED * dt);
  }

  reset(x = 0) {
    this.targetX = clamp(x);
    this.dragging = false;
  }
}

function clamp(x) {
  return Math.max(-LIMIT, Math.min(LIMIT, x));
}
