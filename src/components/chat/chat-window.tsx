'use client';

import { useAssistantManager } from '@/providers/assistant';
import { Button } from '@/ui/button';
import { Input } from '@/ui/input';
import { SendHorizonal } from 'lucide-react';
import React from 'react';
import { useValue } from 'signia-react';

export function ChatWindow() {
  const assistantManager = useAssistantManager();

  const handleMessage = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const message = data.get('message') as string | undefined;
    if (!message) {
      return;
    }

    void assistantManager.sendMessage(message);
    event.currentTarget.reset();
  };

  const disabled = useValue('disabled', () => assistantManager.paused, [
    assistantManager,
  ]);

  const messages = useValue('messages', () => assistantManager.messages, [
    assistantManager,
  ]);

  return (
    <div className="grid h-full overflow-hidden grid-rows-[1fr,_min-content] border-r">
      <div className="w-full h-full overflow-auto p-4">
        {messages.map((message) => {
          return (
            <div key={message.id} className="flex flex-col mb-4">
              <span className="text-xs text-muted-foreground">
                {message.role === 'user' ? 'You' : 'Assistant'}
              </span>
              <span className="text-sm">
                {message.content[0].type === 'text'
                  ? message.content[0].text.value
                  : 'Unsupported content'}
              </span>
            </div>
          );
        })}
      </div>
      <div
        className="p-4 flex items-center
      "
      >
        <form className="relative w-full" onSubmit={handleMessage}>
          <Input name="message" className="pr-8" disabled={disabled} />
          <Button
            variant="ghost"
            className="absolute right-0 top-0 hover:bg-transparent group"
            type="submit"
            disabled={disabled}
          >
            <SendHorizonal size={16} className="group-hover:text-primary" />
          </Button>
        </form>
      </div>
    </div>
  );
}
