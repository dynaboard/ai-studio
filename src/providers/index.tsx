'use client';

import { Assistant } from '@/lib/openai';
import { AssistantContext, AssistantManager } from '@/providers/assistant';
import { useMemo } from 'react';

export function AssistantManagerProvider({
  children,
  assistant,
}: {
  children: React.ReactNode;
  assistant?: Assistant;
}) {
  const manager = useMemo(() => {
    return new AssistantManager(assistant);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assistant?.id]);

  return (
    <AssistantContext.Provider value={manager}>
      {children}
    </AssistantContext.Provider>
  );
}
