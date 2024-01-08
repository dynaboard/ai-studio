import { parseArgs } from 'https://deno.land/std@0.208.0/cli/parse_args.ts'
import * as path from 'https://deno.land/std@0.208.0/path/mod.ts'

const args = parseArgs(Deno.args)

export class DynaboardAIStudio {
  private connection: Deno.Conn | undefined

  manifest: { name: string }

  constructor() {
    const dirname = path.dirname(path.fromFileUrl(Deno.mainModule))
    const manifest = JSON.parse(
      Deno.readTextFileSync(path.join(dirname, 'manifest.json')),
    )

    if (!manifest.name) {
      throw new Error('manifest.json must contain a name')
    }

    this.manifest = manifest
  }

  private async openConnection() {
    if (this.connection) {
      return this.connection
    }
    this.connection = await Deno.connect({
      path: args.socket,
      // @ts-expect-error for some reason, the unstable typings arent picking this up
      transport: 'unix',
    })
    return this.connection
  }

  private getID() {
    return this.manifest.name.replace(/\s+/g, '-').toLowerCase()
  }

  getParams() {
    return args.params
  }

  getContext() {
    return args.context
  }

  async send(message: Record<string, unknown>) {
    const messageWithID = {
      ...message,
      type: 'message',
      id: this.getID(),
    }
    const contents = JSON.stringify(messageWithID)

    await this.openConnection().then((conn) => {
      conn.write(new TextEncoder().encode(contents))
      conn.close()
    })
  }

  async sendChatMessage(messageOptions: Record<string, unknown>) {
    const messageWithID = {
      ...messageOptions,
      type: 'chat-message',
      id: this.getID(),
    }

    const contents = JSON.stringify(messageWithID)

    await this.openConnection().then((conn) => {
      conn.write(new TextEncoder().encode(contents))
      conn.close()
    })
  }
}
