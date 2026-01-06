export default defineNuxtRouteMiddleware((to) => {
  const auth = useAuth()

  if (!auth.token && to.path !== '/login') {
    return navigateTo('/login')
  }
})