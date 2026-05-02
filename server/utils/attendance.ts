import { createError } from "h3"
import { randomBytes } from "node:crypto"
import type { AttendancePayload, AttendanceStatus, CourseInsight, CourseSchedule, SessionInfo } from "~/types/attendance"
import { query } from "./db"

const VALID_STATUSES: AttendanceStatus[] = ["hadir", "terlambat"]
const WITA_TIMEZONE = "Asia/Makassar"
const DAY_ORDER = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"]
const DAY_NAME_MAP: Record<string, string> = {
  Sun: "Minggu",
  Mon: "Senin",
  Tue: "Selasa",
  Wed: "Rabu",
  Thu: "Kamis",
  Fri: "Jumat",
  Sat: "Sabtu"
}

export const FACULTIES = [
  "Ilmu Pendidikan Kristen"
]

export const COURSE_SCHEDULES: CourseSchedule[] = [
  { key: "sistem-operasi", label: "Sistem Operasi", credits: 3, day: "Kamis", startTime: "13:00", endTime: "15:30", cutoffTime: "13:15", location: "Ruang Kelas A", lecturer: "Indah Yessi Kairupan", classGroup: "A" },
  { key: "pemrograman-web", label: "Pemrograman Web", credits: 2, day: "Senin", startTime: "09:00", endTime: "10:30", cutoffTime: "09:15", location: "Lab Web", lecturer: "Ir. ROLTY GLENDY WOWILING M.T", classGroup: "A" },
  { key: "praktikum-pemrograman-web", label: "Praktikum Pemprograman Web", credits: 2, day: "Senin", startTime: "10:31", endTime: "11:30", cutoffTime: "10:46", location: "Lab Web", lecturer: "Ir. ROLTY GLENDY WOWILING M.T", classGroup: "A" },
  { key: "sistem-informasi-manajemen", label: "Sistem Informasi Manajemen", credits: 3, day: "Rabu", startTime: "08:00", endTime: "10:45", cutoffTime: "08:15", location: "Ruang Kelas A", lecturer: "Indah Yessi Kairupan", classGroup: "A" },
  { key: "bahasa-inggris-2", label: "Bahasa Inggris 2 (Business English)", credits: 3, day: "Senin", startTime: "13:00", endTime: "15:30", cutoffTime: "13:15", location: "Ruang Bahasa", lecturer: "FIENNY MARIA LANGI M.Hum", classGroup: "A" },
  { key: "konsep-basis-data", label: "Konsep Basis Data", credits: 3, day: "Rabu", startTime: "13:00", endTime: "15:45", cutoffTime: "13:15", location: "Lab Basis Data", lecturer: "Indah Yessi Kairupan", classGroup: "A" },
  { key: "rekayasa-perangkat-lunak", label: "Rekayasa Perangkat Lunak", credits: 3, day: "Kamis", startTime: "08:00", endTime: "10:30", cutoffTime: "08:15", location: "Ruang Kelas A", lecturer: "Indah Yessi Kairupan", classGroup: "A" },
  { key: "pemrograman-aplikasi-mobile", label: "Pemprograman Aplikasi Mobile", credits: 2, day: "Selasa", startTime: "09:30", endTime: "10:30", cutoffTime: "09:45", location: "Lab Mobile", lecturer: "Ir. ROLTY GLENDY WOWILING M.T", classGroup: "A" },
  { key: "praktikum-pemrograman-aplikasi-mobile", label: "Praktikum Pemprograman Aplikasi Mobile", credits: 2, day: "Selasa", startTime: "10:31", endTime: "12:00", cutoffTime: "10:46", location: "Lab Mobile", lecturer: "Ir. ROLTY GLENDY WOWILING M.T", classGroup: "A" }
]

const nowIso = () => new Date().toISOString()

const getWitaParts = () => {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: WITA_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  })

  const parts = Object.fromEntries(
    formatter
      .formatToParts(new Date())
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value])
  ) as Record<string, string>

  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    time: `${parts.hour}:${parts.minute}`,
    dayName: DAY_NAME_MAP[new Intl.DateTimeFormat("en-US", { timeZone: WITA_TIMEZONE, weekday: "short" }).format(new Date())] || "Minggu"
  }
}

const getCurrentDayName = () => {
  return getWitaParts().dayName
}

const deriveStatus = (time: string, cutoffTime: string): AttendanceStatus => {
  return time <= cutoffTime ? "hadir" : "terlambat"
}

const normalizeStatus = (value: string): AttendanceStatus => {
  if (value === "hadir" || value === "tepat waktu") {
    return "hadir"
  }

  return "terlambat"
}

const getSchedule = (courseKey: string) => {
  return COURSE_SCHEDULES.find((item) => item.key === courseKey)
}

const createSessionToken = () => randomBytes(12).toString("hex")

const toSession = (row: Record<string, any>): SessionInfo => ({
  id: row.id,
  courseKey: row.course_key,
  courseLabel: row.course_label,
  lecturer: row.lecturer,
  classGroup: row.class_group,
  token: row.session_token,
  attendanceDate: row.attendance_date,
  startedAt: row.started_at,
  closedAt: row.closed_at,
  status: row.status === "closed" ? "closed" : "open"
})

const toRecord = (row: Record<string, any>) => {
  const schedule = getSchedule(row.course_key)

  return {
    id: row.id,
    studentName: row.employee_name,
    studentId: row.employee_id,
    faculty: row.department,
    courseKey: row.course_key,
    courseLabel: row.course_label,
    credits: schedule?.credits || 0,
    day: schedule?.day || "-",
    startTime: schedule?.startTime || "08:00",
    endTime: schedule?.endTime || "09:00",
    cutoffTime: row.cutoff_time,
    lecturer: schedule?.lecturer || "Belum diatur",
    classGroup: schedule?.classGroup || "-",
    room: schedule?.location || "Ruang belum diatur",
    attendanceDate: row.attendance_date,
    checkInTime: row.check_in_time,
    status: normalizeStatus(row.status),
    notes: row.notes,
    createdAt: row.created_at
  }
}

const getUniqueStudentKey = (record: { studentId?: string; studentName: string }) => {
  return record.studentId?.trim() ? record.studentId.trim().toLowerCase() : record.studentName.trim().toLowerCase()
}

const getCourseInsights = (records: ReturnType<typeof toRecord>[]): CourseInsight[] => {
  return COURSE_SCHEDULES.map((schedule) => {
    const matched = records.filter((record) => record.courseKey === schedule.key)

    return {
      key: schedule.key,
      label: schedule.label,
      credits: schedule.credits,
      day: schedule.day,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      cutoffTime: schedule.cutoffTime,
      location: schedule.location,
      lecturer: schedule.lecturer,
      classGroup: schedule.classGroup,
      total: matched.length,
      hadir: matched.filter((record) => record.status === "hadir").length,
      late: matched.filter((record) => record.status === "terlambat").length
    }
  })
}

export const getAttendancePayload = async (): Promise<AttendancePayload> => {
  const rowsResult = await query(`
    SELECT id, employee_name, employee_id, department, course_key, course_label, cutoff_time, attendance_date, check_in_time, status, notes, created_at
    FROM attendance_records
    ORDER BY attendance_date DESC, check_in_time DESC, id DESC
  `)
  const rows = rowsResult.rows as Array<Record<string, any>>

  const records = rows.map(toRecord)
  const uniqueStudents = new Set(records.map(getUniqueStudentKey))
  const uniqueFaculties = new Set(records.map((record) => record.faculty))
  const { date, time } = getWitaParts()
  const currentDayName = getCurrentDayName()
  const todayRecords = records.filter((record) => record.attendanceDate === date)
  const todaySchedules = COURSE_SCHEDULES.filter((schedule) => schedule.day === currentDayName)
  const activeSessionResult = await query(`
    SELECT id, course_key, course_label, attendance_date, lecturer, class_group, session_token, started_at, closed_at, status
    FROM attendance_sessions
    WHERE status = 'open'
    ORDER BY id DESC
    LIMIT 1
  `)
  const activeSessionRow = activeSessionResult.rows[0] as Record<string, any> | undefined

  return {
    records,
    schedules: COURSE_SCHEDULES,
    faculties: FACULTIES,
    todayDate: date,
    currentDayName,
    timezone: "WITA (UTC+08:00)",
    currentWitaTime: time,
    courseInsights: getCourseInsights(todayRecords),
    todaySchedules,
    activeSession: activeSessionRow ? toSession(activeSessionRow) : null,
    summary: {
      total: records.length,
      hadir: records.filter((record) => record.status === "hadir").length,
      terlambat: records.filter((record) => record.status === "terlambat").length,
      uniqueStudents: uniqueStudents.size,
      activeFaculties: uniqueFaculties.size,
      latestDate: records[0]?.attendanceDate || "-",
      todayTotal: todayRecords.length,
      hadirToday: todayRecords.filter((record) => record.status === "hadir").length,
      lateToday: todayRecords.filter((record) => record.status === "terlambat").length
    }
  }
}

export const openAttendanceSession = async (body: { courseKey?: string }) => {
  const courseKey = body.courseKey?.trim() || ""
  const schedule = getSchedule(courseKey)

  if (!schedule) {
    throw createError({
      statusCode: 400,
      statusMessage: "Mata kuliah sesi tidak valid."
    })
  }

  const currentOpenResult = await query("SELECT id FROM attendance_sessions WHERE status = 'open' LIMIT 1")
  const currentOpen = currentOpenResult.rows[0] as { id?: number } | undefined

  if (currentOpen?.id) {
    throw createError({
      statusCode: 409,
      statusMessage: "Masih ada sesi presensi yang aktif. Tutup sesi tersebut terlebih dahulu."
    })
  }

  const { date } = getWitaParts()

  await query(`
    INSERT INTO attendance_sessions (
      course_key,
      course_label,
      attendance_date,
      lecturer,
      class_group,
      session_token,
      started_at,
      closed_at,
      status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
  `, [schedule.key, schedule.label, date, schedule.lecturer, schedule.classGroup, createSessionToken(), nowIso(), null, "open"])

  return await getAttendancePayload()
}

export const getCheckInSessionByToken = async (token: string) => {
  const result = await query(`
    SELECT id, course_key, course_label, attendance_date, lecturer, class_group, session_token, started_at, closed_at, status
    FROM attendance_sessions
    WHERE session_token = $1
      AND status = 'open'
    LIMIT 1
  `, [token])
  const row = result.rows[0] as Record<string, any> | undefined

  if (!row) {
    throw createError({
      statusCode: 404,
      statusMessage: "Sesi check-in tidak ditemukan atau sudah ditutup."
    })
  }

  return toSession(row)
}

export const closeAttendanceSession = async () => {
  const currentOpenResult = await query("SELECT id FROM attendance_sessions WHERE status = 'open' ORDER BY id DESC LIMIT 1")
  const currentOpen = currentOpenResult.rows[0] as { id?: number } | undefined

  if (!currentOpen?.id) {
    throw createError({
      statusCode: 404,
      statusMessage: "Tidak ada sesi presensi aktif untuk ditutup."
    })
  }

  await query(`
    UPDATE attendance_sessions
    SET status = 'closed',
        closed_at = $1
    WHERE id = $2
  `, [nowIso(), currentOpen.id])

  return await getAttendancePayload()
}

export const createAttendanceRecord = async (body: {
  studentName?: string
  studentId?: string
  faculty?: string
  courseKey?: string
  attendanceDate?: string
  notes?: string
}) => {
  const studentName = body.studentName?.trim() || ""
  const studentId = body.studentId?.trim() || ""
  const faculty = body.faculty?.trim() || ""
  const courseKey = body.courseKey?.trim() || ""
  const attendanceDate = body.attendanceDate?.trim() || ""
  const notes = body.notes?.trim() || ""
  const schedule = getSchedule(courseKey)
  const { time } = getWitaParts()

  if (!studentName || !faculty || !attendanceDate || !schedule) {
    throw createError({
      statusCode: 400,
      statusMessage: "Nama mahasiswa, fakultas, tanggal, dan mata kuliah wajib diisi."
    })
  }

  const status = deriveStatus(time, schedule.cutoffTime)

  if (!VALID_STATUSES.includes(status)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Status presensi tidak valid."
    })
  }

  const existingResult = studentId
    ? await query(`
      SELECT id
      FROM attendance_records
      WHERE lower(employee_id) = lower($1)
        AND attendance_date = $2
        AND course_key = $3
      LIMIT 1
    `, [studentId, attendanceDate, courseKey])
    : await query(`
      SELECT id
      FROM attendance_records
      WHERE lower(employee_name) = lower($1)
        AND attendance_date = $2
        AND course_key = $3
      LIMIT 1
    `, [studentName, attendanceDate, courseKey])
  const existing = existingResult.rows[0] as { id?: number } | undefined

  if (existing?.id) {
    throw createError({
      statusCode: 409,
      statusMessage: "Mahasiswa ini sudah memiliki presensi untuk mata kuliah tersebut pada tanggal yang sama."
    })
  }

  await query(`
    INSERT INTO attendance_records (
      employee_name,
      employee_id,
      department,
      course_key,
      course_label,
      cutoff_time,
      attendance_date,
      check_in_time,
      status,
      notes,
      created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
  `, [studentName, studentId, faculty, schedule.key, schedule.label, schedule.cutoffTime, attendanceDate, time, status, notes, nowIso()])

  return await getAttendancePayload()
}

export const updateAttendanceRecord = async (body: {
  id?: number
  studentName?: string
  studentId?: string
  faculty?: string
  courseKey?: string
  attendanceDate?: string
  notes?: string
}) => {
  const id = Number(body.id)
  const studentName = body.studentName?.trim() || ""
  const studentId = body.studentId?.trim() || ""
  const faculty = body.faculty?.trim() || ""
  const courseKey = body.courseKey?.trim() || ""
  const attendanceDate = body.attendanceDate?.trim() || ""
  const notes = body.notes?.trim() || ""
  const schedule = getSchedule(courseKey)

  if (!Number.isInteger(id) || id <= 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "ID presensi tidak valid."
    })
  }

  if (!studentName || !faculty || !attendanceDate || !schedule) {
    throw createError({
      statusCode: 400,
      statusMessage: "Nama mahasiswa, fakultas, tanggal, dan mata kuliah wajib diisi."
    })
  }

  const currentResult = await query(`
    SELECT id, check_in_time
    FROM attendance_records
    WHERE id = $1
  `, [id])
  const current = currentResult.rows[0] as { id?: number; check_in_time?: string } | undefined

  if (!current?.id) {
    throw createError({
      statusCode: 404,
      statusMessage: "Data presensi tidak ditemukan."
    })
  }

  const duplicateResult = studentId
    ? await query(`
      SELECT id
      FROM attendance_records
      WHERE lower(employee_id) = lower($1)
        AND attendance_date = $2
        AND course_key = $3
        AND id <> $4
      LIMIT 1
    `, [studentId, attendanceDate, courseKey, id])
    : await query(`
      SELECT id
      FROM attendance_records
      WHERE lower(employee_name) = lower($1)
        AND attendance_date = $2
        AND course_key = $3
        AND id <> $4
      LIMIT 1
    `, [studentName, attendanceDate, courseKey, id])
  const duplicate = duplicateResult.rows[0] as { id?: number } | undefined

  if (duplicate?.id) {
    throw createError({
      statusCode: 409,
      statusMessage: "Sudah ada presensi lain untuk mahasiswa ini pada mata kuliah dan tanggal tersebut."
    })
  }

  const checkInTime = current.check_in_time || schedule.cutoffTime
  const status = deriveStatus(checkInTime, schedule.cutoffTime)

  await query(`
    UPDATE attendance_records
    SET employee_name = $1,
        employee_id = $2,
        department = $3,
        course_key = $4,
        course_label = $5,
        cutoff_time = $6,
        attendance_date = $7,
        status = $8,
        notes = $9
    WHERE id = $10
  `, [studentName, studentId, faculty, schedule.key, schedule.label, schedule.cutoffTime, attendanceDate, status, notes, id])

  return await getAttendancePayload()
}

export const deleteAttendanceRecord = async (body: { id?: number }) => {
  const id = Number(body.id)

  if (!Number.isInteger(id) || id <= 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "ID presensi tidak valid."
    })
  }

  const currentResult = await query("SELECT id FROM attendance_records WHERE id = $1", [id])
  const current = currentResult.rows[0] as { id?: number } | undefined

  if (!current?.id) {
    throw createError({
      statusCode: 404,
      statusMessage: "Data presensi tidak ditemukan."
    })
  }

  await query("DELETE FROM attendance_records WHERE id = $1", [id])

  return await getAttendancePayload()
}
