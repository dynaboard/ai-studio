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
  // GetFilePath = 'files:getFilePath',
  ListFilesInFolder = 'files:listFilesInFolder',
  // DeleteFile = 'files:deleteModelFile',
}

export enum UsageChannel {
  GetSystemUsage = 'usage:getSystemUsage',
}
