import { logError, logInfo, serializeError } from "../utils/logger"

let handlersRegistered = false

export default defineNitroPlugin(() => {
  if (handlersRegistered) {
    return
  }

  handlersRegistered = true

  process.on("unhandledRejection", (reason) => {
    logError("Unhandled promise rejection", {
      error: serializeError(reason)
    })
  })

  process.on("uncaughtException", (error) => {
    logError("Uncaught exception", {
      error: serializeError(error)
    })
  })

  logInfo("Process error handlers registered")
})
