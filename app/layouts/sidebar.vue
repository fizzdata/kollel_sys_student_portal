<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from "vue";
import { useRoute } from "vue-router";
import {
  Dialog,
  DialogPanel,
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
  TransitionChild,
  TransitionRoot,
} from "@headlessui/vue";

const sidebarOpen = ref(false);
const route = useRoute();
const api = useApi();

const token = useCookie("kollel_stundent_token");
const student = useCookie("kollel_student");
const org_pin = useCookie("kollel_sys_org_pin");

const inactivityWarningOpen = ref(false);
const inactivityCountdown = ref(10);
const isLoggingOut = ref(false);

const IDLE_TIMEOUT_MS = 30_000;
const WARNING_SECONDS = 10;

let inactivityTimer = null;
let countdownTimer = null;

const toast = useToast();
const navigation = [
  { name: "Dashboard", href: "/dashboard", key: "dashboard" },
  { name: "Clocking", href: "/clocking", key: "clocking" },
  { name: "Transaction", href: "/transaction", key: "transaction" },
  { name: "Responses", href: "/responses", key: "responses" },
  { name: "Settings", href: "/settings", key: "settings" },
];

const isActive = (href) => route.path.startsWith(href);

const clearInactivityTimer = () => {
  if (inactivityTimer) {
    window.clearTimeout(inactivityTimer);
    inactivityTimer = null;
  }
};

const clearCountdownTimer = () => {
  if (countdownTimer) {
    window.clearInterval(countdownTimer);
    countdownTimer = null;
  }
};

const startInactivityTimer = () => {
  if (!token.value || !process.client) return;

  clearInactivityTimer();
  inactivityTimer = window.setTimeout(() => {
    inactivityWarningOpen.value = true;
    inactivityCountdown.value = WARNING_SECONDS;

    clearCountdownTimer();
    countdownTimer = window.setInterval(() => {
      inactivityCountdown.value -= 1;

      if (inactivityCountdown.value <= 0) {
        clearCountdownTimer();
        inactivityWarningOpen.value = false;
        logout(true);
      }
    }, 1000);
  }, IDLE_TIMEOUT_MS);
};

const onUserActivity = () => {
  if (inactivityWarningOpen.value) return;
  startInactivityTimer();
};

const resumeSession = () => {
  inactivityWarningOpen.value = false;
  inactivityCountdown.value = WARNING_SECONDS;
  clearCountdownTimer();
  startInactivityTimer();
};

const logout = async (isAutoLogout = false) => {
  if (isLoggingOut.value) return;
  isLoggingOut.value = true;

  clearInactivityTimer();
  clearCountdownTimer();

  try {
    if (isAutoLogout) {
      toast.add({
        title: "Session Expiring",
        description: "You were logged out due to inactivity.",
        color: "warning",
        timeout: 2000,
      });
    }

    // Send the full sign-up data to the server
    const response = await api("/student-portal/logout", {
      method: "POST",
      body: { token: token.value }, // Send payload in body
    });

    if (response?.success) {
      toast.add({
        description: response?.message || `Student Logout Successfully`,
        color: "success",
        timeout: 2000,
      });

      // Redirect to login
      navigateTo(`/?org_pin=${org_pin.value}`);
      // Clear cookies
      token.value = null;
      student.value = null;
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
  } finally {
    isLoggingOut.value = false;
  }
};

onMounted(() => {
  if (!process.client || !token.value) return;

  const events = ["mousemove", "mousedown", "keydown", "scroll", "touchstart"];
  events.forEach((eventName) => {
    window.addEventListener(eventName, onUserActivity, { passive: true });
  });

  startInactivityTimer();
});

onBeforeUnmount(() => {
  if (process.client) {
    const events = ["mousemove", "mousedown", "keydown", "scroll", "touchstart"];
    events.forEach((eventName) => {
      window.removeEventListener(eventName, onUserActivity);
    });
  }

  clearInactivityTimer();
  clearCountdownTimer();
});

watch(token, (value) => {
  if (!process.client) return;

  if (!value) {
    inactivityWarningOpen.value = false;
    clearInactivityTimer();
    clearCountdownTimer();
    return;
  }

  startInactivityTimer();
});
</script>

<template>
  <div class="flex flex-col">
    <header class="bg-white">
      <nav
        class="mx-auto flex max-w-7xl items-center justify-between gap-x-6 p-6 px-6 lg:px-8"
        aria-label="Global"
      >
        <div class="flex lg:flex-1">
          <div class="flex items-center">
            <div
              class="bg-primary font-bold text-white w-10 h-10 rounded-lg flex items-center justify-center mr-3 shadow-md"
            >
              K
            </div>
            <div class="flex flex-col">
              <span class="text-lg font-bold text-gray-800"
                >Kollel<span class="text-brand-600"> System</span></span
              >
              <span class="text-sm font-bold text-gray-800"
                >Student<span class="text-brand-600"> Portal</span></span
              >
            </div>
          </div>
        </div>

        <div class="flex gap-x-12">
          <nav class="hidden md:flex w-full justify-center">
            <ul class="flex flex-wrap gap-x-4 items-center justify-center">
              <!-- Menu Items -->
              <li v-for="item in navigation" :key="item.key">
                <ULink
                  :to="item.href"
                  :class="[
                    isActive(item.href)
                      ? 'bg-gray-200 text-gray-700 '
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-700',
                    'flex items-center gap-x-3 rounded-md p-2 text-sm font-semibold transition-colors duration-200',
                  ]"
                >
                  {{ item?.name }}
                </ULink>
              </li>
            </ul>
          </nav>
        </div>

        <div class="flex flex-1 items-center justify-end gap-x-6">
          <UButton @click="logout" class="ml-4"> Log Out </UButton>
        </div>
      </nav>

      <nav class="flex w-full justify-center mb-4 md:hidden">
        <ul class="flex flex-wrap gap-x-4 items-center justify-center">
          <!-- Menu Items -->
          <li v-for="item in navigation" :key="item.key">
            <ULink
              :to="item.href"
              :class="[
                isActive(item.href)
                  ? 'bg-gray-200 text-gray-700'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-700',
                'flex items-center gap-x-3 rounded-md p-2 text-sm font-semibold transition-colors duration-200',
              ]"
            >
              {{ item?.name }}
            </ULink>
          </li>
        </ul>
      </nav>
    </header>

    <main class="max-w-7xl mx-auto mt-5 w-full px-6 lg:px-8">
      <slot />
    </main>

    <UModal v-model:open="inactivityWarningOpen" :dismissible="false">
      <template #header>
        <h2 class="text-lg font-semibold">Session Timeout Warning</h2>
      </template>

      <template #body>
        <p class="text-sm text-gray-700">
          You have been inactive for 30 seconds. You will be logged out in
          {{ inactivityCountdown }} seconds.
        </p>
      </template>

      <template #footer>
        <div class="flex justify-end w-full">
          <UButton color="primary" @click="resumeSession">I am still here</UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
