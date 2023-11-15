export type Model = {
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

export const MODELS: Model[] = [
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
