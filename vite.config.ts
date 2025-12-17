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
      // OpenSky Auth API (for flight tracks)
      '/api/opensky-auth': {
        target: 'https://auth.opensky-network.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/opensky-auth/, '/auth'),
        secure: false,
      },
      // OpenSky API (for flight tracks)
      '/api/opensky': {
        target: 'https://opensky-network.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/opensky/, '/api'),
        secure: false,
      },
      // FlightRadar24 API
      '/api/fr24': {
        target: 'https://fr24api.flightradar24.com/api',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/fr24/, ''),
        secure: false,
      },
      // Airport Data API
      '/api/airport-data': {
        target: 'https://airport-data.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/airport-data/, ''),
        secure: false,
      },
      // Planespotters API
      '/api/planespotters': {
        target: 'https://api.planespotters.net/pub/photos/reg',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/planespotters/, ''),
        secure: false,
      },
    },
  },
})