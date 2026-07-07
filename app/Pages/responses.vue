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
</template>
