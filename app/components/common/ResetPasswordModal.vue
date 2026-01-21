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
  <UModal v-model:open="isOpen">
    <!-- Custom Header -->
    <template #header>
      <div class="flex justify-between w-full">
        <h2 class="text-xl font-bold text-primary">Reset Password</h2>

        <!-- Close Button -->
        <UButton
          size="sm"
          variant="outline"
          color="primary"
          class="rounded-full p-2"
          icon="i-lucide-x"
          @click="
            () => {
              isOpen = false;
              resetPasswordForm();
            }
          "
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
        <div
          class="flex justify-end items-center gap-2 mt-4 border-t border-gray-200 pt-4"
        >
          <UButton
            color="neutral"
            variant="solid"
            @click="
              () => {
                isOpen = false;
                resetPasswordForm();
              }
            "
          >
            Cancel
          </UButton>
          <UButton
            type="submit"
            :loading="isSubmitting"
            :disabled="isSubmitting"
          >
            Confirm
          </UButton>
        </div>
      </UForm>
    </template>
  </UModal>
</template>
