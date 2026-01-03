import path from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  root: __dirname,
  plugins: [react()],
  resolve: {
    alias: {
      '@ai-platform/context-core': path.resolve(
        __dirname,
        '../../libs/context-core/src/index.ts'
      ),
      '@ai-platform/protocol-rest': path.resolve(
        __dirname,
        '../../libs/protocol-rest/src/index.ts'
      ),
      '@ai-platform/protocol-ws': path.resolve(__dirname, '../../libs/protocol-ws/src/index.ts'),
      '@ai-platform/design-tokens': path.resolve(
        __dirname,
        '../../libs/design-tokens/src/index.ts'
      ),
      '@ai-platform/design-tokens/styles.css': path.resolve(
        __dirname,
        '../../libs/design-tokens/src/styles.css'
      )
    }
  },
  server: {
    port: 4300,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: path.resolve(__dirname, '../../dist/apps/client'),
    emptyOutDir: true
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: path.resolve(__dirname, './src/test-setup.ts'),
    include: ['src/**/*.spec.{ts,tsx}', 'src/**/*.test.{ts,tsx}']
  }
});
