<script setup lang="ts">
const route = useRoute()
const token = computed(() => String(route.query.token || ""))
const loading = ref(true)
const saving = ref(false)
const errorMessage = ref("")
const successMessage = ref("")
const sessionData = ref<{ session: any; faculties: string[] } | null>(null)
const REQUEST_TIMEOUT_MS = 8000

const form = reactive({
  studentName: "",
  studentId: "",
  faculty: "",
  notes: ""
})

const fixedFaculty = "Ilmu Pendidikan Kristen"

const loadSession = async () => {
  loading.value = true
  errorMessage.value = ""

  try {
    sessionData.value = await $fetch("/api/checkin", {
      timeout: REQUEST_TIMEOUT_MS,
      query: {
        token: token.value
      }
    })
    form.faculty = fixedFaculty
  } catch (error: any) {
    errorMessage.value = error?.data?.statusMessage || "Sesi check-in tidak tersedia."
  } finally {
    loading.value = false
  }
}

const submitCheckIn = async () => {
  saving.value = true
  errorMessage.value = ""
  successMessage.value = ""

  try {
    await $fetch("/api/checkin", {
      method: "POST",
      body: {
        token: token.value,
        ...form
      }
    })
    successMessage.value = "Check-in berhasil dicatat."
    form.studentName = ""
    form.studentId = ""
    form.faculty = fixedFaculty
    form.notes = ""
  } catch (error: any) {
    errorMessage.value = error?.data?.statusMessage || "Check-in gagal."
  } finally {
    saving.value = false
  }
}

await loadSession()
</script>

<template>
  <main class="login-shell">
    <section class="login-card">
      <p class="eyebrow">Student Check-In</p>
      <h1>Presensi Mahasiswa</h1>
      <p v-if="sessionData" class="helper-text">
        {{ sessionData.session.courseLabel }} - {{ sessionData.session.lecturer }} - kelas {{ sessionData.session.classGroup }}
      </p>

      <p v-if="loading" class="helper-text">Memuat sesi check-in...</p>
      <p v-if="errorMessage" class="status-error">{{ errorMessage }}</p>

      <template v-if="sessionData && !loading">
        <div class="form-grid">
          <label class="field field-wide">
            <span>Nama Mahasiswa</span>
            <input v-model="form.studentName" type="text">
          </label>
          <label class="field">
            <span>NIM</span>
            <input v-model="form.studentId" type="text">
          </label>
          <label class="field">
            <span>Fakultas</span>
            <input v-model="form.faculty" type="text" readonly>
          </label>
          <label class="field field-wide">
            <span>Catatan</span>
            <input v-model="form.notes" type="text">
          </label>
        </div>

        <div class="action-row">
          <button class="button-primary" :disabled="saving" @click="submitCheckIn">
            {{ saving ? "Mengirim..." : "Check-In" }}
          </button>
        </div>

        <p v-if="successMessage" class="status-success">{{ successMessage }}</p>
      </template>
    </section>
  </main>
</template>
