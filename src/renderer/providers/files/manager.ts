import { EmbeddingMeta } from '@shared/meta'
import { Dirent } from 'node:fs'
import { createContext, useContext } from 'react'
import { atom, computed } from 'signia'
import { useValue } from 'signia-react'

type FilesManagerState = {
  embeddingsMeta: EmbeddingMeta[]
  embeddingsIndexes: Dirent[]
}

export class FilesManager {
  private readonly _state = atom<FilesManagerState>('FilesManager._state', {
    embeddingsMeta: [],
    embeddingsIndexes: [],
  })

  constructor() {
    void this.loadFiles()
  }

  async loadFiles() {
    const indexes = await window.files.readDir('embeddings')
    const files = await window.files.readFile('embeddings', '_meta.json')

    this._state.update((state) => {
      return {
        ...state,
        embeddingsMeta: files,
        embeddingsIndexes: indexes,
      }
    })
  }

  async deleteFile(filename: string) {
    await window.files.deleteFile('embeddings', filename)
    await this.loadFiles()
  }

  get state() {
    return this._state.value
  }

  @computed
  get embeddingsMeta() {
    return this.state.embeddingsMeta
  }

  @computed
  get embeddingsIndexes() {
    return this.state.embeddingsIndexes
  }

  isFileArchived(filename: string) {
    return this.state.embeddingsMeta.some((entry) => entry.name === filename)
  }
}

export const FilesManagerContext = createContext(new FilesManager())

export function useFilesManager() {
  return useContext(FilesManagerContext)
}

export function useEmbeddingsMeta() {
  const FilesManager = useFilesManager()

  return useValue('useEmbeddingsMeta', () => FilesManager.embeddingsMeta, [
    FilesManager.embeddingsMeta,
  ])
}
