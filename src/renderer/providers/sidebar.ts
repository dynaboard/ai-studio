import { createContext, useContext } from 'react'
import { atom } from 'signia'
import { useValue } from 'signia-react'

type SidebarState = {
  closed: boolean
}

export class SidebarManager {
  private _state = atom<SidebarState>('SidebarState', {
    closed: false,
  })

  get state() {
    return this._state.value
  }

  toggle() {
    this._state.set({ closed: !this.state.closed })
  }

  setIsClosed(closed: boolean) {
    this._state.set({ closed })
  }
}

export const SidebarManagerContext = createContext(new SidebarManager())

export function useSidebarManager() {
  return useContext(SidebarManagerContext)
}

export function useIsSidebarClosed() {
  const manager = useSidebarManager()
  return useValue('useIsSidebarClosed', () => manager.state.closed, [manager])
}
