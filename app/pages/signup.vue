<script setup>
import * as yup from "yup";

definePageMeta({
  layout: "none",
});
const show = ref(false);
const confirmshow = ref(false);
const toast = useToast();
const api = useApi();
const isSubmitting = ref(false);
const router = useRouter();
const token = useCookie("kollel_sys_token");
const org = useCookie("kollel_sys_org");
const user = useCookie("kollel_sys_user");
const hasAccess = useCookie("kollel_sys_has_access");

const schema = yup.object({
  name: yup
    .string()
    .matches(/^[a-zA-Z\s]+$/, "Invalid name")
    .required("Name is required"),
  email: yup.string().email("Invalid email").required("Email is required"),
  phone: yup
    .string()
    .matches(/^\+?[0-9]{7,15}$/, "Invalid phone number")
    .required("Phone is required"),
  password: yup
    .string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
  password_confirmation: yup
    .string()
    .oneOf([yup.ref("password")], "Passwords must match")
    .required("Confirm Password is required"),
  org_pin: yup.string().required("Org Pin is required"),
});

const state = reactive({
  name: undefined,
  email: undefined,
  phone: undefined,
  password: undefined,
  password_confirmation: undefined,
  org_pin: undefined,
});

async function onSubmit(event) {
  try {
    isSubmitting.value = true;
    const response = await api("/api/register", {
      method: "POST",
      body: event.data,
    });

    if (response?.success) {
      token.value = response?.access_token || "";
      org.value = response?.org || null;
      user.value = response?.user || null;
      hasAccess.value = response?.has_access || [];
      router.push(`/${response?.has_access[0]}`);

      toast.add({
        title: "Success",
        description: response?.message || "Signup Successfully",
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
}
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
    <UCard class="w-full max-w-xl rounded-2xl shadow-xl py-6 sm:py-8">
      <!-- Brand -->
      <div class="mb-6 text-center">
        <ULink to="/">
          <h2 class="text-3xl font-bold text-primary">Kollel System</h2>
        </ULink>
        <ULink to="http://fizzdata.com/" target="_blank" class="block">
          <p class="mt-1 text-sm text-gray-500">by Fizz Data</p>
        </ULink>
      </div>

      <!-- Title -->
      <p class="my-6 text-center text-lg font-medium text-gray-800">
        Sign Up your account
      </p>

      <!-- Form -->
      <UForm
        :schema="schema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <UFormField label="Name" name="name">
            <UInput
              v-model="state.name"
              placeholder="Enter your name"
              size="lg"
              class="w-full"
            />
          </UFormField>
          <UFormField label="Email" name="email">
            <UInput
              v-model="state.email"
              placeholder="Enter your email"
              size="lg"
              class="w-full"
            />
          </UFormField>
          <UFormField label="Phone" name="phone">
            <UInput
              v-model="state.phone"
              placeholder="Enter your phone"
              size="lg"
              class="w-full"
            />
          </UFormField>
          <UFormField label="Org Pin" name="org_pin">
            <UInput
              v-model="state.org_pin"
              placeholder="Enter your org pin"
              size="lg"
              class="w-full"
              type="number"
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
          <UFormField
            label="Password Confirmation"
            name="password_confirmation"
          >
            <UInput
              v-model="state.password_confirmation"
              placeholder="Password Confirmation"
              :type="confirmshow ? 'text' : 'password'"
              :ui="{ trailing: 'pe-1' }"
              class="w-full"
            >
              <template #trailing>
                <UButton
                  color="neutral"
                  variant="link"
                  size="sm"
                  :icon="confirmshow ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                  :aria-label="confirmshow ? 'Hide password' : 'Show password'"
                  :aria-pressed="confirmshow"
                  aria-controls="password"
                  @click="confirmshow = !confirmshow"
                />
              </template>
            </UInput>
          </UFormField>
        </div>
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
          Login!
        </ULink>
      </p>
    </UCard>
  </div>
</template>
