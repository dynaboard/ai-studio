import { app, BrowserWindow, ipcMain } from 'electron'
import extract from 'extract-zip'
import fs, { existsSync, mkdirSync } from 'fs'
import Downloader from 'nodejs-file-downloader'
import path from 'path'

import { sendToRenderer } from '@/webcontents'

import { DownloadsChannel } from '../../preload/events'

export class ElectronDownloadsManager {
  downloads = new Map<
    string,
    {
      downloader: Downloader
    }
  >()

  downloadsFolder = path.resolve(app.getPath('userData'), 'downloads')

  constructor(readonly window: BrowserWindow) {
    if (!existsSync(this.downloadsFolder)) {
      mkdirSync(this.downloadsFolder)
    }
  }

  async download(url: string) {
    if (this.downloads.has(url)) {
      sendToRenderer(
        this.window.webContents,
        DownloadsChannel.DownloadComplete,
        {
          url: '',
          downloadLocation: null,
        },
      )
      return
    }

    const target = path.resolve(
      app.getPath('userData'),
      'downloads',
      path.basename(url),
    )

    console.log('Starting download', url, 'to', target)

    const downloader = new Downloader({
      url: url,
      directory: this.downloadsFolder,
      cloneFiles: false,
      onProgress: (percentage, _chunk, _remainingSize) => {
        if (percentage === '100.00') {
          this.downloads.delete(url)
          sendToRenderer(
            this.window.webContents,
            DownloadsChannel.DownloadComplete,
            {
              url,
              downloadLocation: target,
            },
          )
        }
      },
    })

    this.downloads.set(url, {
      downloader,
    })

    downloader.download()
  }

  async unzipDownload(filePath: string, target: string) {
    try {
      if (!existsSync(filePath)) {
        return
      }

      const unzipPath = path.join(app.getPath('userData'), target)

      console.log('Unzipping', filePath, 'to', unzipPath)

      await extract(filePath, {
        dir: unzipPath,
      })

      fs.unlinkSync(filePath)
    } catch {
      // ignore for now
    }
  }

  addClientEventHandlers() {
    ipcMain.handle(DownloadsChannel.DownloadFile, (_, { url }) => {
      return this.download(url)
    })

    ipcMain.handle(
      DownloadsChannel.UnzipDownload,
      (_, { filePath, target }) => {
        return this.unzipDownload(filePath, target)
      },
    )
  }
}
