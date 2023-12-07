import { is } from '@electron-toolkit/utils'
import { app, BrowserWindow, ipcMain, shell } from 'electron'
import { release } from 'node:os'
import { join } from 'node:path'

import { ElectronChatManager } from '@/managers/chats'
import { EmbeddingsManager } from '@/managers/embeddings'
import { ElectronFilesManager } from '@/managers/files'
import { ElectronLlamaServerManager } from '@/managers/llama-server'
import { ElectronModelManager } from '@/managers/models'
import { SystemUsageManager } from '@/managers/usage'
import { ElectronVectorStoreManager } from '@/managers/vector-store'
import { update } from '@/update'

import { sendToRenderer } from './webcontents'

// Disable GPU Acceleration for Windows 7
if (release().startsWith('6.1')) app.disableHardwareAcceleration()

// Set application name for Windows 10+ notifications
if (process.platform === 'win32') app.setAppUserModelId(app.getName())

if (!app.requestSingleInstanceLock()) {
  app.quit()
  process.exit(0)
}

let win: BrowserWindow | null = null
let modelManager: ElectronModelManager | null = null
let chatManager: ElectronChatManager | null = null
let embeddingsManager: EmbeddingsManager | null = null
let filesManager: ElectronFilesManager | null = null
const vectorStoreManager = new ElectronVectorStoreManager()
const llamaServerManager = new ElectronLlamaServerManager()

const usageManager = new SystemUsageManager(llamaServerManager)
usageManager.addClientEventHandlers()

const preload = join(__dirname, '../preload/index.js')

async function createWindow() {
  if (modelManager) {
    modelManager.close()
  }

  vectorStoreManager.initialize()

  win = new BrowserWindow({
    title: 'Main window',
    width: 1200,
    height: 800,
    webPreferences: {
      preload,
      nodeIntegration: false,
      contextIsolation: true,
    },
    titleBarStyle: 'hiddenInset',
  })

  embeddingsManager = new EmbeddingsManager(win, vectorStoreManager)
  modelManager = new ElectronModelManager(win)
  filesManager = new ElectronFilesManager()
  chatManager = new ElectronChatManager(
    win,
    embeddingsManager,
    llamaServerManager,
  )

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }

  // Test actively push message to the Electron-Renderer
  win.webContents.on('did-finish-load', () => {
    if (win) {
      sendToRenderer(
        win.webContents,
        'main-process-message',
        new Date().toLocaleString(),
      )
    }
  })

  // Make all links open with the browser, not with the application
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:')) shell.openExternal(url)
    return { action: 'deny' }
  })

  win.on('enter-full-screen', () => {
    if (win) {
      sendToRenderer(win.webContents, 'full-screen-change', true)
    }
  })

  win.on('leave-full-screen', () => {
    if (win) {
      sendToRenderer(win.webContents, 'full-screen-change', false)
    }
  })

  // Apply electron-updater
  update(win)

  modelManager.addClientEventHandlers()
  chatManager.addClientEventHandlers()
  embeddingsManager.addClientEventHandlers()
  filesManager.addClientEventHandlers()
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  win = null
  modelManager?.close()

  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('second-instance', () => {
  if (win) {
    // Focus on the main window if the user tried to open another
    if (win.isMinimized()) win.restore()
    win.focus()
  }
})

app.on('activate', () => {
  const allWindows = BrowserWindow.getAllWindows()
  if (allWindows.length) {
    allWindows[0].focus()
  } else {
    createWindow()
  }
})

app.on('will-quit', () => {
  llamaServerManager.close()
})

ipcMain.on('open-path', (_, path) => {
  shell.openPath(path)
})
