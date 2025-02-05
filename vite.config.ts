import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { fileURLToPath } from 'url';
import fg from 'fast-glob';

// Resolve __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use fast-glob to find all index.tsx files under atoms, molecules, and organisms
const entryFiles = fg.sync([
  'src/atoms/**/index.tsx',
  'src/molecules/**/index.tsx',
  'src/organisms/**/index.tsx'
]);

// Create an entries object with keys like "atoms/FormControl"
const componentEntries = entryFiles.reduce((acc, file) => {
  // Remove the 'src/' prefix and the '/index.tsx' suffix to get the module key
  const key = file.replace(/^src\//, '').replace(/\/index\.tsx$/, '');
  acc[key] = path.resolve(__dirname, file);
  return acc;
}, {} as Record<string, string>);

// Manually add style entry points:
const styleEntries = {
  // This entry builds your GlobalStyles component
  'styles/GlobalStyles': path.resolve(__dirname, 'src/styles/GlobalStyles.ts'),
  'styles/theme': path.resolve(__dirname, 'src/styles/theme.ts'),
};

const entries = { ...componentEntries, ...styleEntries };

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',      // Output directory
    emptyOutDir: true,   // Clean previous builds
    rollupOptions: {
      input: entries,
      output: {
        // preserveModules: true,
        preserveModulesRoot: 'src',
        // Each file will be output as [name]/index.js (e.g., atoms/FormControl/index.js)
        entryFileNames: '[name]/index.js',
        format: 'esm',
      },
      // Ensure peer dependencies are external
      external: ['react', 'react-dom', 'styled-components']
    },
  },
  resolve: {
    alias: {
      '@components': path.resolve(__dirname, 'src/components'),
      '@atoms': path.resolve(__dirname, 'src/atoms'),
      '@molecules': path.resolve(__dirname, 'src/molecules'),
      '@organisms': path.resolve(__dirname, 'src/organisms')
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    include: [
      'src/**/*_test.{ts,tsx}',
      'src/**/*.{test,spec}.{ts,tsx}'
    ],
    coverage: {
      reporter: ['text', 'lcov'],
    },
  },
});
