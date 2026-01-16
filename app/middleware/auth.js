export default defineNuxtRouteMiddleware(() => {
  const token = useCookie("kollel_sys_token");

  if (!token.value) {
    return navigateTo("/");
  }
});
