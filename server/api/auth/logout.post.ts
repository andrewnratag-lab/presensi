import { withApiHandler } from "../../utils/api"
import { logoutUser } from "../../utils/auth"

export default withApiHandler((event) => {
  logoutUser(event)
  return { ok: true }
}, {
  route: "auth.logout.post"
})
