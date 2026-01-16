<script setup>
import { object, string } from "yup";

definePageMeta({
  layout: false,
});
const currentPassshow = ref(false);
const newPassshow = ref(false);
const toast = useToast();
const isSubmitting = ref(false);

const schema = object({
  current: string()
    .min(8, "Must be at least 8 characters")
    .required("Password is required"),
  password: string()
    .min(8, "Must be at least 8 characters")
    .required("Password is required"),
  confirmed: yup
    .string()
    .oneOf([yup.ref("password")], "Passwords must match") // ✅ Remove `null`
    .required("Confirm Password is required"),
});

const state = reactive({
  current: undefined,
  password: undefined,
});
const loginResetForm = () => {
  state.current = undefined;
  state.password = undefined;
};

const onSubmit = async (event) => {
  try {
    isSubmitting.value = true;

    const response = await api("/update-password", {
      method: "POST",
      body: event.data,
    });
    //getitem, json.parse

    if (response?.success) {
      navigateTo("/login");

      loginResetForm();
      toast.add({
        title: "Success",
        description: response?.message || "Password Updated Successfully",
        color: "success",
        duration: 2000,
      });
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
      </div>

      <!-- Title -->
      <p class="my-6 text-center text-lg font-medium text-gray-800">
        Update your Password
      </p>

      <!-- Form -->
      <UForm
        :schema="schema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField label="Current Password" name="current">
          <UInput
            v-model="state.current"
            placeholder="Current Password"
            :type="currentPassshow ? 'text' : 'password'"
            :ui="{ trailing: 'pe-1' }"
            class="w-full"
          >
            <template #trailing>
              <UButton
                color="neutral"
                variant="link"
                size="sm"
                :icon="currentPassshow ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                :aria-label="
                  currentPassshow ? 'Hide password' : 'Show password'
                "
                :aria-pressed="currentPassshow"
                aria-controls="password"
                @click="currentPassshow = !currentPassshow"
              />
            </template>
          </UInput>
        </UFormField>

        <UFormField label="New Password" name="password">
          <UInput
            v-model="state.password"
            placeholder="New Password"
            :type="newPassshow ? 'text' : 'password'"
            :ui="{ trailing: 'pe-1' }"
            class="w-full"
          >
            <template #trailing>
              <UButton
                color="neutral"
                variant="link"
                size="sm"
                :icon="newPassshow ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                :aria-label="newPassshow ? 'Hide password' : 'Show password'"
                :aria-pressed="newPassshow"
                aria-controls="password"
                @click="newPassshow = !newPassshow"
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
        Already have an account?
        <ULink
          to="/login"
          class="font-semibold text-primary hover:text-gray-500"
        >
          Login
        </ULink>
      </p>
    </UCard>
  </div>
</template>
