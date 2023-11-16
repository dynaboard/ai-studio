import './globals.css'

import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'

import { ModelManagerProvider, SystemUsageManagerProvider } from '@/providers'
import { router } from '@/router'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ModelManagerProvider>
      <SystemUsageManagerProvider>
        <RouterProvider router={router} />
      </SystemUsageManagerProvider>
    </ModelManagerProvider>
  </React.StrictMode>,
)
