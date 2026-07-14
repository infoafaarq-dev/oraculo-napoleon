/* Oraculum — service worker
   Cachea el núcleo de la app en la instalación (funciona sin conexión)
   y guarda las tipografías de Google Fonts a medida que se usan. */

const VERSION = 'oraculum-v2';
const NUCLEO = [
  './',
  './index.html',
  './styles.css',
  './oraculum-data.js',
  './libro-1855.js',
  './app.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-512-maskable.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', evento => {
  evento.waitUntil(
    caches.open(VERSION)
      .then(cache => cache.addAll(NUCLEO))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', evento => {
  evento.waitUntil(
    caches.keys()
      .then(claves => Promise.all(
        claves.filter(k => k !== VERSION).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', evento => {
  const req = evento.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  const esFuente = url.hostname.endsWith('fonts.googleapis.com') ||
                   url.hostname.endsWith('fonts.gstatic.com');

  /* Tipografías: primero la caché, y se refresca en segundo plano */
  if (esFuente) {
    evento.respondWith(
      caches.open(VERSION).then(cache =>
        cache.match(req).then(cacheada => {
          const red = fetch(req).then(resp => {
            if (resp && resp.status === 200) cache.put(req, resp.clone());
            return resp;
          }).catch(() => cacheada);
          return cacheada || red;
        })
      )
    );
    return;
  }

  /* Solo servimos desde caché lo del propio origen */
  if (url.origin !== self.location.origin) return;

  evento.respondWith(
    caches.match(req).then(cacheada => {
      if (cacheada) return cacheada;
      return fetch(req).then(resp => {
        if (resp && resp.status === 200 && resp.type === 'basic') {
          const copia = resp.clone();
          caches.open(VERSION).then(cache => cache.put(req, copia));
        }
        return resp;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
