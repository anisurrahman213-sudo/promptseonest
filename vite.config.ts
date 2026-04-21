import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  define: {
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "robots.txt"],
      manifest: {
        name: "Prompt SEO Nest",
        short_name: "SEO Nest",
        description: "AI-Powered Image SEO Generator for Stock Marketplaces",
        theme_color: "#8B5CF6",
        background_color: "#0a0a0b",
        display: "standalone",
        orientation: "portrait",
        scope: "/",
        start_url: "/",
        icons: [
          {
            src: "/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        navigateFallbackDenylist: [/^\/~oauth/],
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff,woff2,webp,avif}"],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        // Increase precache size limit for aggressive caching
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB
        runtimeCaching: [
          // Google Fonts CSS - 1 year
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // Google Fonts files - 1 year
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "gstatic-fonts-cache",
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // Supabase image transforms (hero, thumbnails) - StaleWhileRevalidate for instant repeat loads
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/v1\/render\/image\/.*/i,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "supabase-image-transforms",
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 60, // 60 days
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // Supabase raw storage objects - CacheFirst, long TTL
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/v1\/object\/public\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "supabase-storage-cache",
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 60, // 60 days
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // All other images (JPG/PNG/WebP/AVIF/SVG) — StaleWhileRevalidate
          {
            urlPattern: ({ request }) => request.destination === "image",
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "image-cache",
              expiration: {
                maxEntries: 150,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // JS / CSS bundles — StaleWhileRevalidate for instant repeat navigation
          {
            urlPattern: ({ request }) =>
              request.destination === "script" || request.destination === "style",
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "static-resources",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // Site settings & pricing-like read endpoints — StaleWhileRevalidate (instant + background refresh)
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/(site_settings|pricing_plans|feature_cards|tutorial_videos|hero_backgrounds).*/i,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "supabase-public-config",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24, // 1 day
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // Other Supabase REST queries — NetworkFirst (fresh data, fall back to cache offline)
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "supabase-api-cache",
              expiration: {
                maxEntries: 80,
                maxAgeSeconds: 60 * 5,
              },
              cacheableResponse: { statuses: [0, 200] },
              networkTimeoutSeconds: 6,
            },
          },
          // Edge Functions — NetworkFirst with short cache (skip mutations)
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/functions\/v1\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "supabase-functions-cache",
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 2,
              },
              cacheableResponse: { statuses: [0, 200] },
              networkTimeoutSeconds: 8,
            },
          },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: 'es2020',
    minify: 'esbuild',
    cssCodeSplit: true,
    sourcemap: false,
    reportCompressedSize: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-query': ['@tanstack/react-query'],
          'vendor-ui': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-popover', '@radix-ui/react-tabs', '@radix-ui/react-tooltip', '@radix-ui/react-scroll-area', '@radix-ui/react-select'],
          'vendor-motion': ['framer-motion'],
          'vendor-i18n': ['i18next', 'react-i18next', 'i18next-browser-languagedetector'],
          'vendor-charts': ['recharts'],
          'vendor-markdown': ['react-markdown'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-icons': ['lucide-react'],
          'vendor-forms': ['react-hook-form', '@hookform/resolvers', 'zod'],
        },
      },
    },
    chunkSizeWarningLimit: 800,
  },
  esbuild: {
    drop: mode === 'production' ? ['console', 'debugger'] : [],
  },
}));
