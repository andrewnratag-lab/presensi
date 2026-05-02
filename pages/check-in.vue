<script setup lang="ts">
interface MataKuliahItem {
  id: number
  nama: string
  sks: number
  kelas: string
  dosen: string
  jadwal: string
}

const route = useRoute()
const token = computed(() => String(route.query.token || ""))
const loading = ref(true)
const saving = ref(false)
const errorMessage = ref("")
const successMessage = ref("")
const sessionData = ref<{ session: any; faculties: string[] } | null>(null)
const mataKuliah = ref<MataKuliahItem[]>([])
const REQUEST_TIMEOUT_MS = 8000

const form = reactive({
  studentName: "",
  studentId: "",
  faculty: "",
  courseKey: "",
  notes: ""
})

const fixedFaculty = "Ilmu Pendidikan Kristen"

const syncSelectedCourse = () => {
  if (!mataKuliah.value.length) {
    form.courseKey = ""
    return
  }

  const sessionCourseLabel = String(sessionData.value?.session?.courseLabel || "").trim().toLowerCase()
  const matchedCourse = mataKuliah.value.find((item) => item.nama.toLowerCase() === sessionCourseLabel)

  form.courseKey = matchedCourse?.nama || mataKuliah.value[0].nama
}

const loadSession = async () => {
  loading.value = true
  errorMessage.value = ""

  try {
    const [sessionResponse, mataKuliahResponse] = await Promise.all([
      $fetch("/api/checkin", {
        timeout: REQUEST_TIMEOUT_MS,
        query: {
          token: token.value
        }
      }),
      $fetch<MataKuliahItem[]>("/api/matkul", {
        timeout: REQUEST_TIMEOUT_MS
      })
    ])

    sessionData.value = sessionResponse
    mataKuliah.value = mataKuliahResponse
    form.faculty = fixedFaculty
    syncSelectedCourse()
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
    syncSelectedCourse()
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
          <label class="field">
            <span>Mata Kuliah</span>
            <select v-model="form.courseKey">
              <option v-for="mk in mataKuliah" :key="mk.id" :value="mk.nama">
                {{ mk.nama }} - {{ mk.dosen }}
              </option>
            </select>
          </label>
          <label class="field field-wide">
            <span>Catatan</span>
            <input v-model="form.notes" type="text">
          </label>
        </div>

        <p class="helper-text">
          Daftar mata kuliah diambil dari data statis agar tetap berjalan di Vercel. Sesi check-in aktif tetap menentukan mata kuliah presensi yang disimpan.
        </p>

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
