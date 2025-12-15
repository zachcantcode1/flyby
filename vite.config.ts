import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      '/api/auth': {
        target: 'https://auth.opensky-network.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/auth/, '/auth'),
        secure: false,
      },
      '/api/fr24': {
        target: 'https://fr24api.flightradar24.com/api',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/fr24/, ''),
        secure: false,
      },
      '/api/airport-data': {
        target: 'https://airport-data.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/airport-data/, ''),
        secure: false,
      },
      '/api/planespotters': {
        target: 'https://api.planespotters.net/pub/photos/reg',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/planespotters/, ''),
        secure: false,
      },
      '/api': {
        target: 'https://opensky-network.org',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})