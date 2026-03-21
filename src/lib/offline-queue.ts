const DB_NAME = 'dutyproof-offline'
const DB_VERSION = 3
const STORE_NAME = 'checkin-queue'
const CONFIG_STORE = 'watch-config'

export interface QueuedCheckIn {
  id?: number
  token: string
  device_time: string
  latitude: number | null
  longitude: number | null
  gps_accuracy: number | null
  notes: string | null
  queued_at: string
  synced: boolean
  sync_failed: boolean
  // Session mode fields
  session_token?: string
  scheduled_time?: string
}

export interface CachedWatchConfig {
  sessionToken: string
  watchId: string
  facilityName: string
  location: string | null
  assignedName: string
  interval: number
  startTime: string
  plannedEndTime: string | null
  watchLatitude: number | null
  watchLongitude: number | null
  watchRadiusM: number
  escalationPhone: string | null
  postWorkDurationMin: number
  workStoppedAt: string | null
  lastCompletedAt: string | null
  serverTime: string
  checklistCompletedAt: string | null
  cachedAt: string
}

function openDB(): Promise<IDBDatabase> {
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

// ═══════════════════════════════════════════════════════════
// Watch config caching (for offline resume)
// ═══════════════════════════════════════════════════════════

export async function cacheWatchConfig(config: CachedWatchConfig): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(CONFIG_STORE, 'readwrite')
    tx.objectStore(CONFIG_STORE).put(config)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function getCachedWatchConfig(sessionToken: string): Promise<CachedWatchConfig | null> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(CONFIG_STORE, 'readonly')
    const req = tx.objectStore(CONFIG_STORE).get(sessionToken)
    req.onsuccess = () => resolve(req.result ?? null)
    req.onerror = () => reject(req.error)
  })
}

// ═══════════════════════════════════════════════════════════
// Check-in queuing
// ═══════════════════════════════════════════════════════════

export async function queueCheckin(data: Omit<QueuedCheckIn, 'id' | 'queued_at' | 'synced' | 'sync_failed'>): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
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
}

export async function getUnsynced(): Promise<QueuedCheckIn[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const req = tx.objectStore(STORE_NAME).getAll()
    req.onsuccess = () => {
      const all = req.result as QueuedCheckIn[]
      resolve(all.filter((r) => !r.synced && !r.sync_failed))
    }
    req.onerror = () => reject(req.error)
  })
}

export async function getAllItems(): Promise<QueuedCheckIn[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const req = tx.objectStore(STORE_NAME).getAll()
    req.onsuccess = () => resolve(req.result as QueuedCheckIn[])
    req.onerror = () => reject(req.error)
  })
}

export async function markSynced(id: number): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const req = store.get(id)
    req.onsuccess = () => {
      const record = req.result
      if (record) {
        record.synced = true
        store.put(record)
      }
      tx.oncomplete = () => resolve()
    }
    req.onerror = () => reject(req.error)
  })
}

export async function markFailed(id: number): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const req = store.get(id)
    req.onsuccess = () => {
      const record = req.result
      if (record) {
        record.sync_failed = true
        store.put(record)
      }
      tx.oncomplete = () => resolve()
    }
    req.onerror = () => reject(req.error)
  })
}

export async function markBatchSynced(ids: number[]): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
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
}

export async function getPendingCount(): Promise<number> {
  const items = await getUnsynced()
  return items.length
}

/** Delete synced/failed entries older than N hours */
export async function cleanupOldEntries(hours = 24): Promise<number> {
  const db = await openDB()
  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const req = store.getAll()
    let deleted = 0
    req.onsuccess = () => {
      const old = (req.result as QueuedCheckIn[]).filter(
        (r) => (r.synced || r.sync_failed) && r.queued_at < cutoff
      )
      for (const item of old) {
        store.delete(item.id!)
        deleted++
      }
      tx.oncomplete = () => resolve(deleted)
    }
    req.onerror = () => reject(req.error)
  })
}

/** Sync all pending check-ins — routes session-mode to batch endpoint, legacy to individual */
export async function syncPendingCheckins(): Promise<{ synced: number; reconciled: number; failed: number }> {
  const pending = await getUnsynced()
  if (pending.length === 0) return { synced: 0, reconciled: 0, failed: 0 }

  let synced = 0
  let reconciled = 0
  let failed = 0

  // Group by session_token for batch sync
  const sessionGroups: Record<string, QueuedCheckIn[]> = {}
  const legacyItems: QueuedCheckIn[] = []

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
        synced += data.created ?? 0
        reconciled += data.reconciled ?? 0
        failed += data.failed ?? 0
        // Mark all items in this batch as synced
        await markBatchSynced(items.map((i) => i.id!))
      } else if (res.status === 410 || res.status === 404) {
        // Watch ended or invalid — mark all as failed
        for (const item of items) await markFailed(item.id!)
        failed += items.length
      }
      // Other errors (500) — leave for retry
    } catch {
      // Network down — leave for retry
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
        const data = await res.json()
        await markSynced(item.id!)
        if (data.reconciled) {
          reconciled++
        } else {
          synced++
        }
      } else if (res.status === 410 || res.status === 404 || res.status === 409) {
        await markFailed(item.id!)
        failed++
      }
    } catch {
      // Network still down — leave unsynced
    }
  }

  // Cleanup old entries after sync
  try { await cleanupOldEntries(24) } catch {}

  return { synced, reconciled, failed }
}
