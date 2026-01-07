<script setup>
import { object, string } from "yup";

definePageMeta({
  layout: "sidebar",
  middleware: ["auth"],
});

const file = ref(null);
const api = useApi();
const showModal = ref(false);
const importStudentModal = ref(false);
const isSubmitting = ref(false);
const toast = useToast();
const items = ref([]);
const fetchingWages = ref(false);
const students = ref([]);
const loading = ref(false);
const isActive = ref(false);
const searchTerm = ref("");

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

const form = ref({
  id: null,
  first_name: "",
  last_name: "",
  first_yiddish_name: "",
  last_yiddish_name: "",
  phone: "",
  address: "",
  wage: "",
});

const state = reactive({ ...form.value });

const resetForm = () => {
  Object.assign(form.value, {
    id: null,
    first_name: "",
    last_name: "",
    first_yiddish_name: "",
    last_yiddish_name: "",
    phone: "",
    address: "",
    wage: "",
  });

  Object.assign(state, form.value);
};
const handleClose = () => {
  resetForm();
};

const columns = [
  {
    accessorKey: "first_name",
    header: "Full Name",
    cell: ({ row }) =>
      h(
        resolveComponent("NuxtLink"),
        {
          to: `/students/${row.original.id}`, // dynamic route to student detail page
          class: "text-primary hover:underline cursor-pointer",
        },
        () => row.original.first_name + " " + row.original.last_name
      ),
  },
  { accessorKey: "fingerprints", header: "Fingerprints" },
  { accessorKey: "first_yiddish_name", header: "First Yiddish Name" },
  { accessorKey: "last_yiddish_name", header: "Last Yiddish Name" },
  { accessorKey: "phone", header: "Phone" },
  {
    header: "Quick Actions",
    cell: ({ row }) =>
      h("div", { class: "flex gap-2 items-center" }, [
        // Edit Student Button
        h(
          resolveComponent("UTooltip"),
          { text: "Edit Student" },
          {
            default: () =>
              h(resolveComponent("UButton"), {
                icon: "i-lucide-square-pen",
                size: "md",
                color: "success",
                variant: "soft",
                onClick: () => editStudent(row.original),
              }),
          }
        ),

        // Toggle Active/Inactive Status Button
        h(resolveComponent("USwitch"), {
          modelValue: row.original.active,
          "onUpdate:modelValue": (val) =>
            toggleStudentStatus(row.original, val),
          color: "primary",
          size: "md",
          ui: {
            base: "cursor-pointer",
          },
        }),
      ]),
  },
];

const editStudent = (student) => {
  // Open modal instantly
  showModal.value = true;

  // Fill form instantly
  form.value.id = student.id;
  state.id = student.id;
  state.first_name = student.first_name;
  state.last_name = student.last_name;
  state.first_yiddish_name = student.first_yiddish_name;
  state.last_yiddish_name = student.last_yiddish_name;
  state.phone = student.phone;
  state.address = student.address;
  state.wage = student.wage;

  // Fetch wages in background (non-blocking)
  fetchwages();
};

const toggleStudentStatus = async (student) => {
  // toggle locally
  const newStatus = !student.active;
  student.active = newStatus;

  try {
    const response = await api(`/api/students/${student.id}/status`, {
      method: "PATCH",
      body: {
        active: newStatus,
      },
    });

    if (response?.success) {
      toast.add({
        title: "Success",
        description: response?.msg ? response?.msg : "Student deactivated",
        color: "success",
        duration: 2000,
      });

      await fetchStudents();
    } else {
      toast.add({
        title: "Failed",
        description: response?.msg ? response?.msg : "Unable to deactivate.",
        color: "error",
        duration: 2000,
      });

      await fetchStudents();
    }
  } catch (error) {
    console.error("Submission error:", error);
    toast.add({
      title: "Error",
      description: "An unexpected error occurred.",
      color: "error",
    });
  }
};

const fetchStudents = async () => {
  const fetch = isActive.value
    ? `/api/students?active_only=true`
    : `/api/students?active_only=false`;
  try {
    loading.value = true;
    const response = await api(fetch);
    // console.log(fetch);
    if (response?.success) {
      students.value = response?.Students;
    }
  } catch (err) {
    console.log("🚀 ~ fetchStudents ~ err:", err);
  } finally {
    loading.value = false;
  }
};

// Add computed property to filter student based on search term
const filteredStudents = computed(() => {
  if (!searchTerm.value) return students.value;
  // console.log(students.value);
  const term = searchTerm.value.toLowerCase();

  return students.value.filter((student) => {
    return (
      student.first_name?.toLowerCase().includes(term) ||
      student.last_name?.toLowerCase().includes(term) ||
      student.last_yiddish_name?.toLowerCase().includes(term) ||
      student.first_yiddish_name?.toLowerCase().includes(term)
    );
  });
});

const fetchwages = async () => {
  try {
    fetchingWages.value = true;
    const data = await api(`/api/payroll/groups`);
    if (data?.success) {
      items.value = data.wages_groups.map((item) => ({
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
const isModalOpen = async () => {
  showModal.value = true;
  resetForm();
  await fetchwages();
};
const exportStudent = async () => {
  importStudentModal.value = true;
};

const onSubmit = async (event) => {
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
      await fetchStudents();
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

const handleFileSubmit = async () => {
  console.log("file", file.value);

  if (!file.value) {
    toast.add({
      title: "Failed",
      description: "Please Select File.",
      color: "error",
    });

    return;
  }

  isSubmitting.value = true;
  const formData = new FormData();
  formData.append("file", file.value);
  try {
    const response = await api(`/api/students/import`, {
      method: "POST",
      body: formData,
    });

    if (response?.success) {
      importStudentModal.value = false;
      toast.add({
        title: "Success",
        description: response?.message
          ? response?.message
          : "Data imported successfully",
        color: "success",
        duration: 2000,
      });
      await fetchStudents();
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
    file.value = null;
    importStudentModal.value = false;
    isSubmitting.value = false;
  }
};
onMounted(async () => {
  await fetchStudents();
});

const toggleSwitch = async () => {
  isActive.value = !isActive.value;
  // console.log(isActive.value);

  await fetchStudents();
};
</script>

<template>
  <div class="flex justify-between items-center gap-4">
    <h2 class="text-xl font-bold my-4">All Students</h2>
    <div class="flex justify-end gap-2">
      <UButton
        @click="isModalOpen"
        icon="i-lucide-circle-plus"
        label="Create New Student"
      />
      <UButton
        @click="exportStudent"
        icon="i-lucide-file-text"
        label="Import Students"
      />
    </div>
  </div>

  <div class="flex gap-4 items-center">
    <UInput
      v-model="searchTerm"
      icon="i-lucide-search"
      size="md"
      variant="outline"
      placeholder="Search..."
      :ui="{ trailing: 'pe-1' }"
    >
      <template v-if="searchTerm?.length" #trailing>
        <UButton
          color="neutral"
          variant="link"
          size="sm"
          icon="i-lucide-circle-x"
          aria-label="Clear input"
          @click="searchTerm = ''"
        />
      </template>
    </UInput>

    <USwitch
      :model-value="isActive"
      @update:model-value="toggleSwitch"
      label="Active Only"
    />
  </div>
  <!-- Students Table -->
  <UTable
    :columns="columns"
    :loading="loading"
    :data="filteredStudents"
    class="flex-1 mt-6"
  />

  <!-- Modal for Create New Student -->
  <UModal v-model:open="showModal">
    <!-- Custom Header -->
    <template #header>
      <div class="flex justify-between w-full">
        <h2 class="text-xl font-bold text-primary">
          {{ form.id ? "Update Student" : "Create New Student" }}
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
              handleClose();
              showModal = false;
            }
          "
        >
        </UButton>
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
          @submit="onSubmit"
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
              :items="items"
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
                  handleClose();
                  showModal = false;
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
              {{ form.id ? "Update Student" : "Create Student" }}
            </UButton>
          </div>
        </UForm>
      </div>
    </template>
  </UModal>

  <!-- Modal for Export Students -->
  <UModal v-model:open="importStudentModal">
    <template #header>
      <div class="flex justify-between w-full">
        <h2 class="text-xl font-bold text-primary">Import Students</h2>

        <!-- Close Button -->
        <UButton
          size="sm"
          variant="outline"
          color="primary"
          class="rounded-full p-2"
          icon="i-lucide-x"
          @click="
            () => {
              handleClose();
              importStudentModal = false;
            }
          "
        >
        </UButton>
      </div>
    </template>
    <template #body>
      <UFileUpload
        v-model="file"
        icon="i-lucide-file-text"
        label="Drop your file here"
        description="xlsx,xls or csv (max. 2MB)"
        layout="list"
        :multiple="false"
        accept=".xlsx,.xls,.csv"
        :interactive="false"
        class="w-full min-h-48"
      >
        <template #actions="{ open }">
          <UButton
            label="Select File"
            icon="i-lucide-upload"
            color="neutral"
            variant="outline"
            @click="open()"
          />
        </template>

        <!-- <template #files-bottom="{ removeFile, files }">
          <UButton
            v-if="files?.length"
            label="Remove all files"
            color="neutral"
            
            @click="removeFile()"
          />
        </template> -->
      </UFileUpload>

      <!-- Upload Rules -->
      <div class="bg-white border border-gray-200 rounded-lg p-4 text-sm mt-2">
        <div class="flex flex-col gap-3">
          <div>
            <p class="font-bold text-gray-700">Required Format:</p>
            <p class="text-primary">
              Your Excel must contain the first row as headers:<br />
              <span class="font-semibold text-brand-700">
                First Name | Last Name | First Yiddish Name | Last Yiddish Name
                | Phone | Address | Wage Group
              </span>
              <br />
            </p>
          </div>

          <!-- Sample download button -->
          <UButton
            label="Download Sample Sheet"
            color="primary"
            variant="outline"
            icon="i-lucide-download"
            class="rounded-lg h-fit w-64"
            :ui="{
              base: 'border border-gray-600',
            }"
          />
        </div>
      </div>

      <UButton
        type="submit"
        :loading="isSubmitting"
        :disabled="isSubmitting"
        class="w-full flex justify-center items-center mt-4"
        @click="handleFileSubmit"
      >
        Import Student
      </UButton>
    </template>
  </UModal>
</template>
