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
  <div>
    <!-- Mobile Sidebar -->
    <TransitionRoot as="template" :show="sidebarOpen">
      <Dialog class="relative z-50 lg:hidden" @close="sidebarOpen = false">
        <!-- Overlay -->
        <TransitionChild
          as="template"
          enter="transition-opacity ease-linear duration-300"
          enter-from="opacity-0"
          enter-to="opacity-100"
          leave="transition-opacity ease-linear duration-300"
          leave-from="opacity-100"
          leave-to="opacity-0"
        >
          <div class="fixed inset-0 bg-gray-900/80" />
        </TransitionChild>

        <!-- Sidebar Panel -->
        <div class="fixed inset-0 flex">
          <TransitionChild
            as="template"
            enter="transition ease-in-out duration-300 transform"
            enter-from="-translate-x-full"
            enter-to="translate-x-0"
            leave="transition ease-in-out duration-300 transform"
            leave-from="translate-x-0"
            leave-to="-translate-x-full"
          >
            <DialogPanel
              class="relative flex w-full max-w-xs flex-1 flex-col bg-white/95 backdrop-blur-md shadow-lg rounded-tr-2xl rounded-br-2xl px-6 pb-4"
            >
              <!-- Close button -->
              <div
                class="absolute top-0 left-full flex w-16 justify-center pt-5"
              >
                <button
                  class="-m-2.5 p-2.5 cursor-pointer"
                  @click="sidebarOpen = false"
                  aria-label="Close sidebar"
                >
                  <UIcon name="i-lucide-x" class="size-6 text-white" />
                </button>
              </div>

              <!-- Brand -->
              <!-- <ULink to="/"> -->
              <div
                class="flex h-16 items-center font-bold text-primary text-xl"
              >
                Kollel System
              </div>
              <!-- </ULink> -->
              <!-- Navigation -->
              <nav class="flex flex-1 flex-col mt-4">
                <ul class="flex flex-1 flex-col gap-y-3">
                  <!-- Menu Items -->
                  <li v-for="item in navigation" :key="item.key">
                    <ULink
                      :to="item.href"
                      :class="[
                        isActive(item.href)
                          ? 'bg-gray-200 text-gray-700 border-l-4 border-gray-600'
                          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-700',
                        'block rounded-md p-2 text-sm font-semibold transition-colors duration-200',
                      ]"
                      @click="sidebarOpen = false"
                    >
                      {{ item?.name }}
                    </ULink>
                  </li>
                </ul>
              </nav>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </TransitionRoot>

    <!-- Desktop Sidebar -->
    <div
      class="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col"
    >
      <div
        class="flex grow flex-col gap-y-5 border-r border-gray-200 bg-white/90 backdrop-blur-md shadow-md px-6 pb-4 rounded-tr-2xl rounded-br-2xl"
      >
        <!-- Brand -->
        <div class="flex h-16 items-center font-bold text-primary text-xl">
          Kollel System
        </div>
        <!-- Navigation -->
        <nav class="flex flex-1 flex-col">
          <ul class="flex flex-1 flex-col gap-y-4">
            <!-- Menu Items -->
            <li v-for="item in navigation" :key="item.key">
              <ULink
                :to="item.href"
                :class="[
                  isActive(item.href)
                    ? 'bg-gray-200 text-gray-700 border-l-4 border-gray-600'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-700',
                  'flex items-center gap-x-3 rounded-md p-2 text-sm font-semibold transition-colors duration-200',
                ]"
              >
                <!-- Optional: Icon -->
                <!-- <MenuIcon class="w-5 h-5" /> -->
                {{ item?.name }}
              </ULink>
            </li>
          </ul>
        </nav>
      </div>
    </div>

    <!-- Main content -->
    <div class="lg:pl-72">
      <header
        class="flex h-16 items-center border-b border-gray-200 bg-white px-4 shadow-sm"
      >
        <!-- Hamburger icon for mobile -->
        <button
          class="lg:hidden flex flex-col justify-center items-center w-8 h-8 gap-1.5 p-1"
          @click="sidebarOpen = true"
          aria-label="Open sidebar"
        >
          <UIcon name="i-lucide-menu" class="size-6" />
        </button>

        <!-- Spacer -->
        <div class="flex-1"></div>

        <!-- Profile dropdown -->
        <div as="div" class="relative">
          <div class="relative flex items-center gap-2">
            <span class="sr-only">Open user menu</span>
            <UAvatar
              v-if="student"
              :alt="
                student?.first_yiddish_name + ' ' + student?.last_yiddish_name
              "
              size="md"
            />
            <span class="flex items-center gap-1">
              <span class="text-sm font-semibold text-gray-900">
                {{
                  student?.first_yiddish_name + " " + student?.last_yiddish_name
                }}
              </span>
            </span>
          </div>
        </div>
        <UButton @click="logout" class="ml-4"> Log Out </UButton>
      </header>

      <main class="py-10">
        <div class="px-4 sm:px-6 lg:px-8">
          <slot />
        </div>
      </main>
    </div>
  </div>
</template>
