import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import tsconfigPaths from 'vite-tsconfig-paths';
import dts from 'vite-plugin-dts';
import commonjs from 'rollup-plugin-commonjs';
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
        'node_module/**',
        'src/poc/**',
        '**/stories.ts',
        '**/stories.tsx',
        '**/_test.ts',
        '**/_test.tsx'
      ],
    }),
    react(),
    fixDtsImports(), // custom plugin to fix absolute paths in .d.ts files
  ],
  resolve: {
    alias: {
      // ensure only one instance of React is used
      'react': path.resolve('node_modules', 'react'),
      'react-dom': path.resolve('node_modules', 'react-dom'),
    },
  },
  build: {
    // assetsInlineLimit: 0,
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'ReactComponentsLib',
      formats: ['es', 'cjs', 'umd'],
      fileName: (format) => {
        if (format === 'cjs') return 'react-components-lib.cjs';
        return `react-components-lib.${format}.js`;
      },
    },
    rollupOptions: {
      plugins: [commonjs()],
      external: [
        'react',
        'react-dom',
        'styled-components',
        'react-datepicker',
        'react-tooltip',
      ],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'styled-components': 'styled',
          'react-datepicker': 'ReactDatePicker',
          'react-tooltip': 'reactTooltip',
        },
      },
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
      exclude: [
        'src/poc/**/stories.tsx',
        'src/organisms/**/stories.tsx',
        'src/molecules/**/stories.tsx',
        'src/atoms/**/stories.tsx',
        'src/components/**'
      ],
    },
  },
});
