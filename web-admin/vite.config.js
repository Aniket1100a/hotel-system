import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// `host: true` binds to 0.0.0.0 so other devices on the hotel WiFi
// (tablets, other PCs) can reach the dev server too, not just localhost.
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
  },
})
