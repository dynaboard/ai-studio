import { Assistant, Message, Run, Thread } from '@/lib/openai';
import { createContext, useContext } from 'react';
import { atom, computed } from 'signia';

import { getAllActions } from '@/actions';

type AssistantState = {
  assistant: Assistant | null;
  currentThread: Thread | null;
  currentRun: Run | null;
  sendingMessage: boolean;
  messages: Message[];
  runs: Run[];
  threads: { thread: Thread; messages: Message[]; runs: Run }[];
};

export class AssistantManager {
  private readonly _state = atom<AssistantState>('AssistantManager._state', {
    assistant: null,
    currentThread: null,
    currentRun: null,
    sendingMessage: false,
    messages: [],
    runs: [],
    threads: [],
  });

  private timer: ReturnType<typeof setTimeout> | null = null;

  private actions = getAllActions();

  constructor(public assistant?: Assistant) {
    if (assistant) {
      this._state.update((state) => ({ ...state, assistant }));
    }

    this.getThreads().then((data) => {
      this._state.update((state) => ({ ...state, threads: data.threads }));
    });
  }

  get state() {
    return this._state.value;
  }

  async sendMessage(message: string) {
    if (!this.assistant) {
      console.error('No assistant selected');
      return;
    }

    // No thread, so we will create a run a thread with an initial message from the user
    if (!this.state.currentThread) {
      const res = await fetch('/api/openai/threads', {
        method: 'POST',
        body: JSON.stringify({
          message,
          assistantID: this.assistant.id,
          additionalInstructions: '',
        }),
      });

      if (!res.ok) {
        throw new Error(`Failed to create thread: ${res.statusText}`);
      }

      const data = (await res.json()) as { thread: Thread; run: Run };

      // Save the thread ID to local storage to load later
      const threadIDs = this.localThreadIDs;
      threadIDs.push(data.thread.id);
      localStorage.setItem('threadIDs', JSON.stringify(threadIDs));

      this._state.update((state) => ({
        ...state,
        currentThread: data.thread,
        currentRun: data.run,
      }));

      this.getLatestStatus();
    } else {
      // Or we've got an existing thread we want to continue, so we'll just add a new message
      const res = await fetch('/api/openai/messages', {
        method: 'POST',
        body: JSON.stringify({
          message,
          threadID: this.state.currentThread.id,
          additionalInstructions: '',
        }),
      });

      if (!res.ok) {
        throw new Error(`Failed to create message: ${res.statusText}`);
      }

      const data = (await res.json()) as { messages: Message[] };
      this._state.update((state) => ({
        ...state,
        messages: data.messages,
      }));

      // Everytime you send a new message on a thread, you've got to create a new run
      // The run uses the threads context to perform whatever action the assistant decides
      await fetch('/api/openai/runs', {
        method: 'POST',
        body: JSON.stringify({
          threadID: this.state.currentThread.id,
          assistantID: this.assistant.id,
        }),
      });

      this.getLatestStatus();
    }
  }

  async getThreads() {
    if (typeof window === 'undefined') {
      return {
        threads: [],
      };
    }

    const url = new URL('/api/openai/threads', window.location.origin);

    this.localThreadIDs.forEach((id) =>
      url.searchParams.append('threadID[]', id)
    );

    const res = await fetch(url.toString());
    return res.json();
  }

  async getThread(id: string) {
    const res = await fetch(`/api/openai/threads/${id}`);

    if (!res.ok) {
      throw new Error(`Failed to get thread: ${res.statusText}`);
    }

    return (await res.json()) as {
      thread: Thread;
      messages: Message[];
      runs: Run[];
    };
  }

  private async getLatestStatus() {
    if (!this.state.currentThread) {
      return;
    }

    if (this.timer) {
      clearTimeout(this.timer);
    }

    const { messages, runs: latestRuns } = await this.getThread(
      this.state.currentThread.id
    );

    const latestActiveRun = latestRuns.findLast(
      (run) =>
        run.status === 'queued' ||
        run.status === 'in_progress' ||
        run.status === 'requires_action'
    );

    if (latestActiveRun) {
      this._state.update((state) => ({
        ...state,
        messages,
        currentRun: latestActiveRun,
      }));

      // The assistant wants to run something
      if (latestActiveRun.status === 'requires_action') {
        const submitOutputs =
          latestActiveRun.required_action?.submit_tool_outputs;
        if (submitOutputs) {
          // Get all the outputs before we submit them
          const outputs: { callID: string; output: object }[] =
            await Promise.all(
              submitOutputs.tool_calls.map(async (call) => {
                switch (call.function.name) {
                  case 'discover_actions':
                    return {
                      callID: call.id,
                      output: this.actions.map((action) => action.toJSON()),
                    };
                  case 'call_action': {
                    const args = JSON.parse(call.function.arguments);
                    const actionID = args.actionID;
                    const params = args.parameters;
                    const action = this.actions.find(
                      (action) => action.id === actionID
                    );
                    if (!action) {
                      return {
                        callID: call.id,
                        output: {
                          error: `Action with ID ${actionID} not found`,
                        },
                      };
                    }
                    const possibleArgs = action.input.safeParse(params);
                    if (!possibleArgs.success) {
                      return {
                        callID: call.id,
                        output: {
                          error: `Invalid arguments for action ${actionID}: ${possibleArgs.error.message}`,
                        },
                      };
                    }

                    const result = await action.run(possibleArgs.data as any);
                    return {
                      callID: call.id,
                      output: result,
                    };
                  }
                  default:
                    return {
                      callID: call.id,
                      output: {
                        error: `Unknown function ${call.function.name}`,
                      },
                    };
                }
              })
            );

          const res = await fetch(`/api/openai/runs/${latestActiveRun.id}`, {
            method: 'POST',
            body: JSON.stringify({
              threadID: this.state.currentThread.id,
              toolOutputs: outputs,
            }),
          });

          if (!res.ok) {
            throw new Error(`Failed to submit tool outputs: ${res.statusText}`);
          }

          const { run: updatedRun } = (await res.json()) as { run: Run };

          this._state.update((state) => ({
            ...state,
            currentRun: updatedRun,
          }));

          this.timer = setTimeout(() => {
            this.getLatestStatus();
          }, 500);
          return;
        }
      }

      this.timer = setTimeout(() => {
        this.getLatestStatus();
      }, 500);

      return;
    }

    const latestRun = latestRuns[latestRuns.length - 1];
    if (latestRun.status === 'completed') {
      const { messages } = await this.getThread(this.state.currentThread.id);
      this._state.update((state) => ({
        ...state,
        messages,
        currentRun: null,
      }));
    }
  }

  @computed
  get messages() {
    return this.state.messages;
  }

  @computed
  get threads() {
    return this.state.threads;
  }

  @computed
  get paused() {
    if (!this.state.currentRun) {
      return false;
    }

    if (this.state.sendingMessage) {
      return true;
    }

    return (
      this.state.currentRun.status === 'queued' ||
      this.state.currentRun.status === 'in_progress' ||
      this.state.currentRun.status === 'requires_action'
    );
  }

  get localThreadIDs(): string[] {
    const threadIDs = localStorage.getItem('threadIDs');
    try {
      return JSON.parse(threadIDs || '[]');
    } catch {
      return [];
    }
  }
}

export const AssistantContext = createContext(new AssistantManager());

export function useAssistantManager() {
  return useContext(AssistantContext);
}
