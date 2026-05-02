import { withApiHandler } from "../utils/api"

const STATIC_MATA_KULIAH = [
  {
    id: 1,
    nama: "Sistem Operasi",
    sks: 3,
    kelas: "A",
    dosen: "Indah Yessi Kairupan",
    jadwal: "Kamis, 13:00 - 15:30"
  },
  {
    id: 2,
    nama: "Pemrograman Web",
    sks: 2,
    kelas: "A",
    dosen: "Ir. ROLTY GLENDY WOWILING M.T",
    jadwal: "Senin, 09:00 - 10:30"
  },
  {
    id: 3,
    nama: "Praktikum Pemrograman Web",
    sks: 2,
    kelas: "A",
    dosen: "Ir. ROLTY GLENDY WOWILING M.T",
    jadwal: "Senin, 10:31 - 11:30"
  },
  {
    id: 4,
    nama: "Sistem Informasi Manajemen",
    sks: 3,
    kelas: "A",
    dosen: "Indah Yessi Kairupan",
    jadwal: "Rabu, 08:00 - 10:45"
  },
  {
    id: 5,
    nama: "Bahasa Inggris 2 (Business English)",
    sks: 3,
    kelas: "A",
    dosen: "FIENNY MARIA LANGI M.Hum",
    jadwal: "Senin, 13:00 - 15:30"
  },
  {
    id: 6,
    nama: "Konsep Basis Data",
    sks: 3,
    kelas: "A",
    dosen: "Indah Yessi Kairupan",
    jadwal: "Rabu, 13:00 - 15:45"
  },
  {
    id: 7,
    nama: "Rekayasa Perangkat Lunak",
    sks: 3,
    kelas: "A",
    dosen: "Indah Yessi Kairupan",
    jadwal: "Kamis, 08:00 - 10:30"
  },
  {
    id: 8,
    nama: "Pemrograman Aplikasi Mobile",
    sks: 2,
    kelas: "A",
    dosen: "Ir. ROLTY GLENDY WOWILING M.T",
    jadwal: "Selasa, 09:30 - 10:30"
  },
  {
    id: 9,
    nama: "Praktikum Pemrograman Aplikasi Mobile",
    sks: 2,
    kelas: "A",
    dosen: "Ir. ROLTY GLENDY WOWILING M.T",
    jadwal: "Selasa, 10:31 - 12:00"
  }
]

export default withApiHandler(() => {
  return STATIC_MATA_KULIAH
}, {
  route: "matkul.get"
})
