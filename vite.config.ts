import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          '/api': {
            target: 'http://localhost:8000',
            changeOrigin: true,
          },
        },
      },
      plugins: [react(), tailwindcss()],
      define: {
        
        'import.meta.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, 'src'),
        }
      },
      test: {
        environment: 'jsdom',
        setupFiles: './vitest.setup.ts'
      }
    };
});
