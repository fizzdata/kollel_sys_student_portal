<script setup>
import {
  FormatYear,
  G2H,
  G2Hnumber,
  getDayOfWeek as getHebrewDay,
  H2G,
} from "~/common/Gregorian_to_Hebrew.js";
import { getHebrewParasha, sec_to_time } from "~/common/common";

const props = defineProps({
  schedules: {
    type: Object,
    default: () => ({}),
  },
});

const emit = defineEmits(["edit_clicked", "reload", "year_month"]);

const model = reactive({
  id: "",
  day: "",
  start: "",
  end: "",
});

const api = useApi();
const toast = useToast();
const today = new Date();
const hebrewToday = hebrew_date_array(today);

const hYear = ref(hebrewToday.year);
const hMonth = ref(hebrewToday.month);
const isDisabled = ref(false);
const weeks = ref([]);

const hebrewMonthNames = [
  "תשרי",
  "חשון",
  "כסלו",
  "טבת",
  "שבט",
  "אדר א'",
  "אדר ב'",
  "ניסן",
  "אייר",
  "סיון",
  "תמוז",
  "אב",
  "אלול",
];

function formatDate(date) {
  return date.toISOString().split("T")[0];
}

function hebrew_date_array(date) {
  const [y, m, d] = formatDate(date).split("-");
  const h = G2Hnumber(y, m, d).split("/");
  return {
    month: Number(h[0]),
    day: Number(h[1]),
    year: h[2],
  };
}

function findFirstHebrewMonthDay() {
  return H2G(hYear.value, hMonth.value, 1);
}

function month_year() {
  return `${hebrewMonthNames[hMonth.value - 1]} ${FormatYear(hYear.value)}`;
}

function getScheduleForDay(day) {
  return Object.values(props.schedules).find((s) => s.day === day) || null;
}

function generateCalendar() {
  const firstDay = findFirstHebrewMonthDay();
  const weeksArr = [];
  let week = [];

  const firstHebrew = G2Hnumber(
    firstDay.getFullYear(),
    firstDay.getMonth() + 1,
    firstDay.getDate()
  ).split("/")[0];

  let currentDate = new Date(firstDay);

  for (let i = 0; i < firstDay.getDay(); i++) {
    week.push({ date: null, data: null });
  }

  while (true) {
    const dateString = formatDate(currentDate);
    week.push({
      date: { string: dateString, current: new Date(currentDate) },
      data: getScheduleForDay(dateString),
    });

    currentDate.setDate(currentDate.getDate() + 1);

    if (week.length === 7) {
      weeksArr.push(week);
      week = [];
    }

    const nextHebrew = G2Hnumber(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      currentDate.getDate()
    ).split("/")[0];

    if (nextHebrew !== firstHebrew) {
      if (week.length) {
        while (week.length < 7) week.push({ date: null, data: null });
        weeksArr.push(week);
      }
      break;
    }
  }

  weeks.value = weeksArr;
}

function emit_year_month() {
  const from = formatDate(findFirstHebrewMonthDay());
  const toDate = findFirstHebrewMonthDay();
  toDate.setDate(toDate.getDate() + 29);
  emit("year_month", { from, to: formatDate(toDate) });
}

function prevMonth() {
  if (hMonth.value === 1) {
    hMonth.value = 13;
    hYear.value = String(Number(hYear.value) - 1);
  } else {
    hMonth.value--;
  }
  emit_year_month();
  generateCalendar();
}

function nextMonth() {
  if (hMonth.value === 13) {
    hMonth.value = 1;
    hYear.value = String(Number(hYear.value) + 1);
  } else {
    hMonth.value++;
  }
  emit_year_month();
  generateCalendar();
}

function g2h(date) {
  const [y, m, d] = date.split("-");
  return G2H(y, m, d);
}

function edit(current) {
  model.id = current.id;
  model.day = current.day;
  model.start = sec_to_time(current.start, false);
  model.end = sec_to_time(current.end, false);
  emit("edit_clicked", model);
}

async function deleteSchedule(id) {
  isDisabled.value = true;

  try {
    const response = await api(`/api/schedules/destroy/${id}`, {
      method: "DELETE",
    });

    if (response?.success) {
      toast.add({
        title: "Success",
        description: response?.message || "Schedule Deleted Successfully",
        color: "success",
        duration: 2000,
      });

      emit("reload");
    } else {
      toast.add({
        title: "Failed",
        description:
          response?._data.errors ||
          response?._data.message ||
          "Failed to delete Rules",
        color: "error",
        duration: 2000,
      });
    }
  } catch (error) {
    console.error("Error deleting Rules:", error);
  } finally {
    isDisabled.value = false;
  }
}

function hParsha(date) {
  return getHebrewParasha(date);
}

onMounted(generateCalendar);

watch(
  () => props.schedules,
  () => generateCalendar(),
  { deep: true }
);
</script>

<template>
  <div class="calendar">
    <div class="flex justify-between mb-4">
      <UButton
        @click="prevMonth"
        icon="i-lucide-arrow-left"
        color="primary"
        variant="solid"
        >Previous</UButton
      >
      <h2 class="text-3xl font-bold text-gray-900">{{ month_year() }}</h2>
      <UButton
        @click="nextMonth"
        trailing-icon="i-lucide-arrow-right"
        color="primary"
        variant="solid"
      >
        Next
      </UButton>
    </div>

    <table class="w-full border-collapse table-auto">
      <thead>
        <tr class="bg-gray-200"></tr>
        <tr class="bg-gray-200">
          <th class="p-2 border border-gray-300">זונטאג</th>
          <th class="p-2 border border-gray-300">מאנטאג</th>
          <th class="p-2 border border-gray-300">דינסטאג</th>
          <th class="p-2 border border-gray-300">מיטוואך</th>
          <th class="p-2 border border-gray-300">דאנערשטאג</th>
          <th class="p-2 border border-gray-300">פרייטאג</th>
          <th class="p-2 border border-gray-300">שבת קודש</th>
        </tr>
      </thead>

      <tbody>
        <tr v-for="week in weeks" :key="week[0]?.date">
          <td
            v-for="day in week"
            :key="day?.date"
            class="p-2 border border-gray-300 whitespace-normal"
          >
            <div class="h-16 flex flex-col items-center text-sm">
              <span v-if="day?.date" class="flex flex-col">
                {{ g2h(day.date.string) }}
                <small>({{ day.date.string }})</small>
              </span>
            </div>

            <div
              v-if="day?.data"
              v-for="s in day.data.schedule"
              class="mt-2 text-sm bg-yellow-200 p-1 rounded"
            >
              Seder <span v-text="s.session"></span>:
              <span v-html="sec_to_time(s.start)"></span> -
              <span v-html="sec_to_time(s.end)"></span>

              <UButton
                color="success"
                variant="soft"
                class="mt-4"
                icon="i-lucide-square-pen"
                @click="edit(s)"
              />

              <UButton
                color="error"
                variant="soft"
                icon="i-lucide-trash-2"
                class="mt-4"
                :disabled="isDisabled"
                @click="deleteSchedule(s.id)"
              />
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
