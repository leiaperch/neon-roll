import * as THREE from 'three';
import { World } from './world.js';
import { Input } from './input.js';
import { Music } from './music.js';
import { Ui } from './ui.js';
import { Game, STATE } from './game.js';
import { validate } from './level.js';

const errors = validate();
if (errors.length) console.warn('Niveau incohérent :', errors);

// `?debug` garde le tampon de dessin lisible, pour les captures d'écran.
const DEBUG = new URLSearchParams(location.search).has('debug');

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
renderer.toneMappingExposure = 1.0;

const world = new World(renderer);
const input = new Input(canvas);
const music = new Music();
const ui = new Ui(document.body);
const game = new Game(world, input, music, ui);

function resize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  renderer.setSize(w, h, false);
  world.resize(w, h);
}
window.addEventListener('resize', resize);
resize();

async function launch(fromScratch) {
  await music.init();
  game.start(fromScratch);
}

ui.bind({
  onStart: () => launch(true),
  onRetry: () => launch(false),
  onRestart: () => launch(true),
  onMute: () => {
    music.setMuted(!music.muted);
    ui.setMuted(music.muted);
  },
});
ui.setMuted(false);
ui.showMenu();

// Pendant l'animation de chute, le panneau n'est pas encore là : une tape
// sur la piste relance immédiatement, sans attendre.
input.onFirstTouch = () => {
  if (game.state === STATE.DYING && !ui.overlayVisible) launch(false);
};

// Point d'entrée unique pour inspecter ou piloter le jeu depuis la console.
window.__neonroll = { game, world, renderer, music, input, ui, THREE };

let last = performance.now();
renderer.setAnimationLoop((now) => {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (game.state !== STATE.MENU) game.update(dt);
  else world.updateCamera(game.player, 0);
  renderer.render(world.scene, world.camera);
});

// Vue de présentation tant que la partie n'a pas démarré.
world.camera.position.set(0, 5.4, -9);
world.updateCamera(game.player, 0);

if ('serviceWorker' in navigator && location.protocol === 'https:') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}
