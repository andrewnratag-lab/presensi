import { readBody } from "h3"
import { createAttendanceRecord, getCheckInSessionByToken } from "../utils/attendance"
import { withApiHandler } from "../utils/api"

export default withApiHandler(async (event) => {
  const body = await readBody(event)
  const token = body?.token?.trim?.() || ""
  const session = await getCheckInSessionByToken(token)

  return await createAttendanceRecord({
    studentName: body?.studentName,
    studentId: body?.studentId,
    faculty: body?.faculty,
    courseKey: session.courseKey,
    attendanceDate: session.attendanceDate,
    notes: body?.notes
  })
}, {
  route: "checkin.post"
})
