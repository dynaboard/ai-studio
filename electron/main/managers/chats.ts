import { ipcMain } from 'electron'
import path from 'path'

import { AssistantManager } from './assistant-manager'

export class ElectronChatManager {
  addClientEventHandlers() {
    ipcMain.handle('chats:sendMessage', async (_, message) => {
      const modelPath = path.join(
        __dirname,
        '../..',
        'models',
        'mistral-7b-instruct-v0.1.Q4_K_M.gguf',
      )
      const assistant = new AssistantManager(modelPath)

      return assistant.sendMessage(message)
    })
  }
}
