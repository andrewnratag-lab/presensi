import { logoutUser } from "../../utils/auth"

export default defineEventHandler((event) => {
  logoutUser(event)
  return { ok: true }
})
