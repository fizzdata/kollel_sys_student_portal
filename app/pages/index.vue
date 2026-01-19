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
const loginResetForm = () => {
  state.phone = undefined;
  state.password = undefined;
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
</script>

<template>
  <div
    class="relative flex min-h-screen items-center justify-center bg-gray-50 px-4"
  >
    <!-- Animated background blobs (like hero section) -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div
        class="absolute -top-40 -left-40 w-64 h-64 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-pulse-slow"
      ></div>
      <div
        class="absolute -bottom-40 -right-40 w-64 h-64 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-pulse-slow animation-delay-2000"
      ></div>
    </div>
    <UCard class="w-full max-w-lg rounded-2xl shadow-xl p-6 sm:p-8">
      <!-- Brand -->
      <div class="mb-6 text-center">
        <h2 class="text-3xl font-bold text-primary">
          Kollel System Student Portal
        </h2>

        <ULink to="http://fizzdata.com/" target="_blank" class="block">
          <p class="mt-1 text-sm text-gray-500">by Fizz Data</p>
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
        >
          Submit
        </UButton>
      </UForm>

      <!-- Footer -->
      <p class="mt-8 text-center text-sm text-gray-500">
        <!-- Not an account? -->
        <ULink
          :to="`/reset-password?org_pin=${org_pin}`"
          class="font-semibold text-primary hover:text-gray-500 underline"
        >
          Reset Password!
        </ULink>
      </p>
    </UCard>
  </div>
</template>
