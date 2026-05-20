import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import LandscapeGuard from './LandscapeGuard.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LandscapeGuard>
      <App />
    </LandscapeGuard>
  </StrictMode>,
)
