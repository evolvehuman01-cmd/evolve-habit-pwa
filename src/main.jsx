import React from 'react'
import ReactDOM from 'react-dom/client'
import App, { ErrorBoundary } from './App.jsx'
import CoachDashboard from './CoachDashboard.jsx'

// ── ROUTING ───────────────────────────────────────────────
// No router library in this project — single check at the entry
// point. Strip trailing slash so both /coach and /coach/ match.
const path = window.location.pathname.replace(/\/+$/, '')
const isCoachRoute = path === '/coach'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      {isCoachRoute ? <CoachDashboard /> : <App />}
    </ErrorBoundary>
  </React.StrictMode>
)
