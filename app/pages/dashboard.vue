<script setup>
definePageMeta({ layout: "sidebar" });

const loading = ref(false);
const toast = useToast();
const api = useApi();
const studentPortalDummy = {
  student: {
    first_yiddish_name: "אברהם",
    last_yiddish_name: "אויש",
    phone: "9176851389",
    address: "NY, USA",
    active: 1,
    created_at: "2025-12-23 01:41:20",
  },

  balance: 2862,

  // Morning & Afternoon percentages (This Month)
  percent_m: 12.75,
  percent_a: 18.5,

  // Morning & Afternoon percentages (Last Month)
  percent_m_last: 10.25,
  percent_a_last: 15.75,

  came_on_time_this_month: "82%",
  came_on_time_last_month: "75%",

  groups: [
    {
      name: "ער האט יא פראגראמען - און איז א אברך",
    },
    {
      name: "כולל ערב",
    },
  ],
};

const thisMonthPercent =
  studentPortalDummy.percent_m + studentPortalDummy.percent_a;
// 31.25%

const lastMonthPercent =
  studentPortalDummy.percent_m_last + studentPortalDummy.percent_a_last;
// 26%

const percentDiff = thisMonthPercent - lastMonthPercent;
// +5.25%

const cameOnTimeThis = parseInt(studentPortalDummy.came_on_time_this_month);
// 82

const cameOnTimeLast = parseInt(studentPortalDummy.came_on_time_last_month);
// 75

const fetchStudentInfo = async () => {
  try {
    loading.value = true;
    const response = await api(`/student-portal`);
    console.log("🚀 ~ fetchStudentInfo ~ response:", response);

    if (response?.success) {
      // transaction.value = response?.transaction || [];
    } else {
      toast.add({
        title: "Error",
        description: response?.message || "Failed to fetch Transactions",
        color: "error",
      });
    }
  } catch (error) {
    console.error("Fetch error:", error);
    toast.add({
      title: "Error",
      description: "An unexpected error occurred while fetching transactions",
      color: "error",
    });
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  // await fetchStudentInfo();
});
</script>

<template>
  <UCard class="rounded-2xl shadow-sm">
    <div class="flex items-center gap-4">
      <UAvatar
        size="xl"
        :alt="
          studentPortalDummy?.student.first_yiddish_name +
          ' ' +
          studentPortalDummy?.student.last_yiddish_name
        "
      />
      <div class="flex-1">
        <div class="flex justify-between items-center">
          <h2 class="text-lg font-semibold">
            {{ studentPortalDummy?.student.first_yiddish_name }}
            {{ studentPortalDummy?.student.last_yiddish_name }}
          </h2>
          <UBadge
            :color="studentPortalDummy?.student.active ? 'success' : 'error'"
            variant="soft"
          >
            {{ studentPortalDummy?.student.active ? "Active" : "Inactive" }}
          </UBadge>
        </div>
        <div class="mt-2 grid grid-cols-1 gap-2 text-sm">
          <p>
            <span class="font-medium">Phone:</span>
            {{ studentPortalDummy.student?.phone }}
          </p>
          <p>
            <span class="font-medium">Address:</span>
            {{ studentPortalDummy?.student?.address }}
          </p>
          <p>
            <span class="font-medium">Wage Group:</span>
            {{
              studentPortalDummy?.groups?.map((group) => group.name).join(", ")
            }}
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
            ${{ studentPortalDummy?.balance }}
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
            {{ cameOnTimeThis }}%
            <span class="text-sm text-gray-500 ml-1">
              (Last: {{ cameOnTimeLast }}%)
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
          <p class="text-lg font-semibold">{{ thisMonthPercent }}%</p>
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
          <p class="text-lg font-semibold">{{ lastMonthPercent }}%</p>
        </div>
      </div>
    </div>
  </UCard>

  <UCard class="rounded-2xl my-6">
    <h3 class="font-semibold mb-4">Monthly Percentage Comparison</h3>

    <div class="mx-auto max-w-xs h-96">
      <StudentPercentPie :values="[31.25, 26]" />
    </div>
  </UCard>
</template>
