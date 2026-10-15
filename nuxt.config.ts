// KIOSK_BUILD=1 is set only by the Tauri scripts (kiosk:dev / kiosk:generate).
// Normal browser dev/build/generate are unaffected.
const isKiosk = process.env.KIOSK_BUILD === '1'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  ssr: !isKiosk,
  devtools: { enabled: true },
  modules: ['@nuxt/ui'],
  css: ['~/assets/css/main.css'],
  icon: {
    provider: 'iconify',
    clientBundle: {
      scan: true,
      includeCustomCollections: true,
      sizeLimitKb: 512,
    },
    fallbackToApi: false,
  },
  app: {
    baseURL: '/',
    head: {
      title: 'KollelSys Student',
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1',
      link: [
        {
          rel: 'icon',
          type: 'image/svg+xml',
          href:
            'data:image/svg+xml,' +
            encodeURIComponent(`
              <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64">
                <rect x="0" y="0" width="64" height="64" rx="12" ry="12" fill="#1e2939" />
                <text x="50%" y="50%" font-size="32" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="central">
                  K
                </text>
              </svg>
            `),
        },
      ],
    }
  },
  runtimeConfig: {
    // Expose public environment variables to both client and server
    public: {
      API_URL: process.env.API_URL || 'https://api.kollelsys.com/api',
    },
  },
  ui: {
    colorMode: false
  }
})
