export type Model = {
  name: string
  description: string
  parameters: string
  promptTemplate: 'none' | 'mistral' | 'llama' | 'zephyr'
  files: ModelFile[]
}

export type ModelFile = {
  name: string
  url: string
  format: 'gguf'
  repository: string
  quantization: string
  sizeBytes: number
}

export const MODELS: Model[] = [
  {
    name: 'Mistral 7B Instruct v0.1',
    description:
      'This model has been fine-tuned to follow instructions. Similar performance to Llama  13B.',
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
        sizeBytes: 4368438944,
      },
      {
        name: 'mistral-7b-instruct-v0.1.Q5_K_M.gguf',
        format: 'gguf',
        repository:
          'https://huggingface.co/TheBloke/Mistral-7B-Instruct-v0.1-GGUF',
        url: 'https://huggingface.co/TheBloke/Mistral-7B-Instruct-v0.1-GGUF/resolve/main/mistral-7b-instruct-v0.1.Q5_K_M.gguf?download=true',
        quantization: '5-bit',
        sizeBytes: 5131409056,
      },
    ],
  },
  {
    name: 'Zephyr 7B β',
    description:
      'Fine-tuned on Mistral 7B for chat. Not aligned to reduce chance of problematic output.',
    parameters: '7B',
    promptTemplate: 'zephyr',
    files: [
      {
        name: 'zephyr-7b-beta.Q4_K_M.gguf',
        format: 'gguf',
        repository: 'https://huggingface.co/TheBloke/zephyr-7B-beta-GGUF',
        url: 'https://huggingface.co/TheBloke/zephyr-7B-beta-GGUF/resolve/main/zephyr-7b-beta.Q4_K_M.gguf?download=true',
        quantization: '4-bit',
        sizeBytes: 4368438976,
      },
      {
        name: 'zephyr-7b-beta.Q5_K_M.gguf',
        format: 'gguf',
        repository: 'https://huggingface.co/TheBloke/zephyr-7B-beta-GGUF',
        url: 'https://huggingface.co/TheBloke/zephyr-7B-beta-GGUF/resolve/main/zephyr-7b-beta.Q5_K_M.gguf?download=true',
        quantization: '5-bit',
        sizeBytes: 5131409088,
      },
    ],
  },
  {
    name: 'Llama 2 7B Chat',
    description:
      'Fine-tuned Llama 2 for better chat performance.',
    parameters: '7B',
    promptTemplate: 'none',
    files: [
      {
        name: 'llama-2-7b.Q4_K_M.gguf',
        format: 'gguf',
        repository: 'https://huggingface.co/TheBloke/Llama-2-7B-GGUF',
        url: 'https://huggingface.co/TheBloke/Llama-2-7B-GGUF/resolve/main/llama-2-7b.Q4_K_M.gguf?download=true',
        quantization: '4-bit',
        sizeBytes: 4081004224,
      },
      {
        name: 'llama-2-7b.Q5_K_M.gguf',
        format: 'gguf',
        repository: 'https://huggingface.co/TheBloke/Llama-2-7B-GGUF',
        url: 'https://huggingface.co/TheBloke/Llama-2-7B-GGUF/resolve/main/llama-2-7b.Q5_K_M.gguf?download=true',
        quantization: '5-bit',
        sizeBytes: 4783156928,
      },
      {
        name: 'llama-2-7b.Q8_0.gguf',
        format: 'gguf',
        repository: 'https://huggingface.co/TheBloke/Llama-2-7B-GGUF',
        url: 'https://huggingface.co/TheBloke/Llama-2-7B-GGUF/resolve/main/llama-2-7b.Q8_0.gguf?download=true',
        quantization: '8-bit',
        sizeBytes: 7161089728,
      },
    ],
  },
  {
    name: 'CodeLlama 7B Instruct',
    description:
      'Fine-tuned on both code generation and instruction following from Llama 2 7B. Worse at general purpose tasks.',
    parameters: '7B',
    promptTemplate: 'llama',
    files: [
      {
        name: 'codellama-7b-instruct.Q4_K_M.gguf',
        format: 'gguf',
        repository:
          'https://huggingface.co/TheBloke/CodeLlama-7B-Instruct-GGUF',
        url: 'https://huggingface.co/TheBloke/CodeLlama-7B-Instruct-GGUF/resolve/main/codellama-7b-instruct.Q4_K_M.gguf?download=true',
        quantization: '4-bit',
        sizeBytes: 4081095360,
      },
      {
        name: 'codellama-7b-instruct.Q5_K_M.gguf',
        format: 'gguf',
        repository:
          'https://huggingface.co/TheBloke/CodeLlama-7B-Instruct-GGUF',
        url: 'https://huggingface.co/TheBloke/CodeLlama-7B-Instruct-GGUF/resolve/main/codellama-7b-instruct.Q5_K_M.gguf?download=true',
        quantization: '5-bit',
        sizeBytes: 4783256256,
      },
      {
        name: 'codellama-7b-instruct.Q8_0.gguf',
        format: 'gguf',
        repository:
          'https://huggingface.co/TheBloke/CodeLlama-7B-Instruct-GGUF',
        url: 'https://huggingface.co/TheBloke/CodeLlama-7B-Instruct-GGUF/resolve/main/codellama-7b-instruct.Q8_0.gguf?download=true',
        quantization: '8-bit',
        sizeBytes: 7161229504,
      },
    ],
  },
  {
    name: 'CodeLlama 13B Instruct',
    description:
      'Fine-tuned on both code generation and instruction following from Llama 2 13B.',
    parameters: '13B',
    promptTemplate: 'llama',
    files: [
      {
        name: 'codellama-13b-instruct.Q4_K_M.gguf',
        format: 'gguf',
        repository:
          'https://huggingface.co/TheBloke/CodeLlama-13B-Instruct-GGUF',
        url: 'https://huggingface.co/TheBloke/CodeLlama-13B-Instruct-GGUF/resolve/main/codellama-13b-instruct.Q4_K_M.gguf?download=true',
        quantization: '4-bit',
        sizeBytes: 7866070016,
      },
      {
        name: 'codellama-13b-instruct.Q5_K_M.gguf',
        format: 'gguf',
        repository:
          'https://huggingface.co/TheBloke/CodeLlama-13B-Instruct-GGUF',
        url: 'https://huggingface.co/TheBloke/CodeLlama-13B-Instruct-GGUF/resolve/main/codellama-13b-instruct.Q5_K_M.gguf?download=true',
        quantization: '5-bit',
        sizeBytes: 9230048256,
      },
      {
        name: 'codellama-13b-instruct.Q8_0.gguf',
        format: 'gguf',
        repository:
          'https://huggingface.co/TheBloke/CodeLlama-13B-Instruct-GGUF',
        url: 'https://huggingface.co/TheBloke/CodeLlama-13B-Instruct-GGUF/resolve/main/codellama-13b-instruct.Q8_0.gguf?download=true',
        quantization: '8-bit',
        sizeBytes: 13831494016,
      },
    ],
  },
  {
    name: 'Phind CodeLlama 34B v2',
    description:
      'Fine-tuned on additional code samples by the Phind team for better output. Larger model that runs slower.',
    parameters: '34B',
    promptTemplate: 'llama',
    files: [
      {
        name: 'phind-codellama-34b-v2.Q4_K_M.gguf',
        format: 'gguf',
        repository:
          'https://huggingface.co/TheBloke/Phind-CodeLlama-34B-v2-GGUF',
        url: 'https://huggingface.co/TheBloke/Phind-CodeLlama-34B-v2-GGUF/resolve/main/phind-codellama-34b-v2.Q4_K_M.gguf?download=true',
        quantization: '4-bit',
        sizeBytes: 20219900064,
      },
      {
        name: 'phind-codellama-34b-v2.Q5_K_M.gguf',
        format: 'gguf',
        repository:
          'https://huggingface.co/TheBloke/Phind-CodeLlama-34B-v2-GGUF',
        url: 'https://huggingface.co/TheBloke/Phind-CodeLlama-34B-v2-GGUF/resolve/main/phind-codellama-34b-v2.Q5_K_M.gguf?download=true',
        quantization: '5-bit',
        sizeBytes: 23838797984,
      },
      {
        name: 'phind-codellama-34b-v2.Q8_0.gguf',
        format: 'gguf',
        repository:
          'https://huggingface.co/TheBloke/Phind-CodeLlama-34B-v2-GGUF',
        url: 'https://huggingface.co/TheBloke/Phind-CodeLlama-34B-v2-GGUF/resolve/main/phind-codellama-34b-v2.Q8_0.gguf?download=true',
        quantization: '8-bit',
        sizeBytes: 35856052384,
      },
    ],
  },
]
