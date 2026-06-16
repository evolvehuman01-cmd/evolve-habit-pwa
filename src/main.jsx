import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import PrivacyPolicy from './PrivacyPolicy.jsx'

const path = window.location.pathname

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {path === '/privacy-policy' ? <PrivacyPolicy /> : <App />}
  </React.StrictMode>
)
