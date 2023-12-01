import { ipcMain } from 'electron'
import process from 'process'

import { UsageChannel } from '../../preload/events'

export class SystemUsageManager {
  async getSystemUsage() {
    return {
      memory: await process.getProcessMemoryInfo(),
      cpu: process.getCPUUsage(),
    }
  }

  addClientEventHandlers() {
    ipcMain.handle(UsageChannel.GetSystemUsage, () => {
      return this.getSystemUsage()
    })
  }
}
