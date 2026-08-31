import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';
import fs from 'fs';

function maplibreWorkerPlugin() {
  return {
    name: 'maplibre-worker-copy',
    buildStart() {
      try {
        const srcDir = path.resolve(__dirname, 'node_modules/maplibre-gl/dist');
        const pubAssets = path.resolve(__dirname, 'public/assets');
        const pubRoot = path.resolve(__dirname, 'public');
        if (!fs.existsSync(srcDir)) return;
        fs.mkdirSync(pubAssets, { recursive: true });
        ['maplibre-gl-worker.mjs', 'maplibre-gl-worker.mjs.map', 'maplibre-gl-shared.mjs', 'maplibre-gl-shared.mjs.map'].forEach(f => {
          const src = path.join(srcDir, f);
          if (fs.existsSync(src)) {
            fs.copyFileSync(src, path.join(pubAssets, f));
            fs.copyFileSync(src, path.join(pubRoot, f));
          }
        });
      } catch (err) {
        console.warn('MapLibre worker copy warning:', err);
      }
    }
  };
}

export default defineConfig({
  plugins: [vue(), maplibreWorkerPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  worker: {
    format: 'es'
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      },
      '/socket.io': {
        target: 'http://localhost:5000',
        ws: true
      }
    }
  }
});
