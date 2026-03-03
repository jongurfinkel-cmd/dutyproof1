const DB_NAME = 'dutyproof-offline'
const DB_VERSION = 1
const STORE_NAME = 'checkin-queue'

export interface QueuedCheckIn {
  id?: number
  token: string
  device_time: string
  latitude: number | null
  longitude: number | null
  gps_accuracy: number | null
  queued_at: string
  synced: boolean
  sync_failed: boolean
}

function openDB(): Promise<IDBDatabase> {
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

export async function getPendingCount(): Promise<number> {
  const items = await getUnsynced()
  return items.length
}

/** Attempt to sync all queued check-ins to the server */
export async function syncPendingCheckins(): Promise<number> {
  const pending = await getUnsynced()
  let synced = 0

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
        await markSynced(item.id!)
        synced++
      } else if (res.status === 410 || res.status === 404 || res.status === 409) {
        // Token expired or already used or invalid — mark as failed, don't retry
        await markFailed(item.id!)
      }
      // Other errors (500, etc.) — leave unsynced for next attempt
    } catch {
      // Network still down — leave unsynced
    }
  }

  return synced
}
