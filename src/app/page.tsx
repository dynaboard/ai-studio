import { AssistantsDropdown } from '@/components/assistants/dropdown';
import { ChatWindow } from '@/components/chat/chat-window';
import { openai } from '@/lib/openai';
import { AssistantManagerProvider } from '@/providers';

type SearchParams = {
  assistant?: string;
};

export default async function Home({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const assistants = await openai.beta.assistants.list();
  const currentAssistant = assistants.data.find(
    (a) => a.id === searchParams.assistant
  );

  return (
    <AssistantManagerProvider assistant={currentAssistant}>
      <div className="w-screen h-screen">
        <div className="w-full h-full overflow-hidden grid grid-rows-[64px,_minmax(0,_1fr)]">
          <div className="border-b">
            <div className="flex items-center w-full h-full px-4 gap-4">
              <AssistantsDropdown
                assistants={assistants.data}
                currentAssistantID={searchParams.assistant}
              />

              {currentAssistant ? (
                <>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold">
                      {currentAssistant.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {currentAssistant.id}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold">Model</span>
                    <span className="text-xs text-muted-foreground">
                      {currentAssistant.model}
                    </span>
                  </div>
                </>
              ) : null}
            </div>
          </div>

          <div className="h-full overflow-hidden container">
            <ChatWindow />
          </div>
        </div>
      </div>
    </AssistantManagerProvider>
  );
}
