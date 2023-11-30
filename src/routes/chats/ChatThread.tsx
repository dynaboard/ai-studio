import { useEffect } from 'react'
import { useParams } from 'react-router-dom'

import { ChatWindow } from '@/components/chat-window'
import { useChatManager } from '@/providers/chat/manager'

export function ChatThread() {
  const chatManager = useChatManager()
  const { threadID: currentThreadID } = useParams()

  useEffect(() => {
    chatManager.setCurrentThread(currentThreadID)
  }, [chatManager, currentThreadID])

  return <ChatWindow />
}
