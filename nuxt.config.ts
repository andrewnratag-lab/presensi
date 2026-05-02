export default defineNuxtConfig({
  compatibilityDate: "2026-04-30",
  css: ["~/assets/css/main.css"],
  runtimeConfig: {
    public: {
      appBaseUrl: process.env.NUXT_PUBLIC_APP_BASE_URL || ""
    }
  },
  devtools: {
    enabled: true
  },
  app: {
    head: {
      title: "Presensi Mahasiswa",
      meta: [
        {
          name: "viewport",
          content: "width=device-width, initial-scale=1"
        },
        {
          name: "description",
          content: "Aplikasi presensi mahasiswa berbasis Nuxt 3 dengan penyimpanan Postgres yang siap dideploy ke Vercel."
        }
      ]
    }
  }
})
