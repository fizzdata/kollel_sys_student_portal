export default defineNuxtConfig({
  modules: ['@pinia/nuxt'],
  runtimeConfig: {
    public: {
     // apiBase: 'https://api.kollelsys.fizzdata.com/api'
      apiBase: 'http://127.0.0.1:8000/api'
    }
  }
})