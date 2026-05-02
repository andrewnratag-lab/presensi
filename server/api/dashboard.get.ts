import { createSafeAttendancePayload, getAttendancePayload } from "../utils/attendance"
import { withApiHandler } from "../utils/api"
import { requireUser } from "../utils/auth"

export default withApiHandler(async (event) => {
  requireUser(event)
  return await getAttendancePayload()
}, {
  route: "dashboard.get",
  fallback: () => ({
    ...createSafeAttendancePayload(),
    error: true
  })
})
