import { Suspense } from 'react'
import { createBrowserRouter } from 'react-router-dom'

import App from '@/App'
import { HomePage } from '@/routes/Home'
import { ModelsPage } from '@/routes/Models'

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <Suspense
        fallback={
          <div>
            {/* Maybe we can add an animated logo or something here? */}
          </div>
        }
      >
        <App />
      </Suspense>
    ),
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: '/models',
        element: <ModelsPage />,
      },
    ],
  },
])
