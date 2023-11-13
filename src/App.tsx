import { Suspense } from 'react'
import { suspend } from 'suspend-react'

import { ChatWindow } from '@/components/chat-window'
import { openai } from '@/lib/openai'
import { AssistantManagerProvider } from '@/providers'

function App() {
  const assistants = suspend(async () => {
    return openai.beta.assistants.list()
  }, [])

  const coordinatorAssistant = assistants.data.find(
    // Orchestrator
    (a) => a.id === 'asst_9ZKh8kVuuyioPacLMlp3lErh',
  )

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div className="h-screen w-screen">
        <AssistantManagerProvider assistant={coordinatorAssistant}>
          <ChatWindow />
        </AssistantManagerProvider>
      </div>
    </Suspense>
  )
}

export default App
