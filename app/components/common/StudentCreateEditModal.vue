<!-- Modal for Create New Student -->
<script setup>
import { object, string } from "yup";

const props = defineProps({
  modelValue: { type: Boolean, default: false }, // or whatever type
  selectedStudent: { type: Object, default: () => ({}) },
});

const emit = defineEmits(["update:modelValue", "submit", "cancel"]);

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});

const toast = useToast();
const api = useApi();
const fetchingWages = ref(false);
const wageItems = ref([]);
const showModal = ref(false);
const isSubmitting = ref(false);

const schema = object({
  first_name: string().required("First Name is required"),
  last_name: string().required("Last Name is required"),
  first_yiddish_name: string().required("Yeddish First Name is required"),
  last_yiddish_name: string().required("Yeddish Last Name is required"),
  phone: string()
    .required("Phone is required")
    .matches(/^\d{10}$/, "Phone must be exactly 10 digits"),
  address: string().required("Address is required"),
  wage: string().required("Wage is required"),
});

const state = reactive({
  id: props?.selectedStudent?.id || null,
  first_name: props?.selectedStudent?.first_name || "",
  last_name: props?.selectedStudent?.last_name || "",
  first_yiddish_name: props?.selectedStudent?.first_yiddish_name || "",
  last_yiddish_name: props?.selectedStudent?.last_yiddish_name || "",
  phone: props?.selectedStudent?.phone || "",
  address: props?.selectedStudent?.address || "",
  wage: props?.selectedStudent?.wage || "",
});

// Watch for changes in initialData
watch(
  () => props.selectedStudent,
  (newVal) => {
    if (newVal) {
      Object.assign(state, newVal);
    }
  },
  { immediate: true, deep: true }
);

const resetForm = () => {
  state.id = null;
  state.first_name = "";
  state.last_name = "";
  state.first_yiddish_name = "";
  state.last_yiddish_name = "";
  state.phone = "";
  state.address = "";
  state.wage = "";
};

const handleClose = () => {
  resetForm();
  emit("cancel");
};

const handleSubmit = async (event) => {
  isSubmitting.value = true;

  const endpoint = state.id ? `/api/students/${state.id}` : `/api/students`;
  const method = state.id ? "PUT" : "POST";
  delete event.data.id;

  try {
    const response = await api(endpoint, {
      method: method,
      body: event.data,
    });

    if (response?.success) {
      showModal.value = false;
      toast.add({
        title: "Success",
        description: response?.message
          ? response?.message
          : state.id
          ? "Student updated successfully"
          : "Student created successfully",
        color: "success",
        duration: 2000,
      });
      state.id = null;
      isOpen.value = false;
      emit("submit");
    } else if (response?._data?.message) {
      toast.add({
        title: "Failed",
        description: response._data.message,
        color: "error",
      });
    } else {
      toast.add({
        title: "Failed",
        description:
          response?.message || "Something went wrong. Please try again.",
        color: "error",
      });
    }
  } catch (error) {
    console.error("Submission error:", error);
    toast.add({
      title: "Error",
      description: "An unexpected error occurred.",
      color: "error",
    });
  } finally {
    resetForm();
    showModal.value = false;
    isSubmitting.value = false;
  }
};

const fetchwages = async () => {
  try {
    fetchingWages.value = true;
    const data = await api(`/api/payroll/groups`);
    if (data?.success) {
      wageItems.value = data.wages_groups.map((item) => ({
        label: item.name,
        value: item.id,
      }));
    }
  } catch (err) {
    console.log("🚀 ~ fetchwages ~ err:", err);
  } finally {
    fetchingWages.value = false;
  }
};

onMounted(async () => {
  await fetchwages();
});
</script>
<template>
  <UModal v-model:open="isOpen">
    <!-- Custom Header -->
    <template #header>
      <div class="flex justify-between w-full">
        <h2 class="text-xl font-bold text-primary">
          {{ state?.id ? "Update Student" : "Create New Student" }}
        </h2>

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
              handleClose();
            }
          "
        />
      </div>
    </template>

    <template #body>
      <div
        v-if="fetchingWages"
        class="flex items-center justify-center pt-10 w-full"
      >
        <BaseSpinner :show-loader="fetchingWages" size="md" />
      </div>

      <div v-else>
        <UForm
          :schema="schema"
          :state="state"
          class="space-y-4"
          @submit="handleSubmit"
        >
          <div class="grid grid-cols-2 gap-4">
            <UFormField label="First Name" name="first_name">
              <UInput
                v-model="state.first_name"
                placeholder="First Name"
                class="w-full"
              />
            </UFormField>
            <UFormField label="Last Name" name="last_name">
              <UInput
                v-model="state.last_name"
                placeholder="Last Name"
                class="w-full"
              />
            </UFormField>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <UFormField label="Yiddish First Name" name="first_yiddish_name">
              <UInput
                v-model="state.first_yiddish_name"
                placeholder="First Name"
                class="w-full"
              />
            </UFormField>
            <UFormField label="Yeddish Last Name" name="last_yiddish_name">
              <UInput
                v-model="state.last_yiddish_name"
                placeholder="Last Name"
                class="w-full"
              />
            </UFormField>
          </div>
          <UFormField label="Phone" name="phone">
            <UInput
              v-model="state.phone"
              placeholder="Phone Number"
              class="w-full"
            />
          </UFormField>
          <UFormField label="Address" name="address">
            <UInput
              v-model="state.address"
              placeholder="Address"
              class="w-full"
            />
          </UFormField>
          <UFormField label="Wage" name="wage">
            <USelect
              v-model="state.wage"
              :items="wageItems"
              class="w-full"
              placeholder="Select Your Wage"
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
                  handleClose;
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
              {{ state?.id ? "Update Student" : "Create Student" }}
            </UButton>
          </div>
        </UForm>
      </div>
    </template>
  </UModal>
</template>
