import { createError, getCookie, setCookie, deleteCookie, type H3Event } from "h3"

const AUTH_COOKIE = "presensi_auth"

const USERS = [
  { username: "admin", password: "admin14KNS1", name: "Admin Akademik", role: "admin" },
  { username: "dosen", password: "dosen14KNS1", name: "Dosen Pengampu", role: "lecturer" }
] as const

export const getAuthCookieName = () => AUTH_COOKIE

export const getCurrentUser = (event: H3Event) => {
  const raw = getCookie(event, AUTH_COOKIE)

  if (!raw) {
    return null
  }

  try {
    return JSON.parse(raw) as { username: string; name: string; role: string }
  } catch {
    return null
  }
}

export const requireUser = (event: H3Event) => {
  const user = getCurrentUser(event)

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: "Silakan login terlebih dahulu."
    })
  }

  return user
}

export const loginUser = (event: H3Event, body: { username?: string; password?: string }) => {
  const username = body.username?.trim() || ""
  const password = body.password?.trim() || ""
  const matched = USERS.find((user) => user.username === username && user.password === password)

  if (!matched) {
    throw createError({
      statusCode: 401,
      statusMessage: "Username atau password tidak valid."
    })
  }

  const authPayload = {
    username: matched.username,
    name: matched.name,
    role: matched.role
  }

  setCookie(event, AUTH_COOKIE, JSON.stringify(authPayload), {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12
  })

  return authPayload
}

export const logoutUser = (event: H3Event) => {
  deleteCookie(event, AUTH_COOKIE, {
    path: "/"
  })
}
