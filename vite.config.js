import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react()
  ],
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          'vendor-charts': ['chart.js', 'react-chartjs-2'],
          'vendor-utils': ['jspdf', 'jspdf-autotable', 'html2canvas', 'canvas-confetti'],
          'vendor-ui': ['react-icons', 'react-window', '@monaco-editor/react']
        }
      }
    }
  }
});
