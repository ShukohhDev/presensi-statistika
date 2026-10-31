import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

// Konfigurasi Vite untuk Presensi MK Statistika
// Murni menggunakan Vanilla JavaScript (HTML, Tailwind CSS, JavaScript ES6) - Tanpa React / TypeScript
export default defineConfig({
  plugins: [
    tailwindcss(),
  ],
  server: {
    port: 5174,
    proxy: {
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
