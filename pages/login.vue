<script setup lang="ts">
import { apiFetch } from "~/composables/useBackendApi"

definePageMeta({
  middleware: "guest"
})

const username = ref("admin")
const password = ref("admin14KNS1")
const loading = ref(false)
const errorMessage = ref("")

const login = async () => {
  errorMessage.value = ""
  loading.value = true

  try {
    await apiFetch("/api/auth/login", {
      method: "POST",
      body: {
        username: username.value,
        password: password.value
      }
    })
    await navigateTo("/")
  } catch (error: any) {
    errorMessage.value = error?.data?.statusMessage || "Login gagal."
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="login-shell">
    <section class="login-card">
      <div class="login-header">
        <p class="eyebrow">Presensi Mahasiswa</p>
        <h1>Masuk ke Dashboard Presensi</h1>
        <p class="helper-text">Gunakan akun yang terdaftar untuk membuka sesi kelas, memantau kehadiran, dan melihat rekap presensi mahasiswa.</p>
      </div>

      <div class="login-story-grid">
        <article class="login-story-card">
          <span class="story-label">Akses Cepat</span>
          <strong>Buka sesi kelas dan pantau kehadiran</strong>
          <p>Masuk sebagai admin untuk mengelola sesi aktif, check-in, dan koreksi data presensi mahasiswa.</p>
        </article>
        <article class="login-story-card login-story-card-accent">
          <span class="story-label">Hari Ini</span>
          <strong>Dashboard real-time siap dipakai</strong>
          <p>Setelah login, Anda bisa langsung melihat jam sistem, sesi aktif, dan ringkasan kehadiran terbaru.</p>
        </article>
      </div>

      <div class="login-form-block">
        <div class="form-grid">
          <label class="field field-wide">
            <span>Username</span>
            <input v-model="username" type="text" placeholder="Masukkan username">
          </label>

          <label class="field field-wide">
            <span>Password</span>
            <input v-model="password" type="password" placeholder="Masukkan password">
          </label>
        </div>

        <div class="action-row login-actions">
          <button class="button-primary" :disabled="loading" @click="login">
            {{ loading ? "Masuk..." : "Login" }}
          </button>
        </div>

        <p class="login-form-note">Gunakan kredensial admin yang sudah terdaftar di sistem presensi.</p>
        <p v-if="errorMessage" class="status-error">{{ errorMessage }}</p>
      </div>
    </section>
  </main>
</template>
