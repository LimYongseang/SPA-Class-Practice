import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // This tells Vite: Any request starting with /api should be forwarded to the backend
      '/api': {
        target: 'http://localhost:5000', // MUST match your backend's port (ask Member 1 or 2)
        changeOrigin: true,
      },
    },
  },
})