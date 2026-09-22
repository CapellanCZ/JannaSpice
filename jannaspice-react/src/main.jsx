import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fortawesome/fontawesome-free/css/all.min.css'
import './index.css'
import App from './App.jsx'
import { AppProvider } from './context/AppContext.jsx'
import { supabaseConfigError } from './lib/supabase/client.js'

const root = createRoot(document.getElementById('root'))

if (supabaseConfigError) {
  root.render(
    <div style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', padding: 24, fontFamily: 'system-ui, sans-serif', background: '#FDF8F6', color: '#2D2825' }}>
      <div style={{ maxWidth: 420, textAlign: 'center' }}>
        <h1 style={{ fontSize: 22, margin: '0 0 8px' }}>JannaSpice needs setup</h1>
        <p style={{ margin: 0, lineHeight: 1.5, color: '#5c534c' }}>{supabaseConfigError}</p>
      </div>
    </div>
  )
} else {
  root.render(
    <StrictMode>
      <AppProvider>
        <App />
      </AppProvider>
    </StrictMode>,
  )
}
