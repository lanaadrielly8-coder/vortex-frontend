// Vortex AI — Service Worker
// Permite instalar como app e funcionar offline parcialmente

const CACHE_NAME = 'vortex-v1';
const CACHE_STATIC = [
  '/',
  '/index.html',
  '/src/App.jsx',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
];

// Instalar — salvar arquivos estáticos no cache
self.addEventListener('install', (e) => {
  console.log('[SW] Instalando Vortex PWA...');
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(CACHE_STATIC).catch(() => {
        console.log('[SW] Alguns arquivos não foram cacheados');
      });
    })
  );
  self.skipWaiting();
});

// Ativar — limpar caches antigos
self.addEventListener('activate', (e) => {
  console.log('[SW] Vortex PWA ativo!');
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch — servir do cache quando offline
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // API do backend — sempre vai para a rede (não cachear respostas da IA)
  if (url.hostname.includes('onrender.com') || url.hostname.includes('api.')) {
    return;
  }

  // Estratégia: network first, cache fallback
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        // Salvar no cache se for resposta válida
        if (res && res.status === 200 && e.request.method === 'GET') {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, resClone);
          });
        }
        return res;
      })
      .catch(() => {
        // Offline — servir do cache
        return caches.match(e.request).then((cached) => {
          if (cached) return cached;
          // Fallback para index.html (SPA)
          if (e.request.destination === 'document') {
            return caches.match('/');
          }
        });
      })
  );
});

// Push notifications (para o futuro)
self.addEventListener('push', (e) => {
  if (!e.data) return;
  const data = e.data.json();
  self.registration.showNotification(data.title || 'Vortex AI', {
    body: data.body || 'Nova notificação do Vortex',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: { url: data.url || '/' },
  });
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(clients.openWindow(e.notification.data.url || '/'));
});
