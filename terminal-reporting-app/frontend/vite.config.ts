import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // Для GitHub Pages используйте название вашего репозитория
  // Например: base: '/terminal-reporting-app/'
  // Для обычного домена оставьте: base: '/'
  base: process.env.GITHUB_PAGES === 'true' ? '/terminal-reporting-app/' : '/',
  
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
  
  preview: {
    host: '0.0.0.0',
    port: 5173,
  },
})
