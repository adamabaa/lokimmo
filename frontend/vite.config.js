// vite.config.js
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
        manualChunks: {
          // React core
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],

          // Bootstrap CSS framework
          'vendor-bootstrap': ['bootstrap'],

          // Lucide — dangereux si importé en masse
          // ex: import { X, Y, Z, ... } from 'lucide-react' sur 20 pages = lourd
          'vendor-icons': ['lucide-react'],

          // Recharts — grosse lib de graphiques (~500kb)
          'vendor-charts': ['recharts'],

          // PDF generation — jspdf + html2canvas vont ensemble
          // html2canvas est utilisé pour capturer le DOM avant export PDF
          'vendor-pdf': ['jspdf', 'html2canvas'],

          // Excel export — xlsx pèse ~800kb à lui seul
          'vendor-excel': ['xlsx'],

          // HTTP client
          'vendor-http': ['axios'],
        },
      },
    },
  },
});