export default defineNuxtRouteMiddleware((to) => {
  const token = useCookie("kollel_stundent_token");

  if (!token.value) {
    return navigateTo("/login");
  }
})