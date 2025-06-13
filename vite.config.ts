import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

const isProduction = process.env.VITE_ENVIRONMENT === 'production';

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
});
