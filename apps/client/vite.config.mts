import path from 'path';
import { fileURLToPath } from 'url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const currentDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: currentDir,
  plugins: [react()],
  resolve: {
    extensions: ['.ts', '.tsx', '.mjs', '.js', '.jsx', '.json'],
    alias: [
      {
        find: /^@ai-platform\/design-tokens\/styles\.css$/,
        replacement: path.resolve(currentDir, '../../libs/design-tokens/src/styles.css'),
      },
      {
        find: /^@ai-platform\/design-tokens$/,
        replacement: path.resolve(currentDir, '../../libs/design-tokens/src/index.ts'),
      },
      {
        find: /^@effect\/schema\/Schema$/,
        replacement: path.resolve(currentDir, '../../libs/effect-schema/src/Schema.ts'),
      },
      {
        find: /^@effect\/schema$/,
        replacement: path.resolve(currentDir, '../../libs/effect-schema/src/index.ts'),
      },
      {
        find: /^@ai-platform\/context-core$/,
        replacement: path.resolve(currentDir, '../../libs/context-core/src/index.ts'),
      },
      {
        find: /^@ai-platform\/protocol-rest$/,
        replacement: path.resolve(currentDir, '../../libs/protocol-rest/src/index.ts'),
      },
      {
        find: /^@ai-platform\/protocol-ws$/,
        replacement: path.resolve(currentDir, '../../libs/protocol-ws/src/index.ts'),
      },
      {
        find: /^@ai-platform\/protocol-generated$/,
        replacement: path.resolve(currentDir, '../../libs/protocol-generated/src/index.ts'),
      },
    ],
  },
  server: {
    port: 4300,
    allowedHosts: ['ai-platform.local'],
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: path.resolve(currentDir, '../../dist/apps/client'),
    emptyOutDir: true,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: path.resolve(currentDir, './src/test-setup.ts'),
    include: ['src/**/*.spec.{ts,tsx}', 'src/**/*.test.{ts,tsx}'],
  },
});
