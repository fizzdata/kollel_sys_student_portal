<script setup>
import {
  FormatYear,
  G2H,
  G2Hnumber,
  H2G,
} from "~/common/Gregorian_to_Hebrew.js";

const props = defineProps({
  items: {
    type: Array,
    default: () => [],
  },
});

const weeks = ref([]);
const today = new Date();

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
  return { month: +h[0], day: +h[1], year: h[2] };
}

const hebrewToday = hebrew_date_array(today);
const hYear = ref(hebrewToday.year);
const hMonth = ref(hebrewToday.month);

function month_year() {
  return `${hebrewMonthNames[hMonth.value - 1]} ${FormatYear(hYear.value)}`;
}

function findFirstHebrewMonthDay() {
  return H2G(hYear.value, hMonth.value, 1);
}

function getDataForDay(day) {
  return props.items.find((i) => i.day === day) || null;
}

function generateCalendar() {
  const firstDay = findFirstHebrewMonthDay();
  const weeksArr = [];
  let week = [];

  let currentDate = new Date(firstDay);

  for (let i = 0; i < firstDay.getDay(); i++) {
    week.push({ date: null, data: null });
  }

  const firstHebrewMonth = G2Hnumber(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    currentDate.getDate()
  ).split("/")[0];

  while (true) {
    const dateString = formatDate(currentDate);

    week.push({
      date: dateString,
      data: getDataForDay(dateString),
    });

    currentDate.setDate(currentDate.getDate() + 1);

    if (week.length === 7) {
      weeksArr.push(week);
      week = [];
    }

    const nextHebrewMonth = G2Hnumber(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      currentDate.getDate()
    ).split("/")[0];

    if (nextHebrewMonth !== firstHebrewMonth) {
      if (week.length) {
        while (week.length < 7) week.push({ date: null, data: null });
        weeksArr.push(week);
      }
      break;
    }
  }

  weeks.value = weeksArr;
}

function prevMonth() {
  hMonth.value === 1 ? ((hMonth.value = 13), hYear.value--) : hMonth.value--;
  generateCalendar();
}

function nextMonth() {
  hMonth.value === 13 ? ((hMonth.value = 1), hYear.value++) : hMonth.value++;
  generateCalendar();
}

function g2h(date) {
  if (!date) return "";
  const [y, m, d] = date.split("-");
  return G2H(y, m, d);
}

onMounted(generateCalendar);
watch(() => props.items, generateCalendar, { deep: true });
</script>

<template>
  <div class="calendar">
    <div class="flex justify-between items-center mb-4 flex-wrap gap-2">
      <UButton
        @click="prevMonth"
        icon="i-lucide-arrow-left"
        color="primary"
        variant="solid"
      >
        Previous
      </UButton>
      <h2 class="text-2xl font-bold text-gray-900 text-center flex-1">
        {{ month_year() }}
      </h2>
      <UButton
        @click="nextMonth"
        trailing-icon="i-lucide-arrow-right"
        color="primary"
        variant="solid"
      >
        Next
      </UButton>
    </div>

    <!-- Responsive wrapper -->
    <div class="overflow-x-auto">
      <table class="min-w-full border-collapse table-auto">
        <thead>
          <tr class="bg-gray-200">
            <th
              v-for="d in 7"
              :key="d"
              class="p-2 border text-center text-xs sm:text-sm border-gray-300"
            >
              {{
                [
                  "זונטאג",
                  "מאנטאג",
                  "דינסטאג",
                  "מיטוואך",
                  "דאנערשטאג",
                  "פרייטאג",
                  "שבת קודש",
                ][d - 1]
              }}
            </th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="(week, wi) in weeks" :key="wi">
            <td
              v-for="(day, di) in week"
              :key="di"
              class="p-2 border border-gray-300 align-top min-w-30"
            >
              <!-- Date -->
              <div
                v-if="day.date"
                class="text-xs sm:text-sm font-semibold text-center"
              >
                {{ g2h(day.date) }}
                <div class="text-gray-400 text-[10px] sm:text-xs">
                  {{ day.date }}
                </div>
              </div>

              <!-- Day Data -->
              <div
                v-if="day.data"
                class="mt-2 text-[10px] sm:text-xs p-2 space-y-1 flex flex-col gap-1"
              >
                <div class="bg-blue-50 rounded">
                  <span class="ml-1 text-gray-900">
                    {{ day.data.morning_in }} – {{ day.data.morning_out }} |
                    {{ day.data.retzifus_morning }} |
                    {{ day.data.total_morning }}
                  </span>
                </div>

                <div class="bg-blue-50 rounded">
                  <span class="ml-1 text-gray-900">
                    {{ day.data.afternoon_in }} – {{ day.data.afternoon_out }} |
                    {{ day.data.retzifus_evening }} |
                    {{ day.data.total_afternoon }}
                  </span>
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
