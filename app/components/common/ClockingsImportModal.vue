<script setup>
import { ref } from "vue";

const props = defineProps({
  modelValue: Boolean,
  isLoading: Boolean,
});

const emit = defineEmits(["update:modelValue", "import"]);

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});

const fileInput = ref(null);
const selectedFile = ref(null);
const isSubmitting = ref(false);
const toast = useToast();

const requiredColumns = [
  "Student ID",
  "Date",
  "In",
  "Out",
  "Session",
  "old_id",
];

const handleFileSelect = (event) => {
  const file = event.target.files?.[0];
  if (file) {
    // Validate file type (CSV or Excel)
    const validTypes = [
      "text/csv",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];

    if (!validTypes.includes(file.type)) {
      toast.add({
        title: "Invalid File Type",
        description: "Please upload a CSV or Excel file",
        color: "error",
      });
      return;
    }

    selectedFile.value = file;
  }
};

const downloadTemplate = () => {
  // Create CSV template
  const headers = requiredColumns.join(",");
  const exampleRow = "1,2026-01-14,09:00:00,12:00:00,13:00:00,17:00:00";
  const csvContent = [headers, exampleRow].join("\n");

  // Create blob and download
  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "clockings_template.csv";
  link.click();
  window.URL.revokeObjectURL(url);

  toast.add({
    title: "Success",
    description: "Template downloaded successfully",
    color: "success",
    duration: 2000,
  });
};

const handleSubmit = async () => {
  if (!selectedFile.value) {
    toast.add({
      title: "Error",
      description: "Please select a file to import",
      color: "error",
    });
    return;
  }

  isSubmitting.value = true;

  const formData = new FormData();
  formData.append("file", selectedFile.value);

  try {
    emit("import", formData);
    selectedFile.value = null;
    if (fileInput.value) {
      fileInput.value.value = "";
    }
  } catch (error) {
    console.error("Upload error:", error);
  } finally {
    isSubmitting.value = false;
  }
};

const resetModal = () => {
  selectedFile.value = null;
  if (fileInput.value) {
    fileInput.value.value = "";
  }
};
</script>

<template>
  <UModal v-model:open="isOpen">
    <!-- Custom Header -->
    <template #header>
      <div class="flex justify-between w-full">
        <h2 class="text-xl font-bold text-primary">Import Clockings</h2>

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
              resetModal();
            }
          "
        >
        </UButton>
      </div>
    </template>

    <!-- Modal Body -->
    <template #body>
      <div class="space-y-6">
        <!-- Required Columns Section -->
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 class="font-semibold text-blue-900 mb-3">Required Columns</h3>
          <div class="grid grid-cols-2 gap-2">
            <div
              v-for="(column, index) in requiredColumns"
              :key="index"
              class="flex items-center gap-2 text-sm text-blue-800"
            >
              <UIcon name="i-lucide-check" class="text-blue-600" />
              {{ column }}
            </div>
          </div>
        </div>

        <!-- Download Template Section -->
        <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <p class="text-sm text-gray-600 mb-3">
            Download the CSV template to get started with the correct format:
          </p>
          <UButton
            @click="downloadTemplate"
            icon="i-lucide-download"
            label="Download Template"
            variant="outline"
            color="neutral"
          />
        </div>

        <!-- File Upload Section -->
        <div class="border-2 border-dashed border-gray-300 rounded-lg p-6">
          <div class="text-center">
            <UIcon
              name="i-lucide-upload"
              class="w-12 h-12 mx-auto text-gray-400 mb-3"
            />
            <p class="text-sm text-gray-600 mb-3">
              Select a CSV or Excel file to upload
            </p>

            <div class="flex gap-2 justify-center">
              <input
                ref="fileInput"
                type="file"
                accept=".csv,.xlsx,.xls"
                @change="handleFileSelect"
                class="hidden"
              />
              <UButton
                @click="fileInput?.click()"
                icon="i-lucide-file"
                label="Choose File"
                variant="outline"
                color="primary"
              />
            </div>

            <!-- Selected File Display -->
            <div v-if="selectedFile" class="mt-4">
              <div
                class="inline-flex items-center gap-2 bg-green-50 text-green-800 px-3 py-2 rounded-lg text-sm"
              >
                <UIcon name="i-lucide-check-circle" class="text-green-600" />
                {{ selectedFile.name }}
              </div>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex justify-end items-center gap-2 border-t border-gray-200 pt-4">
          <UButton
            color="neutral"
            variant="solid"
            @click="
              () => {
                isOpen = false;
                resetModal();
              }
            "
          >
            Cancel
          </UButton>
          <UButton
            type="submit"
            :loading="isSubmitting || isLoading"
            :disabled="isSubmitting || isLoading || !selectedFile"
            @click="handleSubmit"
          >
            Import Clockings
          </UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>
