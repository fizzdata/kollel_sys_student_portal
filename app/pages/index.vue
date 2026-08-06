<script setup>
import * as yup from "yup";

const show = ref(false);
const toast = useToast();
const api = useApi();
const route = useRoute();
const isSubmitting = ref(false);
const token = useCookie("kollel_stundent_token");
const student = useCookie("kollel_student");
const saveOrgPin = useCookie("kollel_sys_org_pin");
const showDefaultPasswordReminder = useCookie("kollel_default_password_reminder");
const orgPinFromUrl = route?.query?.org_pin;
const org_pin = ref(orgPinFromUrl ?? saveOrgPin.value ?? "");
const needsOrgPin = ref(!orgPinFromUrl);
const orgPinInput = ref(saveOrgPin.value ?? "");
const resetPasswordModal = ref(false);
const logoUrl = ref(null);
const orgName = ref("");
const logoLoading = ref(true);
const logoError = ref(false);

const schema = yup.object({
  phone: yup
    .string()
    .matches(/^\+?[0-9]{7,15}$/, "Invalid phone number")
    .required("Phone is required"),
  password: yup
    .string()
    .min(1, "Must be at least 8 characters")
    .required("Password is required"),
});

const state = reactive({
  phone: undefined,
  password: undefined,
});

// Fetch logo on component mount
const fetchLogo = async () => {
  try {
    logoLoading.value = true;
    logoError.value = false;

    const response = await api("/student-portal/logo", {
      method: "GET",
      params: { org_pin: org_pin.value },
    });

    if (response?.success) {
      logoUrl.value = response.logo;
      orgName.value = response.org_name;
    } else {
      logoError.value = true;
    }
  } catch (error) {
    console.error("Error fetching logo:", error);
    logoError.value = true;
  } finally {
    logoLoading.value = false;
  }
};

onMounted(() => {
  if (org_pin.value) {
    fetchLogo();
  }
});

const submitOrgPin = () => {
  const value = orgPinInput.value?.trim();
  if (!value) {
    toast.add({
      title: "Error",
      description: "Please enter an organization PIN.",
      color: "error",
      duration: 2000,
    });
    return;
  }

  org_pin.value = value;
  saveOrgPin.value = value;
  needsOrgPin.value = false;
  fetchLogo();
};

const loginResetForm = () => {
  state.phone = undefined;
  state.password = undefined;
};

const onSubmit = async (event) => {
  try {
    if (!org_pin.value) {
      toast.add({
        title: "Error",
        description: "Organization PIN is required.",
        color: "error",
        duration: 2000,
      });
      return;
    }
    isSubmitting.value = true;

    const payload = {
      org_pin: org_pin.value,
      ...event.data,
    };

    const response = await api("/student-portal/login", {
      method: "POST",
      body: payload,
    });

    if (response?.success) {
      token.value = response?.token || "";
      student.value = response?.student || null;
      saveOrgPin.value = org_pin.value;

      loginResetForm();

      if (response?.default_password) {
        showDefaultPasswordReminder.value = true;
        navigateTo("/clocking");
      } else {
        toast.add({
          title: "Success",
          description: response?.message || "Login Successfully",
          color: "success",
          duration: 2000,
        });
        navigateTo("/clocking");
      }
    } else {
      toast.add({
        title: "Failed",
        description:
          response?._data.errors ||
          response?._data.message ||
          "Failed to Login",
        color: "error",
        duration: 2000,
      });
    }
  } catch (error) {
    console.error("Error Login:", error);
  } finally {
    isSubmitting.value = false;
  }
};

</script>

<template>
  <!-- Org Pin Entry: shown when org_pin isn't provided in the URL -->
  <div
    v-if="needsOrgPin"
    class="min-h-screen flex items-center justify-center bg-gray-50 px-4"
  >
    <UCard class="w-full max-w-md rounded-2xl shadow-lg p-6 sm:p-8">
      <div class="mb-6 text-center">
        <h2 class="text-2xl sm:text-3xl font-bold text-primary">
          Kollel System
        </h2>
        <p class="text-sm text-gray-600 mt-1">Student Portal</p>
      </div>

      <p class="mb-6 text-center text-lg font-medium text-gray-800">
        Enter your Organization PIN
      </p>

      <UForm :state="{ orgPinInput }" class="space-y-4" @submit="submitOrgPin">
        <UFormField label="Organization PIN" name="orgPinInput">
          <UInput
            v-model="orgPinInput"
            placeholder="Enter organization PIN"
            size="lg"
            class="w-full"
          />
        </UFormField>

        <UButton
          type="submit"
          :loading="isSubmitting"
          :disabled="isSubmitting"
          block
          size="lg"
          class="mt-6"
        >
          Continue
        </UButton>
      </UForm>
    </UCard>
  </div>

  <!-- Error State: Invalid Organization ID -->
  <div
    v-else-if="logoError && !logoLoading"
    class="min-h-screen flex items-center justify-center bg-red-50 px-4"
  >
    <div class="text-center max-w-md">
      <div class="mb-6">
        <UIcon
          name="i-lucide-alert-circle"
          class="w-16 h-16 text-red-600 mx-auto"
        />
      </div>
      <h1 class="text-3xl font-bold text-red-900 mb-2">Invalid Pin</h1>
      <p class="text-red-700 mb-4">
        Unable to load! <br />Please check the PIN and try again.
      </p>
      <UButton color="red" @click="fetchLogo" class="w-full mb-2">Retry</UButton>
      <UButton
        color="neutral"
        variant="outline"
        class="w-full"
        @click="
          needsOrgPin = true;
          logoError = false;
          orgPinInput = org_pin.value;
        "
      >
        Use a different PIN
      </UButton>
    </div>
  </div>

  <!-- Main Content: Split Layout -->
  <div v-else-if="!logoError" class="min-h-screen flex">
    <!-- Left Side: Logo Background -->
    <div
      class="hidden lg:flex lg:w-1/2 bg-primary to-indigo-800 items-center justify-center relative overflow-hidden"
    >
      <!-- Animated background blobs -->
      <div class="absolute inset-0 overflow-hidden">
        <div
          class="absolute -top-40 -left-40 w-80 h-80 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse-slow"
        ></div>
        <div
          class="absolute -bottom-40 -right-40 w-80 h-80 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse-slow animation-delay-2000"
        ></div>
        <div
          class="absolute top-1/2 left-1/2 w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse-slow animation-delay-4000"
        ></div>
      </div>

      <!-- Logo Container -->
      <div class="relative z-10 text-center px-8">
        <div
          v-if="logoLoading"
          class="flex flex-col items-center justify-center"
        >
          <UIcon
            name="i-lucide-loader"
            class="w-20 h-20 text-white animate-spin mb-4"
          />
          <p class="text-white text-lg">Loading...</p>
        </div>
        <div
          v-else-if="logoUrl"
          class="flex flex-col items-center justify-center"
        >
          <img
            :src="`data:image/svg+xml;base64,${logoUrl}`"
            alt="Organization Logo"
            class="max-w-xs max-h-64 object-contain drop-shadow-2xl mb-8"
          />
          <h1 class="text-white text-2xl font-bold">{{ orgName }}</h1>
          <p class="text-indigo-100 mt-2 text-lg">
            Kollel System Student Portal
          </p>
        </div>
      </div>
    </div>

    <!-- Right Side: Login Form -->
    <div
      class="w-full lg:w-1/2 flex items-center justify-center bg-gray-50 px-4 py-8"
    >
      <div class="w-full max-w-md">
        <!-- Mobile Logo (hidden on large screens) -->
        <div class="lg:hidden mb-8 text-center">
          <div
            v-if="logoLoading"
            class="flex flex-col items-center justify-center"
          >
            <UIcon
              name="i-lucide-loader"
              class="w-12 h-12 text-primary animate-spin mb-2"
            />
          </div>
          <div
            v-else-if="logoUrl"
            class="flex flex-col items-center justify-center"
          >
            <img
              :src="`data:image/svg+xml;base64,${logoUrl}`"
              alt="Organization Logo"
              class="max-w-xs max-h-32 object-contain mb-4"
            />
          </div>
        </div>

        <UCard class="rounded-2xl shadow-lg p-6 sm:p-8">
          <!-- Brand -->
          <div class="mb-6 text-center">
            <h2 class="text-2xl sm:text-3xl font-bold text-primary">
              Kollel System
            </h2>
            <p class="text-sm text-gray-600 mt-1">Student Portal</p>
              <p class="mt-2 text-xs text-gray-500">by Fizz Data</p>
          </div>

          <!-- Title -->
          <p class="my-6 text-center text-lg font-medium text-gray-800">
            Login to your account
          </p>

          <!-- Form -->
          <UForm
            :schema="schema"
            :state="state"
            class="space-y-4"
            @submit="onSubmit"
          >
            <UFormField label="Phone" name="phone">
              <UInput
                v-model="state.phone"
                placeholder="Enter your phone"
                size="lg"
                class="w-full"
              />
            </UFormField>

            <UFormField label="Password" name="password">
              <UInput
                v-model="state.password"
                placeholder="Password"
                :type="show ? 'text' : 'password'"
                :ui="{ trailing: 'pe-1' }"
                class="w-full"
              >
                <template #trailing>
                  <UButton
                    color="neutral"
                    variant="link"
                    size="sm"
                    :icon="show ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                    :aria-label="show ? 'Hide password' : 'Show password'"
                    :aria-pressed="show"
                    aria-controls="password"
                    @click="show = !show"
                  />
                </template>
              </UInput>
            </UFormField>

            <UButton
              type="submit"
              :loading="isSubmitting"
              :disabled="isSubmitting"
              block
              size="lg"
              class="mt-6"
            >
              Login
            </UButton>
          </UForm>

          <!-- Footer -->
          <p class="mt-8 text-center text-sm text-gray-500">
            <button
              @click="resetPasswordModal = true"
              class="font-semibold text-primary hover:text-gray-500 hover:underline cursor-pointer"
            >
              Reset Password!
            </button>
          </p>
        </UCard>
      </div>
    </div>
  </div>

  <!-- Reset Password Modal -->
  <CommonResetPasswordModal v-model="resetPasswordModal" />
</template>
