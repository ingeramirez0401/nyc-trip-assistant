import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

const ICON_SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Reemplaza el service worker escrito a mano (public/sw.js, ahora
    // borrado) que quedó desactivado por dejar usuarios pegados en bundles
    // viejos -- Workbox genera un precache versionado por build, así que
    // cada deploy invalida correctamente lo anterior. registerType:'prompt'
    // + injectRegister:null porque el registro y el aviso de "hay una
    // versión nueva" se manejan a mano desde PwaUpdateBanner.jsx (con
    // virtual:pwa-register/react), no automáticamente.
    VitePWA({
      registerType: 'prompt',
      injectRegister: null,
      includeAssets: ['icons/favicon-48.png'],
      manifest: {
        name: 'TripPulse',
        short_name: 'TripPulse',
        description: 'Planifica, explora y vive tus viajes con TripPulse',
        start_url: '/',
        display: 'standalone',
        background_color: '#0f172a',
        theme_color: '#0f172a',
        orientation: 'portrait-primary',
        categories: ['travel', 'navigation', 'lifestyle'],
        icons: ICON_SIZES.map((size) => ({
          src: `/icons/icon-${size}x${size}.png`,
          sizes: `${size}x${size}`,
          type: 'image/png',
          purpose: 'any maskable',
        })),
        shortcuts: [
          {
            name: 'Ver mapa',
            short_name: 'Mapa',
            description: 'Abrir el mapa interactivo de tu viaje',
            url: '/',
            icons: [{ src: '/icons/icon-96x96.png', sizes: '96x96' }],
          },
        ],
      },
      workbox: {
        // Fase 0/1: shell + assets propios + fuentes/íconos externos (si no
        // se cachean, la app offline abre pero sin FontAwesome ni
        // tipografía). Fase 2 suma las fotos de paradas -- los datos de
        // viaje en sí (trips/days/stops) NO pasan por Workbox, tienen su
        // propio espejo en IndexedDB (ver lib/offlineDb.js), porque son
        // lecturas con filtros/RLS por usuario, no URLs GET estables.
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg}'],
        navigateFallback: '/index.html',
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/cdnjs\.cloudflare\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'cdn-fontawesome',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 180 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Fotos de paradas en el bucket de Storage self-hosted -- sin
            // ancla de host (sin ^https://...) a propósito, para que
            // funcione sin importar qué VITE_SUPABASE_URL tenga cada
            // entorno (dev/prod pueden apuntar a hosts distintos).
            urlPattern: /\/storage\/v1\/object\/public\//i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'trip-images',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: {
        // Permite probar el service worker con `npm run dev`, sin tener que
        // hacer build + preview cada vez para verificar cambios.
        enabled: true,
        type: 'module',
      },
    }),
  ],
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
})
