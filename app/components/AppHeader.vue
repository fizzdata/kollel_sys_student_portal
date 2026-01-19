<script setup>
const route = useRoute();

const token = useCookie("kollel_sys_token");
const toast = useToast();

const secondaryNavigation = [
  { name: "Login", href: `/` },
  { name: "Signup", href: `/signup` },
];

const logout = async () => {
  // Redirect to login
  navigateTo("/");
  // Clear cookies
  useCookie("kollel_sys_token").value = null;
  useCookie("kollel_sys_org").value = null;
  useCookie("kollel_sys_user").value = null;
  useCookie("kollel_sys_has_access").value = null;

  toast.add({
    description: `Admin Logout Successfully`,
    color: "success",
    timeout: 2000,
  });

  return;
  try {
    // Send the full sign-up data to the server
    const response = await api("/api/logout", {
      method: "POST",
      body: { token: token.value }, // Send payload in body
    });
    if (response?.success) {
      toast.add({
        description: response?.message || `User Logout Successfully`,
        color: "success",
        timeout: 2000,
      });
      token.value = null;

      // Redirect to login
      navigateTo("/");
      // Clear cookies
      useCookie("kollel_sys_token").value = null;
      useCookie("kollel_sys_org").value = null;
      useCookie("kollel_sys_user").value = null;
      useCookie("kollel_sys_has_access").value = null;
    }

    if (!response?._data?.success && !response?.success) {
      toast.add({
        title: "Error",
        description:
          response?.message ||
          response?._data?.message ||
          `Something went wrong. Please try again later.`,
        color: "red",
        timeout: 2000,
      });
    }
    // Redirect or show a success message
  } catch (error) {
    console.error("Error during sign-up:", error);
  }
};
</script>

<template>
  <header class="border-b border-gray-200 bg-primary">
    <UContainer>
      <nav
        class="flex flex-col md:flex-row items-center justify-between py-6 gap-4"
        aria-label="Global"
      >
        <div class="flex lg:flex-1">
          <ULink to="/" class="-m-1.5 p-1.5">
            <span class="font-bold text-white">KollelSys Admin </span>
          </ULink>
        </div>
        <div v-if="token" class="flex text-center items-center gap-x-4">
          <UButton size="xl" to="/users">Go to your account</UButton>
          <div>
            <UButton type="submit" color="neutral" size="lg" @click="logout">
              Logout
            </UButton>
          </div>
        </div>
        <div v-else class="flex gap-x-4 lg:gap-x-8">
          <ULink
            v-for="item in secondaryNavigation"
            :key="item.name"
            :to="item.href"
            :class="[
              'nav-link text-white hover:text-white font-medium',
              route.path === item.href ? 'font-bold' : '',
            ]"
          >
            {{ item.name }}
          </ULink>
        </div>
      </nav>
    </UContainer>
  </header>
</template>

<style scoped>
.nav-link {
  position: relative;
}
.nav-link::after {
  content: "";
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 0;
  height: 2px;
  background: #ffffff;
  transition: width 0.3s ease;
}
.nav-link:hover::after {
  width: 100%;
  color: white;
}
</style>
