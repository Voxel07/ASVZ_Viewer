import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'framer-motion'],
          'mui-vendor': ['@mui/material', '@mui/icons-material', '@emotion/react', '@emotion/styled'],
          'datagrid-vendor': ['@mui/x-data-grid'],
          'recharts-vendor': ['recharts'],
          'pocketbase': ['pocketbase'],
          'utils-vendor': ['date-fns']
        }
      }
    }
  }
})
