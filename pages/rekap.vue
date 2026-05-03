<script setup lang="ts">
import { apiFetch, buildApiUrl } from "~/composables/useBackendApi"

definePageMeta({
  middleware: "auth",
  layout: "admin"
})

const report = ref<{ records: any[]; schedules: any[]; filters: { courseKey: string; attendanceDate: string } } | null>(null)
const loading = ref(false)
const filters = reactive({
  courseKey: "",
  attendanceDate: ""
})

const loadReport = async () => {
  loading.value = true

  try {
    report.value = await apiFetch("/api/report", {
      query: {
        courseKey: filters.courseKey,
        attendanceDate: filters.attendanceDate
      }
    })
  } finally {
    loading.value = false
  }
}

const exportCsv = () => {
  const query = new URLSearchParams({
    courseKey: filters.courseKey,
    attendanceDate: filters.attendanceDate
  })
  window.location.href = buildApiUrl(`/api/export/attendance.csv?${query.toString()}`)
}

const printPdf = () => {
  const query = new URLSearchParams({
    courseKey: filters.courseKey,
    attendanceDate: filters.attendanceDate
  })
  window.open(`/cetak?${query.toString()}`, "_blank")
}

await loadReport()
</script>

<template>
  <main class="page-shell">
    <section class="panel">
      <div class="section-heading">
        <div>
          <h1>Rekap Presensi Mata Kuliah</h1>
          <p class="helper-text">Filter rekap lalu ekspor ke Excel atau cetak ke PDF.</p>
        </div>
        <div class="hero-actions recap-actions">
          <button class="button-primary" @click="exportCsv">Export Excel (CSV)</button>
          <button class="button-secondary" @click="printPdf">Cetak PDF</button>
        </div>
      </div>

      <div class="filter-grid">
        <label class="field">
          <span>Mata Kuliah</span>
          <select v-model="filters.courseKey">
            <option value="">Semua mata kuliah</option>
            <option v-for="schedule in report?.schedules || []" :key="schedule.key" :value="schedule.key">
              {{ schedule.label }}
            </option>
          </select>
        </label>

        <label class="field">
          <span>Tanggal</span>
          <input v-model="filters.attendanceDate" type="date">
        </label>

        <div class="filter-actions">
          <button class="button-primary" :disabled="loading" @click="loadReport">{{ loading ? "Memuat..." : "Terapkan Filter" }}</button>
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
              <th>Dosen</th>
              <th>Tanggal</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!(report?.records?.length)">
              <td colspan="7" class="empty-state">Belum ada data rekap untuk filter ini.</td>
            </tr>
            <tr v-for="record in report?.records || []" :key="record.id">
              <td>{{ record.studentName }}</td>
              <td>{{ record.studentId }}</td>
              <td>{{ record.faculty }}</td>
              <td>{{ record.courseLabel }}</td>
              <td>{{ record.lecturer }}</td>
              <td>{{ record.attendanceDate }}</td>
              <td><span class="tag" :class="record.status === 'hadir' ? 'tepat-waktu' : 'terlambat'">{{ record.status }}</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </main>
</template>
