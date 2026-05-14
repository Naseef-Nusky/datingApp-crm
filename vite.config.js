import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// Production: set VITE_BASE_PATH=/crm/ when serving CRM at https://yourdomain.com/crm/
const base = process.env.VITE_BASE_PATH || '/'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiProxyTarget = env.VITE_DEV_PROXY_API || 'http://localhost:5000'

  return {
    base,
    plugins: [react()],
    server: {
      port: 5174,
      proxy: {
        '/api': {
          target: apiProxyTarget,
          changeOrigin: true,
        },
      },
    },
  }
})
