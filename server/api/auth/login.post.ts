import { readBody } from "h3"
import { loginUser } from "../../utils/auth"

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  return loginUser(event, body || {})
})
