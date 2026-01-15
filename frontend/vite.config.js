import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Разрешаем доступ по сети (для Docker)
    port: 5173,
    watch: {
      usePolling: true // Исправляет hot-reload в некоторых Docker средах
    },
    proxy: {
      '/api': {
        // Если мы в Docker (dev mode), бэкенд доступен по имени сервиса "backend" на порту 3333.
        // Браузер обращается к Vite, Vite проксирует внутрь докер-сети на backend:3333
        target: 'http://backend:3000',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})