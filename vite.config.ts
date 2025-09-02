import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import tsconfigPaths from 'vite-tsconfig-paths';
import dts from 'vite-plugin-dts';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';
import fs from 'fs'

function fixDtsImports() {
  return {
    name: 'fix-dts-imports',
    closeBundle: async () => {
      const dir = path.resolve(__dirname, 'dist');
      
      function traverseDirectory(directory: string) {
        fs.readdirSync(directory).forEach((file: string) => {
          const fullPath = path.join(directory, file);
          if (fs.statSync(fullPath).isDirectory()) {
            traverseDirectory(fullPath);
          } else if (fullPath.endsWith('.d.ts')) {
            let content = fs.readFileSync(fullPath, 'utf-8');
            // This regex matches any import path that goes through one or more "../" segments into node_modules
            content = content.replace(/(['"])(?:\.\.\/)+node_modules\/([^'"]+)\1/g, `$1$2$1`);
            fs.writeFileSync(fullPath, content);
          }
        });
      }
      
      traverseDirectory(dir);
    },
  };
}

export default defineConfig({
  logLevel: 'warn',
  plugins: [
    tsconfigPaths(),
    dts({
      insertTypesEntry: true,
      rollupTypes: true,
      entryRoot: 'src', // guide bundling from your source folder.
      outDir: 'dist',   // explicit output directory.
      exclude: [
        'public/**',
        'node_modules/**',
        'src/poc/**',
        '**/stories.ts',
        '**/stories.tsx',
        '**/_test.ts',
        '**/_test.tsx',
        '**/stories/**',
        '**/__tests__/**',
        'src/components/**',
      ],
    }),
    react(),
    cssInjectedByJsPlugin(), // inlines CSS into the JS bundle
    fixDtsImports(), // custom plugin to fix absolute paths in .d.ts files
  ],
  resolve: {
    alias: {
      // ensure only one instance of React is used
      'react': path.resolve('node_modules', 'react'),
      'react-dom': path.resolve('node_modules', 'react-dom'),
    },
    dedupe: ['react', 'react-dom', 'styled-components'],
  },
  server: {
    proxy: {
      '/api/chat': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/chat/, '/chat'),
      },
    },
  },
  build: {
    // assetsInlineLimit: 0,
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'ReactComponentsLib',
      formats: ['es', 'cjs'],
      fileName: (format) => {
        if (format === 'cjs') return 'react-components-lib.cjs';
        return `react-components-lib.${format}.js`;
      },
    },
    rollupOptions: {
      external: [
        'react',
        'react-dom',
        'styled-components'
      ],
      output: {
        exports: 'named',
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'styled-components': 'styled',
        },
      },
    },
  },
  test: {
    globals: true,
    restoreMocks: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    css: true,
    include: [
      'src/**/*_test.{ts,tsx}',
      'src/**/*.{test,spec}.{ts,tsx}'
    ],
    coverage: {
      reporter: ['text', 'lcov'],
      exclude: [
        'src/poc/**/stories.tsx',
        'src/organisms/**/stories.tsx',
        'src/molecules/**/stories.tsx',
        'src/atoms/**/stories.tsx',
        'src/components/**',
        '**/stories/**'
      ],
    },
  },
});
