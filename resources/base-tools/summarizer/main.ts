import { DOMParser } from 'https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts'
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'
import { Readability } from 'https://esm.sh/@mozilla/readability@0.4.4'

import { DynaboardAIStudio } from '../dynaboard.ts'

type Article = ReturnType<Readability['parse']>

async function getReadableDocument(url: string): Promise<Article> {
  const response = await fetch(url)
  const html = await response.text()
  const document = new DOMParser().parseFromString(html, 'text/html')
  const article = new Readability(document).parse()
  return article
}

const studio = new DynaboardAIStudio()

const params = studio.getParams()
const ctx = studio.getContext()

const [{ value: articleURL }] = z
  .array(
    z.object({
      name: z.string(),
      value: z.string(),
    }),
  )
  .parse(params)

console.log(`Summarizing article at ${articleURL}`)

const article = await getReadableDocument(articleURL)

const response = await studio.sendChatMessage({
  message: `Can you summarize this article for me? The article is called "${article?.title}" and it's contents are: "${article?.textContent}"`,
  assistantMessageID: ctx.assistantMessageID,
  threadID: ctx.threadID,
  modelPath: ctx.modelPath,
  promptOptions: ctx.promptOptions,
  messageID: 'summarize-article',
  systemPrompt:
    'You are the best at summarizing articles! Summarize the article for the user. Do not make anything up, just use the article contents.',
  outOfBand: true,
})

console.log(response)

studio.reply('Not working yet...')

Deno.exit(0)
