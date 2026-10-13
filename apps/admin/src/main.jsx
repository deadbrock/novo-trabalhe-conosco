import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/design-system/styles/globals.css'
import { AppProviders, AppRouter } from '@/app/App'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppProviders>
      <AppRouter />
    </AppProviders>
  </StrictMode>,
)
