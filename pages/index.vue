<script setup lang="ts">
definePageMeta({
  middleware: "auth",
  layout: "admin"
})

import type { AttendancePayload, AttendanceStatus } from "~/types/attendance"
import { API_URL, apiFetch, buildApiUrl, getApiErrorMessage, isNetworkFailure } from "~/composables/useBackendApi"

const attendance = ref<AttendancePayload | null>(null)
const currentUser = ref<{ username: string; name: string; role: string } | null>(null)
const saving = ref(false)
const errorMessage = ref("")
const successMessage = ref("")
const isEditing = ref(false)
const liveWitaTime = ref("--:--:--")
let liveClockTimer: ReturnType<typeof setInterval> | null = null
const REQUEST_TIMEOUT_MS = 20000

const createDashboardFallback = (): AttendancePayload & { error: true } => ({
  records: [],
  schedules: [],
  faculties: [],
  todayDate: "",
  currentDayName: "",
  timezone: "WITA (UTC+08:00)",
  currentWitaTime: "--:--",
  courseInsights: [],
  todaySchedules: [],
  activeSession: null,
  summary: {
    total: 0,
    hadir: 0,
    terlambat: 0,
    uniqueStudents: 0,
    activeFaculties: 0,
    latestDate: "-",
    todayTotal: 0,
    hadirToday: 0,
    lateToday: 0
  },
  error: true
})

const historyQuery = ref("")
const historyStatus = ref<AttendanceStatus | "semua">("semua")
const historyDate = ref("")
const historyFaculty = ref("semua")
const historyCourse = ref("semua")

const form = reactive({
  id: 0,
  studentName: "",
  studentId: "",
  faculty: "",
  courseKey: "",
  attendanceDate: "",
  notes: ""
})

const summary = computed(() => attendance.value?.summary)
const records = computed(() => attendance.value?.records ?? [])
const schedules = computed(() => attendance.value?.schedules ?? [])
const faculties = computed(() => attendance.value?.faculties ?? [])
const courseInsights = computed(() => attendance.value?.courseInsights ?? [])
const todaySchedules = computed(() => attendance.value?.todaySchedules ?? [])
const activeSession = computed(() => attendance.value?.activeSession ?? null)
const timezoneLabel = computed(() => attendance.value?.timezone ?? "WITA (UTC+08:00)")
const todayDate = computed(() => attendance.value?.todayDate ?? "")
const currentDayName = computed(() => attendance.value?.currentDayName ?? "")
const currentWitaTime = computed(() => liveWitaTime.value)
const currentWitaMinute = computed(() => currentWitaTime.value.slice(0, 5))
const selectedCourse = computed(() => schedules.value.find((item) => item.key === form.courseKey) ?? null)
const courseOptionLabel = (schedule: AttendancePayload["schedules"][number]) => {
  return `${schedule.label} | ${schedule.day}, ${schedule.startTime}-${schedule.endTime} | Kelas ${schedule.classGroup}`
}
const witaTimeFormatter = new Intl.DateTimeFormat("id-ID", {
  timeZone: "Asia/Makassar",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false
})

const updateLiveWitaTime = () => {
  liveWitaTime.value = witaTimeFormatter.format(new Date())
}

const resolvedBaseUrl = computed(() => API_URL)
const checkInUrl = computed(() => {
  if (!activeSession.value || !resolvedBaseUrl.value) {
    return ""
  }

  return buildApiUrl(`/check-in?token=${encodeURIComponent(activeSession.value.token)}`)
})
const qrImageUrl = computed(() => {
  if (!checkInUrl.value) {
    return ""
  }

  return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(checkInUrl.value)}`
})
const selectedCutoff = computed(() => selectedCourse.value?.cutoffTime ?? "--:--")
const selectedStartTime = computed(() => selectedCourse.value?.startTime ?? "--:--")
const autoStatus = computed<AttendanceStatus>(() => {
  if (!selectedCourse.value) {
    return "hadir"
  }

  return currentWitaMinute.value <= selectedCourse.value.cutoffTime ? "hadir" : "terlambat"
})

const statusClass = (status: AttendanceStatus) => {
  return status === "hadir" ? "tepat-waktu" : "terlambat"
}

const todaysRecords = computed(() => {
  if (!todayDate.value) {
    return []
  }

  return records.value.filter((record) => record.attendanceDate === todayDate.value)
})

const filteredRecords = computed(() => {
  return records.value.filter((record) => {
    const haystack = `${record.studentName} ${record.studentId}`.toLowerCase()
    const matchesQuery = !historyQuery.value || haystack.includes(historyQuery.value.toLowerCase())
    const matchesStatus = historyStatus.value === "semua" || record.status === historyStatus.value
    const matchesDate = !historyDate.value || record.attendanceDate === historyDate.value
    const matchesFaculty = historyFaculty.value === "semua" || record.faculty === historyFaculty.value
    const matchesCourse = historyCourse.value === "semua" || record.courseKey === historyCourse.value
    return matchesQuery && matchesStatus && matchesDate && matchesFaculty && matchesCourse
  })
})

const clearFilters = () => {
  historyQuery.value = ""
  historyStatus.value = "semua"
  historyDate.value = ""
  historyFaculty.value = "semua"
  historyCourse.value = "semua"
}

async function fetchDashboard() {
  try {
    return await apiFetch<AttendancePayload>("/api/dashboard", {
      timeout: REQUEST_TIMEOUT_MS
    })
  } catch (error) {
    if (!isNetworkFailure(error)) {
      throw error
    }

    console.error("[dashboard] Falling back to safe payload after network failure.", error)
    return createDashboardFallback()
  }
}

const loadAttendance = async () => {
  errorMessage.value = ""

  try {
    const session = await apiFetch<{ user: { username: string; name: string; role: string } | null }>("/api/auth/session", {
      timeout: REQUEST_TIMEOUT_MS
    })
    currentUser.value = session.user

    if (!session.user) {
      return
    }

    attendance.value = await fetchDashboard()

    if ((attendance.value as (AttendancePayload & { error?: boolean }) | null)?.error) {
      errorMessage.value = "Data dashboard sedang memakai fallback aman karena layanan backend atau database bermasalah."
    }

    if (!form.attendanceDate) {
      form.attendanceDate = attendance.value.todayDate
    }

    if (!form.faculty && attendance.value.faculties.length) {
      form.faculty = attendance.value.faculties[0]
    }

    if (!form.courseKey && attendance.value.schedules.length) {
      form.courseKey = attendance.value.activeSession?.courseKey
        || attendance.value.todaySchedules[0]?.key
        || attendance.value.schedules[0].key
    }
  } catch (error: any) {
    errorMessage.value = getApiErrorMessage(
      error,
      "Server presensi tidak bisa dijangkau. Pastikan aplikasi production sedang berjalan di server."
    )
  }
}

const resetForm = () => {
  form.id = 0
  form.studentName = ""
  form.studentId = ""
  form.faculty = faculties.value[0] || ""
  form.courseKey = activeSession.value?.courseKey || todaySchedules.value[0]?.key || schedules.value[0]?.key || ""
  form.attendanceDate = todayDate.value
  form.notes = ""
  isEditing.value = false
}

const activateSession = async (courseKey: string) => {
  errorMessage.value = ""
  successMessage.value = ""
  saving.value = true

  try {
    attendance.value = await apiFetch<AttendancePayload>("/api/attendance", {
      method: "POST",
      body: {
        action: "open-session",
        courseKey
      }
    })
    form.courseKey = courseKey
    form.attendanceDate = attendance.value.todayDate
    successMessage.value = "Sesi presensi kelas berhasil dibuka."
  } catch (error: any) {
    errorMessage.value = getApiErrorMessage(error, "Gagal membuka sesi presensi.")
  } finally {
    saving.value = false
  }
}

const closeSession = async () => {
  errorMessage.value = ""
  successMessage.value = ""
  saving.value = true

  try {
    attendance.value = await apiFetch<AttendancePayload>("/api/attendance", {
      method: "POST",
      body: {
        action: "close-session"
      }
    })
    successMessage.value = "Sesi presensi berhasil ditutup."
    resetForm()
  } catch (error: any) {
    errorMessage.value = getApiErrorMessage(error, "Gagal menutup sesi presensi.")
  } finally {
    saving.value = false
  }
}

const fillForm = (id: number) => {
  const record = records.value.find((item) => item.id === id)
  if (!record) {
    return
  }

  form.id = record.id
  form.studentName = record.studentName
  form.studentId = record.studentId
  form.faculty = record.faculty
  form.courseKey = record.courseKey
  form.attendanceDate = record.attendanceDate
  form.notes = record.notes
  isEditing.value = true
  errorMessage.value = ""
  successMessage.value = ""
}

const saveAttendance = async () => {
  errorMessage.value = ""
  successMessage.value = ""
  saving.value = true

  try {
    attendance.value = await apiFetch<AttendancePayload>("/api/attendance", {
      method: "POST",
      body: {
        ...form,
        courseKey: !isEditing.value && activeSession.value ? activeSession.value.courseKey : form.courseKey,
        action: isEditing.value ? "update" : "create"
      }
    })

    successMessage.value = isEditing.value
      ? "Data presensi mahasiswa berhasil diperbarui."
      : "Presensi mahasiswa berhasil disimpan."
    resetForm()
  } catch (error: any) {
    errorMessage.value = getApiErrorMessage(error, "Gagal menyimpan presensi mahasiswa.")
  } finally {
    saving.value = false
  }
}

const removeAttendance = async (id: number) => {
  errorMessage.value = ""
  successMessage.value = ""
  saving.value = true

  try {
    attendance.value = await apiFetch<AttendancePayload>("/api/attendance", {
      method: "POST",
      body: {
        id,
        action: "delete"
      }
    })

    if (form.id === id) {
      resetForm()
    }

    successMessage.value = "Data presensi mahasiswa berhasil dihapus."
  } catch (error: any) {
    errorMessage.value = getApiErrorMessage(error, "Gagal menghapus presensi mahasiswa.")
  } finally {
    saving.value = false
  }
}

const logout = async () => {
  saving.value = true

  try {
    await apiFetch("/api/auth/logout", {
      method: "POST"
    })
    const authCookie = useCookie<string | null>("presensi_auth")
    authCookie.value = null
    await navigateTo("/login")
  } finally {
    saving.value = false
  }
}

await loadAttendance()

if (attendance.value) {
  resetForm()
  liveWitaTime.value = attendance.value.currentWitaTime
}

if (import.meta.client) {
  updateLiveWitaTime()
}

onMounted(() => {
  updateLiveWitaTime()
  liveClockTimer = window.setInterval(updateLiveWitaTime, 1000)
})

onBeforeUnmount(() => {
  if (liveClockTimer) {
    clearInterval(liveClockTimer)
  }
})
</script>

<template>
  <main class="page-shell">
    <p v-if="errorMessage && !attendance" class="status-error">{{ errorMessage }}</p>
    <section class="hero-card">
      <div class="hero-copy-block">
        <p class="eyebrow">Student Attendance Dashboard</p>
        <h1>Presensi Mahasiswa Sistem Informasi</h1>
        <p class="hero-copy">
          Presensi mahasiswa: input singkat, status otomatis berdasarkan cutoff mata kuliah,
          dan ringkasan kelas yang langsung terbaca untuk admin akademik maupun dosen.
        </p>

        <div class="hero-focus-grid">
          <article class="hero-focus-card">
            <span class="story-label">Sesi Saat Ini</span>
            <strong>{{ activeSession ? activeSession.courseLabel : "Belum ada sesi aktif" }}</strong>
            <p>
              {{ activeSession
                ? `${activeSession.lecturer} - kelas ${activeSession.classGroup} - ${activeSession.attendanceDate}`
                : "Pilih salah satu jadwal hari ini untuk mulai membuka sesi presensi kelas." }}
            </p>
          </article>

          <article class="hero-focus-card hero-focus-time">
            <span class="story-label">Waktu Sistem</span>
            <strong>{{ currentWitaTime }}</strong>
            <p>{{ currentDayName || "Hari belum tersedia" }} - {{ timezoneLabel }}</p>
          </article>
        </div>

        <div class="hero-actions">
          <div class="hero-chip hero-chip-primary">{{ currentUser?.name || "Pengguna" }}</div>
          <div class="hero-chip">Zona waktu {{ timezoneLabel }}</div>
          <div class="hero-chip">Hari {{ currentDayName }}</div>
          <div class="hero-chip hero-chip-accent">Jam aktif {{ currentWitaTime }}</div>
          <div class="hero-chip">Postgres cloud</div>
        </div>
      </div>

      <div class="hero-stats">
        <article class="stat-card stat-emphasis">
          <span>Presensi Hari Ini</span>
          <strong>{{ summary?.todayTotal ?? 0 }}</strong>
          <small>Total mahasiswa yang sudah check-in pada tanggal perkuliahan aktif.</small>
        </article>
        <article class="stat-card stat-good">
          <span>Hadir</span>
          <strong>{{ summary?.hadirToday ?? 0 }}</strong>
        </article>
        <article class="stat-card stat-warn">
          <span>Terlambat</span>
          <strong>{{ summary?.lateToday ?? 0 }}</strong>
        </article>
        <article class="stat-card stat-neutral">
          <span>Fakultas Aktif</span>
          <strong>{{ summary?.activeFaculties ?? 0 }}</strong>
        </article>
      </div>
    </section>

    <section class="story-grid">
      <article class="story-card">
        <span class="story-label">Rekap Presensi</span>
        <strong>Lihat laporan dan ekspor data kelas</strong>
        <p>Buka halaman rekap untuk memfilter presensi per mata kuliah, per tanggal, lalu ekspor CSV atau cetak PDF.</p>
        <div class="story-actions">
          <NuxtLink to="/rekap" class="link-button button-primary">Buka Rekap</NuxtLink>
        </div>
      </article>
      <article class="story-card">
        <span class="story-label">Aturan Kelas</span>
        <strong>Status dihitung otomatis</strong>
        <p>Jam WITA dibandingkan langsung dengan batas presensi tiap mata kuliah.</p>
      </article>
      <article class="story-card">
        <span class="story-label">Logout</span>
        <strong>Keluar akun dengan cepat dan aman</strong>
        <p>Gunakan tombol logout di navigasi atas untuk menutup sesi admin setelah selesai mengelola presensi.</p>
        <div class="story-actions">
          <button class="button-danger" :disabled="saving" @click="logout">
            {{ saving ? "Keluar..." : "Logout" }}
          </button>
        </div>
      </article>
    </section>

    <section class="content-grid">
      <div class="stack">
        <section class="panel">
          <div class="section-heading">
            <div>
              <h2>Kontrol Sesi Kelas</h2>
              <p class="helper-text">Buka satu sesi aktif sebelum mahasiswa mulai presensi di kelas.</p>
            </div>
            <span class="pill">{{ todaySchedules.length }} kelas hari ini</span>
          </div>

          <div v-if="activeSession" class="session-banner">
            <div>
              <strong>Sesi Aktif: {{ activeSession.courseLabel }}</strong>
              <p class="helper-text">{{ activeSession.lecturer }} - kelas {{ activeSession.classGroup }} - tanggal {{ activeSession.attendanceDate }}</p>
            </div>
            <button class="button-danger" :disabled="saving" @click="closeSession">Tutup Sesi</button>
          </div>

          <div v-if="activeSession" class="session-qr">
            <div class="session-qr-media">
              <img :src="qrImageUrl" alt="QR Check-In">
            </div>
            <div class="session-qr-copy">
              <strong>QR / Link Check-In Mahasiswa</strong>
              <p class="helper-text">Posisikan QR ini di layar depan kelas atau bagikan link berikut agar mahasiswa bisa check-in mandiri dengan lebih cepat.</p>
              <a class="helper-link" :href="checkInUrl" target="_blank">{{ checkInUrl }}</a>
            </div>
          </div>

          <div v-else class="session-grid">
            <article v-for="schedule in todaySchedules" :key="`today-course-${schedule.key}`" class="session-card">
              <strong>{{ schedule.label }}</strong>
              <p class="helper-text">{{ schedule.day }}, {{ schedule.startTime }}-{{ schedule.endTime }} - {{ schedule.lecturer }}</p>
              <button class="button-primary" :disabled="saving" @click="activateSession(schedule.key)">Mulai Sesi</button>
            </article>
            <div v-if="!todaySchedules.length" class="empty-card">
              Tidak ada jadwal kuliah yang cocok untuk hari {{ currentDayName }}.
            </div>
          </div>
        </section>

        <section class="panel form-panel">
          <div class="section-heading">
            <div>
              <h2>Presensi Mahasiswa</h2>
              <p class="helper-text">
                {{ isEditing
                  ? "Perbarui data presensi mahasiswa yang dipilih lalu simpan kembali."
                  : "Isi data mahasiswa untuk input manual. Jika sesi kelas sedang aktif, mata kuliah akan otomatis mengikuti sesi tersebut." }}
              </p>
            </div>
            <span class="mode-badge" :class="isEditing ? 'editing' : 'active'">
              {{ isEditing ? "Mode Edit" : "Siap Input" }}
            </span>
          </div>

          <div class="insight-banner">
            <strong>{{ autoStatus === "hadir" ? "Status saat ini: hadir" : "Status saat ini: terlambat" }}</strong>
            <span>
              Kelas dimulai {{ selectedStartTime }}, batas presensi {{ selectedCutoff }}, dan jam sistem {{ currentWitaTime }}.
            </span>
          </div>

          <div class="quick-grid">
            <article class="quick-card">
              <span>Tanggal perkuliahan</span>
              <strong>{{ todayDate || "-" }}</strong>
            </article>
            <article class="quick-card">
              <span>Status otomatis</span>
              <strong :class="autoStatus === 'hadir' ? 'text-good' : 'text-warn'">{{ autoStatus }}</strong>
            </article>
            <article class="quick-card">
              <span>Ruang kelas</span>
              <strong>{{ selectedCourse?.location ?? "-" }}</strong>
            </article>
          </div>

          <div class="form-grid">
            <label class="field field-wide">
              <span>Nama Mahasiswa</span>
              <input v-model="form.studentName" type="text" placeholder="Contoh: Andi Saputra">
            </label>

            <label class="field">
              <span>NIM</span>
              <input v-model="form.studentId" type="text" placeholder="Contoh: 2310110001">
            </label>

            <label class="field">
              <span>Fakultas</span>
              <input v-model="form.faculty" type="text" readonly>
            </label>

            <label class="field">
              <span>Mata Kuliah</span>
              <select v-model="form.courseKey" :disabled="Boolean(activeSession) && !isEditing">
                <option v-for="schedule in schedules" :key="schedule.key" :value="schedule.key">
                  {{ courseOptionLabel(schedule) }}
                </option>
              </select>
              <small class="field-note">
                {{ selectedCourse
                  ? `${selectedCourse.lecturer} | ${selectedCourse.location} | ${selectedCourse.credits} SKS`
                  : "Pilih mata kuliah yang sesuai dengan jadwal kelas." }}
              </small>
            </label>

            <label class="field">
              <span>Tanggal</span>
              <input v-model="form.attendanceDate" type="date">
            </label>

            <label class="field field-wide">
              <span>Catatan</span>
              <input v-model="form.notes" type="text" placeholder="Contoh: hadir di sesi praktikum atau bergabung setelah pergantian kelas">
            </label>
          </div>

          <div class="action-row">
            <button class="button-primary" :disabled="saving" @click="saveAttendance">
              {{ saving ? "Menyimpan..." : isEditing ? "Simpan Perubahan" : "Simpan Presensi" }}
            </button>
            <button class="button-secondary" :disabled="saving" @click="resetForm">
              {{ isEditing ? "Batal Edit" : "Reset Form" }}
            </button>
          </div>

          <p v-if="successMessage" class="status-success">{{ successMessage }}</p>
          <p v-if="errorMessage" class="status-error">{{ errorMessage }}</p>
        </section>

        <section class="panel">
          <div class="section-heading">
            <div>
              <h2>Mata Kuliah</h2>
              <p class="helper-text">Distribusi presensi per mata kuliah pada tanggal perkuliahan aktif.</p>
            </div>
            <span class="pill">{{ courseInsights.length }} mata kuliah</span>
          </div>

          <div class="insight-grid">
            <article v-for="item in courseInsights" :key="item.key" class="insight-card">
              <div class="insight-head">
                <strong>{{ item.label }}</strong>
                <span>{{ item.credits }} SKS - Kelas {{ item.classGroup }}</span>
              </div>
              <p class="helper-text">{{ item.lecturer }} - {{ item.day }}, {{ item.startTime }}-{{ item.endTime }}</p>
              <div class="mini-metrics">
                <div>
                  <span>Total</span>
                  <strong>{{ item.total }}</strong>
                </div>
                <div>
                  <span>Hadir</span>
                  <strong>{{ item.hadir }}</strong>
                </div>
                <div>
                  <span>Terlambat</span>
                  <strong>{{ item.late }}</strong>
                </div>
              </div>
            </article>
          </div>
        </section>

        <section class="panel">
          <div class="section-heading">
            <div>
              <h2>Presensi Hari Ini</h2>
              <p class="helper-text">Catatan check-in mahasiswa terbaru untuk tanggal perkuliahan aktif.</p>
            </div>
            <span class="pill">{{ todaysRecords.length }} catatan</span>
          </div>

          <div class="presence-grid">
            <div v-if="!todaysRecords.length" class="empty-card">
              Belum ada presensi mahasiswa untuk hari ini.
            </div>
            <article v-for="record in todaysRecords" :key="`today-${record.id}`" class="presence-card">
              <div class="presence-header">
                <div>
                  <strong>{{ record.studentName }}</strong>
                  <p>{{ record.studentId || "Tanpa NIM" }} - {{ record.faculty }}</p>
                </div>
                <span class="tag" :class="statusClass(record.status)">{{ record.status }}</span>
              </div>
              <div class="presence-line">{{ record.courseLabel }} - {{ record.credits }} SKS - kelas {{ record.classGroup }}</div>
              <div class="timeline-row">
                <span>Check-in {{ record.checkInTime }} WITA</span>
                <span>{{ record.day }}, {{ record.attendanceDate }}</span>
              </div>
              <p class="helper-text">{{ record.notes || "Tanpa catatan tambahan." }}</p>
            </article>
          </div>
        </section>

        <section class="panel table-panel">
          <div class="section-heading">
            <div>
              <h2>Riwayat Presensi</h2>
              <p class="helper-text">Telusuri presensi berdasarkan nama, NIM, status, fakultas, mata kuliah, dan tanggal.</p>
            </div>
            <span class="pill">{{ filteredRecords.length }} hasil</span>
          </div>

          <div class="filter-toolbar">
            <div class="filter-summary">
              <div class="filter-summary-chip">Pencarian cepat</div>
              <div class="filter-summary-chip">Filter aktif {{ historyStatus === "semua" ? "semua status" : historyStatus }}</div>
              <div class="filter-summary-chip">Tanggal {{ historyDate || "semua" }}</div>
            </div>
          </div>

          <div class="filter-grid filter-grid-elevated">
            <label class="field">
              <span>Cari nama atau NIM</span>
              <input v-model="historyQuery" type="text" placeholder="Cari mahasiswa">
            </label>

            <label class="field">
              <span>Filter status</span>
              <select v-model="historyStatus">
                <option value="semua">Semua status</option>
                <option value="hadir">Hadir</option>
                <option value="terlambat">Terlambat</option>
              </select>
            </label>

            <label class="field">
              <span>Filter fakultas</span>
              <select v-model="historyFaculty">
                <option value="semua">Semua fakultas</option>
                <option v-for="faculty in faculties" :key="faculty" :value="faculty">
                  {{ faculty }}
                </option>
              </select>
            </label>

            <label class="field">
              <span>Filter mata kuliah</span>
              <select v-model="historyCourse">
                <option value="semua">Semua mata kuliah</option>
                <option v-for="schedule in schedules" :key="schedule.key" :value="schedule.key">
                  {{ schedule.label }}
                </option>
              </select>
            </label>

            <label class="field">
              <span>Filter tanggal</span>
              <input v-model="historyDate" type="date">
            </label>

            <div class="filter-actions">
              <button class="button-secondary" @click="clearFilters">Bersihkan Filter</button>
            </div>
          </div>

          <div class="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Nama</th>
                  <th>NIM</th>
                  <th>Fakultas</th>
                  <th>Mata Kuliah</th>
                  <th>Jadwal</th>
                  <th>Tanggal</th>
                  <th>Check-in</th>
                  <th>Status</th>
                  <th>Catatan</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="!filteredRecords.length">
                  <td colspan="10" class="empty-state">Belum ada data yang cocok dengan filter.</td>
                </tr>
                <tr v-for="record in filteredRecords" :key="record.id">
                  <td>
                    <div class="table-primary-cell">
                      <strong>{{ record.studentName }}</strong>
                    </div>
                  </td>
                  <td>
                    <span class="table-inline-badge">{{ record.studentId || "Tanpa NIM" }}</span>
                  </td>
                  <td>{{ record.faculty }}</td>
                  <td>
                    <div class="table-primary-cell">
                      <strong>{{ record.courseLabel }}</strong>
                      <small>{{ record.credits }} SKS - kelas {{ record.classGroup }}</small>
                    </div>
                  </td>
                  <td>
                    <div class="table-primary-cell">
                      <strong>{{ record.day }}</strong>
                      <small>{{ record.startTime }}-{{ record.endTime }}</small>
                    </div>
                  </td>
                  <td>{{ record.attendanceDate }}</td>
                  <td>
                    <span class="table-inline-badge table-inline-badge-time">{{ record.checkInTime }} WITA</span>
                  </td>
                  <td><span class="tag" :class="statusClass(record.status)">{{ record.status }}</span></td>
                  <td>{{ record.notes || "-" }}</td>
                  <td>
                    <div class="table-actions">
                      <button class="button-secondary action-button" :disabled="saving" @click="fillForm(record.id)">Edit</button>
                      <button class="button-danger action-button" :disabled="saving" @click="removeAttendance(record.id)">Hapus</button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <div class="stack">
        <section class="panel side-panel">
          <h2>Ringkasan Sistem</h2>
          <div class="metric-list">
            <div class="metric-row">
              <span>Total catatan</span>
              <strong>{{ summary?.total ?? 0 }}</strong>
            </div>
            <div class="metric-row">
              <span>Total hadir</span>
              <strong>{{ summary?.hadir ?? 0 }}</strong>
            </div>
            <div class="metric-row">
              <span>Total terlambat</span>
              <strong>{{ summary?.terlambat ?? 0 }}</strong>
            </div>
            <div class="metric-row">
              <span>Mahasiswa unik</span>
              <strong>{{ summary?.uniqueStudents ?? 0 }}</strong>
            </div>
            <div class="metric-row">
              <span>Tanggal terbaru</span>
              <strong>{{ summary?.latestDate ?? "-" }}</strong>
            </div>
          </div>
        </section>

        <section class="panel side-panel">
          <h2>Alur Penggunaan</h2>
          <div class="legend-list">
            <div class="legend-row"><span class="legend-index">1</span><span>Pilih jadwal kuliah hari ini lalu buka sesi presensi yang sedang berlangsung.</span></div>
            <div class="legend-row"><span class="legend-index">2</span><span>Tampilkan QR atau bagikan link check-in agar mahasiswa bisa mengisi presensi sendiri.</span></div>
            <div class="legend-row"><span class="legend-index">3</span><span>Gunakan form input manual jika ada mahasiswa yang perlu dibantu dicatat oleh operator.</span></div>
            <div class="legend-row"><span class="legend-index">4</span><span>Tutup sesi setelah kelas selesai agar link check-in tidak lagi dipakai di luar jadwal.</span></div>
          </div>
        </section>

        <section class="panel side-panel">
          <h2>Fokus Rilis Saat Ini</h2>
          <div class="scope-list">
            <div class="scope-row">Pembukaan sesi presensi per kelas dengan status aktif yang jelas</div>
            <div class="scope-row">Check-in mahasiswa lewat QR atau link yang mudah dibagikan</div>
            <div class="scope-row">Input manual operator untuk koreksi atau cadangan saat dibutuhkan</div>
            <div class="scope-row">Rekap dan riwayat presensi yang siap dipantau dan diekspor</div>
          </div>
        </section>
      </div>
    </section>
  </main>
</template>
