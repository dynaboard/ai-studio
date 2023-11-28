import { ipcMain } from 'electron'

export class TransformersManager {
  async embed(fileContent: string) {
    return fileContent
  }

  addClientEventHandlers() {
    ipcMain.handle('transformers:embed', (_, fileContent) => {
      return this.embed(fileContent)
    })
  }
}
