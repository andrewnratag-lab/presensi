import { getQuery } from "h3"
import { getAttendancePayload } from "../utils/attendance"
import { requireUser } from "../utils/auth"

export default defineEventHandler(async (event) => {
  requireUser(event)
  const query = getQuery(event)
  const courseKey = String(query.courseKey || "")
  const attendanceDate = String(query.attendanceDate || "")
  const payload = await getAttendancePayload()

  const records = payload.records.filter((record) => {
    const matchesCourse = !courseKey || record.courseKey === courseKey
    const matchesDate = !attendanceDate || record.attendanceDate === attendanceDate
    return matchesCourse && matchesDate
  })

  return {
    filters: {
      courseKey,
      attendanceDate
    },
    schedules: payload.schedules,
    records,
    generatedAt: new Date().toISOString()
  }
})
