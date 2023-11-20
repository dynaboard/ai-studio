import { useEffect } from 'react'
import { useParams } from 'react-router-dom'

import { ChatWindow } from '@/components/chat-window'
import { useChatManager } from '@/providers/chat/manager'
import { useAvailableModels } from '@/providers/models/manager'

export function ChatThread() {
  const chatManager = useChatManager()
  const availableModels = useAvailableModels()
  const { threadID: currentThreadID } = useParams()

  useEffect(() => {
    chatManager.setCurrentThread(currentThreadID)
  }, [chatManager, currentThreadID])

  return <ChatWindow models={availableModels} />
}
