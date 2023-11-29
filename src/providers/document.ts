import { createContext, useContext } from 'react'
import { atom } from 'signia'

type DocumentState = {
  documentText: string
  loading: boolean
}

export class DocumentManager {
  private _state = atom<DocumentState>('DocumentState', {
    documentText: '',
    loading: false,
  })

  async load(file: File) {
    console.log('load document to DocumentManager: ', file.path)
    // const data = await window.transformers.parse(file)
  }

  get state() {
    return this._state.value
  }
}

export const DocumentManagerContext = createContext(new DocumentManager())

export function useDocumentManager() {
  return useContext(DocumentManagerContext)
}
