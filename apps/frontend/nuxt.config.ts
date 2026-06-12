// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',

  // Admin internal tool: no SEO needs, SPA mode keeps setup & deployment simple.
  // See Architecture-Note.md §3.
  ssr: false,

  devtools: { enabled: true },

  modules: ['@pinia/nuxt', '@nuxt/eslint'],

  // Flat component names (BaseButton, not UiBaseButton) regardless of subfolder.
  components: [{ path: '~/components', pathPrefix: false }],

  css: ['~/assets/css/main.css'],

  app: {
    head: {
      title: 'Klontong Admin',
      htmlAttrs: { lang: 'id' },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Sistem manajemen produk toko klontong' },
      ],
    },
  },

  runtimeConfig: {
    public: {
      // Base URL backend NestJS. Override via NUXT_PUBLIC_API_BASE_URL.
      apiBaseUrl: 'http://localhost:3001/api',
    },
  },

  typescript: {
    strict: true,
    typeCheck: false,
  },
})
