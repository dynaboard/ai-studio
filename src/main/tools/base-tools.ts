import randomNumberTool from '../../../resources/base-tools/random-number/main.ts?asset'
import randomNumberManifest from '../../../resources/base-tools/random-number/manifest.json?asset&url'
import summarizerTool from '../../../resources/base-tools/summarizer/main.ts?asset'
import summarizerManifest from '../../../resources/base-tools/summarizer/manifest.json?asset&url'

export const BASE_TOOL_PATHS: { toolPath: string; manifestPath: string }[] = [
  {
    toolPath: randomNumberTool,
    manifestPath: randomNumberManifest,
  },
  {
    toolPath: summarizerTool,
    manifestPath: summarizerManifest,
  },
]
