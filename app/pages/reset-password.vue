<script setup>
import * as yup from "yup";

const confirmCode = ref(false);
const toast = useToast();
const api = useApi();
const isSubmitting = ref(false);
const saveOrgPin = useCookie("kollel_sys_org_pin");
const route = useRoute();
const org_pin = route.query.org_pin ?? saveOrgPin.value;

const state = reactive({
  phone: undefined,
});
const resetPasswordForm = () => {
  state.phone = undefined;
};
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
    const endpoint = `/student-portal/password-reset`;

    console.log("event", event.data);

    const response = await api(endpoint, {
      method: "POST",
      body: payload,
    });
    //getitem, json.parse

    if (response?.success) {
      confirmCode.value = true;
      state.phone = event?.data?.phone;
      toast.add({
        title: "Success",
        description: response?.message || "Code Sent!",
        color: "success",
        duration: 2000,
      });
      resetPasswordForm();
      navigateTo(`/?org_pin=${org_pin}`);
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
        Reset your password
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

      <p class="mt-8 text-center text-sm text-gray-500">
        Already have an account?
        <ULink
          :to="`/?org_pin=${org_pin}`"
          class="font-semibold text-primary hover:text-gray-500"
        >
          Login!
        </ULink>
      </p>
    </UCard>
  </div>
</template>
