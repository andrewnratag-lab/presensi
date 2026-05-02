import { getQuery } from "h3"
import { FACULTIES, getCheckInSessionByToken } from "../utils/attendance"

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const token = String(query.token || "")

  return {
    session: await getCheckInSessionByToken(token),
    faculties: FACULTIES
  }
})
