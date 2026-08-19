import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { fileURLToPath } from 'url'

const rootDir = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react(), tailwindcss()],
  envDir: path.resolve(rootDir, '..'),
  resolve: {
    alias: {
      '@': path.resolve(rootDir, './src'),
    },
  },
  optimizeDeps: {
    // Pre-bundling breaks MapLibre's web worker; tiles fail to load (gray map).
    exclude: ['maplibre-gl'],
  },
  server: {
    port: 5173,
  },
})
