import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/frontend-ecommerce/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  },
  server: {
    port: 3001,
    host: true
  },
  preview: {
    port: process.env.PORT || 3001,
    host: '0.0.0.0'
  }
})
