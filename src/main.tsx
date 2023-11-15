import './globals.css'

import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'

import { ModelManagerProvider } from '@/providers'
import { router } from '@/router'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ModelManagerProvider>
      <RouterProvider router={router} />
    </ModelManagerProvider>
  </React.StrictMode>,
)
