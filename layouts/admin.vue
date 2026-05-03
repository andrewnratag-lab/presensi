<script setup lang="ts">
import { apiFetch } from "~/composables/useBackendApi"

const route = useRoute()
const drawerOpen = ref(false)
const loggingOut = ref(false)
const authCookie = useCookie<string | null>("presensi_auth")

const navigationItems = [
  {
    to: "/",
    label: "Dashboard",
    caption: "Sesi dan presensi",
    icon: "home"
  },
  {
    to: "/rekap",
    label: "Rekap Presensi",
    caption: "Laporan dan ekspor",
    icon: "report"
  }
] as const

const parseCurrentUser = () => {
  if (!authCookie.value) {
    return null
  }

  try {
    return JSON.parse(authCookie.value) as { username: string; name: string; role: string }
  } catch {
    return null
  }
}

const currentUser = computed(() => parseCurrentUser())
const activeNavigation = computed(() => {
  return navigationItems.find((item) => item.to === route.path) || navigationItems[0]
})
const reportNavigation = computed(() => {
  return navigationItems.find((item) => item.to === "/rekap") || navigationItems[1]
})
const uiBuildVersion = "UI v2026-05-03-1035"

const iconPaths: Record<string, string> = {
  home: "M3 10.75 12 3l9 7.75v9.25a1 1 0 0 1-1 1h-5.5v-6.5h-5V21H4a1 1 0 0 1-1-1z",
  report: "M7 3.75A1.75 1.75 0 0 1 8.75 2h5.69c.46 0 .9.18 1.22.5l4.34 4.34c.32.32.5.76.5 1.22v12.19A1.75 1.75 0 0 1 18.75 22h-10A1.75 1.75 0 0 1 7 20.25zM14 3.5v3.25c0 .69.56 1.25 1.25 1.25h3.25M9.5 12h7m-7 3h7m-7-6h3.5",
  logout: "M10.5 4.75a1 1 0 0 1 1-1h5.75A1.75 1.75 0 0 1 19 5.5v13a1.75 1.75 0 0 1-1.75 1.75H11.5a1 1 0 1 1 0-2h5.5V5.75h-5.5a1 1 0 0 1-1-1m-4.8 6.55 2.6-2.6a1 1 0 1 1 1.4 1.4L8.8 11H14a1 1 0 1 1 0 2H8.8l.9.9a1 1 0 1 1-1.4 1.4l-2.6-2.6a1 1 0 0 1 0-1.4"
}

const getIconPath = (icon: string) => iconPaths[icon] || iconPaths.report

const closeDrawer = () => {
  drawerOpen.value = false
}

watch(() => route.fullPath, closeDrawer)

const logout = async () => {
  loggingOut.value = true

  try {
    await apiFetch("/api/auth/logout", {
      method: "POST"
    })
    authCookie.value = null
    closeDrawer()
    await navigateTo("/login")
  } finally {
    loggingOut.value = false
  }
}
</script>

<template>
  <div class="admin-shell">
    <div class="admin-main">
      <header class="admin-header">
        <div class="admin-header-copy">
          <p class="eyebrow admin-header-eyebrow">Panel Admin</p>
          <strong>{{ activeNavigation.label }}</strong>
          <small>{{ activeNavigation.caption }}</small>
          <span class="admin-build-badge">{{ uiBuildVersion }}</span>
        </div>

        <div class="admin-header-actions">
          <NuxtLink
            :to="reportNavigation.to"
            class="admin-header-link"
            :class="{ active: route.path === reportNavigation.to }"
          >
            <span class="admin-nav-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <path :d="getIconPath(reportNavigation.icon)" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </span>
            <span>{{ reportNavigation.label }}</span>
          </NuxtLink>

          <button class="admin-header-logout" :disabled="loggingOut" @click="logout">
            <span class="admin-nav-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <path :d="getIconPath('logout')" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </span>
            <span>{{ loggingOut ? "Keluar..." : "Logout" }}</span>
          </button>

          <div class="hero-chip admin-header-chip">{{ currentUser?.role || "admin" }}</div>
        </div>
      </header>

      <div class="admin-quick-nav" aria-label="Navigasi cepat">
        <div class="admin-operator-card">
          <div class="admin-brand">
            <div class="admin-brand-mark">SI</div>
            <div class="admin-brand-copy">
              <strong>Panel Operator</strong>
              <span>{{ currentUser?.name || "Pengguna" }} · {{ currentUser?.role || "admin" }}</span>
              <small class="admin-brand-status">
                <span class="admin-brand-status-dot" aria-hidden="true"></span>
                Sistem aktif
              </small>
            </div>
          </div>
          <div class="admin-build-chip">{{ uiBuildVersion }}</div>
        </div>

        <NuxtLink
          v-for="item in navigationItems"
          :key="`quick-${item.to}`"
          :to="item.to"
          class="admin-quick-link"
          :class="{ active: route.path === item.to }"
        >
          <span class="admin-nav-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path :d="getIconPath(item.icon)" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </span>
          <span>{{ item.label }}</span>
        </NuxtLink>

        <button class="admin-quick-logout" :disabled="loggingOut" @click="logout">
          <span class="admin-nav-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path :d="getIconPath('logout')" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </span>
          <span>{{ loggingOut ? "Keluar..." : "Logout" }}</span>
        </button>
      </div>

      <div class="admin-content">
        <slot />
      </div>
    </div>
  </div>
</template>
