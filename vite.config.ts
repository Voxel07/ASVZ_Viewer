import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // Vite 8 uses Rolldown: the object form of `manualChunks` is no longer
        // supported, so vendor chunking is expressed as code-splitting groups.
        codeSplitting: {
          groups: [
            { name: 'react-vendor', test: /node_modules[\\/](react|react-dom|framer-motion)[\\/]/ },
            { name: 'datagrid-vendor', test: /node_modules[\\/]@mui[\\/]x-data-grid[\\/]/ },
            { name: 'mui-vendor', test: /node_modules[\\/](@mui|@emotion)[\\/]/ },
            { name: 'recharts-vendor', test: /node_modules[\\/]recharts[\\/]/ },
            { name: 'pocketbase', test: /node_modules[\\/]pocketbase[\\/]/ },
            { name: 'utils-vendor', test: /node_modules[\\/]date-fns[\\/]/ }
          ]
        }
      }
    }
  }
})
