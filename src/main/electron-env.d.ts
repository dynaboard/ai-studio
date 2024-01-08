/// <reference types="electron-vite/node" />

declare namespace NodeJS {
  interface ProcessEnv {
    VSCODE_DEBUG?: 'true'
    DIST_ELECTRON: string
    DIST: string
    /** /dist/ or /public/ */
    VITE_PUBLIC: string
  }
}

// node asset, but we don't want vite to see it as something to parse (useful for JSON)
declare module '*?asset&url' {
  const src: string
  export default src
}
