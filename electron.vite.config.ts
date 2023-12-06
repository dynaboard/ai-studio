import react from '@vitejs/plugin-react'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import { resolve } from 'path'

import { swcPlugin } from './plugins/swc'

export default defineConfig({
  main: {
    resolve: {
      alias: {
        '@': resolve('src/main'),
        '@shared': resolve('src/shared'),
        '@preload': resolve('src/preload'),
      },
    },
    plugins: [swcPlugin(), externalizeDepsPlugin()],
  },
  preload: {
    resolve: {
      alias: {
        '@main': resolve('src/main'),
        '@shared': resolve('src/shared'),
      },
    },
    plugins: [externalizeDepsPlugin()],
  },
  renderer: {
    resolve: {
      alias: {
        '@': resolve('src/renderer'),
        '@shared': resolve('src/shared'),
      },
    },
    plugins: [
      swcPlugin({
        transformOptions: {
          react: {
            runtime: 'automatic',
            development: process.env.NODE_ENV === 'development',
            refresh: true,
          },
        },
      }),
      react(),
    ],
  },
})
