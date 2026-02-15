import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react(), VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['vite.svg', 'app-icon.png', 'pwa-192.png', 'pwa-512.png', 'manifest.webmanifest'],
        manifest: {
          name: 'DZKB Bayern e.V.',
          short_name: 'DZKB',
          description: 'Prüfungstrainer für DZKB Bayern e.V.',
          start_url: '/',
          scope: '/',
          display: 'standalone',
          background_color: '#ffffff',
          theme_color: '#0f172a',
          icons: [
            { src: '/pwa-192.png', sizes: '192x192', type: 'image/png' },
            { src: '/pwa-512.png', sizes: '512x512', type: 'image/png' },
            { src: '/pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
        },
        workbox: {
          runtimeCaching: [
            
{
              // Studienleitfaden: niemals aus Cache bedienen (immer Netzwerk), sonst sieht man alte PDFs
              urlPattern: ({ url }) =>
                url.hostname.endsWith('supabase.co') &&
                (url.pathname.includes('/storage/v1/object/public/learning_materials/studienleitfaden.pdf') ||
                 url.pathname.includes('/storage/v1/object/sign/learning_materials/studienleitfaden.pdf')),
              handler: 'NetworkOnly',
              options: {
                cacheName: 'guide-no-cache',
              },
            },

{
              urlPattern: ({ url }) => url.hostname.endsWith('supabase.co'),
              handler: 'NetworkFirst',
              options: {
                cacheName: 'supabase-cache',
                networkTimeoutSeconds: 5,
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60 * 24 * 7,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
      })],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
