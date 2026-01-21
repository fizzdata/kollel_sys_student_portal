<script setup>
import * as yup from "yup";
definePageMeta({
  layout: "sidebar",
});
const toast = useToast();
const api = useApi();
const isSubmitting = ref(false);
const activeTab = ref("1");
const currentPassshow = ref(false);
const newPassShow = ref(false);
const confirmPassShow = ref(false);
const org_pin = useCookie("kollel_sys_org_pin");

const updatePasswordSchema = yup.object({
  old_password: yup
    .string()
    .min(1, "Must be at least 1 characters")
    .required("Password is required"),
  password: yup
    .string()
    .min(1, "Must be at least 8 characters")
    .required("Password is required"),
  password_confirmation: yup
    .string()
    .oneOf([yup.ref("password")], "Passwords must match") // ✅ Remove `null`
    .required("Confirm Password is required"),
});

const updatePasswordState = reactive({
  old_password: null,
  password: null,
  password_confirmation: null,
});

const loginResetForm = () => {
  updatePasswordState.old_password = null;
  updatePasswordState.password = null;
  updatePasswordState.password_confirmation = null;
};

const tabs = [
  { label: "Reset Password", key: "reset-password" },
  { label: "Update Password", key: "update-password" },
];

const confirmCode = ref(false);
const schema = computed(() =>
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
});
const resetPasswordForm = () => {
  state.phone = undefined;
};

const onSubmit = async (event) => {
  try {
    if (!org_pin.value) {
      toast.add({
        title: "Error",
        description: "Organization PIN is missing in the URL.",
        color: "error",
        duration: 2000,
      });
      return;
    }

    isSubmitting.value = true;

    const endpoint = confirmCode.value
      ? `/student-portal/password-reset/2`
      : `/student-portal/password-reset/1`;

    const payload = {
      org_pin: org_pin.value,
      ...event.data,
    };

    const response = await api(endpoint, {
      method: "POST",
      body: payload,
    });

    if (response?.success) {
      confirmCode.value = true;
      state.phone = event?.data?.phone;

      toast.add({
        title: "Success",
        description: response?.message || "Code Sent!",
        color: "success",
        duration: 2000,
      });

      navigateTo(`/?org_pin=${org_pin.value}`);
    } else {
      toast.add({
        title: "Failed",
        description: response?.message || "Code Sending Failed",
        color: "error",
        duration: 2000,
      });
    }
  } catch (error) {
    console.error("Error Login:", error);
  } finally {
    isSubmitting.value = false;
    resetPasswordForm();
  }
};

const submitUpdatePassword = async (event) => {
  try {
    isSubmitting.value = true;

    const response = await api("/student-portal/change-password", {
      method: "POST",
      body: event.data,
    });

    if (response?.success) {
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
    loginResetForm();
  }
};
</script>
<template>
  <UCard class="rounded-2xl shadow-sm">
    <div class="flex justify-between items-center gap-4">
      <h2 class="text-xl font-bold">Settings</h2>
    </div>
  </UCard>

  <!-- <UTabs v-model="activeTab" :items="tabs" variant="link" class="mt-6" /> -->
  <!-- <div
    v-if="activeTab === '0'"
    class="relative flex items-center justify-center mt-8"
  >
    <UCard class="w-full max-w-lg p-6 sm:p-8">
      Title
      <p class="my-6 text-center text-lg font-medium text-gray-800">
        Reset your password
      </p>
      <p
        v-if="confirmCode"
        class="my-6 text-center text-base font-medium text-gray-800"
      >
        Please enter your pin.
      </p>

      Form
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
            :disabled="confirmCode"
          />
        </UFormField>

        <UFormField v-if="confirmCode" label="Confirmation Code" name="code">
          <UInput
            v-model="state.code"
            placeholder="Enter your confirmation code"
            size="lg"
            class="w-full"
            type="number"
          />
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
    </UCard>
  </div> -->

  <div
    v-if="activeTab === '1'"
    class="relative flex items-center justify-center mt-8"
  >
    <UCard class="w-full max-w-lg p-6 sm:p-8">
      <!-- Title -->
      <p class="my-6 text-center text-lg font-medium text-gray-800">
        Update your Password
      </p>

      <!-- Form -->
      <UForm
        :schema="updatePasswordSchema"
        :state="updatePasswordState"
        class="space-y-4"
        @submit="submitUpdatePassword"
      >
        <UFormField label="Current Password" name="old_password">
          <UInput
            v-model="updatePasswordState.old_password"
            placeholder="Current Password"
            :type="currentPassshow ? 'text' : 'password'"
            :ui="{ trailing: 'pe-1' }"
            class="w-full"
            size="lg"
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
            v-model="updatePasswordState.password"
            placeholder="New Password"
            :type="newPassShow ? 'text' : 'password'"
            :ui="{ trailing: 'pe-1' }"
            class="w-full"
            size="lg"
          >
            <template #trailing>
              <UButton
                color="neutral"
                variant="link"
                size="sm"
                :icon="newPassShow ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                :aria-label="newPassShow ? 'Hide password' : 'Show password'"
                :aria-pressed="newPassShow"
                aria-controls="password"
                @click="newPassShow = !newPassShow"
              />
            </template>
          </UInput>
        </UFormField>

        <UFormField label="Confirm Password" name="password_confirmation">
          <UInput
            v-model="updatePasswordState.password_confirmation"
            placeholder="Confirm Password"
            :type="confirmPassShow ? 'text' : 'password'"
            :ui="{ trailing: 'pe-1' }"
            class="w-full"
            size="lg"
          >
            <template #trailing>
              <UButton
                color="neutral"
                variant="link"
                size="sm"
                :icon="confirmPassShow ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                :aria-label="
                  confirmPassShow ? 'Hide password' : 'Show password'
                "
                :aria-pressed="confirmPassShow"
                aria-controls="password"
                @click="confirmPassShow = !confirmPassShow"
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
    </UCard>
  </div>
</template>
