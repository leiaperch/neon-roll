import { STATE, CAUSES } from './game.js';

const pct = (v) => `${Math.floor(v * 100)} %`;
const couronnes = (n, total) => '♛'.repeat(n) + '·'.repeat(Math.max(0, total - n));

/**
 * L'interface vit dans le HTML : on bascule des classes et on écrit du texte.
 * Les lignes de la pochette sont clonées depuis un <template>, jamais
 * fabriquées à coups de chaînes.
 */
export class Ui {
  constructor(root) {
    this.root = root;
    this.overlay = root.querySelector('#overlay');
    this.hud = root.querySelector('#hud');
    this.tracklist = root.querySelector('#tracklist');
    this.template = root.querySelector('#tpl-track');
    this.muteButton = root.querySelector('#mute');
    this.overlayVisible = true;
    this.onSelect = null;

    this.el = {
      code: root.querySelector('#hud-code'),
      titre: root.querySelector('#hud-title'),
      crowns: root.querySelector('#hud-crowns'),
      grooveFill: root.querySelector('#groove-fill'),
      grooveHead: root.querySelector('#groove-head'),
      progress: root.querySelector('#hud-progress'),
      diamonds: root.querySelector('#hud-diamonds'),
      bpm: root.querySelector('#hud-bpm'),
      flashCheckpoint: root.querySelector('#flash-checkpoint'),
      flashCrown: root.querySelector('#flash-crown'),
      briefFace: root.querySelector('#brief-face'),
      briefIndex: root.querySelector('#brief-index'),
      briefTitle: root.querySelector('#brief-title'),
      briefGenre: root.querySelector('#brief-genre'),
      briefTagline: root.querySelector('#brief-tagline'),
      briefBpm: root.querySelector('#brief-bpm'),
      briefLength: root.querySelector('#brief-length'),
      briefBest: root.querySelector('#brief-best'),
      deathCause: root.querySelector('#death-cause'),
      deathProgress: root.querySelector('#death-progress'),
      deathBest: root.querySelector('#death-best'),
      deathAttempts: root.querySelector('#death-attempts'),
      winTitle: root.querySelector('#win-title'),
      winCrowns: root.querySelector('#win-crowns'),
      winDiamonds: root.querySelector('#win-diamonds'),
      winAttempts: root.querySelector('#win-attempts'),
      sleeveTotal: root.querySelector('#sleeve-total'),
    };
  }

  bind(actions) {
    const lier = (id, fn) => this.root.querySelector(id).addEventListener('click', fn);
    lier('#btn-play', actions.onPlay);
    lier('#btn-back', actions.onSleeve);
    lier('#btn-retry', actions.onRetry);
    lier('#btn-restart', actions.onRestart);
    lier('#btn-sleeve', actions.onSleeve);
    lier('#btn-sleeve2', actions.onSleeve);
    lier('#btn-replay', actions.onRestart);
    lier('#btn-next', actions.onNext);
    this.muteButton.addEventListener('click', actions.onMute);
  }

  /** Remplit la pochette à partir des pistes et de la progression connue. */
  buildSleeve(tracks, save) {
    this.tracklist.replaceChildren();
    let secondes = 0;
    for (const track of tracks) {
      const duree = (track.totalRows * 60) / (track.bpm * track.rowsPerBeat);
      secondes += duree;
      const etat = save.get(track.id);
      const node = this.template.content.firstElementChild.cloneNode(true);
      node.querySelector('.track-code').textContent = `${track.face}${track.index}`;
      node.querySelector('.track-title').textContent = track.title;
      node.querySelector('.track-genre').textContent = `${track.genre} · ${track.bpm} bpm · ${format(duree)}`;
      node.querySelector('.track-best').textContent = etat.best > 0 ? pct(etat.best) : '—';
      node.querySelector('.track-crowns').textContent = couronnes(etat.crowns, track.crownCount);
      if (etat.cleared) node.classList.add('is-cleared');
      node.querySelector('.track-btn').addEventListener('click', () => {
        if (this.onSelect) this.onSelect(track);
      });
      this.tracklist.append(node);
    }
    this.el.sleeveTotal.textContent = `durée totale ${format(secondes)}`;
  }

  /** L'accent de l'interface suit la piste affichée. */
  applyPalette(track) {
    const hex = `#${track.palette.accent.toString(16).padStart(6, '0')}`;
    document.documentElement.style.setProperty('--accent', hex);
  }

  showBrief(track, save) {
    const etat = save.get(track.id);
    const duree = (track.totalRows * 60) / (track.bpm * track.rowsPerBeat);
    this.el.briefFace.textContent = `Face ${track.face}`;
    this.el.briefIndex.textContent = String(track.index);
    this.el.briefTitle.textContent = track.title;
    this.el.briefGenre.textContent = track.genre;
    this.el.briefTagline.textContent = track.tagline;
    this.el.briefBpm.textContent = `${track.bpm} bpm`;
    this.el.briefLength.textContent = format(duree);
    this.el.briefBest.textContent = etat.best > 0 ? pct(etat.best) : 'inédit';
    this._panel('brief');
  }

  showSleeve() {
    this._panel('sleeve');
  }

  setState(game) {
    if (game.state === STATE.PLAYING) {
      this._panel('');
      this.hud.hidden = false;
      this.el.code.textContent = `${game.track.face}${game.track.index}`;
      this.el.titre.textContent = game.track.title;
      this.el.bpm.textContent = `${game.track.bpm} bpm`;
    }
  }

  showDeath(game) {
    this.el.deathCause.textContent = CAUSES[game.deathCause] || 'Lecture interrompue';
    this.el.deathProgress.textContent = pct(game.progress);
    this.el.deathBest.textContent = pct(game.bestProgress);
    this.el.deathAttempts.textContent = String(game.attempts);
    this._panel('dead');
  }

  showWin(game) {
    this.el.winTitle.textContent = game.track.title;
    this.el.winCrowns.textContent = `${game.crowns}/${game.totalCrowns}`;
    this.el.winDiamonds.textContent = `${game.diamonds}/${game.totalDiamonds}`;
    this.el.winAttempts.textContent = String(game.attempts);
    this._panel('win');
  }

  setMuted(muted) {
    this.muteButton.textContent = muted ? 'muet' : 'son';
    this.muteButton.classList.toggle('is-off', muted);
  }

  flashCheckpoint() {
    this._flash(this.el.flashCheckpoint);
  }

  flashCrown() {
    this._flash(this.el.flashCrown);
  }

  _flash(el) {
    el.classList.remove('is-on');
    void el.offsetWidth; // relance l'animation sans la dupliquer
    el.classList.add('is-on');
  }

  _panel(name) {
    this.overlay.dataset.panel = name || '';
    this.overlayVisible = Boolean(name);
    this.overlay.classList.toggle('is-hidden', !name);
    if (name) this.hud.hidden = name !== 'dead' && name !== 'win';
  }

  updateHud(game) {
    const p = game.progress;
    this.el.grooveFill.style.transform = `scaleX(${p})`;
    this.el.grooveHead.style.left = `${p * 100}%`;
    this.el.progress.textContent = pct(p);
    this.el.diamonds.textContent = `◆ ${game.diamonds}/${game.totalDiamonds}`;
    this.el.crowns.textContent = couronnes(game.crowns, game.totalCrowns);
  }
}

function format(secondes) {
  const m = Math.floor(secondes / 60);
  const s = Math.round(secondes % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}
