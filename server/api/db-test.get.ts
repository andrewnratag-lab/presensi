import { withApiHandler } from "../utils/api"
import { testDatabaseConnection } from "../utils/db"

export default withApiHandler(async () => {
  const database = await testDatabaseConnection()

  return {
    ok: true,
    status: "connected",
    timestamp: new Date().toISOString(),
    database
  }
}, {
  route: "db-test.get"
})
