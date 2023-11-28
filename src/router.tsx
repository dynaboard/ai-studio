import { Suspense } from 'react'
import { createBrowserRouter, redirect } from 'react-router-dom'

import App from '@/App'
import { DEFAULT_MODEL } from '@/providers/models/manager'
import { ChatThread } from '@/routes/chats/ChatThread'
import { ChatsIndex } from '@/routes/chats/Index'
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
    loader: async () => {
      const isModelDownloaded =
        await window.models.isModelDownloaded(DEFAULT_MODEL)
      const areTransformersAvailable =
        await window.transformers.doesTransformersCacheExist()
      return {
        needsSetup: !isModelDownloaded || !areTransformersAvailable,
      }
    },
    children: [
      { index: true, element: <></>, loader: () => redirect('/chats') },
      {
        path: '/chats',
        element: <ChatsIndex />,
        children: [
          {
            path: '/chats/:threadID',
            element: <ChatThread />,
          },
        ],
      },
      {
        path: '/models',
        element: <ModelsPage />,
      },
    ],
  },
])
