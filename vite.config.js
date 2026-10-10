import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 5174,
    watch: {
      ignored: ['**/screenshots/**', '**/docs/**', '**/*.png', '**/*.ps1', '**/*.bat']
    }
  }
});
