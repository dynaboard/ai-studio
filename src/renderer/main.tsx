import './globals.css'

import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'

import {
  BrowserWindowManagerProvider,
  HistoryManagerProvider,
  ModelManagerProvider,
  SystemUsageManagerProvider,
  ToolManagerProvider,
} from '@/providers'
import { router } from '@/router'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ModelManagerProvider>
      <BrowserWindowManagerProvider>
        <SystemUsageManagerProvider>
          <HistoryManagerProvider>
            <ToolManagerProvider>
              <RouterProvider router={router} />
            </ToolManagerProvider>
          </HistoryManagerProvider>
        </SystemUsageManagerProvider>
      </BrowserWindowManagerProvider>
    </ModelManagerProvider>
  </React.StrictMode>,
)
