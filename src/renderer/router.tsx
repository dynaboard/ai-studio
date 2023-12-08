import { Suspense } from 'react'
import { createHashRouter, redirect } from 'react-router-dom'

import App from '@/App'
import { DEFAULT_MODEL } from '@/providers/models/manager'
import { ChatThread } from '@/routes/chats/ChatThread'
import { ChatsIndex } from '@/routes/chats/Index'
import { ModelsPage } from '@/routes/Models'
import { ToolsPage } from '@/routes/Tools'

import { FilesPage } from './routes/Documents'

export const router = createHashRouter([
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
        await window.embeddings.doesTransformersCacheExist()
      return {
        needsSetup: !isModelDownloaded || !areTransformersAvailable,
      }
    },
    children: [
      { index: true, element: <></>, loader: () => redirect('/chats') },
      {
        path: '/chats',
        id: 'chats',
        element: <ChatsIndex />,
        children: [
          {
            id: 'thread',
            path: '/chats/:threadID',
            element: <ChatThread />,
          },
        ],
      },
      {
        path: '/models',
        id: 'models',
        element: <ModelsPage />,
      },
      {
        path: '/tools',
        element: <ToolsPage />,
      },
      {
        path: '/files',
        id: 'files',
        element: <FilesPage />,
      },
    ],
  },
])
