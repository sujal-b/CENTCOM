import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      },
      '/ws': {
        target: 'ws://localhost:3001',
        ws: true
      }
    }
  },
  build: {
    target: 'esnext',
    minify: 'esbuild',
    rollupOptions: {
      // Externalize Node.js built-ins that loaders.gl tries to import
      external: [],
      onwarn(warning, warn) {
        // Suppress the child_process / spawn warnings from @loaders.gl
        if (warning.message && warning.message.includes('__vite-browser-external')) return;
        warn(warning);
      }
    },
    commonjsOptions: {
      // Ensure loaders.gl CJS modules are handled properly
      transformMixedEsModules: true
    }
  },
  resolve: {
    alias: {
      // Stub out Node.js modules that deck.gl/loaders.gl reference but never actually use in browser
      'child_process': './src/utils/noop.js'
    }
  }
});
