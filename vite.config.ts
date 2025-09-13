import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/widget.ts',
      name: 'ChatboxWidget',
      fileName: 'widget',
      formats: ['iife', 'es']
    },
    rollupOptions: {
      output: {
        globals: {},
        exports: 'named'
      }
    },
    target: 'es2020',
    minify: 'terser'
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts']
  }
});
