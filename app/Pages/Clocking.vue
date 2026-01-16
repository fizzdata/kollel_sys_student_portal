<script setup>
definePageMeta({ layout: "sidebar" });

const api = useApi();
const clockings = ref([]);
const date_from = ref(30);
const date_to = ref(new Date().toISOString().slice(0, 10));
const loading = ref(false);

const secondsToAmPm = (seconds) => {
  if (seconds == null) return "-";

  let hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;

  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${secs.toString().padStart(2, "0")} ${ampm}`;
};

const secondsToPercent = (workedSeconds, scheduledSeconds) => {
  if (!workedSeconds || !scheduledSeconds) return "-";

  const percent = (workedSeconds / scheduledSeconds) * 100;
  return `${Math.round(percent)}%`;
};

const normalizeClockings = (clockings) => {
  if (!clockings) return [];

  return Object.values(clockings).map((dayEntry) => {
    // Normalize clocking to array
    const sessions = Array.isArray(dayEntry.clocking)
      ? dayEntry.clocking
      : Object.values(dayEntry.clocking || {});

    const row = {
      day: dayEntry.day,

      morning_in: "-",
      morning_out: "-",
      retzifus_morning: "-",
      total_morning: "-",

      afternoon_in: "-",
      afternoon_out: "-",
      retzifus_evening: "-",
      total_afternoon: "-",
    };

    sessions.forEach((s) => {
      if (s.session === 1) {
        row.morning_in = secondsToAmPm(s.in);
        row.morning_out = secondsToAmPm(s.out);
        row.retzifus_morning = s.retzifus === 0 ? "NO" : "-";
        row.total_morning = secondsToPercent(s.out - s.in, s.schedule_total);
      }

      if (s.session === 2) {
        row.afternoon_in = secondsToAmPm(s.in);
        row.afternoon_out = secondsToAmPm(s.out);
        row.retzifus_evening = s.retzifus === 0 ? "NO" : "-";
        row.total_afternoon = secondsToPercent(s.out - s.in, s.schedule_total);
      }
    });

    return row;
  });
};

const daysAgo = () => {
  const today = new Date();
  return new Date(today.setDate(today.getDate() - date_from.value))
    .toISOString()
    .slice(0, 10);
};

const fetchClocking = async () => {
  try {
    loading.value = true;
    const response = await api(`/student-portal/clockings`, {
      query: {
        from: daysAgo(),
        to: date_to.value,
      },
    });

    if (response) {
      clockings.value = normalizeClockings(response?.clockings);
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
        <h2 class="text-xl font-bold">Clocking</h2>
        <div>
          <select
            class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
            v-model="date_from"
            @change="fetchClocking"
          >
            <option value="30">Last 30 Days</option>
            <option value="90">Last 3 Months</option>
            <option value="180">Last 6 Months</option>
          </select>
        </div>
      </div>
    </UCard>

    <div class="my-6">
      <ClockingCalender :items="clockings" />
    </div>

    <div v-if="loading" class="fixed inset-0 z-50 bg-black/10">
      <div class="flex justify-center items-center h-full text-center inset-0">
        <BaseSpinner :show-loader="loading" />
      </div>
    </div>
  </div>
</template>
