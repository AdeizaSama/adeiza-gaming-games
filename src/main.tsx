import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import './app/index.css'
import './app/theme/fonts'
import App from './app/App.tsx'
import { pickTheme, startingTheme } from './app/theme/themes'

// The theme picked on this device, or on a first visit one that matches the phone's dark-mode setting (ADR 0010).
pickTheme(startingTheme())

// BrowserRouter: the browser's address bar decides which page shows, and links change it without reloading.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
