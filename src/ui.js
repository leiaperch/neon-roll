import { STATE } from './game.js';

/**
 * Toute l'interface vit dans le HTML : ici on ne fait que basculer des classes
 * et écrire du texte, jamais injecter de balises.
 */
export class Ui {
  constructor(root) {
    this.root = root;
    this.overlay = root.querySelector('#overlay');
    this.progressFill = root.querySelector('#progress-fill');
    this.progressLabel = root.querySelector('#progress-label');
    this.diamondLabel = root.querySelector('#diamond-label');
    this.checkpointFlash = root.querySelector('#checkpoint-flash');
    this.deathProgress = root.querySelector('#death-progress');
    this.deathBest = root.querySelector('#death-best');
    this.deathAttempts = root.querySelector('#death-attempts');
    this.deathCause = root.querySelector('#death-cause');
    this.winDiamonds = root.querySelector('#win-diamonds');
    this.winAttempts = root.querySelector('#win-attempts');
    this.muteButton = root.querySelector('#mute');
    this.overlayVisible = true;
    this._flashTimer = 0;
  }

  /** Branche les boutons sur les actions du jeu. */
  bind({ onStart, onRetry, onRestart, onMute }) {
    this.root.querySelector('#btn-start').addEventListener('click', onStart);
    this.root.querySelector('#btn-retry').addEventListener('click', onRetry);
    this.root.querySelector('#btn-restart').addEventListener('click', onRestart);
    this.root.querySelector('#btn-replay').addEventListener('click', onRestart);
    this.muteButton.addEventListener('click', onMute);
  }

  setMuted(muted) {
    this.muteButton.textContent = muted ? '♪ off' : '♪ on';
    this.muteButton.classList.toggle('is-off', muted);
  }

  _showPanel(name) {
    this.overlay.dataset.panel = name || '';
    this.overlayVisible = Boolean(name);
    this.overlay.classList.toggle('is-hidden', !name);
  }

  showMenu() {
    this._showPanel('menu');
  }

  setState(game) {
    if (game.state === STATE.PLAYING) this._showPanel('');
  }

  showDeath(game) {
    this.deathProgress.textContent = `${Math.floor(game.progress * 100)} %`;
    this.deathBest.textContent = `${Math.floor(game.bestProgress * 100)} %`;
    this.deathAttempts.textContent = String(game.attempts);
    this.deathCause.textContent = { trou: 'Tombée dans le vide', bloc: 'Percutée par un bloc', obstacle: 'Fauchée par un obstacle' }[game.deathCause] || '';
    this._showPanel('dead');
  }

  showWin(game) {
    this.winDiamonds.textContent = `${game.diamonds} / ${game.totalDiamonds}`;
    this.winAttempts.textContent = String(game.attempts);
    this._showPanel('win');
  }

  flashCheckpoint() {
    this.checkpointFlash.classList.remove('is-on');
    // Redémarre l'animation CSS sans la dupliquer.
    void this.checkpointFlash.offsetWidth;
    this.checkpointFlash.classList.add('is-on');
  }

  updateHud(game) {
    const pct = Math.floor(game.progress * 100);
    this.progressFill.style.transform = `scaleX(${game.progress})`;
    this.progressLabel.textContent = `${pct} %`;
    this.diamondLabel.textContent = `${game.diamonds} / ${game.totalDiamonds}`;
  }
}
