import { getAttendancePayload } from "../utils/attendance"
import { requireUser } from "../utils/auth"

export default defineEventHandler(async (event) => {
  requireUser(event)
  return await getAttendancePayload()
})
