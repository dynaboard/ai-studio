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
    const embeddings = await window.transformers.embedDocument(fileContent)
    console.log('embeddings: ', embeddings)
    return embeddings
  }

  async embedDocument(filePath: string) {
    return new Promise((resolve) => {
      const cleanup = window.transformers.onEmbeddingsComplete((data) => {
        console.log('Embeddings complete: ', data)
        resolve(data)
        cleanup()
      })

      window.transformers.embedDocument(filePath)
    })
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
