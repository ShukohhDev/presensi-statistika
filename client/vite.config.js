import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

// Konfigurasi Vite untuk Presensi MK Statistika
// Menggunakan Vanilla JavaScript, HTML5, CSS3, dan Tailwind CSS
export default defineConfig({
  plugins: [
    tailwindcss()
  ],
  server: {
    port: 5174,
    proxy: {
      // Proxy otomatis ke Backend Python (Port 5000)
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      },
    },
  },
})
