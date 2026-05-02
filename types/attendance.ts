export type AttendanceStatus = "hadir" | "terlambat"

export interface CourseSchedule {
  key: string
  label: string
  credits: number
  day: string
  startTime: string
  endTime: string
  cutoffTime: string
  location: string
  lecturer: string
  classGroup: string
}

export interface AttendanceRecord {
  id: number
  studentName: string
  studentId: string
  faculty: string
  courseKey: string
  courseLabel: string
  credits: number
  day: string
  startTime: string
  endTime: string
  cutoffTime: string
  lecturer: string
  classGroup: string
  room: string
  attendanceDate: string
  checkInTime: string
  status: AttendanceStatus
  notes: string
  createdAt: string
}

export interface AttendanceSummary {
  total: number
  hadir: number
  terlambat: number
  uniqueStudents: number
  activeFaculties: number
  latestDate: string
  todayTotal: number
  hadirToday: number
  lateToday: number
}

export interface CourseInsight {
  key: string
  label: string
  credits: number
  day: string
  startTime: string
  endTime: string
  cutoffTime: string
  location: string
  lecturer: string
  classGroup: string
  total: number
  hadir: number
  late: number
}

export interface SessionInfo {
  id: number
  courseKey: string
  courseLabel: string
  lecturer: string
  classGroup: string
  token: string
  attendanceDate: string
  startedAt: string
  closedAt: string | null
  status: "open" | "closed"
}

export interface AttendancePayload {
  records: AttendanceRecord[]
  summary: AttendanceSummary
  schedules: CourseSchedule[]
  faculties: string[]
  todayDate: string
  currentDayName: string
  timezone: string
  currentWitaTime: string
  courseInsights: CourseInsight[]
  todaySchedules: CourseSchedule[]
  activeSession: SessionInfo | null
}
