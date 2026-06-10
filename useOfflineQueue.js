// ── OFFLINE QUEUE ─────────────────────────────────────────
// Caches failed submissions and retries when back online.
// NOTE: no-cors fetches return opaque responses — we cannot
// confirm server receipt. We mark items as "sent" once the
// fetch resolves without a network error, which is the best
// signal available without CORS on the Apps Script endpoint.

const QUEUE_KEY = 'evolve_offline_queue'

export function queueLog(payload, url) {
  try {
    const queue = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]')
    // Deduplicate: replace existing entry for same date + clientId
    const idx = queue.findIndex(
      i => i.payload?.date === payload?.date &&
           i.payload?.clientId === payload?.clientId &&
           i.url === url
    )
    const entry = { payload, url, queuedAt: new Date().toISOString() }
    if (idx >= 0) queue[idx] = entry
    else queue.push(entry)
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
  } catch {}
}

export function getQueueLength() {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]').length
  } catch { return 0 }
}

export async function flushQueue() {
  let queue = []
  try {
    queue = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]')
  } catch { return 0 }
  if (!queue.length) return 0

  const remaining = []
  let sent = 0

  for (const item of queue) {
    try {
      await fetch(item.url, {
        method:  'POST',
        mode:    'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(item.payload),
      })
      // no-cors resolves = network layer accepted the request.
      // We cannot confirm Apps Script wrote it, but this is the
      // best signal available without enabling CORS on the endpoint.
      sent++
    } catch {
      remaining.push(item)
    }
  }

  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(remaining))
  } catch {}
  return sent
}
// NOTE: useOnlineStatus removed — event listener is registered
// directly in App.jsx with proper cleanup via useEffect return.
