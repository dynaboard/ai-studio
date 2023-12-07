import { is } from '@electron-toolkit/utils'
import { WebContents } from 'electron'

/**
 * Send a message to a renderer process via its webContents asynchronously.
 * Checks if webContents is valid before sending the message.
 */
export function sendToRenderer(
  webContents: WebContents,
  channel: string,
  ...args: unknown[]
): void {
  if (webContents.isDestroyed()) {
    const msg = `Failed to send on ${channel}: webContents was destroyed`
    if (is.dev) {
      throw new Error(msg)
    }
    console.error(msg)
  } else {
    webContents.send(channel, ...args)
  }
}
