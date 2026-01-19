<script setup>
import { convertTo24Hour } from "~/common/common";
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

const emit = defineEmits(["reload"]);

const editClockingModal = ref(false);
const weeks = ref([]);
const isSubmitting = ref(false);
const today = new Date();
const api = useApi();
const toast = useToast();
const state = reactive({
  id: null,
  day: null,
  session: null,
  session_id: null,
  in: "",
  out: "",
  retzifus: false,
  notes: "",
});
const resetForm = () => {
  state.id = null;
  state.day = null;
  state.session = null;
  state.session_id = null;
  state.in = null;
  state.out = null;
  state.retzifus = null;
  state.notes = null;
};

const editClocking = (clock, type) => {
  const isMorning = type === "morning";

  const prefix = isMorning ? "morning" : "afternoon";

  state.in =
    clock[`${prefix}_in`] === "-"
      ? null
      : convertTo24Hour(clock[`${prefix}_in`]);

  state.out =
    clock[`${prefix}_out`] === "-"
      ? null
      : convertTo24Hour(clock[`${prefix}_out`]);

  state.id = clock[`${prefix}_id`];
  state.day = clock[`${prefix}_day`];
  state.session = clock[`${prefix}_session`];
  state.session_id = clock[`${prefix}_session_id`];

  state.retzifus = isMorning
    ? clock.retzifus_morning !== "NO"
    : clock.retzifus_evening !== "NO";

  editClockingModal.value = true;
};

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
  return props?.items?.find((i) => i.day === day) || null;
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
    currentDate.getDate(),
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
      currentDate.getDate(),
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

const onSubmit = async (event) => {
  isSubmitting.value = true;

  const payload = {
    ...event.data,
    retzifus: event.data.retzifus ? 1 : 0,
  };
  try {
    const response = await api(`/student-portal/clocking/edit`, {
      method: "POST",
      body: payload,
    });

    if (response?.success) {
      toast.add({
        title: "Success",
        description: response?.message || "Schedule updated successfully",
        color: "success",
        duration: 2000,
      });

      emit("reload");
    } else if (response?._data?.message) {
      toast.add({
        title: "Failed",
        description: response._data.message,
        color: "error",
      });
    } else {
      toast.add({
        title: "Failed",
        description:
          response?.message || "Something went wrong. Please try again.",
        color: "error",
      });
    }
  } catch (error) {
    console.error("Submission error:", error);
    toast.add({
      title: "Error",
      description: "An unexpected error occurred.",
      color: "error",
    });
  } finally {
    editClockingModal.value = false;
    isSubmitting.value = false;
    resetForm();
  }
};

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
                <button
                  @click="editClocking(day.data, 'morning')"
                  class="hover:underline cursor-pointer"
                >
                  <div class="bg-blue-50 rounded">
                    <span class="ml-1 text-gray-900">
                      {{ day.data.morning_in }} – {{ day.data.morning_out }} |
                      {{ day.data.retzifus_morning }} |
                      {{ day.data.total_morning }}
                    </span>
                  </div>
                </button>
                <button
                  @click="editClocking(day.data, 'afternoon')"
                  class="hover:underline cursor-pointer"
                >
                  <div class="bg-blue-50 rounded">
                    <span class="ml-1 text-gray-900">
                      {{ day.data.afternoon_in }} –
                      {{ day.data.afternoon_out }} |
                      {{ day.data.retzifus_evening }} |
                      {{ day.data.total_afternoon }}
                    </span>
                  </div>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- edit clocking modal -->
  <UModal v-model:open="editClockingModal">
    <!-- Custom Header -->
    <template #header>
      <div class="flex justify-between w-full">
        <h2 class="text-xl font-bold text-primary">Edit Clocking</h2>

        <!-- Close Button -->
        <UButton
          size="sm"
          variant="outline"
          color="primary"
          class="rounded-full p-2"
          icon="i-lucide-x"
          @click="
            () => {
              editClockingModal = false;
              resetForm();
            }
          "
        >
        </UButton>
      </div>
    </template>

    <template #body>
      <UForm :state="state" class="space-y-4" @submit="onSubmit">
        <div class="grid grid-cols-2 my-6 place-items-center">
          <UFormField label="In" class="flex gap-4 items-center">
            <input
              v-model="state.in"
              type="time"
              name="in"
              id="in"
              step="1"
              class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary p-2.5"
              required
            />
          </UFormField>
          <UFormField label="Out" class="flex gap-4 items-center">
            <input
              v-model="state.out"
              type="time"
              name="out"
              id="out"
              step="1"
              class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary p-2.5"
              required
            />
          </UFormField>
        </div>

        <UCheckbox v-model="state.retzifus" size="lg" label="Retzifus" />
        <UFormField label="Notes" name="notes">
          <UTextarea
            v-model="state.notes"
            placeholder="Enter your notes..."
            class="w-full"
            required
          />
        </UFormField>
        <div
          class="flex justify-end items-center gap-2 mt-4 border-t border-gray-200 pt-4"
        >
          <UButton
            color="neutral"
            variant="solid"
            @click="
              () => {
                editClockingModal = false;
                resetForm();
              }
            "
          >
            Cancel
          </UButton>
          <UButton
            type="submit"
            :loading="isSubmitting"
            :disabled="isSubmitting"
          >
            Confirm
          </UButton>
        </div>
      </UForm>
    </template>
  </UModal>
</template>
