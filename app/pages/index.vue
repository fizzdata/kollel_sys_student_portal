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
const org_pin = route?.query?.org_pin ?? saveOrgPin.value;
const resetPasswordModal = ref(false);
const showModal = ref(false);
const logoUrl = ref(null);
const logoLoading = ref(true);
const logoError = ref(false);

const confirmCode = ref(false);
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

const resetPasswordSchema = computed(() =>
  yup.object({
    phone: yup
      .string()
      .matches(/^\+?[0-9]{7,15}$/, "Invalid phone number")
      .required("Phone is required"),

    code: confirmCode.value
      ? yup
          .string()
          .length(6, "Code must be 6 digits")
          .required("Verification code is required")
      : yup.string().notRequired(),
  }),
);

const state = reactive({
  phone: undefined,
  password: undefined,
});

const resetPasswordState = reactive({
  phone: undefined,
  code: undefined,
});

// Fetch logo on component mount
const fetchLogo = async () => {
  try {
    logoLoading.value = true;
    logoError.value = false;
    
    const response = await api("/student-portal/logo", {
      method: "GET",
      params: { org_pin: org_pin },
    });

    if (response?.success && response?.logo) {
      logoUrl.value = response.logo;
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
  fetchLogo();
});

const loginResetForm = () => {
  state.phone = undefined;
  state.password = undefined;
};

const resetPasswordForm = () => {
  resetPasswordState.phone = undefined;
  resetPasswordState.code = undefined;
  confirmCode.value = false;
};

const onSubmit = async (event) => {
  try {
    if (!org_pin) {
      toast.add({
        title: "Error",
        description: "Organization PIN is missing in the URL.",
        color: "error",
        duration: 2000,
      });
      return;
    }
    isSubmitting.value = true;

    const payload = {
      org_pin: org_pin,
      ...event.data,
    };

    const response = await api("/student-portal/login", {
      method: "POST",
      body: payload,
    });

    if (response?.success) {
      token.value = response?.token || "";
      student.value = response?.student || null;
      saveOrgPin.value = org_pin;

      loginResetForm();
      toast.add({
        title: "Success",
        description: response?.message || "Login Successfully",
        color: "success",
        duration: 2000,
      });
      navigateTo("/clocking");
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

const resetPassword = async (event) => {
  try {
    if (!org_pin) {
      toast.add({
        title: "Error",
        description: "Organization PIN is missing in the URL.",
        color: "error",
        duration: 2000,
      });
      return;
    }

    isSubmitting.value = true;

    const payload = {
      org_pin: org_pin,
      phone: event?.data?.phone,
    };

    if (confirmCode.value && event?.data?.code) {
      payload.code = event.data.code;
    }

    const response = await api("/student-portal/password-reset", {
      method: "POST",
      body: payload,
    });

    if (response?.success) {
      if (!confirmCode.value) {
        confirmCode.value = true;
        resetPasswordState.phone = event?.data?.phone;
        toast.add({
          title: "Success",
          description: response?.message || "Code Sent!",
          color: "success",
          duration: 2000,
        });
      } else {
        toast.add({
          title: "Success",
          description: response?.message || "Password Reset!",
          color: "success",
          duration: 2000,
        });
        resetPasswordForm();
        resetPasswordModal.value = false;
        navigateTo(`/?org_pin=${org_pin}`);
      }
    } else {
      toast.add({
        title: "Failed",
        description: response?._data.message || "Code Sending Failed",
        color: "error",
        duration: 2000,
      });
    }
  } catch (error) {
    console.error("Error Reset Password:", error);
  } finally {
    isSubmitting.value = false;
  }
};

const handleCancel = () => {
  resetPasswordModal.value = false;
};
</script>

<template>
  <!-- Error State: Invalid Organization ID -->
  <div v-if="logoError && !logoLoading" class="min-h-screen flex items-center justify-center bg-red-50 px-4">
    <div class="text-center max-w-md">
      <div class="mb-6">
        <UIcon name="i-lucide-alert-circle" class="w-16 h-16 text-red-600 mx-auto" />
      </div>
      <h1 class="text-3xl font-bold text-red-900 mb-2">Invalid Pin</h1>
      <p class="text-red-700 mb-4">Unable to load! <br>Please check the URL and try again.</p>
      <UButton color="red" @click="fetchLogo" class="w-full">Retry</UButton>
    </div>
  </div>

  <!-- Main Content: Split Layout -->
  <div v-else-if="!logoError" class="min-h-screen flex">
    <!-- Left Side: Logo Background -->
    <div class="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-600 to-indigo-800 items-center justify-center relative overflow-hidden">
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
        <div v-if="logoLoading" class="flex flex-col items-center justify-center">
          <UIcon name="i-lucide-loader" class="w-20 h-20 text-white animate-spin mb-4" />
          <p class="text-white text-lg">Loading...</p>
        </div>
        <div v-else-if="logoUrl" class="flex flex-col items-center justify-center">
          <img 
            :src="`data:image/svg+xml;base64,${logoUrl}`"
            alt="Organization Logo"
            class="max-w-xs max-h-64 object-contain drop-shadow-2xl mb-8"
          />
          <h1 class="text-white text-2xl font-bold">Welcome Back</h1>
          <p class="text-indigo-100 mt-2 text-lg">Kollel System Student Portal</p>
        </div>
      </div>
    </div>

    <!-- Right Side: Login Form -->
    <div class="w-full lg:w-1/2 flex items-center justify-center bg-gray-50 px-4 py-8">
      <div class="w-full max-w-md">
        <!-- Mobile Logo (hidden on large screens) -->
        <div class="lg:hidden mb-8 text-center">
          <div v-if="logoLoading" class="flex flex-col items-center justify-center">
            <UIcon name="i-lucide-loader" class="w-12 h-12 text-indigo-600 animate-spin mb-2" />
          </div>
          <div v-else-if="logoUrl" class="flex flex-col items-center justify-center">
            <img
              :src="logoUrl"
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
            <ULink to="http://fizzdata.com/" target="_blank" class="block">
              <p class="mt-2 text-xs text-gray-500">by Fizz Data</p>
            </ULink>
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
  <UModal v-model:open="resetPasswordModal">
    <template #header>
      <div class="flex justify-between w-full items-center">
        <h2 class="text-xl font-bold text-primary">Reset Password</h2>
        <UButton
          size="sm"
          variant="outline"
          color="primary"
          class="rounded-full p-2"
          icon="i-lucide-x"
          @click="resetPasswordModal = false"
        />
      </div>
    </template>

    <template #body>
      <UForm
        :schema="resetPasswordSchema"
        :state="resetPasswordState"
        class="space-y-4"
        @submit="resetPassword"
      >
        <UFormField label="Phone" name="phone">
          <UInput
            v-model="resetPasswordState.phone"
            placeholder="Enter your phone"
            size="lg"
            class="w-full"
          />
        </UFormField>

        <UFormField v-if="confirmCode" label="Confirmation Code" name="code">
          <UInput
            v-model="resetPasswordState.code"
            placeholder="Enter your confirmation code"
            size="lg"
            class="w-full"
            type="number"
          />
        </UFormField>

        <div class="flex justify-end items-center gap-2 mt-4 border-t border-gray-200 pt-4">
          <UButton
            color="neutral"
            variant="solid"
            @click="resetPasswordModal = false"
          >
            Cancel
          </UButton>
          <UButton
            type="submit"
            :loading="isSubmitting"
            :disabled="isSubmitting"
          >
            {{ confirmCode ? 'Verify Code' : 'Send Code' }}
          </UButton>
        </div>
      </UForm>
    </template>
  </UModal>
</template>
