import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
  ],
  server: {
    port: 5173,
    // Proxy Cloudinary Admin API calls to avoid CORS
    proxy: {
      '/cldapi': {
        target: 'https://api.cloudinary.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/cldapi\/([^/]+)/, '/v1_1/$1'),
      },
    },
  },
})
