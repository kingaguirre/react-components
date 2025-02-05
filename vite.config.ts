import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { fileURLToPath } from 'url';

// Fix for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist', // Ensure the output directory is explicitly set
    emptyOutDir: true, // Ensure it clears previous builds
  },
  resolve: {
    alias: {
      '@components': path.resolve(__dirname, 'src/components'),
      '@atoms': path.resolve(__dirname, 'src/atoms'),
      '@molecules': path.resolve(__dirname, 'src/molecules'),
      '@organisms': path.resolve(__dirname, 'src/organisms'),
    },
  },
  test: {
    globals: true, // enables global test APIs (like describe, it, expect)
    environment: 'jsdom', // simulates a browser environment for testing components
    setupFiles: './src/setupTests.ts', // run common setup before tests
    include: ['src/**/*_test.{ts,tsx}', 'src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      reporter: ['text', 'lcov'], // lcov report is recognized by SonarQube
    },
  },
});
