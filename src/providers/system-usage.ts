import { createContext, useContext } from 'react'
import { atom } from 'signia'
import { useValue } from 'signia-react'

type SystemUsageState = {
  usage: Electron.ProcessMemoryInfo
}

export class SystemUsageManager {
  private _state = atom<SystemUsageState>('SystemUsageState', {
    usage: {
      private: 0,
      residentSet: 0,
      shared: 0,
    },
  })

  timer: number | null = null

  initialize() {
    if (this.timer) {
      return
    }

    this.timer = window.setInterval(() => {
      this.getSystemUsage().then((usage) => {
        console.log('usage', usage)
        this._state.set({ usage })
      })
    }, 2000)
  }

  destroy() {
    if (this.timer) {
      window.clearInterval(this.timer)
      this.timer = null
    }
  }

  getSystemUsage(): Promise<Electron.ProcessMemoryInfo> {
    return window.usage.getSystemUsage()
  }

  get state() {
    return this._state.value
  }
}

export const SystemUsageManagerContext = createContext(new SystemUsageManager())

export function useSystemUsageManager() {
  return useContext(SystemUsageManagerContext)
}

export function useSystemUsage() {
  const manager = useSystemUsageManager()
  return useValue('system-usage', () => manager.state.usage, [manager])
}
