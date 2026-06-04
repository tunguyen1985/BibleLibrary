const CACHE_VERSION = 'v1'
const STATIC_CACHE = `static-${CACHE_VERSION}`
const IMAGES_CACHE = `images-${CACHE_VERSION}`

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/data/posts.json',
  '/data/search-index.json',
  '/data/categories.json'
]

// Cài đặt: pre-cache file tĩnh
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache =>
      cache.addAll(PRECACHE_URLS).catch(() => {})
    ).then(() => self.skipWaiting())
  )
})

// Activate: xóa cache cũ
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== STATIC_CACHE && k !== IMAGES_CACHE)
            .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  )
})

// Fetch: cache-first cho tất cả
self.addEventListener('fetch', event => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)

  // Hình ảnh: cache-on-access
  if (url.pathname.startsWith('/data/images/')) {
    event.respondWith(
      caches.open(IMAGES_CACHE).then(cache =>
        cache.match(request).then(cached => {
          if (cached) return cached
          return fetch(request).then(res => {
            if (res.ok) cache.put(request, res.clone())
            return res
          }).catch(() => new Response('', { status: 404 }))
        })
      )
    )
    return
  }

  // Tất cả còn lại: cache-first, fallback network
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached
      return fetch(request).then(res => {
        if (res.ok) {
          caches.open(STATIC_CACHE).then(cache => cache.put(request, res.clone()))
        }
        return res
      }).catch(() => caches.match('/index.html'))
    })
  )
})
