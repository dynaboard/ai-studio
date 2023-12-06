import { Readability } from '@mozilla/readability'
import { z } from 'zod'

import { DEFAULT_MODEL } from '@/providers/models/manager'
import { BaseTool, RunContext, ToolParameter } from '@/tools/base'

export default class SummarizeArticleTool extends BaseTool {
  name = 'Summarize Article'
  description = 'Summarize an article from the internet'
  requiredModels = [DEFAULT_MODEL]

  parameters: ToolParameter[] = [
    {
      name: 'url',
      description: 'URL of the article that you want to summarize',
      type: 'string',
    },
  ]

  async run(ctx: RunContext, url: unknown) {
    const { value: articleURL } = z
      .object({
        name: z.literal('url'),
        value: z.string(),
      })
      .parse(url)

    console.log(`Summarizing article at ${articleURL}`)

    const article = (await window.tools.fetch(
      articleURL,
      {
        method: 'GET',
      },
      'text',
    )) as string

    const doc = document.cloneNode(true) as Document
    doc.documentElement.innerHTML = article
    const parsedDoc = new Readability(doc as Document).parse()

    if (!parsedDoc) {
      return "I'm sorry, I was unable to summarize that article. Please try again later."
    }

    const response = await window.chats.sendMessage({
      message: `Can you summarize this article for me? The article is called "${parsedDoc.title}" and it's contents are: "${parsedDoc.textContent}"`,
      assistantMessageID: ctx.assistantMessageID,
      threadID: ctx.threadID,
      modelPath: ctx.modelPath,
      promptOptions: ctx.promptOptions,
      messageID: 'summarize-article',
      systemPrompt:
        'You are the best at summarizing articles! Summarize the article for the user. Do not make anything up, just use the article contents.',
      outOfBand: true,
    })

    return response
  }
}
