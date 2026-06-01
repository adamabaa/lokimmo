import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  server: {
    port: 5173,
  },

  build: {
    chunkSizeWarningLimit: 500,

    rollupOptions: {
      output: {
        // Vite 8 (Rolldown) requiert une fonction, pas un objet
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
              return 'vendor-react'
            }
            if (id.includes('bootstrap')) {
              return 'vendor-bootstrap'
            }
            if (id.includes('lucide-react')) {
              return 'vendor-icons'
            }
            if (id.includes('recharts')) {
              return 'vendor-charts'
            }
            if (id.includes('jspdf') || id.includes('html2canvas')) {
              return 'vendor-pdf'
            }
            if (id.includes('xlsx')) {
              return 'vendor-excel'
            }
            if (id.includes('axios')) {
              return 'vendor-http'
            }
            // Toutes les autres dépendances node_modules ensemble
            return 'vendor-misc'
          }
        },
      },
    },
  },
});