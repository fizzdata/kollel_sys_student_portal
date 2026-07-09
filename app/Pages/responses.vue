<script setup>
import { getDayOfWeek, yiddish_date } from "~/common/Gregorian_to_Hebrew.js";

definePageMeta({ layout: "sidebar" });

const api = useApi();
const loading = ref(false);
const responses = ref([]);
const toast = useToast();
const currentPage = ref(1);
const pageSize = ref(25);
const totalResponses = ref(0);
const totalPages = ref(1);

const fetchResponses = async (page = currentPage.value) => {
  try {
    loading.value = true;
    const response = await api(
      `/student-portal/responses/list?page=${page}&page_size=${pageSize.value}`,
    );

    if (response?.success) {
      currentPage.value = Number(response?.page || page || 1);
      pageSize.value = Number(response?.page_size || pageSize.value);
      totalResponses.value = Number(response?.total_responses || 0);
      totalPages.value = Number(response?.total_pages || 1);
      responses.value = response?.responses || [];
    } else {
      toast.add({
        title: "Error",
        description: response?.message || "Failed to fetch Responses",
        color: "error",
      });
    }
  } catch (error) {
    console.error("Fetch error:", error);
    toast.add({
      title: "Error",
      description: "An unexpected error occurred while fetching responses",
      color: "error",
    });
  } finally {
    loading.value = false;
  }
};

const goToPreviousPage = async () => {
  if (currentPage.value <= 1 || loading.value) return;
  await fetchResponses(currentPage.value - 1);
};

const goToNextPage = async () => {
  if (currentPage.value >= totalPages.value || loading.value) return;
  await fetchResponses(currentPage.value + 1);
};

onMounted(async () => {
  await fetchResponses();
});

// response was historically stored as boolean (1/0), later changed to free text
const formatResponse = (value) => {
  if (value === 1 || value === "1" || value === true) return "Yes";
  if (value === 0 || value === "0" || value === false) return "No";
  return value ?? "-";
};

// Change response
const changeResponseModal = ref(false);
const selectedResponse = ref(null);
const selectedButton = ref(null);
const isSavingResponse = ref(false);

const answerOptions = computed(() => {
  if (!selectedResponse.value) return [];

  return [1, 2, 3]
    .filter((n) => selectedResponse.value[`button_text_${n}`])
    .map((n) => ({
      label: selectedResponse.value[`button_text_${n}`],
      value: n,
    }));
});

const openChangeResponse = (response) => {
  selectedResponse.value = response;
  selectedButton.value = response.response_button ?? null;
  changeResponseModal.value = true;
};

// created_at comes as "Y-m-d H:i:s" from the backend
const capturedAt = computed(() => {
  const createdAt = selectedResponse.value?.created_at;
  if (!createdAt) return null;

  const date = new Date(createdAt.replace(" ", "T"));
  if (isNaN(date)) return createdAt;

  const time = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  const day = createdAt.slice(0, 10);

  return `${getDayOfWeek(day)}, ${yiddish_date(day)} (${day}) at ${time}`;
});

const saveResponse = async () => {
  if (!selectedButton.value) {
    toast.add({
      title: "Validation Error",
      description: "Please select an answer",
      color: "error",
    });
    return;
  }

  try {
    isSavingResponse.value = true;
    const response = await api("/student-portal/responses/update", {
      method: "POST",
      body: {
        id: selectedResponse.value.id,
        response_button: selectedButton.value,
      },
    });

    if (response?.success) {
      toast.add({
        title: "Success",
        description: response?.message || "Response updated",
        color: "success",
        duration: 2000,
      });
      changeResponseModal.value = false;
      selectedResponse.value = null;
      await fetchResponses();
    } else {
      toast.add({
        title: "Failed",
        description: response?.message || "Failed to update response",
        color: "error",
      });
    }
  } catch (error) {
    console.error("Update error:", error);
    toast.add({
      title: "Error",
      description: "An unexpected error occurred while updating the response",
      color: "error",
    });
  } finally {
    isSavingResponse.value = false;
  }
};

const columns = [
  {
    accessorKey: "date",
    header: "Date",
    meta: {
      class: {
        th: "w-40",
      },
    },
    cell: ({ row }) => {
      const date = row.original.date;

      return h("div", { class: "leading-tight" }, [
        h(
          "div",
          { class: "font-medium text-gray-900" },
          `${getDayOfWeek(date)}, ${yiddish_date(date)}`,
        ),
        h("div", { class: "text-xs text-gray-500" }, date),
      ]);
    },
  },
  {
    accessorKey: "question",
    header: "Question",
    meta: {
      class: {
        th: "w-[45%]",
      },
    },
    cell: ({ row }) =>
      h(
        "div",
        {
          class:
            "whitespace-normal break-words leading-snug max-w-[20rem] md:max-w-[30rem]",
        },
        row.original.question || "-",
      ),
  },
  {
    accessorKey: "response",
    header: "Response",
    meta: {
      class: {
        th: "w-32",
      },
    },
    cell: ({ row }) => formatResponse(row.original.response),
  },
  {
    accessorKey: "session",
    header: "Session",
    meta: {
      class: {
        th: "w-24",
      },
    },
    cell: ({ row }) => row.original.session ?? "-",
  },
  {
    header: "Actions",
    meta: {
      class: {
        th: "w-40",
      },
    },
    cell: ({ row }) =>
      row.original.editable
        ? h(resolveComponent("UButton"), {
            label: "Change Response",
            icon: "i-lucide-square-pen",
            size: "sm",
            color: "primary",
            variant: "soft",
            onClick: () => openChangeResponse(row.original),
          })
        : null,
  },
];
</script>
<template>
  <div>
    <UCard class="rounded-2xl shadow-sm">
      <div
        class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div class="space-y-1">
          <h2 class="text-2xl font-semibold text-gray-900">Responses</h2>
        </div>
      </div>
    </UCard>

    <UCard class="my-8 rounded-2xl">
      <UTable
        :columns="columns"
        :loading="loading"
        :data="responses"
        class="flex-1 mt-6"
      />

      <div class="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p class="text-sm text-gray-600">
          Page {{ currentPage }} of {{ totalPages }}
          ({{ totalResponses }} responses)
        </p>

        <div class="flex items-center gap-2">
          <UButton
            label="Previous"
            variant="outline"
            :disabled="loading || currentPage <= 1"
            @click="goToPreviousPage"
          />
          <UButton
            label="Next"
            variant="outline"
            :disabled="loading || currentPage >= totalPages"
            @click="goToNextPage"
          />
        </div>
      </div>
    </UCard>
  </div>

  <!-- Modal for Change Response -->
  <UModal v-model:open="changeResponseModal">
    <template #header>
      <div class="flex justify-between w-full">
        <h2 class="text-xl font-bold text-primary">Change Response</h2>
        <UButton
          size="sm"
          variant="outline"
          color="primary"
          class="rounded-full p-2"
          icon="i-lucide-x"
          @click="changeResponseModal = false"
        />
      </div>
    </template>

    <template #body>
      <div class="space-y-4">
        <p
          class="whitespace-normal break-words leading-snug font-medium text-gray-900"
        >
          {{ selectedResponse?.question }}
        </p>

        <p v-if="capturedAt" class="text-xs text-gray-500">
          Answered on {{ capturedAt }}
        </p>

        <URadioGroup v-model="selectedButton" :items="answerOptions" />

        <div
          class="flex justify-end items-center gap-2 mt-4 border-t border-gray-200 pt-4"
        >
          <UButton
            color="neutral"
            variant="solid"
            label="Cancel"
            @click="changeResponseModal = false"
          />
          <UButton
            :loading="isSavingResponse"
            :disabled="isSavingResponse"
            label="Save"
            @click="saveResponse"
          />
        </div>
      </div>
    </template>
  </UModal>
</template>
