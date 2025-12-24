import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
    tailwindcss(),
  ],
  server: {
    proxy: {
      // Proxy requests starting with '/api'
      '/api': {
        target: 'http://localhost:3000', // Your backend server address
        changeOrigin: true, // Needed for virtual hosted sites
        // Optional: rewrite the path to remove the '/api' prefix on the backend request
        // rewrite: (path) => path.replace(/^\/api/, ''), 
      },
    },
  },
})
