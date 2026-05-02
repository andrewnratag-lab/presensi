import { defineEventHandler, getRequestURL } from "h3"
import { logApiRequest } from "../utils/logger"

export default defineEventHandler((event) => {
  if (!getRequestURL(event).pathname.startsWith("/api/")) {
    return
  }

  logApiRequest(event)
})
