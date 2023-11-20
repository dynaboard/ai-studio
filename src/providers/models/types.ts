export type ActiveDownload = {
  filename: string
  receivedBytes: number
  totalBytes: number
  status: 'downloading' | 'paused'
}
