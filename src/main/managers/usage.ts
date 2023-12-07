import { ipcMain } from 'electron'
import process from 'process'

import { ElectronLlamaServerManager } from '@/managers/llama-server'

import { UsageChannel } from '../../preload/events'

export class SystemUsageManager {
  constructor(readonly llamaServerManager: ElectronLlamaServerManager) {}
  
  async getSystemUsage() {
    const memoryInfo = await process.getProcessMemoryInfo()
    const llamaMemoryBytes = await this.llamaServerManager.memoryUsage()
    memoryInfo.shared = memoryInfo.shared + llamaMemoryBytes / 1024
    return {
      memory: memoryInfo,
      cpu: process.getCPUUsage(),
    }
  }

  addClientEventHandlers() {
    ipcMain.handle(UsageChannel.GetSystemUsage, () => {
      return this.getSystemUsage()
    })
  }
}
