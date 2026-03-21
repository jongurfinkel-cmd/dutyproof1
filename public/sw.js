/// <reference lib="webworker" />

const CACHE_NAME = 'dutyproof-v3'
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
const DB_VERSION = 3
const STORE_NAME = 'checkin-queue'
const CONFIG_STORE = 'watch-config'

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true })
      }
      if (!db.objectStoreNames.contains(CONFIG_STORE)) {
        db.createObjectStore(CONFIG_STORE, { keyPath: 'sessionToken' })
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

function markBatchSynced(ids) {
  return openDB().then((db) =>
    new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      const store = tx.objectStore(STORE_NAME)
      for (const id of ids) {
        const req = store.get(id)
        req.onsuccess = () => {
          const record = req.result
          if (record) {
            record.synced = true
            store.put(record)
          }
        }
      }
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  )
}

function deleteOlderThan(hours) {
  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()
  return openDB().then((db) =>
    new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      const store = tx.objectStore(STORE_NAME)
      const req = store.getAll()
      req.onsuccess = () => {
        const old = req.result.filter((r) => (r.synced || r.sync_failed) && r.queued_at < cutoff)
        for (const item of old) {
          store.delete(item.id)
        }
        tx.oncomplete = () => resolve(old.length)
      }
      req.onerror = () => reject(req.error)
    })
  )
}

// ─── Fetch: intercept failed check-in POSTs ───
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Intercept POST /api/checkin (legacy single check-in)
  if (request.method === 'POST' && url.pathname === '/api/checkin') {
    event.respondWith(handleCheckinPost(request))
    return
  }

  // Intercept POST /api/checkin/sync (session-mode batch sync)
  if (request.method === 'POST' && url.pathname === '/api/checkin/sync') {
    event.respondWith(handleSyncPost(request))
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
      notes: body.notes ?? null,
    })

    if (self.registration && 'sync' in self.registration) {
      try { await self.registration.sync.register('sync-checkins') } catch {}
    }

    const clients = await self.clients.matchAll({ type: 'window' })
    for (const client of clients) {
      client.postMessage({ type: 'checkin-queued', token: body.token })
    }

    return new Response(
      JSON.stringify({
        success: true,
        serverTime: body.device_time,
        nextCheckIn: null,
        offline: true,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

async function handleSyncPost(request) {
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
    // Network failure — queue each check-in individually for later batch sync
    const checkIns = body.check_ins || []
    for (const ci of checkIns) {
      await addToQueue({
        session_token: body.session_token,
        scheduled_time: ci.scheduled_time,
        device_time: ci.device_time,
        latitude: ci.latitude ?? null,
        longitude: ci.longitude ?? null,
        gps_accuracy: ci.gps_accuracy ?? null,
        notes: ci.notes ?? null,
        token: 'session-' + Date.now(), // placeholder token for queue key
      })
    }

    if (self.registration && 'sync' in self.registration) {
      try { await self.registration.sync.register('sync-checkins') } catch {}
    }

    const clients = await self.clients.matchAll({ type: 'window' })
    for (const client of clients) {
      client.postMessage({ type: 'checkin-queued', session: body.session_token, count: checkIns.length })
    }

    return new Response(
      JSON.stringify({
        created: checkIns.length,
        reconciled: 0,
        skipped: 0,
        failed: 0,
        serverTime: new Date().toISOString(),
        offline: true,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
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
  let syncedCount = 0

  // Group by session_token for batch sync
  const sessionGroups = {}
  const legacyItems = []

  for (const item of pending) {
    if (item.session_token) {
      if (!sessionGroups[item.session_token]) sessionGroups[item.session_token] = []
      sessionGroups[item.session_token].push(item)
    } else {
      legacyItems.push(item)
    }
  }

  // Batch sync session-mode check-ins
  for (const [sessionToken, items] of Object.entries(sessionGroups)) {
    try {
      const res = await fetch('/api/checkin/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_token: sessionToken,
          check_ins: items.map((item) => ({
            device_time: item.device_time,
            scheduled_time: item.scheduled_time,
            latitude: item.latitude,
            longitude: item.longitude,
            gps_accuracy: item.gps_accuracy,
            notes: item.notes,
          })),
        }),
      })
      if (res.ok) {
        const data = await res.json()
        syncedCount += (data.created || 0) + (data.reconciled || 0)
        await markBatchSynced(items.map((i) => i.id))
      } else if (res.status === 410 || res.status === 404) {
        for (const item of items) await markRecord(item.id, 'sync_failed')
      }
    } catch {
      // Still offline
    }
  }

  // Legacy single-token sync
  for (const item of legacyItems) {
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
          notes: item.notes ?? null,
          completed_offline: true,
        }),
      })
      if (res.ok) {
        await markRecord(item.id, 'synced')
        syncedCount++
      } else if (res.status === 410 || res.status === 404 || res.status === 409) {
        await markRecord(item.id, 'sync_failed')
      }
    } catch {
      // Still offline
    }
  }

  // Notify clients
  if (syncedCount > 0) {
    const clients = await self.clients.matchAll({ type: 'window' })
    for (const client of clients) {
      client.postMessage({ type: 'checkins-synced', count: syncedCount })
    }
  }

  // Cleanup old entries
  try { await deleteOlderThan(24) } catch {}
}

// ─── Periodic cleanup on activate ───
self.addEventListener('activate', () => {
  deleteOlderThan(24).catch(() => {})
})
