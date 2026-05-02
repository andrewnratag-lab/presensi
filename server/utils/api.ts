import { defineEventHandler, getRequestURL, setResponseStatus, type EventHandler, type H3Event } from "h3"
import { getRequestId, logApiRequest, logApiResponse, logError, serializeError } from "./logger"

type FallbackResolver<T> = T | ((event: H3Event, error: unknown) => T)

interface ApiHandlerOptions<T> {
  route: string
  fallback?: FallbackResolver<T>
  fallbackStatusCode?: number
}

interface StructuredErrorResponse {
  ok: false
  error: {
    code: string
    message: string
    statusCode: number
    requestId: string
  }
  timestamp: string
  path: string
}

const nowIso = () => new Date().toISOString()

const getErrorStatusCode = (error: any) => {
  const statusCode = Number(error?.statusCode || error?.status || 500)
  return Number.isInteger(statusCode) && statusCode >= 400 ? statusCode : 500
}

const getErrorCode = (error: any, statusCode: number) => {
  const raw = String(error?.data?.code || error?.code || error?.name || "").trim()
  if (!raw || statusCode >= 500) {
    return "INTERNAL_SERVER_ERROR"
  }

  return raw.replace(/[^A-Z0-9_]/gi, "_").toUpperCase()
}

const getErrorMessage = (error: any, statusCode: number) => {
  if (statusCode >= 500) {
    return "Internal server error"
  }

  return String(error?.statusMessage || error?.message || "Request failed")
}

const createStructuredError = (event: H3Event, error: unknown): StructuredErrorResponse => {
  const statusCode = getErrorStatusCode(error)

  return {
    ok: false,
    error: {
      code: getErrorCode(error, statusCode),
      message: getErrorMessage(error, statusCode),
      statusCode,
      requestId: getRequestId(event)
    },
    timestamp: nowIso(),
    path: getRequestURL(event).pathname
  }
}

export const withApiHandler = <T>(handler: EventHandler<T>, options: ApiHandlerOptions<T>) => defineEventHandler(async (event) => {
  const startedAt = Date.now()

  logApiRequest(event)

  try {
    const result = await handler(event)
    logApiResponse(event, 200, Date.now() - startedAt, {
      route: options.route
    })
    return result
  } catch (error) {
    const structuredError = createStructuredError(event, error)

    logError("API request failed", {
      route: options.route,
      requestId: structuredError.error.requestId,
      method: event.node.req.method || "GET",
      path: structuredError.path,
      statusCode: structuredError.error.statusCode,
      error: serializeError(error)
    })

    if (typeof options.fallback !== "undefined" && structuredError.error.statusCode >= 500) {
      const fallbackStatusCode = options.fallbackStatusCode ?? 200
      setResponseStatus(event, fallbackStatusCode)
      logApiResponse(event, fallbackStatusCode, Date.now() - startedAt, {
        route: options.route,
        fallback: true
      })

      return typeof options.fallback === "function"
        ? (options.fallback as (event: H3Event, error: unknown) => T)(event, error)
        : options.fallback
    }

    setResponseStatus(event, structuredError.error.statusCode)
    logApiResponse(event, structuredError.error.statusCode, Date.now() - startedAt, {
      route: options.route
    })

    return structuredError
  }
})
