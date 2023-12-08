import { z } from 'zod'

import { BaseTool, RunContext, ToolParameter } from '@/tools/base'

export default class ImageCrawlerTool extends BaseTool {
  name = 'Image Crawler'
  description = 'Crawl images on the open web'
  requiredModels = ['Mistral 7B Instruct v0.1']

  parameters: ToolParameter[] = [
    {
      name: 'query',
      description: 'The search query for the image you are looking for',
      type: 'string',
    },
    {
      name: 'numberOfImages',
      description: 'The number of images you want to generate. Default 1',
      type: 'number',
    },
  ]

  async run(_ctx: RunContext, query: unknown, numberOfImages: unknown) {
    const { value: queryInput } = z
      .object({
        name: z.literal('query'),
        value: z.string(),
      })
      .parse(query)

    const { value: limitInput } = z
      .object({
        name: z.literal('numberOfImages'),
        value: z.coerce.number(),
      })
      .parse(numberOfImages)

    const images = await window.tools.crawlImages(queryInput, limitInput)

    return images.map((image) => `\n![image](${image.thumbnail})`).join('\n')
  }
}
