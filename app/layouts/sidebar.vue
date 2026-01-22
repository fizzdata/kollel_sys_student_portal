<script setup>
import { ref, computed } from "vue";
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

const toast = useToast();
const navigation = [
  { name: "Dashboard", href: "/dashboard", key: "dashboard" },
  { name: "Clocking", href: "/clocking", key: "clocking" },
  { name: "Transaction", href: "/transaction", key: "transaction" },
  { name: "Settings", href: "/settings", key: "settings" },
];

const isActive = (href) => route.path.startsWith(href);

const logout = async () => {
  try {
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
  }
};
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
  </div>
</template>
