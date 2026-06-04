<script setup>
import { secondsToAmPm, secondsToPercent } from "~/common/common";
import { G2Hnumber, H2G } from "~/common/Gregorian_to_Hebrew.js";

definePageMeta({ layout: "sidebar" });

const api = useApi();
const clockings = ref([]);
const loading = ref(false);
const pendingRequests = ref([]);
const last_editable_date = ref("");
const monthPercentages = ref({
  morning: { percent: 0, error_date: "" },
  afternoon: { percent: 0, error_date: "" },
});

const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getHebrewMonthRange = (date = new Date()) => {
  const [year, month, day] = formatDate(date).split("-");
  const [hebrewMonth, , hebrewYear] = G2Hnumber(year, month, day).split("/");
  const firstDay = H2G(hebrewYear, Number(hebrewMonth), 1);
  const currentDate = new Date(firstDay);
  const firstHebrewMonth = G2Hnumber(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    currentDate.getDate(),
  ).split("/")[0];

  while (true) {
    currentDate.setDate(currentDate.getDate() + 1);

    const nextHebrewMonth = G2Hnumber(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      currentDate.getDate(),
    ).split("/")[0];

    if (nextHebrewMonth !== firstHebrewMonth) {
      currentDate.setDate(currentDate.getDate() - 1);
      return {
        from: formatDate(firstDay),
        to: formatDate(currentDate),
      };
    }
  }
};

const activeRange = ref(getHebrewMonthRange());

const normalizeClockings = (clockings) => {
  if (!clockings) return [];

  return Object.values(clockings).map((dayEntry) => {
    const normalizeEntry = (entry) => {
      const isMorning = Number(entry?.session) === 1;
      const prefix = isMorning ? "morning" : "afternoon";
      const totalKey = isMorning ? "total_morning" : "total_afternoon";
      const retzifusKey = isMorning ? "retzifus_morning" : "retzifus_evening";
      const workedSeconds =
        entry?.in != null && entry?.out != null ? entry.out - entry.in : null;

      return {
        ...entry,
        [`${prefix}_day`]: entry?.day ?? dayEntry.day,
        [`${prefix}_id`]: entry?.id ?? null,
        [`${prefix}_session`]: entry?.session ?? null,
        [`${prefix}_session_id`]: entry?.session_id ?? null,
        [`${prefix}_in`]: secondsToAmPm(entry?.in),
        [`${prefix}_out`]: secondsToAmPm(entry?.out),
        [retzifusKey]: entry?.retzifus === 0 ? "NO" : "-",
        [totalKey]: secondsToPercent(workedSeconds, entry?.schedule_total),
      };
    };

    const normalizedClocking = Array.isArray(dayEntry.clocking)
      ? dayEntry.clocking.map(normalizeEntry)
      : Object.fromEntries(
          Object.entries(dayEntry.clocking || {}).map(([key, entry]) => [
            key,
            normalizeEntry(entry),
          ]),
        );

    return {
      day: dayEntry.day,
      clocking: normalizedClocking,
    };
  });
};

const fetchClocking = async (range) => {
  activeRange.value = range ?? activeRange.value ?? getHebrewMonthRange();
  const { from, to } = activeRange.value;

  try {
    loading.value = true;
    const response = await api(`/student-portal/clockings`, {
      query: { from, to },
    });

    if (response) {
      clockings.value = normalizeClockings(response?.clockings);
      pendingRequests.value = response?.pending_edits || [];
      last_editable_date.value = response?.last_editable_date?.slice(0, 10);
      monthPercentages.value = response?.month_percentages || {
        morning: { percent: 0, error_date: "" },
        afternoon: { percent: 0, error_date: "" },
      };
    }
  } catch (err) {
    console.log("🚀 ~ fetchClocking ~ err:", err);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchClocking(activeRange.value);
});
</script>
<template>
  <div class="relative">
    <UCard class="rounded-2xl shadow-sm">
      <div class="flex justify-between items-center gap-4">
        <h2 class="text-xl font-bold">Clocking</h2>
        <!-- <div>
          <select
            class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
            v-model="date_from"
            @change="fetchClocking"
          >
            <option value="30">Last 30 Days</option>
            <option value="90">Last 3 Months</option>
            <option value="180">Last 6 Months</option>
          </select>
        </div> -->
      </div>
    </UCard>

    <div class="my-6">
      <StudentCalender
        :items="clockings"
        :month-percentages="monthPercentages"
        @reload="fetchClocking"
        :pendingRequests="pendingRequests"
        :last_editable_date="last_editable_date"
      />
    </div>

    <div v-if="loading" class="fixed inset-0 z-50 bg-black/10">
      <div class="flex justify-center items-center h-full text-center inset-0">
        <BaseSpinner :show-loader="loading" />
      </div>
    </div>
  </div>
</template>
