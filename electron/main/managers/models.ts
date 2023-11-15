import {
  app,
  type BrowserWindow,
  type DownloadItem,
  type Event,
  ipcMain,
} from 'electron'
import { access, constants } from 'fs'

import { ModelChannel, ModelEvent } from '../../preload/events'

export class ElectronModelManager {
  downloads = new Map<string, DownloadItem>()

  constructor(readonly window: BrowserWindow) {
    window.webContents.session.on('will-download', this.onWillDownload)
  }

  onWillDownload = (_event: Event, item: DownloadItem) => {
    this.addDownload(item)
  }

  addDownload(downloadItem: DownloadItem) {
    if (this.downloads.has(downloadItem.getFilename())) {
      console.warn('Already downloading:', downloadItem.getFilename())
      return
    }
    downloadItem.addListener('updated', () => {
      this.window.webContents.send(ModelEvent.DownloadProgress, {
        filename: downloadItem.getFilename(),
        recievedBytes: downloadItem.getReceivedBytes(),
        totalBytes: downloadItem.getTotalBytes(),
      })
    })

    downloadItem.addListener('done', (_event, state) => {
      this.window.webContents.send(ModelEvent.DownloadComplete, {
        state,
        filename: downloadItem.getFilename(),
        savePath: downloadItem.getSavePath(),
        recievedBytes: downloadItem.getReceivedBytes(),
        totalBytes: downloadItem.getTotalBytes(),
      })
      downloadItem.removeAllListeners()
      this.downloads.delete(downloadItem.getFilename())
    })

    const savePath = `${app.getPath(
      'userData',
    )}/models/${downloadItem.getFilename()}`

    console.log('Saving file to:', savePath)
    downloadItem.setSavePath(savePath)

    this.downloads.set(downloadItem.getFilename(), downloadItem)
  }

  close() {
    this.window.off('will-download', this.onWillDownload)
    this.downloads.forEach((download) => {
      download.cancel()
      download.removeAllListeners()
    })
    this.downloads.clear()
  }

  addClientEventHandlers() {
    ipcMain.handle(ModelChannel.CancelDownload, (_, filename) => {
      const downloadItem = this.downloads.get(filename)
      if (!downloadItem) {
        console.warn('No download found for:', filename)
        return
      }
      downloadItem.cancel()
    })

    ipcMain.handle(ModelChannel.PauseDownload, (_, filename) => {
      const downloadItem = this.downloads.get(filename)
      if (!downloadItem) {
        console.warn('No download found for:', filename)
        return
      }
      downloadItem.pause()
    })

    ipcMain.handle(ModelChannel.ResumeDownload, (_, filename) => {
      const downloadItem = this.downloads.get(filename)
      if (!downloadItem) {
        console.warn('No download found for:', filename)
        return
      }
      downloadItem.resume()
    })

    ipcMain.handle(ModelChannel.GetFilePath, async (_, filename) => {
      const path = `${app.getPath('userData')}/models/${filename}`
      return new Promise((resolve) => {
        access(path, constants.F_OK, (err) => {
          !err ? resolve(path) : resolve(null)
        })
      })
    })
  }
}
