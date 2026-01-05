import path from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  root: __dirname,
  plugins: [react()],
  resolve: {
    extensions: ['.ts', '.tsx', '.mjs', '.js', '.jsx', '.json'],
    alias: [
      {
        find: /^@ai-platform\/design-tokens\/styles\.css$/,
        replacement: path.resolve(__dirname, '../../libs/design-tokens/src/styles.css')
      },
      {
        find: /^@ai-platform\/design-tokens$/,
        replacement: path.resolve(__dirname, '../../libs/design-tokens/src/index.ts')
      },
      {
        find: /^@ai-platform\/context-core$/,
        replacement: path.resolve(__dirname, '../../libs/context-core/src/index.ts')
      },
      {
        find: /^@ai-platform\/protocol-rest$/,
        replacement: path.resolve(__dirname, '../../libs/protocol-rest/src/index.ts')
      },
      {
        find: /^@ai-platform\/protocol-ws$/,
        replacement: path.resolve(__dirname, '../../libs/protocol-ws/src/index.ts')
      }
    ]
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
