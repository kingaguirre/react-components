import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { fileURLToPath } from 'url';

// Fix for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vite.dev/config/
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
});
