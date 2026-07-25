import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const here = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  base: './',
  plugins: [react()],
  build: { assetsInlineLimit: 0 },
  server: {
    // The fonts and the wordmark live in assets/, one level above pitch/.
    fs: { allow: [here, resolve(here, '../assets')] },
  },
})
