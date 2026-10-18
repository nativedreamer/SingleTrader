import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// In-memory signal store for local development dev server middleware
let memorySignals: any[] = [];

function signalApiPlugin(): Plugin {
  return {
    name: 'signal-api-middleware',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split('?')[0];
        if (url === '/api/signal' || url === '/api/signals') {
          if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => {
              body += chunk;
            });
            req.on('end', () => {
              try {
                const parsed = JSON.parse(body || '{}');
                const signalRecord = {
                  id: 'sig_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
                  symbol: parsed.symbol || 'BTCUSD',
                  action: parsed.action || 'HOLD',
                  price: Number(parsed.price) || 0,
                  tp1: Number(parsed.tp1) || 0,
                  tp2: Number(parsed.tp2) || 0,
                  sl: Number(parsed.sl) || 0,
                  confidence: Number(parsed.confidence) || 0,
                  timestamp: parsed.timestamp || new Date().toISOString(),
                  indicators: parsed.indicators || {},
                  source: parsed.source || 'python_script',
                };
                memorySignals.unshift(signalRecord);
                if (memorySignals.length > 50) memorySignals.pop();

                res.setHeader('Content-Type', 'application/json');
                res.writeHead(200);
                res.end(JSON.stringify({ success: true, message: 'Signal received', signal: signalRecord }));
              } catch (e: any) {
                res.setHeader('Content-Type', 'application/json');
                res.writeHead(400);
                res.end(JSON.stringify({ error: 'Invalid JSON body: ' + e.message }));
              }
            });
            return;
          }
          if (req.method === 'GET') {
            res.setHeader('Content-Type', 'application/json');
            res.writeHead(200);
            res.end(JSON.stringify({
              latest: memorySignals[0] || null,
              signals: memorySignals,
              serverTime: new Date().toISOString()
            }));
            return;
          }
        }
        next();
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      signalApiPlugin(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.png', 'apple-touch-icon.png', 'icon.svg'],
        manifest: {
          id: '/',
          name: 'SingleTrader BTC/USD',
          short_name: 'SingleTrader',
          description: 'High-precision BTC/USD Quantitative Signal Generator & Pine Script 2:1 Analytics PWA',
          theme_color: '#090d16',
          background_color: '#090d16',
          display: 'standalone',
          start_url: '/',
          scope: '/',
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
        devOptions: {
          enabled: true,
          type: 'module',
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
