import { defineConfig } from 'vite';
import path from 'node:path';
import tsconfigPaths from 'vite-tsconfig-paths';
import dts from 'vite-plugin-dts';

export default defineConfig({
  logLevel: 'warn',
  plugins: [
    tsconfigPaths(),
    dts({
      tsconfigPath: 'tsconfig.server.json',
      insertTypesEntry: false,
      entryRoot: 'src',
      outDir: 'dist/server',
      include: ['src/server/index.ts', 'src/common/server/ai/**/*.d.ts'],
    }),
  ],
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/server/index.ts'),
      name: 'ReactComponentsLibServer',
      formats: ['es', 'cjs'],
      fileName: (format) => (format === 'cjs' ? 'index.cjs' : 'index.js'),
    },
    rollupOptions: {
      external: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        'react/jsx-dev-runtime',
      ],
      output: { exports: 'named' },
    },
    outDir: 'dist/server',
    emptyOutDir: false, // keep your client build in dist/
  },
});
