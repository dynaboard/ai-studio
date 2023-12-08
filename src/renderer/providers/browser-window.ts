import { createContext, useContext } from 'react'
import { atom } from 'signia'
import { useValue } from 'signia-react'

type BrowserWindowState = {
  isFullScreen: boolean
  isActive: boolean
}

export class BrowserWindowManager {
  private readonly _state = atom<BrowserWindowState>('BrowserWindowState', {
    isFullScreen: false,
    isActive: true,
  })

  handlers: (() => void)[] = []

  constructor() {
    this.initialize()
  }

  get state() {
    return this._state.value
  }

  handleFullScreenChange = (isFullScreen: boolean) => {
    this.setIsFullScreen(isFullScreen)
  }

  handleActiveWindowChange = (isActive: boolean) => {
    this.setIsActive(isActive)
  }

  initialize() {
    this.handlers.push(
      window.browserWindow.onFullScreenChange(this.handleFullScreenChange),
    )
    this.handlers.push(
      window.browserWindow.onActiveWindowChange(this.handleActiveWindowChange),
    )
  }

  destroy() {
    this.handlers.forEach((handler) => handler())
    this.handlers = []
  }

  setIsFullScreen(isFullScreen: boolean) {
    this._state.update((state) => ({
      ...state,
      isFullScreen: isFullScreen,
    }))
  }

  setIsActive(isActive: boolean) {
    if (isActive === this.state.isActive) return
    this._state.update((state) => ({
      ...state,
      isActive: isActive,
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
    manager.state,
  ])
}

export function useIsActiveWindow() {
  const manager = useBrowserWindowManager()
  return useValue('useIsActiveWindow', () => manager.state.isActive, [
    manager.state,
  ])
}
