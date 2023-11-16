import { ipcMain } from 'electron'
import process from 'process'

import { UsageChannel } from '../../preload/events'

export class SystemUsageManager {
  async getSystemUsage() {
    // TODO: actually track llamacpp process memory
    return process.getProcessMemoryInfo()
  }

  addClientEventHandlers() {
    ipcMain.handle(UsageChannel.GetSystemUsage, () => {
      return this.getSystemUsage()
    })
  }
}
