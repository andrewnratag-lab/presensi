import { getQuery } from "h3"
import { getAttendancePayload } from "../utils/attendance"
import { withApiHandler } from "../utils/api"
import { requireUser } from "../utils/auth"
import { COURSE_SCHEDULES } from "../utils/attendance"

export default withApiHandler(async (event) => {
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
}, {
  route: "report.get",
  fallback: (event) => {
    const query = getQuery(event)

    return {
      filters: {
        courseKey: String(query.courseKey || ""),
        attendanceDate: String(query.attendanceDate || "")
      },
      schedules: COURSE_SCHEDULES,
      records: [],
      generatedAt: new Date().toISOString(),
      error: true
    }
  }
})
