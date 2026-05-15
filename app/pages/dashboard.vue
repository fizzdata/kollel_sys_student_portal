<script setup>
definePageMeta({ layout: "sidebar" });

const loading = ref(false);
const profileLoaded = ref(false);
const toast = useToast();
const api = useApi();
const studentPortal = ref(null);

const toNumber = (value) => {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = parseFloat(value.replace("%", ""));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const thisMonthPercent = computed(
  () =>
    toNumber(studentPortal.value?.percent_m) +
    toNumber(studentPortal.value?.percent_a)
);

const lastMonthPercent = computed(
  () =>
    toNumber(studentPortal.value?.percent_m_last) +
    toNumber(studentPortal.value?.percent_a_last)
);

const percentDiff = computed(() => thisMonthPercent.value - lastMonthPercent.value);

const cameOnTimeThis = computed(() =>
  toNumber(studentPortal.value?.came_on_time_this_month)
);

const cameOnTimeLast = computed(() =>
  toNumber(studentPortal.value?.came_on_time_last_month)
);

const wageGroupLabel = computed(() => {
  const groups = studentPortal.value?.groups;
  if (!Array.isArray(groups) || !groups.length) return "N/A";
  return groups.map((group) => group?.name).filter(Boolean).join(", ");
});

const pieValues = computed(() => [thisMonthPercent.value, lastMonthPercent.value]);

const fetchStudentInfo = async () => {
  try {
    loading.value = true;
    const response = await api(`/student-portal`);

    if (response?.success) {
      studentPortal.value = response;
      profileLoaded.value = true;
    } else {
      toast.add({
        title: "Error",
        description: response?.message || "Failed to fetch dashboard data",
        color: "error",
      });
    }
  } catch (error) {
    toast.add({
      title: "Error",
      description: "An unexpected error occurred while fetching dashboard data",
      color: "error",
    });
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  await fetchStudentInfo();
});
</script>

<template>
  <div v-if="loading" class="space-y-4">
    <USkeleton class="h-28 w-full rounded-2xl" />
    <div class="grid md:grid-cols-3 gap-4">
      <USkeleton class="h-24 w-full rounded-2xl" />
      <USkeleton class="h-24 w-full rounded-2xl" />
      <USkeleton class="h-24 w-full rounded-2xl" />
    </div>
    <USkeleton class="h-24 w-full rounded-2xl" />
    <USkeleton class="h-96 w-full rounded-2xl" />
  </div>

  <UAlert
    v-else-if="!profileLoaded || !studentPortal"
    title="Unable to load dashboard"
    description="Please refresh the page or try again later."
    color="error"
    variant="soft"
    class="mb-6"
  />

  <div v-else>
  <UCard class="rounded-2xl shadow-sm">
    <div class="flex items-center gap-4">
      <UAvatar
        size="xl"
        :alt="
          studentPortal?.student?.first_yiddish_name +
          ' ' +
          studentPortal?.student?.last_yiddish_name
        "
      />
      <div class="flex-1">
        <div class="flex justify-between items-center">
          <h2 class="text-lg font-semibold">
            {{ studentPortal?.student?.first_yiddish_name || "-" }}
            {{ studentPortal?.student?.last_yiddish_name || "" }}
          </h2>
          <UBadge
            :color="studentPortal?.student?.active ? 'success' : 'error'"
            variant="soft"
          >
            {{ studentPortal?.student?.active ? "Active" : "Inactive" }}
          </UBadge>
        </div>
        <div class="mt-2 grid grid-cols-1 gap-2 text-sm">
          <p>
            <span class="font-medium">Phone:</span>
            {{ studentPortal?.student?.phone || "N/A" }}
          </p>
          <p>
            <span class="font-medium">Address:</span>
            {{ studentPortal?.student?.address || "N/A" }}
          </p>
          <p>
            <span class="font-medium">Wage Group:</span>
            {{ wageGroupLabel }}
          </p>
        </div>
      </div>
    </div>
  </UCard>

  <div class="grid md:grid-cols-3 gap-4 mt-6">
    <!-- Balance -->
    <UCard class="rounded-2xl">
      <div class="flex gap-4">
        <div
          class="flex h-9 w-9 items-center justify-center rounded-full bg-gray-50 shrink-0"
        >
          <UIcon name="i-lucide-wallet" class="size-4 text-gray-600" />
        </div>

        <div class="flex-1">
          <p class="text-sm text-gray-500 mb-1">Available Balance</p>
          <p class="text-xl font-semibold">
            ${{ toNumber(studentPortal?.balance).toFixed(2) }}
          </p>
        </div>
      </div>
    </UCard>

    <!-- % Comparison -->
    <UCard class="rounded-2xl">
      <div class="flex gap-4">
        <div
          class="flex h-9 w-9 items-center justify-center rounded-full bg-amber-50 shrink-0"
        >
          <UIcon name="i-lucide-percent" class="size-4 text-amber-600" />
        </div>
        <div class="flex-1">
          <p class="text-sm text-gray-500 mb-1">This Month vs Last</p>
          <p
            class="text-xl font-semibold"
            :class="percentDiff >= 0 ? 'text-success' : 'text-error'"
          >
            {{ percentDiff >= 0 ? "+" : "" }}{{ percentDiff.toFixed(2) }}%
          </p>
        </div>
      </div>
    </UCard>

    <!-- Came On Time -->
    <UCard class="rounded-2xl">
      <div class="flex gap-4">
        <div
          class="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-50 shrink-0"
        >
          <UIcon name="i-lucide-clock" class="size-4 text-indigo-600" />
        </div>
        <div class="flex-1">
          <p class="text-sm text-gray-500 mb-1">Came On Time</p>
          <p class="text-xl font-semibold">
            {{ cameOnTimeThis.toFixed(0) }}%
            <span class="text-sm text-gray-500 ml-1">
              (Last: {{ cameOnTimeLast.toFixed(0) }}%)
            </span>
          </p>
        </div>
      </div>
    </UCard>
  </div>

  <UCard class="rounded-2xl mt-6">
    <div class="grid grid-cols-2 gap-4">
      <!-- This Month -->
      <div class="flex items-center gap-3">
        <div
          class="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 shrink-0"
        >
          <UIcon
            name="i-lucide-calendar-days"
            class="size-4 text-emerald-600"
          />
        </div>
        <div>
          <p class="text-sm text-gray-500">This Month</p>
          <p class="text-lg font-semibold">{{ thisMonthPercent.toFixed(2) }}%</p>
        </div>
      </div>

      <!-- Last Month -->
      <div class="flex items-center gap-3">
        <div
          class="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 shrink-0"
        >
          <UIcon name="i-lucide-calendar-clock" class="size-4 text-gray-600" />
        </div>
        <div>
          <p class="text-sm text-gray-500">Last Month</p>
          <p class="text-lg font-semibold">{{ lastMonthPercent.toFixed(2) }}%</p>
        </div>
      </div>
    </div>
  </UCard>

  <UCard class="rounded-2xl my-6">
    <h3 class="font-semibold mb-4">Monthly Percentage Comparison</h3>

    <div class="mx-auto max-w-xs h-96">
      <StudentPercentPie :values="pieValues" />
    </div>
  </UCard>
  </div>
</template>
