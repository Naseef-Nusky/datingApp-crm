import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Production: set VITE_BASE_PATH=/crm/ when serving CRM at https://yourdomain.com/crm/
const base = process.env.VITE_BASE_PATH || '/'

export default defineConfig({
  base,
  plugins: [react()],
  server: {
    port: 5174,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
})
