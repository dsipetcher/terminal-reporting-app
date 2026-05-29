import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // Для GitHub Pages - используйте название вашего репозитория
  // Например: base: '/terminal-reporting-app/'
  base: process.env.VITE_BASE_PATH || '/terminal-reporting-app/',
  
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
  
  preview: {
    host: '0.0.0.0',
    port: 5173,
  },
})
