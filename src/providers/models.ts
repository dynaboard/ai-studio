import { createContext, useContext } from 'react'
import { atom, computed } from 'signia'

type Model = {
  name: string
  description: string
  parameters: string
  promptTemplate: 'mistral' | 'llama' | 'zephyr'
  files: {
    name: string
    url: string
    format: 'gguf'
    repository: string
    quantization: string
  }[]
}

const MODELS: Model[] = [
  {
    name: 'Mistral 7B Instruct v0.1',
    description:
      'This model is fine-tuned for chat, but excels in many different workflows.',
    parameters: '7B',
    promptTemplate: 'mistral',
    files: [
      {
        name: 'mistral-7b-instruct-v0.1.Q4_K_M.gguf',
        format: 'gguf',
        repository:
          'https://huggingface.co/TheBloke/Mistral-7B-Instruct-v0.1-GGUF',
        url: 'https://huggingface.co/TheBloke/Mistral-7B-Instruct-v0.1-GGUF/resolve/main/mistral-7b-instruct-v0.1.Q4_K_M.gguf?download=true',
        quantization: '4-bit',
      },
      {
        name: 'mistral-7b-instruct-v0.1.Q5_K_M.gguf',
        format: 'gguf',
        repository:
          'https://huggingface.co/TheBloke/Mistral-7B-Instruct-v0.1-GGUF',
        url: 'https://huggingface.co/TheBloke/Mistral-7B-Instruct-v0.1-GGUF/resolve/main/mistral-7b-instruct-v0.1.Q5_K_M.gguf?download=true',
        quantization: '5-bit',
      },
    ],
  },
  {
    name: 'Zephyr 7B β',
    description:
      'This model is trained to act as a helpful assistant for a variety of tasks.',
    parameters: '7B',
    promptTemplate: 'zephyr',
    files: [
      {
        name: 'zephyr-7b-beta.Q4_K_M.gguf',
        format: 'gguf',
        repository: 'https://huggingface.co/TheBloke/zephyr-7B-beta-GGUF',
        url: 'https://huggingface.co/TheBloke/zephyr-7B-beta-GGUF/resolve/main/zephyr-7b-beta.Q4_K_M.gguf?download=true',
        quantization: '4-bit',
      },
      {
        name: 'zephyr-7b-beta.Q5_K_M.gguf',
        format: 'gguf',
        repository: 'https://huggingface.co/TheBloke/zephyr-7B-beta-GGUF',
        url: 'https://huggingface.co/TheBloke/zephyr-7B-beta-GGUF/resolve/main/zephyr-7b-beta.Q5_K_M.gguf?download=true',
        quantization: '5-bit',
      },
    ],
  },
]

type ModelManagerState = {
  isStatusVisible: boolean
  availableModels: Model[]
  downloads: Record<
    string,
    {
      filename: string
      recievedBytes: number
      totalBytes: number
    }
  >
}

export class ModelManager {
  private readonly _state = atom<ModelManagerState>('ModelManager._state', {
    isStatusVisible: false,
    availableModels: [],
    downloads: {},
  })

  cleanupHandlers: (() => void)[] = []

  constructor(addListeners = true) {
    if (addListeners) {
      const cleanupDownloadProgress = window.models.onDownloadProgress(
        this.onDownloadProgress,
      )
      const cleanupDownloadComplete = window.models.onDownloadComplete(
        this.onDownloadComplete,
      )

      this.cleanupHandlers.push(cleanupDownloadProgress)
      this.cleanupHandlers.push(cleanupDownloadComplete)
    }
  }

  onDownloadProgress = (
    event: any,
    progress: { filename: string; recievedBytes: number; totalBytes: number },
  ) => {
    console.log('download-progress', progress)

    this._state.update((state) => {
      const downloads = {
        ...state.downloads,
      }
      downloads[progress.filename] = progress
      return {
        ...state,
        downloads,
      }
    })
  }

  onDownloadComplete = (event: any, progress: any) => {
    console.log('download-complete', event, progress)
    this._state.update((state) => {
      const downloads = {
        ...state.downloads,
      }
      delete downloads[progress.filename]
      return {
        ...state,
        downloads,
      }
    })
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
      const downloads = {
        ...state.downloads,
      }
      delete downloads[filename]
      return {
        ...state,
        downloads,
      }
    })
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
    return this.state.downloads
  }

  get allModels() {
    return MODELS
  }
}

export const ModelManagerContext = createContext(new ModelManager(false))

export function useModelManager() {
  return useContext(ModelManagerContext)
}
