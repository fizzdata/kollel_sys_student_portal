<script setup>
import * as yup from "yup";

const toast = useToast();
const saveOrgPin = useCookie("kollel_sys_org_pin");
const route = useRoute();
const org_pin = route.query.org_pin ?? saveOrgPin.value;

const { step, question, state, isSubmitting, apiMessage, requestQuestion, submitAnswer } =
  useResetPassword();

const schema = computed(() =>
  yup.object({
    phone:
      step.value === "phone"
        ? yup
            .string()
            .matches(/^\+?[0-9]{7,15}$/, "Invalid phone number")
            .required("Phone is required")
        : yup.string().notRequired(),

    answer:
      step.value === "answer"
        ? yup.string().required("Answer is required")
        : yup.string().notRequired(),
  }),
);

const onSubmit = async () => {
  if (!org_pin) {
    toast.add({
      title: "Error",
      description: "Organization PIN is missing in the URL.",
      color: "error",
      duration: 2000,
    });
    return;
  }

  const isAnswerStep = step.value === "answer";
  const response = isAnswerStep
    ? await submitAnswer(org_pin)
    : await requestQuestion(org_pin);

  if (response?.success) {
    if (isAnswerStep) {
      toast.add({
        title: "Success",
        description: apiMessage(response, "Password reset successfully!"),
        color: "success",
        duration: 3000,
      });
      navigateTo(`/?org_pin=${org_pin}`);
    }
  } else {
    toast.add({
      title: "Failed",
      description: apiMessage(response, "Something went wrong"),
      color: "error",
      duration: 2000,
    });
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
        <UFormField v-if="step === 'phone'" label="Phone" name="phone">
          <UInput
            v-model="state.phone"
            placeholder="Enter your phone"
            size="lg"
            class="w-full"
          />
        </UFormField>

        <UFormField v-else label="Answer" name="answer">
          <p class="mb-2 text-sm text-gray-600">{{ question }}</p>
          <UInput
            v-model="state.answer"
            placeholder="Enter your answer"
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
