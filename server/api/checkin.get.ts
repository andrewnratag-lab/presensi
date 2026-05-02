import { getQuery } from "h3"
import { FACULTIES, getCheckInSessionByToken } from "../utils/attendance"
import { withApiHandler } from "../utils/api"

export default withApiHandler(async (event) => {
  const query = getQuery(event)
  const token = String(query.token || "")

  return {
    session: await getCheckInSessionByToken(token),
    faculties: FACULTIES
  }
}, {
  route: "checkin.get"
})
