import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'https://ai-diary-e2xo.onrender.com/api',
        changeOrigin: true,
        secure: false,
        ws: true,
        configure: (proxy, _options) => {
          proxy.on('error', (_err, _req, _res) => {});
          proxy.on('proxyReq', (_proxyReq, _req, _res) => {});
          proxy.on('proxyRes', (_proxyRes, _req, _res) => {});
        },
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['lucide-react', '@tiptap/react', '@tiptap/starter-kit'],
        },
      },
    },
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify('Production'),
  },
});
