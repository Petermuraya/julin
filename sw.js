const CACHE_NAME = 'juln-pwa-v1';

// Build asset URLs relative to the service worker scope so the SW works when
// the site is hosted under a repo subpath (e.g. GitHub Pages /username/repo/).
const ensureTrailing = (s) => (s.endsWith('/') ? s : `${s}/`);
const SCOPE_PATH = (self.registration && self.registration.scope)
  ? new URL(self.registration.scope).pathname
  : '/';
const BASE_PATH = ensureTrailing(SCOPE_PATH);

const ASSETS_TO_CACHE = ['','index.html','site.webmanifest','favicon.ico']
  .map((p) => new URL(p, `${self.location.origin}${BASE_PATH}`).href);

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);

    // Use Promise.allSettled so a single missing/failed resource doesn't
    // abort the entire install. Log failures for diagnostics.
    const results = await Promise.allSettled(
      ASSETS_TO_CACHE.map(async (url) => {
        try {
          const res = await fetch(url, { cache: 'no-cache' });
          if (!res || !res.ok) throw new Error(`Failed to fetch ${url} (status: ${res && res.status})`);
          await cache.put(url, res.clone());
        } catch (err) {
          // rethrow to be captured by allSettled
          throw err;
        }
      })
    );

    const failed = results.filter((r) => r.status === 'rejected');
    if (failed.length) {
      // Non-fatal: log the failures but allow activation
      console.warn('[sw] some assets failed to cache during install:', failed.map((f) => f.reason));
    }
  })());

  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Navigation requests: try network first, fallback to cache
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return res;
        })
        .catch(() => caches.match(request).then((r) => r || caches.match(`${BASE_PATH}index.html`)))
    );
    return;
  }

  // For other requests, use cache-first strategy
  event.respondWith(
    caches.match(request).then((cached) =>
      cached || fetch(request).then((res) => {
        // don't cache opaque responses (e.g., cross-origin)
        if (res && res.type === 'basic' && res.status === 200) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return res;
      }).catch(() => cached)
    )
  );
});
