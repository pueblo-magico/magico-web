import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath, URL } from 'url'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: null,
      includeAssets: ['favicon.svg', 'robots.txt'],
      // El sitio maneja sus manifests a mano (manifest.json, manifest-reservas.json,
      // enlazados directo desde cada HTML shell — ver index.html y scripts/prerender.mjs)
      // y el Service Worker propio en sw.js (registrado en index.html), no el de
      // vite-plugin-pwa. Sin esto, VitePWA inyectaba un segundo <link rel="manifest">
      // en cada página apuntando a un manifest genérico no usado, compitiendo con
      // el real.
      manifest: false,
      workbox: {
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5 MiB
        globPatterns: ['**/*.{js,css,ico,png,svg}'],
        globIgnores: ['**/uploads/**'],
        navigateFallback: null,
        runtimeCaching: [
          {
            // Guardar imágenes de Unsplash para verlas offline
            urlPattern: /^https:\/\/images\.unsplash\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'unsplash-images',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 días
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // Guardar fuentes de Google
            urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 }
            }
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./', import.meta.url))
    },
    dedupe: ['react', 'react-dom']
  },
  server: {
    host: true,
    // choose a constant port so the URL doesn't shift each time you restart
    // and so you can bookmark or open it without guessing.
    port: 5173,
    // Las Functions (/api: login del panel, formularios, CSV) no corren en
    // Vite: se reenvían a `npx wrangler pages dev dist --port 8788`.
    proxy: {
      '/api': 'http://127.0.0.1:8788',
    },
  }
})