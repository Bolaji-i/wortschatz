import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  // BASE is set when publishing the web version to a sub-path (e.g. GitHub Pages)
  base: process.env.BASE || '/',
  plugins: [vue()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  build: { outDir: 'dist', chunkSizeWarningLimit: 1500 }
})
