import { createContext, useContext } from 'react'
import { atom } from 'signia'

type TransformersState = {
  documentText: string
  loading: boolean
}

export class TransformersManager {
  private _state = atom<TransformersState>('TransformersState', {
    documentText: '',
    loading: false,
  })

  async parse(filePath: string) {
    const fileContent = await window.transformers.parse(filePath)
    console.log('parsed PDF: ', fileContent)
    return fileContent
  }

  async embed(fileContent: string) {
    const embeddings = await window.transformers.embed(fileContent)
    console.log('embeddings: ', embeddings)
    return embeddings
  }

  get state() {
    return this._state.value
  }
}

export const TransformersManagerContext = createContext(
  new TransformersManager(),
)

export function useTransformersManager() {
  return useContext(TransformersManagerContext)
}
