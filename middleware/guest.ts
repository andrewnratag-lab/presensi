export default defineNuxtRouteMiddleware(() => {
  const authCookie = useCookie("presensi_auth")

  if (authCookie.value) {
    return navigateTo("/")
  }
})
