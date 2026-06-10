import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import CoachDashboard from './CoachDashboard.jsx'
import { ErrorBoundary } from './App.jsx'

// Route /coach to CoachDashboard, everything else to App.
// This is a simple pathname check — no router dependency needed.
const isCoachRoute = window.location.pathname === '/coach'
const Root = isCoachRoute ? CoachDashboard : App

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <Root />
    </ErrorBoundary>
  </React.StrictMode>
)
