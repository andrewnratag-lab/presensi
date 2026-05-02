import { getQuery, setHeader } from "h3"
import { getAttendancePayload } from "../../utils/attendance"
import { withApiHandler } from "../../utils/api"
import { requireUser } from "../../utils/auth"

const toCsvCell = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`

export default withApiHandler(async (event) => {
  requireUser(event)
  const query = getQuery(event)
  const courseKey = String(query.courseKey || "")
  const attendanceDate = String(query.attendanceDate || "")
  const payload = await getAttendancePayload()

  const filtered = payload.records.filter((record) => {
    const matchesCourse = !courseKey || record.courseKey === courseKey
    const matchesDate = !attendanceDate || record.attendanceDate === attendanceDate
    return matchesCourse && matchesDate
  })

  const rows = [
    ["Nama", "NIM", "Fakultas", "Mata Kuliah", "SKS", "Kelas", "Dosen", "Jadwal", "Tanggal", "Check-in", "Status", "Catatan"],
    ...filtered.map((record) => [
      record.studentName,
      record.studentId,
      record.faculty,
      record.courseLabel,
      record.credits,
      record.classGroup,
      record.lecturer,
      `${record.day}, ${record.startTime}-${record.endTime}`,
      record.attendanceDate,
      record.checkInTime,
      record.status,
      record.notes
    ])
  ]

  setHeader(event, "Content-Type", "text/csv; charset=utf-8")
  setHeader(event, "Content-Disposition", `attachment; filename="rekap-presensi-${attendanceDate || "semua"}.csv"`)

  return `\uFEFF${rows.map((row) => row.map(toCsvCell).join(",")).join("\n")}`
}, {
  route: "export.attendance.csv.get"
})
