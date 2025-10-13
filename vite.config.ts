import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        ui: 'index.html'
      },
      output: {
        entryFileNames: 'ui.js',
        assetFileNames: 'ui.[ext]'
      }
    }
  },
  server: {
    port: 3000,
    open: false
  }
})