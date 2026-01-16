export default defineNuxtConfig({
  compatibilityDate: '2026-01-16',
  devtools: { enabled: true },
  app: {
    baseURL: '/',
    head: {
      title: 'Student Portal | KollelSys Admin',
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
  modules: ['@pinia/nuxt', '@nuxt/ui'],
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    public: {
      // apiBase: 'https://api.kollelsys.fizzdata.com/api'
      apiBase: process.env.apiBase || 'http://127.0.0.1:8000/api'
    }
  },
  ui: {
    colorMode: false
  }
})