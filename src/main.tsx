import './globals.css'

import React from 'react'
import ReactDOM from 'react-dom/client'

import { ModelManagerProvider } from '@/providers'

import App from './App'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ModelManagerProvider>
      <App />
    </ModelManagerProvider>
  </React.StrictMode>,
)
