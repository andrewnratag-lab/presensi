import { withApiHandler } from "../../utils/api"
import { getCurrentUser } from "../../utils/auth"

export default withApiHandler((event) => {
  return {
    user: getCurrentUser(event)
  }
}, {
  route: "auth.session.get",
  fallback: {
    user: null
  }
})
