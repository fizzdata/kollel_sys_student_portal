<script setup>
import { secondsToAmPm, secondsToPercent } from "~/common/common";

definePageMeta({ layout: "sidebar" });

const { t } = useAppLocale();
const api = useApi();
const clockings = ref([]);
const date_from = ref(30);
const date_to = ref(new Date().toISOString().slice(0, 10));
const loading = ref(false);
const pendingRequests = ref([]);
const last_editable_date = ref("");
const monthPercentages = ref(null);
// Helper to get current month's date range in YYYY-MM-DD
const getMonthRange = (date = new Date()) => {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return {
    from: start.toISOString().slice(0, 10),
    to: end.toISOString().slice(0, 10),
  };
};

// clocked in but never out -> no credit, show 0%
const percentFor = (s) => {
  if (s.in != null && s.out == null) return "0%";
  return secondsToPercent(s.out - s.in, s.schedule_total);
};

// A day/session can have more than one clocking (e.g. clocked out and back in
// mid-seder), so each session is an array of punches rather than a single in/out.
const buildPunch = (s) => ({
  id: s.id,
  day: s.day,
  session: s.session,
  session_id: s.session_id,
  schedule_id: s.schedule_id,
  schedule_total: s.schedule_total,
  in: secondsToAmPm(s.in),
  out: secondsToAmPm(s.out),
  in_seconds: s.in,
  out_seconds: s.out,
  retzifus: s.retzifus === 0 ? "NO" : "-",
  percent: percentFor(s),
  question_in: s.question_in,
  question_out: s.question_out,
});

// no daily_session scheduled for this day/session at all
const emptyPunch = () => ({
  id: null,
  day: "",
  session: "",
  session_id: "",
  schedule_id: null,
  schedule_total: null,
  in: "-",
  out: "-",
  in_seconds: null,
  out_seconds: null,
  retzifus: "-",
  percent: "-",
  question_in: null,
  question_out: null,
});

const normalizeClockings = (clockings) => {
  if (!clockings) return [];

  return Object.values(clockings).map((dayEntry) => {
    const sessions = Array.isArray(dayEntry.clocking)
      ? dayEntry.clocking
      : Object.values(dayEntry.clocking || {});

    const morning = sessions.filter((s) => s.session === 1).map(buildPunch);
    const afternoon = sessions.filter((s) => s.session === 2).map(buildPunch);

    return {
      day: dayEntry.day,
      morning: morning.length ? morning : [emptyPunch()],
      afternoon: afternoon.length ? afternoon : [emptyPunch()],
    };
  });
};

const daysAgo = () => {
  const today = new Date();
  return new Date(today.setDate(today.getDate() - date_from.value))
    .toISOString()
    .slice(0, 10);
};

// Updated: accepts optional { from, to } range. Defaults to current month.
const fetchClocking = async (range) => {
  console.log("🚀 ~ fetchClocking ~ range:", range);
  const { from, to } = range?.from && range?.to ? range : getMonthRange();

  try {
    loading.value = true;
    const response = await api(`/student-portal/clockings`, {
      query: { from, to },
    });

    if (response) {
      clockings.value = normalizeClockings(response?.clockings);
      pendingRequests.value = response?.pending_edits || [];
      last_editable_date.value = response?.last_editable_date?.slice(0, 10);
      monthPercentages.value = response?.month_percentages || null;
      console.log("🚀 ~ fetchClocking ~ clockings.value :", clockings.value);
    }
  } catch (err) {
    console.log("🚀 ~ fetchClocking ~ err:", err);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchClocking();
});
</script>
<template>
  <div class="relative">
    <UCard class="rounded-2xl shadow-sm">
      <div class="flex justify-between items-center gap-4">
        <h2 class="text-xl font-bold">{{ t("Clocking") }}</h2>
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
        @reload="fetchClocking"
        :pendingRequests="pendingRequests"
        :last_editable_date="last_editable_date"
        :monthPercentages="monthPercentages"
      />
    </div>

    <div v-if="loading" class="fixed inset-0 z-50 bg-black/10">
      <div class="flex justify-center items-center h-full text-center inset-0">
        <BaseSpinner :show-loader="loading" />
      </div>
    </div>
  </div>
</template>
