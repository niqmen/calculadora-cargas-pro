/* ============================================================
   Service Worker — Calculadora de Cuadro de Cargas Pro
   Ing. Niquel Mendoza M. | niqmen.github.io/calculadora-cargas-pro
   ============================================================ */

const CACHE_STATIC = 'cuadro-cargas-static-v3';
const CACHE_IMAGES = 'cuadro-cargas-images-v1';

const BASE = '/calculadora-cargas-pro';

/* Assets que se cachean al instalar (precache) */
const PRECACHE = [
  `${BASE}/`,
  `${BASE}/index.html`,
  `${BASE}/css/styles.css`,
  `${BASE}/js/calculos.js`,
  `${BASE}/js/app.js`,
  `${BASE}/js/exportar.js`,
  `${BASE}/js/modal.js`,
  `${BASE}/js/drive.js`,
  `${BASE}/js/pagos.js`,
  `${BASE}/manifest.json`,
  `${BASE}/Logo_Asesor_Electricista.webp`,
  /* JSON de datos — ajusta si tienes más archivos en /data/ */
  `${BASE}/data/residencial.json`,
  `${BASE}/data/panaderia.json`,
  `${BASE}/data/carpinteria.json`,
  `${BASE}/data/carpinteria_metalica.json`,
  `${BASE}/data/consultorio_dental.json`,
  `${BASE}/data/imprenta.json`,
  `${BASE}/data/polleria.json`,
  `${BASE}/data/restaurante.json`,
  `${BASE}/data/carniceria.json`,
  `${BASE}/data/minimarket.json`,
];

/* ── INSTALL ── */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_STATIC)
      .then(cache => cache.addAll(
          /* Filtramos con try individual para que un 404 no rompa todo */
          PRECACHE
        ).catch(() =>
          Promise.allSettled(PRECACHE.map(url =>
            caches.open(CACHE_STATIC).then(c => c.add(url)).catch(() => {})
          ))
        )
      )
      .then(() => self.skipWaiting())
  );
});

/* ── ACTIVATE: eliminar caches viejos ── */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_STATIC && k !== CACHE_IMAGES)
          .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

/* ── FETCH ── */
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  /* Solo GET */
  if (request.method !== 'GET') return;
  if (url.protocol === 'chrome-extension:') return;

  /* Google (Forms, Drive, Apps Script) → siempre red */
  if (url.hostname.includes('google') || url.hostname.includes('googleapis')) {
    event.respondWith(fetch(request).catch(() => new Response('', { status: 503 })));
    return;
  }

  /* CDN (jsPDF, SheetJS, Google Fonts) → Cache-First */
  if (
    url.hostname === 'cdnjs.cloudflare.com' ||
    url.hostname === 'cdn.sheetjs.com' ||
    url.hostname === 'fonts.googleapis.com' ||
    url.hostname === 'fonts.gstatic.com'
  ) {
    event.respondWith(cacheFirst(request, CACHE_STATIC));
    return;
  }

  /* Imágenes propias → Cache-First con fallback SVG */
  if (request.destination === 'image') {
    event.respondWith(cacheFirstImage(request));
    return;
  }

  /* Todo lo demás de github.io → Stale-While-Revalidate */
  if (url.hostname === 'niqmen.github.io') {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }
});

/* ══════════════════════════════════
   ESTRATEGIAS
══════════════════════════════════ */

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) (await caches.open(cacheName)).put(request, response.clone());
    return response;
  } catch {
    return new Response('Sin conexión', { status: 503 });
  }
}

async function cacheFirstImage(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) (await caches.open(CACHE_IMAGES)).put(request, response.clone());
    return response;
  } catch {
    return new Response(
      `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="150">
        <rect width="200" height="150" fill="#1a1a1a"/>
        <text x="50%" y="55%" fill="#F5C400" text-anchor="middle"
          font-size="13" font-family="sans-serif">Sin imagen</text>
      </svg>`,
      { headers: { 'Content-Type': 'image/svg+xml' } }
    );
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_STATIC);
  const cached = await cache.match(request);
  /* Actualiza en background aunque sirva desde caché */
  const fetchPromise = fetch(request).then(r => {
    if (r.ok) cache.put(request, r.clone());
    return r;
  }).catch(() => null);
  return cached || await fetchPromise || new Response('Sin conexión', { status: 503 });
}

/* ── Mensaje para forzar actualización ── */
self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});
