<script setup>
definePageMeta({
  layout: "sidebar",
});

const toast = useToast();
const api = useApi();
const { t } = useAppLocale();

const currentPassshow = ref(false);
const newPassShow = ref(false);
const confirmPassShow = ref(false);

const profileLoading = ref(true);
const profile = ref(null);

const wageGroupLabel = computed(() => {
  const groups = profile.value?.groups;
  if (!Array.isArray(groups) || !groups.length) return "N/A";
  return groups.map((group) => group?.name).filter(Boolean).join(", ");
});

const fetchProfile = async () => {
  try {
    profileLoading.value = true;
    const response = await api("/student-portal");
    if (response?.success) {
      profile.value = response;
    }
  } finally {
    profileLoading.value = false;
  }
};

const {
  schema: updatePasswordSchema,
  state: updatePasswordState,
  isSubmitting: isSubmittingPassword,
  submit: submitChangePassword,
} = useChangePassword();

const submitUpdatePassword = async () => {
  const response = await submitChangePassword();

  if (response?.success) {
    toast.add({
      title: t("Success"),
      description: response?.message || t("Password Updated Successfully"),
      color: "success",
      duration: 2000,
    });
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

const {
  schema: securityQuestionSchema,
  state: securityQuestionState,
  isSubmitting: isSubmittingSecurityQuestion,
  fetchQuestion,
  save: saveSecurityQuestion,
} = useSecurityQuestion();

const submitSecurityQuestion = async () => {
  const response = await saveSecurityQuestion();

  if (response?.success) {
    toast.add({
      title: t("Success"),
      description: response?.message || t("Security question saved"),
      color: "success",
      duration: 2000,
    });
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

onMounted(() => {
  fetchProfile();
  fetchQuestion();
});
</script>
<template>
  <div class="space-y-6">
    <UCard class="rounded-2xl shadow-sm">
      <div class="flex justify-between items-center gap-4">
        <h2 class="text-xl font-bold">{{ t("Settings") }}</h2>
      </div>
    </UCard>

    <!-- Profile -->
    <UCard class="rounded-2xl shadow-sm">
      <div v-if="profileLoading" class="flex items-center gap-4">
        <USkeleton class="h-16 w-16 rounded-full" />
        <div class="flex-1 space-y-2">
          <USkeleton class="h-5 w-40" />
          <USkeleton class="h-4 w-64" />
        </div>
      </div>

      <div v-else class="flex flex-col sm:flex-row sm:items-center gap-4">
        <UAvatar
          size="xl"
          :alt="
            profile?.student?.first_yiddish_name +
            ' ' +
            profile?.student?.last_yiddish_name
          "
        />
        <div class="flex-1">
          <div class="flex flex-wrap items-center gap-2">
            <h3 class="text-lg font-semibold">
              {{ profile?.student?.first_yiddish_name || "-" }}
              {{ profile?.student?.last_yiddish_name || "" }}
            </h3>
            <UBadge
              :color="profile?.student?.active ? 'success' : 'error'"
              variant="soft"
            >
              {{ profile?.student?.active ? t("Active") : t("Inactive") }}
            </UBadge>
          </div>

          <div class="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <p class="flex items-start gap-2">
              <UIcon name="i-lucide-user" class="size-4 mt-0.5 text-gray-400 shrink-0" />
              <span>
                <span class="block font-bold text-gray-500">{{ t("English Name") }}</span>
                {{ profile?.student?.first_name || "-" }}
                {{ profile?.student?.last_name || "" }}
              </span>
            </p>
            <p class="flex items-start gap-2">
              <UIcon name="i-lucide-phone" class="size-4 mt-0.5 text-gray-400 shrink-0" />
              <span>
                <span class="block font-bold text-gray-500">{{ t("Phone") }}</span>
                {{ profile?.student?.phone || t("N/A") }}
              </span>
            </p>
            <p class="flex items-start gap-2">
              <UIcon name="i-lucide-map-pin" class="size-4 mt-0.5 text-gray-400 shrink-0" />
              <span>
                <span class="block font-bold text-gray-500">{{ t("Address") }}</span>
                {{ profile?.student?.address || t("N/A") }}
              </span>
            </p>
            <p class="flex items-start gap-2">
              <UIcon name="i-lucide-briefcase" class="size-4 mt-0.5 text-gray-400 shrink-0" />
              <span>
                <span class="block font-bold text-gray-500">{{ t("Wage Group") }}</span>
                {{ wageGroupLabel }}
              </span>
            </p>
          </div>
        </div>
      </div>
    </UCard>

    <!-- Account security -->
    <div class="grid md:grid-cols-2 gap-6 items-start">
      <UCard class="rounded-2xl shadow-sm">
        <div class="flex items-center gap-3 mb-6">
          <div
            class="flex h-9 w-9 items-center justify-center rounded-full bg-gray-50 shrink-0"
          >
            <UIcon name="i-lucide-lock" class="size-4 text-gray-600" />
          </div>
          <h3 class="text-lg font-medium text-gray-800">{{ t("Change Password") }}</h3>
        </div>

        <UForm
          :schema="updatePasswordSchema"
          :state="updatePasswordState"
          class="space-y-4"
          @submit="submitUpdatePassword"
        >
          <UFormField :label="t('Current Password')" name="old_password">
            <UInput
              v-model="updatePasswordState.old_password"
              :placeholder="t('Current Password')"
              :type="currentPassshow ? 'text' : 'password'"
              autocomplete="current-password"
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
                    currentPassshow ? t('Hide password') : t('Show password')
                  "
                  :aria-pressed="currentPassshow"
                  aria-controls="password"
                  @click="currentPassshow = !currentPassshow"
                />
              </template>
            </UInput>
          </UFormField>

          <UFormField :label="t('New Password')" name="password">
            <UInput
              v-model="updatePasswordState.password"
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
                  :aria-label="newPassShow ? t('Hide password') : t('Show password')"
                  :aria-pressed="newPassShow"
                  aria-controls="password"
                  @click="newPassShow = !newPassShow"
                />
              </template>
            </UInput>
          </UFormField>

          <UFormField :label="t('Confirm Password')" name="password_confirmation">
            <UInput
              v-model="updatePasswordState.password_confirmation"
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
                    confirmPassShow ? t('Hide password') : t('Show password')
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
            :loading="isSubmittingPassword"
            :disabled="isSubmittingPassword"
            block
            size="lg"
          >
            {{ t("Update Password") }}
          </UButton>
        </UForm>
      </UCard>

      <UCard class="rounded-2xl shadow-sm">
        <div class="flex items-center gap-3 mb-2">
          <div
            class="flex h-9 w-9 items-center justify-center rounded-full bg-gray-50 shrink-0"
          >
            <UIcon
              name="i-lucide-shield-question"
              class="size-4 text-gray-600"
            />
          </div>
          <h3 class="text-lg font-medium text-gray-800">{{ t("Security Question") }}</h3>
        </div>
        <p class="mb-6 text-sm text-gray-500">
          {{
            t(
              "Used to verify your identity if you ever forget your password. Choose a question and answer only you would know.",
            )
          }}
        </p>

        <UForm
          :schema="securityQuestionSchema"
          :state="securityQuestionState"
          class="space-y-4"
          @submit="submitSecurityQuestion"
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

          <UButton
            type="submit"
            :loading="isSubmittingSecurityQuestion"
            :disabled="isSubmittingSecurityQuestion"
            block
            size="lg"
          >
            {{ t("Save Security Question") }}
          </UButton>
        </UForm>
      </UCard>
    </div>
  </div>
</template>
