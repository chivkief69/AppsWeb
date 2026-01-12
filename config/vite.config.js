import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: '.',
  publicDir: 'assets',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, '../index.html')
      }
    }
  },
  server: {
    port: 3000,
    open: true
    // Note: Vite automatically handles history API fallback for SPAs
    // The real issue is Firebase authDomain configuration - see docs/FIREBASE_REDIRECT_FIX.md
  },
  plugins: [],
  resolve: {
    alias: {
      '@': resolve(__dirname, '../js')
    }
  }
});

