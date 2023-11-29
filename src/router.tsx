import { Suspense } from 'react'
import { createHashRouter, redirect } from 'react-router-dom'

import App from '@/App'
import { ChatThread } from '@/routes/chats/ChatThread'
import { ChatsIndex } from '@/routes/chats/Index'
import { ModelsPage } from '@/routes/Models'

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
