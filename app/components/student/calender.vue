<script setup>
import { convertTo24Hour } from "~/common/common";
import {
  FormatYear,
  G2H,
  G2Hnumber,
  H2G,
} from "~/common/Gregorian_to_Hebrew.js";
import { h } from "vue";
import { UIcon } from "#components"; // Nuxt UI auto-import may already handle this

const props = defineProps({
  items: {
    type: Array,
    default: () => [],
  },
  pendingRequests: {
    type: Array,
    default: () => [],
  },
  last_editable_date: {
    type: String,
    default: "",
  },
  monthPercentages: {
    type: Object,
    default: null,
  },
});

// { percent, error_date } -> display string; error_date means a day with no
// clock-out was excluded from the calculation
const formatMonthPercent = (p) => {
  if (!p) return "-";
  return `${Math.round(p.percent)}%`;
};

const emit = defineEmits(["reload"]);
const currentRange = ref({ from: null, to: null });
const firstDate = ref(null);
const lastDate = ref(null);
const deletePendingModal = ref(false);
const selectedPendingToDelete = ref(null);

// "calendar" (default) or "list"
const view = ref("calendar");

function notifyRange() {
  if (firstDate.value && lastDate.value) {
    currentRange.value = { from: firstDate.value, to: lastDate.value };
    emit("reload", currentRange.value);
  }
}

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

// ---------- Session details modal ----------
const detailsModal = ref(false);
const detailsRow = ref(null);
const detailsType = ref(null);

const details = computed(() => {
  const row = detailsRow.value;
  if (!row) return null;

  const prefix = detailsType.value === "morning" ? "morning" : "afternoon";
  const day = row[`${prefix}_day`] || row.day;

  return {
    type: detailsType.value,
    label: detailsType.value === "morning" ? "Morning Seder" : "Afternoon Seder",
    day,
    id: row[`${prefix}_id`],
    session: row[`${prefix}_session`],
    schedule_id: row[`${prefix}_schedule_id`],
    in: row[`${prefix}_in`],
    out: row[`${prefix}_out`],
    percent: prefix === "morning" ? row.total_morning : row.total_afternoon,
    retzifus: prefix === "morning" ? row.retzifus_morning : row.retzifus_evening,
    question_in: row[`${prefix}_question_in`],
    question_out: row[`${prefix}_question_out`],
    status: is_editable(row[`${prefix}_id`], day, row[`${prefix}_session`]),
  };
});

const detailQuestions = computed(() => {
  if (!details.value) return [];
  return [
    { dir: "in", label: "Clock-In Question", q: details.value.question_in },
    { dir: "out", label: "Clock-Out Question", q: details.value.question_out },
  ].filter((item) => item.q);
});

const openDetails = (current, type) => {
  detailsRow.value = current;
  detailsType.value = type;
  closeQuestionEditor();
  detailsModal.value = true;
};

const closeDetails = () => {
  detailsModal.value = false;
  closeQuestionEditor();
};

const editTimesFromDetails = () => {
  const status = details.value?.status;

  if (status === "p") {
    toast.add({
      title: "This entry is Pending",
      color: "warning",
    });
    return;
  }

  if (status === "l") {
    toast.add({
      title: "This entry is Locked",
      color: "info",
    });
    return;
  }

  const row = detailsRow.value;
  const type = detailsType.value;
  closeDetails();
  editClocking(row, type);
};

// ---------- Answer / change a question response ----------
const activeQuestion = ref(null); // { dir: 'in' | 'out', q }
const selectedButton = ref(null);
const isSavingResponse = ref(false);

const openQuestionEditor = (dir, q) => {
  activeQuestion.value = { dir, q };
  selectedButton.value = q.response?.response_button ?? null;
};

const closeQuestionEditor = () => {
  activeQuestion.value = null;
  selectedButton.value = null;
};

const answerOptions = computed(() => {
  const q = activeQuestion.value?.q;
  if (!q) return [];

  return [1, 2, 3]
    .filter((n) => q[`button_text_${n}`])
    .map((n) => ({
      label: q[`button_text_${n}`],
      value: n,
    }));
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

  const q = activeQuestion.value.q;
  const isChange = !!q.response;

  const url = isChange
    ? "/student-portal/responses/update"
    : "/student-portal/responses/store";

  const body = isChange
    ? { id: q.response.id, response_button: selectedButton.value }
    : {
        question_id: q.question_id,
        session_id: details.value.schedule_id,
        date: details.value.day,
        response_button: selectedButton.value,
      };

  try {
    isSavingResponse.value = true;
    const response = await api(url, { method: "POST", body });

    if (response?.success) {
      toast.add({
        title: "Success",
        description: response?.message || "Response saved",
        color: "success",
        duration: 2000,
      });
      closeDetails();
      emit("reload", currentRange.value);
    } else {
      toast.add({
        title: "Failed",
        description: response?.message || "Failed to save response",
        color: "error",
      });
    }
  } catch (error) {
    console.error("Response save error:", error);
    toast.add({
      title: "Error",
      description: "An unexpected error occurred while saving the response",
      color: "error",
    });
  } finally {
    isSavingResponse.value = false;
  }
};

// does this session have a question the student still needs to answer?
const hasUnanswered = (row, type) => {
  const prefix = type === "morning" ? "morning" : "afternoon";
  return ["in", "out"].some(
    (dir) => row[`${prefix}_question_${dir}`]?.can_answer,
  );
};

// the session's questions, for the list view
const questionsFor = (row, type) => {
  const prefix = type === "morning" ? "morning" : "afternoon";
  return [
    { dir: "in", label: "In", q: row[`${prefix}_question_in`] },
    { dir: "out", label: "Out", q: row[`${prefix}_question_out`] },
  ].filter((item) => item.q);
};

// open the details modal with a question's answer editor already expanded
const openDetailsWithQuestion = (row, type, dir) => {
  openDetails(row, type);
  const q =
    dir === "in" ? details.value?.question_in : details.value?.question_out;
  if (q && (q.can_answer || q.can_change)) {
    openQuestionEditor(dir, q);
  }
};

const deletePending = (clock, type) => {
  const isMorning = type === "morning";

  const prefix = isMorning ? "morning" : "afternoon";

  let id = clock[`${prefix}_id`];
  let day = clock[`${prefix}_day`];
  let session = clock[`${prefix}_session`];

  const pendingId = props.pendingRequests.find((request) => {
    if (id === null) {
      return request.day === day && request.session === session;
    } else {
      return request.clocking_id === id;
    }
  })?.id;

  selectedPendingToDelete.value = pendingId;
  deletePendingModal.value = true;
  return;
};

function button_text(current, type) {
  const isMorning = type === "morning";

  const prefix = isMorning ? "morning" : "afternoon";

  let id = current[`${prefix}_id`];
  let day = current[`${prefix}_day`];
  let session = current[`${prefix}_session`];

  const status = is_editable(id, day, session);

  if (status === "p") {
    return h(UIcon, {
      name: "la:hourglass",
      class: "w-5 h-5 text-gray-500",
    });
  }

  if (status === "l") {
    return h(UIcon, {
      src: "la:lock",
      class: "w-5 h-5 text-gray-500",
    });
  }

  return h(UIcon, {
    name: "la:pen",
    class: "w-5 h-5 ",
  });
}

const confirmDeletePending = async () => {
  isSubmitting.value = true;

  try {
    const response = await api(`/student-portal/clocking/delete-pending`, {
      method: "POST",
      body: { pending_id: selectedPendingToDelete.value },
    });

    if (response?.success) {
      toast.add({
        title: "Success",
        description: response?.message || "Pending Request Deleted",
        color: "success",
        duration: 2000,
      });
      emit("reload", currentRange.value);
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
    selectedPendingToDelete.value = null;
    deletePendingModal.value = false;
    isSubmitting.value = false;
  }
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
    week.push({ date: dateString, data: getDataForDay(dateString) });

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

  // Month-basis range: first day of current Hebrew month to the day before the next Hebrew month
  firstDate.value = formatDate(firstDay);
  const lastDay = new Date(currentDate);
  lastDay.setDate(lastDay.getDate() - 1);
  lastDate.value = formatDate(lastDay);
  currentRange.value = { from: firstDate.value, to: lastDate.value };
}

// list view: every day of the month that has data, in date order
const listDays = computed(() =>
  weeks.value.flat().filter((d) => d.date && d.data),
);

function prevMonth() {
  hMonth.value === 1 ? ((hMonth.value = 13), hYear.value--) : hMonth.value--;
  generateCalendar();
  notifyRange();
}

function nextMonth() {
  hMonth.value === 13 ? ((hMonth.value = 1), hYear.value++) : hMonth.value++;
  generateCalendar();
  notifyRange();
}

function g2h(date) {
  if (!date) return "";
  const [y, m, d] = date.split("-");
  return G2H(y, m, d);
}

function is_editable(id, date, session) {
  var last_editable_date = new Date(props.last_editable_date);
  var clocking = new Date(date);

  if (clocking < last_editable_date) {
    return "l";
  }

  for (let key in props.pendingRequests) {
    if (props.pendingRequests.hasOwnProperty(key)) {
      let request = props.pendingRequests[key];
      if (id === null) {
        if (request.day === date && request.session === session) {
          return "p";
        }
      } else {
        if (request.clocking_id === id) {
          return "p";
        }
      }
    }
  }

  return "e";
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
        description: h("span", {
          innerHTML: response?.message || "Schedule updated successfully",
        }),
        color: "success",
        duration: 2000,
      });

      emit("reload", currentRange.value);
    } else if (response?._data?.message) {
      toast.add({
        title: "Failed",
        description: h("span", {
          innerHTML: response._data.message,
        }),
        color: "error",
      });
    } else {
      toast.add({
        title: "Failed",
        description: h("span", {
          innerHTML:
            response?.message || "Something went wrong. Please try again.",
        }),

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

    <!-- Month totals per seder -->
    <div
      v-if="monthPercentages"
      class="flex justify-center gap-6 mb-4 text-sm sm:text-base"
    >
      <div class="bg-gray-50 rounded-lg px-4 py-2 text-center">
        <span class="text-gray-500">Morning Seder:</span>
        <span class="font-bold text-gray-900 ml-1">
          {{ formatMonthPercent(monthPercentages.morning) }}
        </span>
        <UIcon
          v-if="monthPercentages.morning?.error_date"
          name="i-lucide-triangle-alert"
          class="w-4 h-4 text-warning-500 ml-1 align-middle"
          :title="`Excluding ${monthPercentages.morning.error_date} (missing clock-out)`"
        />
      </div>
      <div class="bg-gray-50 rounded-lg px-4 py-2 text-center">
        <span class="text-gray-500">Afternoon Seder:</span>
        <span class="font-bold text-gray-900 ml-1">
          {{ formatMonthPercent(monthPercentages.afternoon) }}
        </span>
        <UIcon
          v-if="monthPercentages.afternoon?.error_date"
          name="i-lucide-triangle-alert"
          class="w-4 h-4 text-warning-500 ml-1 align-middle"
          :title="`Excluding ${monthPercentages.afternoon.error_date} (missing clock-out)`"
        />
      </div>
    </div>

    <!-- View toggle -->
    <div class="flex justify-center mb-4 gap-2">
      <UButton
        icon="i-lucide-calendar"
        :variant="view === 'calendar' ? 'solid' : 'outline'"
        color="primary"
        size="sm"
        @click="view = 'calendar'"
      >
        Calendar
      </UButton>
      <UButton
        icon="i-lucide-list"
        :variant="view === 'list' ? 'solid' : 'outline'"
        color="primary"
        size="sm"
        @click="view = 'list'"
      >
        List
      </UButton>
    </div>

    <!-- Calendar view -->
    <div v-if="view === 'calendar'" class="overflow-x-auto">
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
                <div
                  v-for="type in ['morning', 'afternoon']"
                  :key="type"
                  class="flex items-center justify-center gap-2"
                >
                  <button
                    @click="openDetails(day.data, type)"
                    class="hover:underline cursor-pointer"
                  >
                    <div
                      class="bg-blue-50 rounded flex items-center px-1"
                      :class="{
                        'bg-warning-100':
                          is_editable(
                            day.data[`${type}_id`],
                            day.data[`${type}_day`],
                            day.data[`${type}_session`],
                          ) === 'p',
                      }"
                    >
                      <component :is="button_text(day.data, type)" />

                      <span class="ml-1 text-gray-900">
                        {{ day.data[`${type}_in`] }} –
                        {{ day.data[`${type}_out`] }}
                      </span>

                      <UIcon
                        v-if="hasUnanswered(day.data, type)"
                        name="i-lucide-circle-help"
                        class="w-4 h-4 text-warning-500 ml-1"
                      />
                    </div>
                  </button>

                  <UButton
                    v-if="
                      is_editable(
                        day.data[`${type}_id`],
                        day.data[`${type}_day`],
                        day.data[`${type}_session`],
                      ) === 'p'
                    "
                    color="error"
                    variant="soft"
                    icon="i-lucide-trash-2"
                    size="xs"
                    @click="deletePending(day.data, type)"
                  />
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- List view -->
    <div v-else class="overflow-x-auto">
      <table class="min-w-full border-collapse table-auto">
        <thead>
          <tr class="bg-gray-200 text-xs sm:text-sm">
            <th class="p-2 border border-gray-300 text-left">Date</th>
            <th class="p-2 border border-gray-300 text-left">Seder</th>
            <th class="p-2 border border-gray-300 text-left">In</th>
            <th class="p-2 border border-gray-300 text-left">Out</th>
            <th class="p-2 border border-gray-300 text-left">%</th>
            <th class="p-2 border border-gray-300 text-left">Retzifus</th>
            <th class="p-2 border border-gray-300 text-left">Questions</th>
            <th class="p-2 border border-gray-300"></th>
          </tr>
        </thead>
        <tbody>
          <template v-for="day in listDays" :key="day.date">
            <tr
              v-for="type in ['morning', 'afternoon']"
              :key="`${day.date}-${type}`"
              class="text-xs sm:text-sm hover:bg-blue-50 cursor-pointer"
              :class="{
                'bg-warning-100':
                  is_editable(
                    day.data[`${type}_id`],
                    day.data[`${type}_day`],
                    day.data[`${type}_session`],
                  ) === 'p',
              }"
              @click="openDetails(day.data, type)"
            >
              <td class="p-2 border border-gray-300">
                <div class="font-medium">{{ g2h(day.date) }}</div>
                <div class="text-gray-400 text-[10px] sm:text-xs">
                  {{ day.date }}
                </div>
              </td>
              <td class="p-2 border border-gray-300">
                {{ type === "morning" ? "Morning" : "Afternoon" }}
              </td>
              <td class="p-2 border border-gray-300">
                {{ day.data[`${type}_in`] }}
              </td>
              <td class="p-2 border border-gray-300">
                {{ day.data[`${type}_out`] }}
              </td>
              <td class="p-2 border border-gray-300">
                {{ type === "morning" ? day.data.total_morning : day.data.total_afternoon }}
              </td>
              <td class="p-2 border border-gray-300">
                {{
                  type === "morning"
                    ? day.data.retzifus_morning
                    : day.data.retzifus_evening
                }}
              </td>
              <td class="p-2 border border-gray-300">
                <div
                  v-if="questionsFor(day.data, type).length"
                  class="space-y-1"
                >
                  <div
                    v-for="item in questionsFor(day.data, type)"
                    :key="item.dir"
                    class="flex items-center gap-2"
                  >
                    <UBadge color="neutral" variant="soft" size="sm">
                      {{ item.label }}
                    </UBadge>
                    <span
                      class="truncate max-w-40 sm:max-w-60"
                      :title="item.q.question_text"
                    >
                      {{ item.q.question_text }}
                    </span>
                    <span
                      v-if="item.q.response"
                      class="font-medium text-gray-900"
                    >
                      {{ item.q.response.response }}
                    </span>
                    <UBadge v-else color="warning" variant="soft" size="sm">
                      Not answered
                    </UBadge>
                    <UButton
                      v-if="item.q.can_answer || item.q.can_change"
                      size="xs"
                      color="primary"
                      variant="soft"
                      :icon="
                        item.q.response
                          ? 'i-lucide-square-pen'
                          : 'i-lucide-message-circle-reply'
                      "
                      @click.stop="
                        openDetailsWithQuestion(day.data, type, item.dir)
                      "
                    />
                  </div>
                </div>
                <span v-else class="text-gray-400">-</span>
              </td>
              <td class="p-2 border border-gray-300 text-center">
                <div class="flex items-center justify-center gap-1">
                  <component :is="button_text(day.data, type)" />
                  <UButton
                    v-if="
                      is_editable(
                        day.data[`${type}_id`],
                        day.data[`${type}_day`],
                        day.data[`${type}_session`],
                      ) === 'p'
                    "
                    color="error"
                    variant="soft"
                    icon="i-lucide-trash-2"
                    size="xs"
                    @click.stop="deletePending(day.data, type)"
                  />
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
  </div>

  <!-- session details modal -->
  <UModal v-model:open="detailsModal">
    <template #header>
      <div class="flex justify-between w-full">
        <h2 class="text-xl font-bold text-primary">Session Details</h2>
        <UButton
          size="sm"
          variant="outline"
          color="primary"
          class="rounded-full p-2"
          icon="i-lucide-x"
          @click="closeDetails"
        />
      </div>
    </template>

    <template #body>
      <div v-if="details" class="space-y-4">
        <!-- Date + session -->
        <div>
          <p class="font-semibold text-gray-900">
            {{ g2h(details.day) }}
            <span class="text-gray-400 text-sm">({{ details.day }})</span>
          </p>
          <p class="text-sm text-gray-600">{{ details.label }}</p>
        </div>

        <!-- Times / percent / retzifus -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          <div class="bg-gray-50 rounded-lg p-2">
            <p class="text-xs text-gray-500">In</p>
            <p class="font-medium text-gray-900">{{ details.in }}</p>
          </div>
          <div class="bg-gray-50 rounded-lg p-2">
            <p class="text-xs text-gray-500">Out</p>
            <p class="font-medium text-gray-900">{{ details.out }}</p>
          </div>
          <div class="bg-gray-50 rounded-lg p-2">
            <p class="text-xs text-gray-500">Percent</p>
            <p class="font-medium text-gray-900">{{ details.percent }}</p>
          </div>
          <div class="bg-gray-50 rounded-lg p-2">
            <p class="text-xs text-gray-500">Retzifus</p>
            <p class="font-medium text-gray-900">{{ details.retzifus }}</p>
          </div>
        </div>

        <!-- Questions -->
        <div v-if="detailQuestions.length" class="space-y-3">
          <h3 class="font-semibold text-gray-900">Questions</h3>

          <div
            v-for="item in detailQuestions"
            :key="item.dir"
            class="border border-gray-200 rounded-lg p-3 space-y-2"
          >
            <UBadge color="neutral" variant="soft" size="sm">
              {{ item.label }}
            </UBadge>

            <p
              class="whitespace-normal break-words leading-snug font-medium text-gray-900"
            >
              {{ item.q.question_text }}
            </p>

            <div class="flex items-center justify-between gap-2">
              <p class="text-sm">
                <span class="text-gray-500">Answer:</span>
                <span v-if="item.q.response" class="font-medium text-gray-900">
                  {{ item.q.response.response }}
                </span>
                <UBadge v-else color="warning" variant="soft" size="sm">
                  Not answered
                </UBadge>
              </p>

              <UButton
                v-if="
                  (item.q.can_answer || item.q.can_change) &&
                  activeQuestion?.dir !== item.dir
                "
                :label="item.q.response ? 'Change' : 'Answer'"
                :icon="
                  item.q.response
                    ? 'i-lucide-square-pen'
                    : 'i-lucide-message-circle-reply'
                "
                size="sm"
                color="primary"
                variant="soft"
                @click="openQuestionEditor(item.dir, item.q)"
              />
            </div>

            <!-- inline answer editor -->
            <div
              v-if="activeQuestion?.dir === item.dir"
              class="border-t border-gray-200 pt-3 space-y-3"
            >
              <URadioGroup v-model="selectedButton" :items="answerOptions" />

              <div class="flex justify-end items-center gap-2">
                <UButton
                  color="neutral"
                  variant="solid"
                  size="sm"
                  label="Cancel"
                  @click="closeQuestionEditor"
                />
                <UButton
                  size="sm"
                  :loading="isSavingResponse"
                  :disabled="isSavingResponse"
                  label="Save"
                  @click="saveResponse"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Edit times -->
        <div
          class="flex justify-end items-center gap-2 border-t border-gray-200 pt-4"
        >
          <UButton
            icon="la:pen"
            label="Edit Times"
            color="primary"
            variant="outline"
            @click="editTimesFromDetails"
          />
        </div>
      </div>
    </template>
  </UModal>

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

  <UModal
    v-model:open="deletePendingModal"
    title="Confirm Delete Pending Request"
    :close="{
      color: 'primary',
      variant: 'outline',
      class: 'rounded-full',
    }"
  >
    <template #body>
      <div>
        <p>Are you sure you want to delete this pending request?</p>
      </div>
      <div class="flex gap-2 justify-end items-center">
        <UButton
          color="neutral"
          variant="solid"
          class="mt-4"
          @click="
            () => {
              deletePendingModal = false;
            }
          "
        >
          Cancel
        </UButton>
        <UButton
          color="error"
          variant="solid"
          class="mt-4"
          :loading="isSubmitting"
          :disabled="isSubmitting"
          @click="confirmDeletePending()"
        >
          Delete
        </UButton>
      </div>
    </template>
  </UModal>
</template>
