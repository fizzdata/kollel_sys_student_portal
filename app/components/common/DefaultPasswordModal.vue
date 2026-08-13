<script setup>
const props = defineProps({
  modelValue: { type: Boolean, default: false },
});

const emit = defineEmits(["update:modelValue"]);

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});

const toast = useToast();
const { t } = useLocale();
const step = ref("password");

const newPassShow = ref(false);
const confirmPassShow = ref(false);

const {
  schema: passwordSchema,
  state: passwordState,
  isSubmitting: isSubmittingPassword,
  submit: submitChangePassword,
} = useChangePassword(true);

const {
  schema: securityQuestionSchema,
  state: securityQuestionState,
  isSubmitting: isSubmittingSecurityQuestion,
  save: saveSecurityQuestion,
} = useSecurityQuestion();

const closeModal = () => {
  isOpen.value = false;
};

watch(isOpen, (open) => {
  if (open) {
    step.value = "password";
  }
});

const onSubmitPassword = async () => {
  const response = await submitChangePassword();

  if (response?.success) {
    toast.add({
      title: t("Success"),
      description: response?.message || t("Password updated successfully"),
      color: "success",
      duration: 2000,
    });
    step.value = "security-question";
  } else {
    toast.add({
      title: t("Failed"),
      description:
        response?._data?.errors ||
        response?._data?.message ||
        response?.message ||
        t("Failed to update password"),
      color: "error",
      duration: 2000,
    });
  }
};

const onSubmitSecurityQuestion = async () => {
  const response = await saveSecurityQuestion();

  if (response?.success) {
    toast.add({
      title: t("Success"),
      description: response?.message || t("Security question saved"),
      color: "success",
      duration: 2000,
    });
    closeModal();
  } else {
    toast.add({
      title: t("Failed"),
      description:
        response?._data?.errors ||
        response?._data?.message ||
        response?.message ||
        t("Failed to save security question"),
      color: "error",
      duration: 2000,
    });
  }
};
</script>
<template>
  <UModal v-model:open="isOpen">
    <template #header>
      <div class="flex justify-between w-full items-center">
        <h2 class="text-xl font-bold text-primary">
          {{
            step === "password"
              ? t("Set a New Password")
              : t("Add a Security Question")
          }}
        </h2>
        <UButton
          size="sm"
          variant="outline"
          color="primary"
          class="rounded-full p-2"
          icon="i-lucide-x"
          @click="closeModal"
        />
      </div>
    </template>

    <template #body>
      <div v-if="step === 'password'">
        <p class="mb-6 text-sm text-gray-500">
          {{
            t(
              "You're still using the default password. Set a new one to keep your account secure.",
            )
          }}
        </p>

        <UForm
          :schema="passwordSchema"
          :state="passwordState"
          class="space-y-4"
          @submit="onSubmitPassword"
        >
          <UFormField :label="t('New Password')" name="password">
            <UInput
              v-model="passwordState.password"
              :placeholder="t('New Password')"
              :type="newPassShow ? 'text' : 'password'"
              autocomplete="new-password"
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
                  @click="newPassShow = !newPassShow"
                />
              </template>
            </UInput>
          </UFormField>

          <UFormField :label="t('Confirm Password')" name="password_confirmation">
            <UInput
              v-model="passwordState.password_confirmation"
              :placeholder="t('Confirm Password')"
              :type="confirmPassShow ? 'text' : 'password'"
              autocomplete="new-password"
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
                  @click="confirmPassShow = !confirmPassShow"
                />
              </template>
            </UInput>
          </UFormField>

          <div class="flex justify-end items-center gap-2 mt-4 border-t border-gray-200 pt-4">
            <UButton color="neutral" variant="solid" @click="closeModal">
              {{ t("Remind Me Later") }}
            </UButton>
            <UButton
              type="submit"
              :loading="isSubmittingPassword"
              :disabled="isSubmittingPassword"
            >
              {{ t("Update Password") }}
            </UButton>
          </div>
        </UForm>
      </div>

      <div v-else>
        <p class="mb-6 text-sm text-gray-500">
          {{
            t(
              "Recommended: set up a security question so you can reset your own password if you ever forget it.",
            )
          }}
        </p>

        <UForm
          :schema="securityQuestionSchema"
          :state="securityQuestionState"
          class="space-y-4"
          @submit="onSubmitSecurityQuestion"
        >
          <UFormField :label="t('Your Security Question')" name="question">
            <UInput
              v-model="securityQuestionState.question"
              :placeholder="t('e.g. What did I name my first bicycle?')"
              size="lg"
              class="w-full"
            />
          </UFormField>

          <UFormField :label="t('Your Answer')" name="answer">
            <UInput
              v-model="securityQuestionState.answer"
              :placeholder="t('Enter your answer')"
              size="lg"
              class="w-full"
            />
          </UFormField>

          <div class="flex justify-end items-center gap-2 mt-4 border-t border-gray-200 pt-4">
            <UButton color="neutral" variant="solid" @click="closeModal">
              {{ t("Maybe Later") }}
            </UButton>
            <UButton
              type="submit"
              :loading="isSubmittingSecurityQuestion"
              :disabled="isSubmittingSecurityQuestion"
            >
              {{ t("Save") }}
            </UButton>
          </div>
        </UForm>
      </div>
    </template>
  </UModal>
</template>
