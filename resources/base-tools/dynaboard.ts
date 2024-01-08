import { parseArgs } from 'https://deno.land/std/cli/parse_args.ts'
import * as path from 'https://deno.land/std/path/mod.ts'

const args = parseArgs(Deno.args)

export class DynaboardAIStudio {
  private connection: Deno.Conn | undefined

  manifest: { name: string }

  constructor() {
    console.log('import', Deno.mainModule)
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
      transport: 'unix',
    })
    return this.connection
  }

  private getID() {
    return this.manifest.name.replace(/\s+/g, '-').toLowerCase()
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
