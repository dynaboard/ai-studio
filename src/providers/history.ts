import { createContext, useContext } from 'react'
import { atom, computed } from 'signia'

type Thread = {
  id: string
  title: string
  modelID: string
  createdAt: Date
}

type HistoryManagerState = {
  threads: Thread[]
}

export class HistoryManager {
  private readonly _state = atom<HistoryManagerState>('HistoryManager._state', {
    threads: [
      { id: 'a', title: "Chat A", modelID: "gpt4", createdAt: new Date() },
      { id: 'b', title: "Chat B", modelID: "gpt4", createdAt: new Date() },
    ],
  })

  @computed
  get threads() {
    return this._state.value.threads
  }

  addThread(thread: Thread) {
    this._state.update((state) => {
      return {
        threads: [...state.threads, thread],
      }
    })
  }
}

export const HistoryManagerContext = createContext(new HistoryManager())

export function useHistoryManager() {
  return useContext(HistoryManagerContext)
}
