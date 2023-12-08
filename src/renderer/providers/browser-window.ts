import { createContext, useContext } from 'react'
import { atom } from 'signia'
import { useValue } from 'signia-react'

type BrowserWindowState = {
  isFullScreen: boolean
  isLeftSidebarOpen: boolean
}

export class BrowserWindowManager {
  private readonly _state = atom<BrowserWindowState>('BrowserWindowState', {
    isFullScreen: false,
    isLeftSidebarOpen: false,
  })

  cleanupHandler: (() => void) | undefined

  constructor() {
    this.initialize()
  }

  get state() {
    return this._state.value
  }

  handleFullScreenChange = (isFullScreen: boolean) => {
    this.setIsFullScreen(isFullScreen)
  }

  initialize() {
    this.cleanupHandler = window.browserWindow.onFullScreenChange(
      this.handleFullScreenChange,
    )
  }

  destroy() {
    this.cleanupHandler?.()
  }

  setIsFullScreen(isFullScreen: boolean) {
    this._state.update((state) => ({
      ...state,
      isFullScreen: isFullScreen,
    }))
  }

  setIsLeftSidebarOpen(open: boolean) {
    this._state.update((state) => ({
      ...state,
      isLeftSidebarOpen: open,
    }))
  }
}

export const BrowserWindowManagerContext = createContext(
  new BrowserWindowManager(),
)

export function useBrowserWindowManager() {
  return useContext(BrowserWindowManagerContext)
}

export function useIsFullScreen() {
  const manager = useBrowserWindowManager()
  return useValue('useIsFullScreen', () => manager.state.isFullScreen, [
    manager,
  ])
}

export function useIsLeftSidebarOpen() {
  const manager = useBrowserWindowManager()
  return useValue(
    'useIsLeftSidebarOpen',
    () => manager.state.isLeftSidebarOpen,
    [manager],
  )
}
