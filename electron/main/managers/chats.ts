import { ipcMain } from 'electron'
import path from 'path'

import { AssistantManager } from './assistant-manager'

export class ElectronChatManager {
  addClientEventHandlers() {
    ipcMain.handle(
      'chats:sendMessage',
      async (_, { message, promptOptions, modelPath }) => {
        const fullPath = path.join(__dirname, '../..', 'models', modelPath)
        const assistant = new AssistantManager()

        return assistant.sendMessage({
          message,
          promptOptions,
          modelPath: fullPath,
        })
      },
    )
  }
}
