import { readBody } from "h3"
import { closeAttendanceSession, createAttendanceRecord, deleteAttendanceRecord, openAttendanceSession, updateAttendanceRecord } from "../utils/attendance"
import { withApiHandler } from "../utils/api"
import { requireUser } from "../utils/auth"

export default withApiHandler(async (event) => {
  requireUser(event)
  const body = await readBody(event)
  const payload = body || {}

  if (payload.action === "update") {
    return await updateAttendanceRecord(payload)
  }

  if (payload.action === "open-session") {
    return await openAttendanceSession(payload)
  }

  if (payload.action === "close-session") {
    return await closeAttendanceSession()
  }

  if (payload.action === "delete") {
    return await deleteAttendanceRecord(payload)
  }

  return await createAttendanceRecord(payload)
}, {
  route: "attendance.post"
})
