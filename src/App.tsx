import { Suspense, useState } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { ChatWindow } from '@/components/chat-window';
import { AssistantManagerProvider } from '@/providers';
import { suspend } from 'suspend-react';
import { openai } from '@/lib/openai';

function App() {
  const assistants = suspend(async () => {
    return openai.beta.assistants.list();
  }, []);

  const coordinatorAssistant = assistants.data.find(
    (a) => a.id === 'asst_9ZKh8kVuuyioPacLMlp3lErh',
  );

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div className="h-screen w-screen">
        <AssistantManagerProvider assistant={coordinatorAssistant}>
          <ChatWindow />
        </AssistantManagerProvider>
      </div>
    </Suspense>
  );
}

export default App;
