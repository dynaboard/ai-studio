import { createBrowserRouter } from 'react-router-dom'

import App from '@/App'
import { HomePage } from '@/routes/Home'
import { ModelsPage } from '@/routes/Models'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
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
