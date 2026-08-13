import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

const isProduction = process.env.VITE_ENVIRONMENT === 'production';

/** Headers de endurecimento (dev/preview). Em prod o `serve` usa public/serve.json → dist. */
const securityHeaders: Record<string, string> = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Content-Security-Policy': [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com https://www.clarity.ms https://scripts.clarity.ms https://accounts.google.com",
    "style-src 'self' 'unsafe-inline' https://accounts.google.com",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "frame-src https://accounts.google.com",
    "connect-src 'self' https://*.marcapranos.com.br https://*.up.railway.app https://www.google-analytics.com https://analytics.google.com https://*.clarity.ms https://www.clarity.ms https://viacep.com.br https://accounts.google.com http://localhost:* http://127.0.0.1:* ws: wss:",
    "worker-src 'self' blob:",
    "media-src 'self' blob:",
  ].join('; '),
};

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['logo-mpn.png', 'robots.txt', 'apple-touch-icon.png'],
      workbox: {
        // SPA online: `serve -s` já devolve index.html.
        // NavigationRoute + precache vazio/desatualizado = ERR_FAILED no refresh (Chrome Android).
        navigateFallback: undefined,
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
      },
      manifest: {
        name: 'Marca Pra Nós',
        short_name: 'MPN',
        description: 'Gerenciamento de reservas de horários em quadras esportivas',
        display: 'standalone',
        background_color: '#081425',
        theme_color: '#081425',
        icons: isProduction
          ? [
            {
              src: 'favicon-192x192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: 'favicon-512x512.png',
              sizes: '512x512',
              type: 'image/png',
            },
            {
              src: 'favicon-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable',
            },
          ]
          : [
            {
              src: 'favicon-test-192x192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: 'favicon-test-512x512.png',
              sizes: '512x512',
              type: 'image/png',
            },
            {
              src: 'favicon-test-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable',
            },
          ],
      },
    }),
  ],
  server: {
    headers: securityHeaders,
  },
  preview: {
    headers: securityHeaders,
  },
});
