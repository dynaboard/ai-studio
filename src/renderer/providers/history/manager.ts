import { createContext, useContext } from 'react'
import { atom, computed } from 'signia'
import { useComputed, useValue } from 'signia-react'

import { Message } from '@/providers/chat/types'
import { Thread } from '@/providers/history/types'

type HistoryManagerState = {
  threads: Thread[]
  messages: Map<string, Message>
}

export class HistoryManager {
  private readonly _state = atom<HistoryManagerState>('HistoryManager._state', {
    threads: [],
    messages: new Map<string, Message>(),
  })

  constructor() {
    this.loadThreads()
  }

  // backed by localStorage for now
  loadThreads() {
    try {
      const threads = JSON.parse(
        localStorage.getItem('threads') ?? '[]',
      ) as Thread[]

      if (threads) {
        const messages = new Map<string, Message>()
        threads.forEach((thread) => {
          thread.messages.forEach((message) => {
            messages.set(message.id, message)
          })
        })

        this._state.set({
          threads,
          messages,
        })
      }

      return threads
    } catch {
      // ignore
      return []
    }
  }

  get state() {
    return this._state.value
  }

  @computed
  get threads() {
    return this._state.value.threads
  }

  addThread(thread: Omit<Thread, 'id'>) {
    const newThread = {
      ...thread,
      id: crypto.randomUUID(),
    }

    this._state.update((state) => {
      const threads = [newThread, ...state.threads]
      localStorage.setItem('threads', JSON.stringify(threads))

      newThread.messages.forEach((message) => {
        state.messages.set(message.id, message)
      })

      return {
        ...state,
        threads,
      }
    })

    return newThread
  }

  moveThreads(threadIDs: string[], index: number) {
    const indexToMove = Math.max(0, Math.min(index - 1, index))
    this._state.update((state) => {
      const threads: Thread[] = []
      const movingThreads: Thread[] = []

      const currentThreadIndex = state.threads.findIndex((thread) =>
        threadIDs.includes(thread.id),
      )
      if (currentThreadIndex === index || currentThreadIndex + 1 === index) {
        return state
      }

      state.threads.forEach((thread) => {
        if (threadIDs.includes(thread.id)) {
          movingThreads.push(thread)
        } else {
          threads.push(thread)
        }
      })

      threads.splice(indexToMove, 0, ...movingThreads)

      localStorage.setItem('threads', JSON.stringify(threads))

      return {
        ...state,
        threads,
      }
    })
  }

  deleteThread(threadID: string) {
    this._state.update((state) => {
      const thread = state.threads.find((thread) => thread.id === threadID)
      const threads = state.threads.filter((thread) => {
        return thread.id !== threadID
      })
      if (thread) {
        thread.messages.forEach((message) => {
          state.messages.delete(message.id)
        })
      }

      localStorage.setItem('threads', JSON.stringify(threads))
      return {
        ...state,
        threads,
      }
    })
  }

  renameThread(threadID: string, title: string) {
    this._state.update((state) => {
      const threads = state.threads.map((thread) => {
        if (thread.id === threadID) {
          return {
            ...thread,
            title,
          }
        }
        return thread
      })

      localStorage.setItem('threads', JSON.stringify(threads))

      return {
        ...state,
        threads,
      }
    })
  }

  changeThreadModel(threadID: string, model: string) {
    this._state.update((state) => {
      const threads = state.threads.map((thread) => {
        if (thread.id === threadID) {
          return {
            ...thread,
            modelID: model,
          }
        }
        return thread
      })

      localStorage.setItem('threads', JSON.stringify(threads))

      return {
        ...state,
        threads,
      }
    })
  }

  changeSystemPrompt(threadID: string, systemPrompt: string) {
    this._state.update((state) => {
      const threads = state.threads.map((thread) => {
        if (thread.id === threadID) {
          return {
            ...thread,
            systemPrompt,
          }
        }
        return thread
      })

      localStorage.setItem('threads', JSON.stringify(threads))

      return {
        ...state,
        threads,
      }
    })
  }

  changeTemperature(threadID: string, temperature: number) {
    this._state.update((state) => {
      const threads = state.threads.map((thread) => {
        if (thread.id === threadID) {
          return {
            ...thread,
            temperature,
          }
        }
        return thread
      })

      localStorage.setItem('threads', JSON.stringify(threads))

      return {
        ...state,
        threads,
      }
    })
  }

  changeTopP(threadID: string, topP: number) {
    this._state.update((state) => {
      const threads = state.threads.map((thread) => {
        if (thread.id === threadID) {
          return {
            ...thread,
            topP,
          }
        }
        return thread
      })

      localStorage.setItem('threads', JSON.stringify(threads))

      return {
        ...state,
        threads,
      }
    })
  }

  changeThreadFilePath(threadID: string, filePath: string) {
    this._state.update((state) => {
      const threads = state.threads.map((thread) => {
        if (thread.id === threadID) {
          return {
            ...thread,
            filePath,
          }
        }
        return thread
      })

      localStorage.setItem('threads', JSON.stringify(threads))

      return {
        ...state,
        threads,
      }
    })
  }

  addMessage({ threadID, message }: { threadID: string; message: Message }) {
    this._state.update((state) => {
      const threads = state.threads.map((thread) => {
        if (thread.id === threadID) {
          const messages = [...thread.messages, message]
          return {
            ...thread,
            messages,
          }
        }
        return thread
      })

      state.messages.set(message.id, message)

      localStorage.setItem('threads', JSON.stringify(threads))

      return {
        ...state,
        threads,
      }
    })
  }

  deleteMessage({
    threadID,
    messageID,
  }: {
    threadID: string
    messageID: string
  }) {
    const thread = this.getThread(threadID)
    if (!thread) {
      return
    }

    const messages = thread.messages.filter((message) => {
      return message.id !== messageID
    })

    this._state.update((state) => {
      const threads = state.threads.map((thread) => {
        if (thread.id === threadID) {
          return {
            ...thread,
            messages,
          }
        }
        return thread
      })

      state.messages.delete(messageID)

      localStorage.setItem('threads', JSON.stringify(threads))

      return {
        ...state,
        threads,
      }
    })
  }

  getMessage(messageID: string) {
    return this.state.messages.get(messageID)
  }

  editMessage({
    threadID,
    messageID,
    contents,
    state: messageState,
  }: {
    threadID: string
    messageID: string
    contents: string
    state?: Message['state']
  }) {
    const thread = this.getThread(threadID)
    if (!thread) {
      return
    }

    for (const message of thread.messages) {
      if (message.id === messageID) {
        message.message = contents
        message.state = messageState ?? message.state
        break
      }
    }

    this._state.update((state) => {
      const threads = state.threads.map((thread) => {
        if (thread.id === threadID) {
          return {
            ...thread,
            messages: thread.messages,
          }
        }
        return thread
      })

      const currentMessage = state.messages.get(messageID)
      if (currentMessage) {
        currentMessage.message = contents
        currentMessage.state = messageState ?? currentMessage.state
      }

      localStorage.setItem('threads', JSON.stringify(threads))

      return {
        ...state,
        threads,
      }
    })
  }

  getThread(threadID: string | undefined) {
    if (!threadID) {
      return
    }
    return this.threads.find((thread) => thread.id === threadID)
  }
}

export const HistoryManagerContext = createContext(new HistoryManager())

export function useHistoryManager() {
  return useContext(HistoryManagerContext)
}

export function useThreads() {
  const historyManager = useHistoryManager()
  return useValue('threads', () => historyManager.threads, [
    historyManager,
    historyManager.threads,
  ])
}

export function useThread(threadID?: string) {
  const threads = useThreads()
  if (!threadID) {
    return null
  }
  return threads.find((t) => t.id === threadID)
}

export function useThreadMessages(threadID?: string) {
  const thread = useThread(threadID)
  return useValue('threadMessages', () => thread?.messages ?? [], [thread])
}

export function useThreadFilePath(threadID?: string) {
  const thread = useThread(threadID)
  return useValue('threadFilePath', () => thread?.filePath ?? null, [thread])
}

export function useMessage(messageID: string) {
  const historyManager = useHistoryManager()
  return useComputed(
    'useMessage',
    () => historyManager.state.messages.get(messageID),
    [messageID],
  )
}
