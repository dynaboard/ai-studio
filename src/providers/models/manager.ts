import { createContext, useContext } from 'react'
import { atom, computed } from 'signia'
import { useValue } from 'signia-react'

import { ActiveDownload } from '@/providers/models/types'

import { Model, MODELS } from './model-list'

type ModelManagerState = {
  isStatusVisible: boolean
  availableModels: Model[]
  downloads: Map<string, ActiveDownload>
}

export const DEFAULT_MODEL = 'mistral-7b-instruct-v0.1.Q4_K_M.gguf'

export class ModelManager {
  private readonly _state = atom<ModelManagerState>('ModelManager._state', {
    isStatusVisible: false,
    availableModels: [], // should be available once app renders
    downloads: new Map(),
  })

  cleanupHandlers: (() => void)[] = []

  completionHandlers: (() => void)[] = []

  private _onDownloadProgress = (
    _event: unknown,
    progress: { filename: string; receivedBytes: number; totalBytes: number },
  ) => {
    this._state.update((state) => {
      const currentDownload = state.downloads.get(progress.filename)
      let showStatus = state.isStatusVisible
      if (!currentDownload && !showStatus) {
        showStatus = true
      }

      const downloads = new Map(state.downloads)
      downloads.set(progress.filename, {
        ...progress,
        status: 'downloading',
      })
      return {
        ...state,
        isStatusVisible: showStatus,
        downloads,
      }
    })
  }

  private _onDownloadComplete = (
    _event: unknown,
    progress: {
      filename: string
      receivedBytes: number
      totalBytes: number
      state: 'completed' | 'cancelled' | 'interrupted'
    },
  ) => {
    this._state.update((state) => {
      const downloads = new Map(state.downloads)
      downloads.delete(progress.filename)
      return {
        ...state,
        downloads,
      }
    })
    this.completionHandlers.forEach((handler) => handler())
    void this.loadAvailableModels()
  }

  initialize() {
    const cleanupDownloadProgress = window.models.onDownloadProgress(
      this._onDownloadProgress,
    )
    const cleanupDownloadComplete = window.models.onDownloadComplete(
      this._onDownloadComplete,
    )

    this.cleanupHandlers.push(cleanupDownloadProgress)
    this.cleanupHandlers.push(cleanupDownloadComplete)
  }

  destroy() {
    this.cleanupHandlers.forEach((handler) => handler())
    this.cleanupHandlers = []
  }

  toggleStatus() {
    this._state.update((state) => {
      return {
        ...state,
        isStatusVisible: !state.isStatusVisible,
      }
    })
  }

  async cancelDownload(filename: string) {
    await window.models.cancelDownload(filename)
    this._state.update((state) => {
      const downloads = new Map(state.downloads)
      downloads.delete(filename)
      return {
        ...state,
        downloads,
      }
    })
    await this.loadAvailableModels()
  }

  async pauseDownload(filename: string) {
    await window.models.pauseDownload(filename)
    this._state.update((state) => {
      const downloads = new Map(state.downloads)
      const download = downloads.get(filename)
      if (download) {
        downloads.set(filename, {
          ...download,
          status: 'paused',
        })
      }
      return {
        ...state,
        downloads,
      }
    })
  }

  async resumeDownload(filename: string) {
    await window.models.resumeDownload(filename)
  }

  async isModelDownloaded(filename: string) {
    return window.models.isModelDownloaded(filename)
  }

  async deleteModelFile(fileName: string) {
    await window.models.deleteModelFile(fileName)
    await this.loadAvailableModels()
  }

  onDownloadComplete(handler: () => void) {
    this.completionHandlers.push(handler)
    return () => {
      this.completionHandlers = this.completionHandlers.filter(
        (h) => h !== handler,
      )
    }
  }

  async loadAvailableModels() {
    const available = await Promise.all(
      this.allModels.map(async (model) => {
        const files = []
        for (const file of model.files) {
          const path = await window.models.getFilePath(file.name)
          if (path) {
            files.push(file)
          }
        }
        return {
          ...model,
          files,
        }
      }),
    )

    const models = available.filter((model) => model.files.length > 0)

    this._state.update((state) => {
      return {
        ...state,
        availableModels: models,
      }
    })

    return models
  }

  get state() {
    return this._state.value
  }

  @computed
  get isStatusVisible() {
    return this.state.isStatusVisible
  }

  @computed
  get availableModels() {
    return this.state.availableModels
  }

  @computed
  get downloads() {
    return Array.from(this.state.downloads.values())
  }

  get allModels() {
    return MODELS
  }
}

export const ModelManagerContext = createContext(new ModelManager())

export function useModelManager() {
  return useContext(ModelManagerContext)
}

export function useAvailableModels() {
  const modelManager = useModelManager()

  return useValue('useAvailableModels', () => modelManager.availableModels, [
    modelManager.availableModels,
  ])
}

export function useDownloads() {
  const modelManager = useModelManager()

  return useValue('useDownloads', () => modelManager.downloads, [
    modelManager.downloads,
  ])
}
