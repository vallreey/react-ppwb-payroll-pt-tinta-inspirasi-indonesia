import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import './tailwind.css'
import './index.css'
import './App.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthProvider'
import { SettingsProvider } from './context/SettingsProvider'
import { ToastProvider } from './context/ToastProvider'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HashRouter>
      <ToastProvider>
        <SettingsProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </SettingsProvider>
      </ToastProvider>
    </HashRouter>
  </StrictMode>,
)
