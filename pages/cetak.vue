<script setup lang="ts">
definePageMeta({
  middleware: "auth"
})

const route = useRoute()
const report = await $fetch("/api/report", {
  query: {
    courseKey: String(route.query.courseKey || ""),
    attendanceDate: String(route.query.attendanceDate || "")
  }
})

onMounted(() => {
  window.print()
})
</script>

<template>
  <main class="page-shell print-shell">
    <section class="panel">
      <h1>Rekap Presensi Cetak</h1>
      <p class="helper-text">Halaman ini bisa langsung disimpan sebagai PDF dari dialog print browser.</p>
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
              <th>Check-in</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="record in report.records" :key="record.id">
              <td>{{ record.studentName }}</td>
              <td>{{ record.studentId }}</td>
              <td>{{ record.faculty }}</td>
              <td>{{ record.courseLabel }}</td>
              <td>{{ record.lecturer }}</td>
              <td>{{ record.attendanceDate }}</td>
              <td>{{ record.checkInTime }}</td>
              <td>{{ record.status }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </main>
</template>
