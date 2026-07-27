import * as THREE from 'three';
import { World } from './world.js';
import { Input } from './input.js';
import { Synth } from './synth.js';
import { Ui } from './ui.js';
import { Save } from './save.js';
import { Game, STATE } from './game.js';
import { TRACKS, validateAll } from './tracks/index.js';

for (const piste of validateAll()) {
  if (piste.erreurs.length) console.warn(`piste ${piste.id} incohérente :`, piste.erreurs);
}

const PARAMS = new URLSearchParams(location.search);
// `?debug` garde le tampon de dessin lisible, pour les captures d'écran.
const DEBUG = PARAMS.has('debug');
// `?hero` (ou `?embed`) : mode vitrine embarqué — pas de pochette, la piste est
// prête et se lance au premier clic (pour l'intégration dans un portfolio).
const HERO = PARAMS.has('hero') || PARAMS.has('embed');

const canvas = document.querySelector('#scene');
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: window.devicePixelRatio < 2,
  powerPreference: 'high-performance',
  preserveDrawingBuffer: DEBUG,
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;

const world = new World(renderer);
const input = new Input(canvas);
const synth = new Synth();
const ui = new Ui(document.body);
const save = new Save();
const game = new Game(world, input, synth, ui, save);

let courante = TRACKS[0];

function resize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  renderer.setSize(w, h, false);
  world.resize(w, h);
}
window.addEventListener('resize', resize);
resize();

/** Charge une piste et présente sa fiche, sans encore lancer la lecture. */
function select(track) {
  courante = track;
  ui.applyPalette(track);
  game.load(track);
  world.updateCamera(game.player, 0);
  ui.showBrief(track, save);
}

async function launch(fromScratch) {
  await synth.init();
  game.start(fromScratch);
}

function retourPochette() {
  synth.stop();
  game.state = STATE.MENU;
  ui.buildSleeve(TRACKS, save);
  ui.showSleeve();
}

ui.onSelect = select;
ui.bind({
  onPlay: () => launch(true),
  onRetry: () => launch(false),
  onRestart: () => launch(true),
  onSleeve: retourPochette,
  onNext: () => {
    const suivante = TRACKS[(TRACKS.indexOf(courante) + 1) % TRACKS.length];
    select(suivante);
  },
  onMute: () => {
    synth.setMuted(!synth.muted);
    ui.setMuted(synth.muted);
  },
});

ui.setMuted(false);
ui.applyPalette(courante);
game.load(courante);

if (HERO) {
  // vitrine : aucune pochette, la piste est posée et n'attend qu'un clic
  document.body.classList.add('is-hero');
  ui._panel('');
  world.updateCamera(game.player, 0);
  const hint = document.createElement('div');
  hint.id = 'hero-hint';
  hint.textContent = '▶ clique pour jouer';
  document.body.append(hint);
  const lancerAuClic = () => {
    if (game.state === STATE.MENU) { hint.remove(); launch(true); }
  };
  canvas.addEventListener('pointerdown', lancerAuClic);
} else {
  ui.buildSleeve(TRACKS, save);
  ui.showSleeve();
}

// Pendant l'animation de chute, le panneau n'est pas encore là : une tape sur
// la piste relance immédiatement, sans attendre.
input.onFirstTouch = () => {
  if (game.state === STATE.DYING && !ui.overlayVisible) launch(false);
};

window.__sillon = {
  game, world, renderer, synth, input, ui, save, TRACKS, THREE,
  /** Vérifie qu'une piste, ou toutes, restent franchissables. */
  async autoplay(id) {
    const { autoplay } = await import('./autoplay.js');
    const cibles = id ? TRACKS.filter((t) => t.id === id) : TRACKS;
    const rapport = cibles.map((t) => autoplay(game, world, input, t));
    game.load(courante);
    ui.showSleeve();
    return rapport;
  },

  /** Mesure ce que chaque piste exige réellement d'un joueur. */
  async audit() {
    const { audit } = await import('./autoplay.js');
    return TRACKS.map((t) => audit(t));
  },

  /** Vérifie que ce qui est affiché correspond à ce qui tue. */
  async coherence() {
    const { coherence } = await import('./autoplay.js');
    const rapport = TRACKS.map((t) => {
      world.load(t);
      return { piste: t.id, ecarts: coherence(world, t) };
    });
    game.load(courante);
    return rapport;
  },
};

let last = performance.now();
renderer.setAnimationLoop((now) => {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (game.state !== STATE.MENU) game.update(dt);
  else world.updateCamera(game.player, 0);
  renderer.render(world.scene, world.camera);
});

if ('serviceWorker' in navigator && location.protocol === 'https:') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}
