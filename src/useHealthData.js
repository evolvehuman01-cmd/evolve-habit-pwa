// ── HEALTH DATA INTEGRATION v2 ────────────────────────────
// All Google Fit calls now go through the Apps Script proxy.
// The client connects once — refresh tokens stored server-side.
// No more 1-hour expiry. Stays connected permanently.

// ── Initiate Google Fit connection ────────────────────────
// Calls Apps Script to get the OAuth URL, then redirects
export async function initiateGoogleFitAuth(appsScriptUrl, clientId, clientName) {
  try {
    const url = `${appsScriptUrl}?action=getAuthUrl&clientId=${encodeURIComponent(clientId)}&clientName=${encodeURIComponent(clientName)}`
    const res  = await fetch(url)
    const json = await res.json()
    if (json.success && json.url) {
      // Redirect to Google OAuth — on return, Apps Script handles the callback
      window.location.href = json.url
    }
  } catch(err) {
    console.error('Could not get auth URL:', err)
  }
}

// ── Check if client has connected Google Fit ──────────────
export async function checkFitConnection(appsScriptUrl, clientId) {
  try {
    const url  = `${appsScriptUrl}?action=checkFitConnection&clientId=${encodeURIComponent(clientId)}`
    const res  = await fetch(url)
    const json = await res.json()
    return json.connected === true
  } catch { return false }
}

// ── Fetch today's Fit data from Apps Script proxy ─────────
export async function fetchFitData(appsScriptUrl, clientId) {
  try {
    const url  = `${appsScriptUrl}?action=getFitData&clientId=${encodeURIComponent(clientId)}`
    const res  = await fetch(url)
    const json = await res.json()
    if (json.success && json.data) {
      return { connected: true, data: json.data }
    }
    return { connected: false, data: {} }
  } catch { return { connected: false, data: {} } }
}

// ── Disconnect Google Fit ─────────────────────────────────
export async function disconnectFit(appsScriptUrl, clientId) {
  try {
    const url = `${appsScriptUrl}?action=disconnectFit&clientId=${encodeURIComponent(clientId)}`
    await fetch(url)
  } catch {}
}
