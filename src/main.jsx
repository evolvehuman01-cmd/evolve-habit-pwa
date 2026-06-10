import React from 'react'
import ReactDOM from 'react-dom/client'
import App, { ErrorBoundary } from './App.jsx'
import CoachDashboard from './CoachDashboard.jsx'

const isCoachRoute = window.location.pathname === '/coach'
const Root = isCoachRoute ? CoachDashboard : App

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <Root />
    </ErrorBoundary>
  </React.StrictMode>
)
