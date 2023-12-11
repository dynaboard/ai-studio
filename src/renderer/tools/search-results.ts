import { z } from 'zod'

import { BaseTool, RunContext, ToolParameter } from '@/tools/base'

export default class SearchResultsTool extends BaseTool {
  name = 'Search Results'
  description = 'Search the web for websites related to your query.'
  requiredModels = ['Mistral 7B Instruct v0.1']

  parameters: ToolParameter[] = [
    {
      name: 'query',
      description: 'The search query for the websites you are looking for.',
      type: 'string',
    },
    {
      name: 'numberOfSites',
      description: 'The number of sites you want to return. Default 5.',
      type: 'number',
    },
  ]

  async run(_ctx: RunContext, query: unknown, numberOfSites: unknown) {
    const { value: queryInput } = z
      .object({
        name: z.literal('query'),
        value: z.string(),
      })
      .parse(query)

    const { value: limitInput } = z
      .object({
        name: z.literal('numberOfSites'),
        value: z.coerce.number(),
      })
      .parse(numberOfSites)

    const results = await window.tools.crawlWebsites(queryInput, limitInput)
    return results
      .map((result) => {
        return `${result.title} (${result.href})

${result.body}\n`
      })
      .join('\n')
  }
}
