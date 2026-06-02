// ── HEALTH DATA INTEGRATION ───────────────────────────────
// Attempts to read steps, sleep and mindfulness from:
// 1. Web Health API (limited browser support)
// 2. Google Fit REST API (requires OAuth)
// Falls back to manual entry gracefully

const GOOGLE_FIT_CLIENT_ID = '1072939218676-93pnpm1iseqjue2f79lrgpkdt2uesc16.apps.googleusercontent.com'
const GOOGLE_FIT_SCOPES = [
  'https://www.googleapis.com/auth/fitness.activity.read',
  'https://www.googleapis.com/auth/fitness.sleep.read',
].join(' ')

// ── Google Fit OAuth ──────────────────────────────────────
export function initiateGoogleFitAuth() {
  const redirectUri = encodeURIComponent(window.location.origin + '/auth/callback')
  const scope       = encodeURIComponent(GOOGLE_FIT_SCOPES)
  const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_FIT_CLIENT_ID}&redirect_uri=${redirectUri}&response_type=token&scope=${scope}`
  window.location.href = url
}

export function getGoogleFitToken() {
  // Check URL hash for token (returned after OAuth redirect)
  const hash = window.location.hash
  if (hash.includes('access_token')) {
    const params = new URLSearchParams(hash.substring(1))
    const token  = params.get('access_token')
    if (token) {
      localStorage.setItem('gfit_token', token)
      localStorage.setItem('gfit_token_ts', Date.now().toString())
      window.history.replaceState({}, document.title, window.location.pathname)
      return token
    }
  }
  // Check stored token (expires after 1 hour)
  const stored = localStorage.getItem('gfit_token')
  const ts     = parseInt(localStorage.getItem('gfit_token_ts') || '0')
  if (stored && Date.now() - ts < 3500000) return stored
  return null
}

export function revokeGoogleFit() {
  localStorage.removeItem('gfit_token')
  localStorage.removeItem('gfit_token_ts')
}

// ── Fetch today's steps from Google Fit ───────────────────
export async function fetchGoogleFitSteps(token) {
  const now       = Date.now()
  const midnight  = new Date(); midnight.setHours(0,0,0,0)
  const startMs   = midnight.getTime()

  const body = {
    aggregateBy: [{ dataTypeName: 'com.google.step_count.delta' }],
    bucketByTime: { durationMillis: 86400000 },
    startTimeMillis: startMs,
    endTimeMillis: now,
  }

  try {
    const res  = await fetch('https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate', {
      method:  'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    })
    const data = await res.json()
    const bucket = data.bucket?.[0]
    const points = bucket?.dataset?.[0]?.point || []
    const steps  = points.reduce((sum, p) => sum + (p.value?.[0]?.intVal || 0), 0)
    return steps || null
  } catch { return null }
}

// ── Fetch last night's sleep from Google Fit ──────────────
export async function fetchGoogleFitSleep(token) {
  const now      = Date.now()
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate()-1); yesterday.setHours(18,0,0,0)

  const body = {
    aggregateBy: [{ dataTypeName: 'com.google.sleep.segment' }],
    bucketByTime: { durationMillis: 86400000 },
    startTimeMillis: yesterday.getTime(),
    endTimeMillis: now,
  }

  try {
    const res  = await fetch('https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate', {
      method:  'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    })
    const data = await res.json()
    const bucket = data.bucket?.[0]
    const points = bucket?.dataset?.[0]?.point || []
    // Sum sleep segments (type 1=light, 2=deep, 3=REM — exclude 4=awake)
    const sleepMs = points
      .filter(p => p.value?.[0]?.intVal !== 4)
      .reduce((sum, p) => {
        const dur = parseInt(p.endTimeNanos) - parseInt(p.startTimeNanos)
        return sum + dur / 1e6
      }, 0)
    const sleepHrs = Math.round((sleepMs / 3600000) * 10) / 10
    return sleepHrs > 0 ? sleepHrs : null
  } catch { return null }
}

// ── Auto-fill habit values from health APIs ───────────────
export async function autoFillFromHealth(token) {
  const results = {}
  if (!token) return results

  const [steps, sleep] = await Promise.all([
    fetchGoogleFitSteps(token),
    fetchGoogleFitSleep(token),
  ])

  if (steps !== null) results.steps       = steps
  if (sleep !== null) results.sleep       = sleep

  return results
}
