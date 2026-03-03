/// <reference lib="webworker" />

const CACHE_NAME = 'dutyproof-v1'
const STATIC_ASSETS = [
  '/logo.svg',
  '/icon.svg',
]

// ─── Install: pre-cache static assets ───
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

// ─── Activate: clean old caches ───
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// ─── IndexedDB helpers (inline — SW can't import ES modules) ───
const DB_NAME = 'dutyproof-offline'
const DB_VERSION = 1
const STORE_NAME = 'checkin-queue'

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function addToQueue(data) {
  return openDB().then((db) =>
    new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      tx.objectStore(STORE_NAME).add({
        ...data,
        queued_at: new Date().toISOString(),
        synced: false,
        sync_failed: false,
      })
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  )
}

function getUnsynced() {
  return openDB().then((db) =>
    new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const req = tx.objectStore(STORE_NAME).getAll()
      req.onsuccess = () => resolve(req.result.filter((r) => !r.synced && !r.sync_failed))
      req.onerror = () => reject(req.error)
    })
  )
}

function markRecord(id, field) {
  return openDB().then((db) =>
    new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      const store = tx.objectStore(STORE_NAME)
      const req = store.get(id)
      req.onsuccess = () => {
        const record = req.result
        if (record) {
          record[field] = true
          store.put(record)
        }
        tx.oncomplete = () => resolve()
      }
      req.onerror = () => reject(req.error)
    })
  )
}

// ─── Fetch: intercept failed check-in POSTs ───
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Only intercept POST /api/checkin
  if (request.method === 'POST' && url.pathname === '/api/checkin') {
    event.respondWith(handleCheckinPost(request))
    return
  }

  // Static assets: cache-first
  if (request.method === 'GET' && STATIC_ASSETS.some((a) => url.pathname === a)) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request))
    )
    return
  }

  // Everything else: network only (default browser behavior)
})

async function handleCheckinPost(request) {
  // Clone request body before consuming
  const bodyText = await request.clone().text()
  let body
  try {
    body = JSON.parse(bodyText)
  } catch {
    return fetch(request)
  }

  try {
    const response = await fetch(request)
    return response
  } catch {
    // Network failure — queue offline
    await addToQueue({
      token: body.token,
      device_time: body.device_time,
      latitude: body.latitude ?? null,
      longitude: body.longitude ?? null,
      gps_accuracy: body.gps_accuracy ?? null,
    })

    // Register for background sync
    if (self.registration && 'sync' in self.registration) {
      try {
        await self.registration.sync.register('sync-checkins')
      } catch {
        // Background Sync not supported (Safari) — client handles fallback
      }
    }

    // Return synthetic offline response
    return new Response(
      JSON.stringify({
        success: true,
        serverTime: body.device_time,
        nextCheckIn: null,
        offline: true,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}

// ─── Background Sync: replay queued check-ins ───
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-checkins') {
    event.waitUntil(syncAllPending())
  }
})

async function syncAllPending() {
  const pending = await getUnsynced()

  for (const item of pending) {
    try {
      const res = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: item.token,
          device_time: item.device_time,
          latitude: item.latitude,
          longitude: item.longitude,
          gps_accuracy: item.gps_accuracy,
        }),
      })
      if (res.ok) {
        await markRecord(item.id, 'synced')
      } else if (res.status === 410 || res.status === 404 || res.status === 409) {
        await markRecord(item.id, 'sync_failed')
      }
    } catch {
      // Still offline — will retry on next sync
    }
  }
}
