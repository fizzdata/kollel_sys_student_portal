<script setup>
import * as yup from "yup";

const props = defineProps({
  modelValue: { type: Boolean, default: false }, // or whatever type
});

const emit = defineEmits(["update:modelValue", "submit", "cancel"]);

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});

const toast = useToast();
const saveOrgPin = useCookie("kollel_sys_org_pin");
const route = useRoute();
const org_pin = route.query.org_pin ?? saveOrgPin.value;
const { t } = useAppLocale();

const { step, question, state, isSubmitting, apiMessage, reset, requestQuestion, submitAnswer } =
  useResetPassword();

const schema = computed(() =>
  yup.object({
    phone:
      step.value === "phone"
        ? yup
            .string()
            .matches(/^\+?[0-9]{7,15}$/, t("Invalid phone number"))
            .required(t("Phone is required"))
        : yup.string().notRequired(),

    answer:
      step.value === "answer"
        ? yup.string().required(t("Answer is required"))
        : yup.string().notRequired(),
  }),
);

const closeModal = () => {
  isOpen.value = false;
  reset();
};

const onSubmit = async () => {
  if (!org_pin) {
    toast.add({
      title: t("Error"),
      description: t("Organization PIN is missing in the URL."),
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
        title: t("Success"),
        description: apiMessage(response, t("Password reset successfully!")),
        color: "success",
        duration: 3000,
      });
      closeModal();
      navigateTo(`/?org_pin=${org_pin}`);
    }
  } else {
    toast.add({
      title: t("Failed"),
      description: apiMessage(response, t("Something went wrong")),
      color: "error",
      duration: 2000,
    });
  }
};
</script>
<template>
  <UModal v-model:open="isOpen">
    <!-- Custom Header -->
    <template #header>
      <div class="flex justify-between w-full">
        <h2 class="text-xl font-bold text-primary">{{ t("Reset Password") }}</h2>

        <!-- Close Button -->
        <UButton
          size="sm"
          variant="outline"
          color="primary"
          class="rounded-full p-2"
          icon="i-lucide-x"
          @click="closeModal"
        >
        </UButton>
      </div>
    </template>

    <template #body>
      <UForm
        :schema="schema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField v-if="step === 'phone'" :label="t('Phone')" name="phone">
          <UInput
            v-model="state.phone"
            :placeholder="t('Enter your phone')"
            autocomplete="tel"
            size="lg"
            class="w-full"
          />
        </UFormField>

        <UFormField v-else :label="t('Answer')" name="answer">
          <p class="mb-2 text-sm text-gray-600">{{ question }}</p>
          <UInput
            v-model="state.answer"
            :placeholder="t('Enter your answer')"
            size="lg"
            class="w-full"
          />
        </UFormField>

        <div
          class="flex justify-end items-center gap-2 mt-4 border-t border-gray-200 pt-4"
        >
          <UButton color="neutral" variant="solid" @click="closeModal">
            {{ t("Cancel") }}
          </UButton>
          <UButton
            type="submit"
            :loading="isSubmitting"
            :disabled="isSubmitting"
          >
            {{ t("Confirm") }}
          </UButton>
        </div>
      </UForm>
    </template>
  </UModal>
</template>
