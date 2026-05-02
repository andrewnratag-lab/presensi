import { readBody } from "h3"
import { withApiHandler } from "../../utils/api"
import { loginUser } from "../../utils/auth"

export default withApiHandler(async (event) => {
  const body = await readBody(event)
  return loginUser(event, body || {})
}, {
  route: "auth.login.post"
})
