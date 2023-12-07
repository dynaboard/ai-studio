export enum ModelEvent {
  DownloadProgress = 'download-progress',
  DownloadComplete = 'download-complete',
}

export enum ModelChannel {
  ResumeDownload = 'models:resumeDownload',
  PauseDownload = 'models:pauseDownload',
  CancelDownload = 'models:cancelDownload',
  GetFilePath = 'models:getFilePath',
  DeleteModelFile = 'models:deleteModelFile',
  IsModelDownloaded = 'models:isModelDownloaded',
}

export enum FileChannel {
  ReadDir = 'files:readDir',
  ReadFile = 'files:readFile',
  DeleteFile = 'files:deleteFile',
}

export enum UsageChannel {
  GetSystemUsage = 'usage:getSystemUsage',
}

export enum ToolChannel {
  GetTool = 'tools:getTool',
  Fetch = 'tools:fetch',
  CrawlImages = 'tools:crawlImages',
}
