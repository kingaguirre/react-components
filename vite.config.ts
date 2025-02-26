import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import tsconfigPaths from 'vite-tsconfig-paths';
import dts from 'vite-plugin-dts';
import commonjs from 'rollup-plugin-commonjs';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';

export default defineConfig({
  logLevel: 'warn',
  plugins: [
    tsconfigPaths(),
    dts({
      insertTypesEntry: true,
      exclude: [
        'public/**',
        'node_module/**',
        'src/poc/**',
        'src/components/**',
        '**/stories.ts',
        '**/stories.tsx',
        '**/_test.ts',
        '**/_test.tsx'
      ],
    }),
    react(),
    cssInjectedByJsPlugin(), // Inlines CSS into the JS bundle
  ],
  resolve: {
    alias: {
      // Ensure only one instance of React is used
      'react': path.resolve('node_modules', 'react'),
      'react-dom': path.resolve('node_modules', 'react-dom'),
    },
  },
  build: {
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
