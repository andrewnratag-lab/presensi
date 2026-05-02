import { withApiHandler } from "../utils/api"
import { isDatabaseConfigured } from "../utils/db"

export default withApiHandler(async () => {
  return {
    ok: true,
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
    environment: process.env.NODE_ENV || "development",
    databaseConfigured: isDatabaseConfigured()
  }
}, {
  route: "health.get"
})
