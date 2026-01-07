<script setup>
import { object, string } from "yup";

definePageMeta({
  layout: "none",
});
const show = ref(false);
const api = useApi();
const toast = useToast();
const isSubmitting = ref(false);
const router = useRouter();
const token = useCookie("kollel_sys_token");
const org = useCookie("kollel_sys_org");
const user = useCookie("kollel_sys_user");
const hasAccess = useCookie("kollel_sys_has_access");

const schema = object({
  email: string().email("Invalid email").required("Email is required"),
  password: string()
    .min(8, "Must be at least 8 characters")
    .required("Password is required"),
});

const state = reactive({
  email: undefined,
  password: undefined,
});
const loginResetForm = () => {
  state.email = undefined;
  state.password = undefined;
};

const onSubmit = async (event) => {
  try {
    isSubmitting.value = true;

    const response = await api("/api/login", {
      method: "POST",
      body: event.data,
    });
    //getitem, json.parse

    if (response?.success) {
      token.value = response?.access_token || "";
      org.value = response?.org || null;
      user.value = response?.user || null;
      hasAccess.value = response?.has_access || [];
      router.push(`/${response?.has_access[0]}`);

      loginResetForm();
      toast.add({
        title: "Success",
        description: response?.message || "Login Successfully",
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
        <ULink to="/">
          <h2 class="text-3xl font-bold text-primary">Kollel System</h2>
        </ULink>
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
        <UFormField label="Email" name="email">
          <UInput
            v-model="state.email"
            placeholder="you@example.com"
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
        Not an account?
        <ULink
          to="/signup"
          class="font-semibold text-primary hover:text-gray-500"
        >
          Sign up!
        </ULink>
      </p>
    </UCard>
  </div>
</template>
