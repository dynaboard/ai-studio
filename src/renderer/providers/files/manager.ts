import { Dirent } from 'node:fs'
import { createContext, useContext } from 'react'
import { atom, computed } from 'signia'
import { useValue } from 'signia-react'

type FilesManagerState = {
  availableFiles: Dirent[]
}

export class FilesManager {
  private readonly _state = atom<FilesManagerState>('FilesManager._state', {
    availableFiles: [], // should be available once app renders
  })

  initialize() {
    void this.loadFiles()
  }

  destroy() {}

  async deleteFile(filename: string) {
    await window.files.deleteFile(filename)
    await this.loadFiles()
  }

  async loadFiles() {
    const files = await window.files.listFilesInFolder('embeddings')

    this._state.update((state) => {
      return {
        ...state,
        availableFiles: files,
      }
    })
  }

  get state() {
    return this._state.value
  }

  @computed
  get availableFiles() {
    return this.state.availableFiles
  }
}

export const FilesManagerContext = createContext(new FilesManager())

export function useFilesManager() {
  return useContext(FilesManagerContext)
}

export function useAvailableFiles() {
  const FilesManager = useFilesManager()

  return useValue('useAvailableFiles', () => FilesManager.availableFiles, [
    FilesManager.availableFiles,
  ])
}