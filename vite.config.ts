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
    "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com https://www.clarity.ms https://scripts.clarity.ms",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://*.marcapranos.com.br https://*.up.railway.app https://www.google-analytics.com https://analytics.google.com https://*.clarity.ms https://www.clarity.ms https://viacep.com.br http://localhost:* http://127.0.0.1:* ws: wss:",
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
      includeAssets: isProduction
        ? [
          'favicon.svg',
          'favicon.ico',
          'robots.txt',
          'apple-touch-icon.png',
        ]
        : [
          'favicon-test.svg',
          'favicon-test.ico',
          'robots.txt',
          'apple-touch-icon.png',
        ],
      manifest: {
        name: 'Marca Pra Nós',
        short_name: 'MPN',
        description: 'Gerenciamento de reservas de horários em quadras esportivas',
        theme_color: '#2C3043',
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
