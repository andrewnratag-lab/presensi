import { randomUUID } from "node:crypto"
import { getRequestIP, getRequestURL, setHeader, type H3Event } from "h3"

type LogLevel = "info" | "error"

const nowIso = () => new Date().toISOString()

const writeLog = (level: LogLevel, message: string, meta: Record<string, unknown> = {}) => {
  const payload = {
    level,
    message,
    timestamp: nowIso(),
    ...meta
  }

  const line = JSON.stringify(payload)

  if (level === "error") {
    console.error(line)
    return
  }

  console.info(line)
}

export const logInfo = (message: string, meta: Record<string, unknown> = {}) => {
  writeLog("info", message, meta)
}

export const logError = (message: string, meta: Record<string, unknown> = {}) => {
  writeLog("error", message, meta)
}

export const serializeError = (error: unknown) => {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message
    }
  }

  return {
    message: String(error)
  }
}

export const getRequestId = (event: H3Event) => {
  const existing = event.context.requestId as string | undefined

  if (existing) {
    return existing
  }

  const headerValue = event.node.req.headers["x-request-id"]
  const requestId = typeof headerValue === "string" && headerValue.trim()
    ? headerValue.trim()
    : randomUUID()

  event.context.requestId = requestId
  setHeader(event, "x-request-id", requestId)

  return requestId
}

export const logApiRequest = (event: H3Event) => {
  if (event.context.apiRequestLogged) {
    return
  }

  event.context.apiRequestLogged = true

  logInfo("API request received", {
    requestId: getRequestId(event),
    method: event.node.req.method || "GET",
    path: getRequestURL(event).pathname,
    ip: getRequestIP(event, { xForwardedFor: true }) || "unknown"
  })
}

export const logApiResponse = (event: H3Event, statusCode: number, durationMs: number, meta: Record<string, unknown> = {}) => {
  logInfo("API request completed", {
    requestId: getRequestId(event),
    method: event.node.req.method || "GET",
    path: getRequestURL(event).pathname,
    statusCode,
    durationMs,
    ...meta
  })
}
