import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';


// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(),
  VitePWA({
    registerType: 'autoUpdate',
    includeAssets: ['favicon.svg', 'favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
    manifest: {
      name: 'Marca pra nós',
      short_name: 'MPN',
      description: 'Gerenciamento de reservas de horários em quadras esportivas',
      theme_color: '#2C3043',
      icons: [
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
      ],
    },
  })
  ],
  server: {
    allowedHosts: ['c4fe-177-2-138-4.ngrok-free.app'],
  },
})