/* Service worker : le jeu tient dans quelques fichiers statiques, on les sert
   depuis le cache pour qu'il démarre hors ligne.

   La page HTML, elle, est demandée au réseau en premier. Sans ça une nouvelle
   version déployée n'atteint jamais un appareil qui a déjà joué : l'ancien
   index.html resterait servi depuis le cache, avec ses anciens scripts. */

const CACHE = 'sillon-v3';
const NOYAU = ['./', './index.html', './manifest.webmanifest', './icon.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(NOYAU))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;

  // Navigation : réseau d'abord, cache en secours hors ligne.
  if (req.mode === 'navigate' || req.destination === 'document') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copie = res.clone();
          caches.open(CACHE).then((cache) => cache.put('./index.html', copie)).catch(() => {});
          return res;
        })
        .catch(() => caches.match('./index.html').then((hit) => hit || caches.match('./')))
    );
    return;
  }

  // Le reste porte une empreinte dans son nom : le cache ne peut pas périmer.
  event.respondWith(
    caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      const copie = res.clone();
      caches.open(CACHE).then((cache) => cache.put(req, copie)).catch(() => {});
      return res;
    }))
  );
});
