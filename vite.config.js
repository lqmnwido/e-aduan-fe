import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    // pdf lib is big so keep it separate
    chunkSizeWarningLimit: 1300,
  },
})
