<script setup>
import { object, string, ref as yupRef } from "yup";

definePageMeta({
  layout: "default",
  middleware: "auth",
});

const api = useApi();
const toast = useToast();
const isSubmitting = ref(false);

const schema = object({
  current_password: string()
    .min(8, "Must be at least 8 characters")
    .required("Current password is required"),
  password: string()
    .min(8, "Must be at least 8 characters")
    .required("New password is required"),
  password_confirmation: string()
    .oneOf([yupRef("password")], "Passwords must match")
    .required("Password confirmation is required"),
});

const state = reactive({
  current_password: undefined,
  password: undefined,
  password_confirmation: undefined,
});

const showCurrentPassword = ref(false);
const showPassword = ref(false);
const showConfirmPassword = ref(false);

const resetForm = () => {
  state.current_password = undefined;
  state.password = undefined;
  state.password_confirmation = undefined;
};

const onSubmit = async (event) => {
  try {
    isSubmitting.value = true;

    const response = await api("/api/update-password", {
      method: "POST",
      body: event.data,
    });

    if (response?.success) {
      resetForm();
      toast.add({
        title: "Success",
        description: response?.message || "Password updated successfully",
        color: "success",
        duration: 2000,
      });
    } else {
      toast.add({
        title: "Failed",
        description:
          response?._data?.errors ||
          response?._data?.message ||
          "Failed to update password",
        color: "error",
        duration: 2000,
      });
    }
  } catch (error) {
    console.error("Error updating password:", error);
    toast.add({
      title: "Error",
      description: "An error occurred while updating password",
      color: "error",
      duration: 2000,
    });
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <div class="container mx-auto px-4 py-8">
    <div class="max-w-md mx-auto">
      <UCard class="rounded-2xl shadow-xl p-6 sm:p-8">
        <!-- Title -->
        <div class="mb-6">
          <h1 class="text-2xl font-bold text-gray-800">Update Password</h1>
          <p class="mt-2 text-sm text-gray-500">
            Change your account password
          </p>
        </div>

        <!-- Form -->
        <UForm
          :schema="schema"
          :state="state"
          class="space-y-4"
          @submit="onSubmit"
        >
          <!-- Current Password -->
          <UFormField label="Current Password" name="current_password">
            <UInput
              v-model="state.current_password"
              placeholder="Enter your current password"
              :type="showCurrentPassword ? 'text' : 'password'"
              :ui="{ trailing: 'pe-1' }"
              class="w-full"
            >
              <template #trailing>
                <UButton
                  color="neutral"
                  variant="link"
                  size="sm"
                  :icon="
                    showCurrentPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'
                  "
                  :aria-label="
                    showCurrentPassword ? 'Hide password' : 'Show password'
                  "
                  @click="showCurrentPassword = !showCurrentPassword"
                />
              </template>
            </UInput>
          </UFormField>

          <!-- New Password -->
          <UFormField label="New Password" name="password">
            <UInput
              v-model="state.password"
              placeholder="Enter new password"
              :type="showPassword ? 'text' : 'password'"
              :ui="{ trailing: 'pe-1' }"
              class="w-full"
            >
              <template #trailing>
                <UButton
                  color="neutral"
                  variant="link"
                  size="sm"
                  :icon="showPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                  :aria-label="showPassword ? 'Hide password' : 'Show password'"
                  @click="showPassword = !showPassword"
                />
              </template>
            </UInput>
          </UFormField>

          <!-- Confirm Password -->
          <UFormField label="Confirm Password" name="password_confirmation">
            <UInput
              v-model="state.password_confirmation"
              placeholder="Confirm new password"
              :type="showConfirmPassword ? 'text' : 'password'"
              :ui="{ trailing: 'pe-1' }"
              class="w-full"
            >
              <template #trailing>
                <UButton
                  color="neutral"
                  variant="link"
                  size="sm"
                  :icon="
                    showConfirmPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'
                  "
                  :aria-label="
                    showConfirmPassword ? 'Hide password' : 'Show password'
                  "
                  @click="showConfirmPassword = !showConfirmPassword"
                />
              </template>
            </UInput>
          </UFormField>

          <!-- Submit Button -->
          <UButton
            type="submit"
            :loading="isSubmitting"
            :disabled="isSubmitting"
            block
            size="lg"
            class="mt-6"
          >
            Update Password
          </UButton>
        </UForm>

        <!-- Back Link -->
        <div class="mt-4 text-center">
          <ULink to="/dashboard" class="text-sm text-primary hover:underline">
            Back to Dashboard
          </ULink>
        </div>
      </UCard>
    </div>
  </div>
</template>
