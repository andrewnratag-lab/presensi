import { withApiHandler } from "../utils/api"
import { isDatabaseConfigured, testDatabaseConnection } from "../utils/db"
import { serializeError } from "../utils/logger"

export default withApiHandler(async () => {
  try {
    const database = await testDatabaseConnection()

    return {
      ok: true,
      status: "connected",
      timestamp: new Date().toISOString(),
      database
    }
  } catch (error) {
    return {
      ok: false,
      status: "db-test-failed",
      timestamp: new Date().toISOString(),
      databaseConfigured: isDatabaseConfigured(),
      error: serializeError(error)
    }
  }
}, {
  route: "db-test.get"
})
