const API_URL = String(import.meta.env.VITE_API_URL || "").trim().replace(/\/$/, "")
let hasLoggedApiUrl = false

export { API_URL }

export const requireApiUrl = () => {
  if (!API_URL) {
    throw new Error("VITE_API_URL is not configured.")
  }

  if (!hasLoggedApiUrl) {
    console.log(`[api] Using backend API URL: ${API_URL}`)
    hasLoggedApiUrl = true
  }

  return API_URL
}

export const buildApiUrl = (path: string) => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`
  return `${requireApiUrl()}${normalizedPath}`
}

export const isNetworkFailure = (error: unknown) => {
  if (!error || typeof error !== "object") {
    return false
  }

  const fetchError = error as {
    name?: string
    message?: string
    status?: number
    statusCode?: number
    cause?: { code?: string; message?: string }
    data?: unknown
  }

  if (typeof fetchError.status === "number" || typeof fetchError.statusCode === "number") {
    return false
  }

  const details = [
    fetchError.name,
    fetchError.message,
    fetchError.cause?.code,
    fetchError.cause?.message
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()

  return [
    "fetch",
    "network",
    "failed to fetch",
    "load failed",
    "timeout",
    "econnrefused",
    "enotfound",
    "econnreset"
  ].some((token) => details.includes(token))
}

export const apiFetch = <T>(path: string, options?: Parameters<typeof $fetch<T>>[1]) => {
  const url = buildApiUrl(path)

  console.log(`[api] Request: ${url}`)

  return $fetch<T>(url, {
    credentials: "include",
    ...options
  }).catch((error) => {
    const errorDetails = {
      url,
      method: options?.method || "GET",
      status: error?.status ?? error?.statusCode ?? null,
      statusMessage: error?.statusMessage ?? null,
      message: error?.message ?? "Unknown API error",
      data: error?.data ?? null
    }

    console.error("[api] Request failed", errorDetails)

    throw error
  })
}
