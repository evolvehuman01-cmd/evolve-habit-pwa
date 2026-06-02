// ── OFFLINE QUEUE ─────────────────────────────────────────
// Caches failed submissions and retries when back online

const QUEUE_KEY = 'evolve_offline_queue'

export function queueLog(payload, url) {
  const queue = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]')
  queue.push({ payload, url, queuedAt: new Date().toISOString() })
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
}

export function getQueueLength() {
  return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]').length
}

export async function flushQueue() {
  const queue = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]')
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
      sent++
    } catch {
      remaining.push(item)
    }
  }

  localStorage.setItem(QUEUE_KEY, JSON.stringify(remaining))
  return sent
}

export function useOnlineStatus(onOnline) {
  // Call onOnline callback whenever connection is restored
  if (typeof window !== 'undefined') {
    window.addEventListener('online', async () => {
      const sent = await flushQueue()
      if (sent > 0 && onOnline) onOnline(sent)
    })
  }
}
