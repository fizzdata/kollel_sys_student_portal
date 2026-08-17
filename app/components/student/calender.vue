<script setup>
import { convertTo24Hour, getHebrewParasha } from "~/common/common";
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

const { t } = useAppLocale();
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
  const punch = detailsRow.value;
  if (!punch) return null;

  return {
    type: detailsType.value,
    label: detailsType.value === "morning" ? t("Morning Seder") : t("Afternoon Seder"),
    day: punch.day,
    id: punch.id,
    session: punch.session,
    session_id: punch.session_id,
    schedule_id: punch.schedule_id,
    in: punch.in,
    out: punch.out,
    percent: punch.percent,
    retzifus: punch.retzifus,
    question_in: punch.question_in,
    question_out: punch.question_out,
    status: is_editable(punch.id, punch.day, punch.session),
  };
});

const openDetails = (punch, type) => {
  detailsRow.value = punch;
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
      title: t("This entry is Pending"),
      color: "warning",
    });
    return;
  }

  if (status === "l") {
    toast.add({
      title: t("This entry is Locked"),
      color: "info",
    });
    return;
  }

  const punch = detailsRow.value;
  closeDetails();
  editClocking(punch);
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
      title: t("Validation Error"),
      description: t("Please select an answer"),
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
        title: t("Success"),
        description: response?.message || t("Response saved"),
        color: "success",
        duration: 2000,
      });
      closeDetails();
      emit("reload", currentRange.value);
    } else {
      toast.add({
        title: t("Failed"),
        description: response?.message || t("Failed to save response"),
        color: "error",
      });
    }
  } catch (error) {
    console.error("Response save error:", error);
    toast.add({
      title: t("Error"),
      description: t("An unexpected error occurred while saving the response"),
      color: "error",
    });
  } finally {
    isSavingResponse.value = false;
  }
};

// does this punch have a question the student still needs to answer?
const hasUnanswered = (punch) =>
  ["in", "out"].some((dir) => punch[`question_${dir}`]?.can_answer);

// a punch's questions, for the list view
const questionsFor = (punch) =>
  [
    { dir: "in", label: t("In"), q: punch.question_in },
    { dir: "out", label: t("Out"), q: punch.question_out },
  ].filter((item) => item.q);

// open the details modal with a question's answer editor already expanded
const openDetailsWithQuestion = (punch, type, dir) => {
  openDetails(punch, type);
  const q = dir === "in" ? punch.question_in : punch.question_out;
  if (q && (q.can_answer || q.can_change)) {
    openQuestionEditor(dir, q);
  }
};

const deletePending = (punch) => {
  const pendingId = props.pendingRequests.find((request) => {
    if (punch.id === null) {
      return request.day === punch.day && request.session === punch.session;
    } else {
      return request.clocking_id === punch.id;
    }
  })?.id;

  selectedPendingToDelete.value = pendingId;
  deletePendingModal.value = true;
};

function button_text(punch) {
  const status = is_editable(punch.id, punch.day, punch.session);

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
        title: t("Success"),
        description: response?.message || t("Pending Request Deleted"),
        color: "success",
        duration: 2000,
      });
      emit("reload", currentRange.value);
    } else if (response?._data?.message) {
      toast.add({
        title: t("Failed"),
        description: response._data.message,
        color: "error",
      });
    } else {
      toast.add({
        title: t("Failed"),
        description:
          response?.message || t("Something went wrong. Please try again."),
        color: "error",
      });
    }
  } catch (error) {
    console.error("Submission error:", error);
    toast.add({
      title: t("Error"),
      description: t("An unexpected error occurred."),
      color: "error",
    });
  } finally {
    selectedPendingToDelete.value = null;
    deletePendingModal.value = false;
    isSubmitting.value = false;
  }
};
const editClocking = (punch) => {
  state.in = punch.in === "-" ? null : convertTo24Hour(punch.in);
  state.out = punch.out === "-" ? null : convertTo24Hour(punch.out);

  state.id = punch.id;
  state.day = punch.day;
  state.session = punch.session;
  state.session_id = punch.session_id;

  state.retzifus = punch.retzifus !== "NO";

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
        title: t("Success"),
        description: h("span", {
          innerHTML: response?.message || t("Schedule updated successfully"),
        }),
        color: "success",
        duration: 2000,
      });

      emit("reload", currentRange.value);
    } else if (response?._data?.message) {
      toast.add({
        title: t("Failed"),
        description: h("span", {
          innerHTML: response._data.message,
        }),
        color: "error",
      });
    } else {
      toast.add({
        title: t("Failed"),
        description: h("span", {
          innerHTML:
            response?.message || t("Something went wrong. Please try again."),
        }),

        color: "error",
      });
    }
  } catch (error) {
    console.error("Submission error:", error);
    toast.add({
      title: t("Error"),
      description: t("An unexpected error occurred."),
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
        {{ t("Previous") }}
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
        {{ t("Next") }}
      </UButton>
    </div>

    <!-- Month totals per seder -->
    <div
      v-if="monthPercentages"
      class="flex justify-center gap-6 mb-4 text-sm sm:text-base"
    >
      <div class="bg-gray-50 rounded-lg px-4 py-2 text-center">
        <span class="text-gray-500">{{ t("Morning Seder") }}:</span>
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
        <span class="text-gray-500">{{ t("Afternoon Seder") }}:</span>
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
        {{ t("Calendar") }}
      </UButton>
      <UButton
        icon="i-lucide-list"
        :variant="view === 'list' ? 'solid' : 'outline'"
        color="primary"
        size="sm"
        @click="view = 'list'"
      >
        {{ t("List") }}
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
                <div
                  v-if="di === 6"
                  class="text-primary-600 text-[10px] sm:text-xs font-bold"
                >
                  {{ getHebrewParasha(day.date) }}
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
                  class="flex flex-col items-center gap-1"
                >
                  <div
                    v-for="(punch, pi) in day.data[type]"
                    :key="`${type}-${pi}-${punch.id ?? 'new'}`"
                    class="flex items-center justify-center gap-2"
                  >
                    <button
                      @click="openDetails(punch, type)"
                      class="hover:underline cursor-pointer"
                    >
                      <div
                        class="bg-blue-50 rounded flex items-center px-1"
                        :class="{
                          'bg-warning-100':
                            is_editable(punch.id, punch.day, punch.session) === 'p',
                        }"
                      >
                        <component :is="button_text(punch)" />

                        <span class="ml-1 text-gray-900">
                          {{ punch.in }} –
                          {{ punch.out }}
                        </span>

                        <UIcon
                          v-if="hasUnanswered(punch)"
                          name="i-lucide-circle-help"
                          class="w-4 h-4 text-warning-500 ml-1"
                        />
                      </div>
                    </button>

                    <UButton
                      v-if="is_editable(punch.id, punch.day, punch.session) === 'p'"
                      color="error"
                      variant="soft"
                      icon="i-lucide-trash-2"
                      size="xs"
                      @click="deletePending(punch)"
                    />
                  </div>
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
            <th class="p-2 border border-gray-300 text-left">{{ t("Date") }}</th>
            <th class="p-2 border border-gray-300 text-left">{{ t("Seder") }}</th>
            <th class="p-2 border border-gray-300 text-left">{{ t("In") }}</th>
            <th class="p-2 border border-gray-300 text-left">{{ t("Out") }}</th>
            <th class="p-2 border border-gray-300 text-left">%</th>
            <th class="p-2 border border-gray-300 text-left">{{ t("Retzifus") }}</th>
            <th class="p-2 border border-gray-300 text-left">{{ t("Questions") }}</th>
            <th class="p-2 border border-gray-300"></th>
          </tr>
        </thead>
        <tbody>
          <template v-for="day in listDays" :key="day.date">
            <template v-for="type in ['morning', 'afternoon']">
              <tr
                v-for="(punch, pi) in day.data[type]"
                :key="`${day.date}-${type}-${pi}-${punch.id ?? 'new'}`"
                class="text-xs sm:text-sm hover:bg-blue-50 cursor-pointer"
                :class="{
                  'bg-warning-100':
                    is_editable(punch.id, punch.day, punch.session) === 'p',
                }"
                @click="openDetails(punch, type)"
              >
                <td class="p-2 border border-gray-300">
                  <div class="font-medium">{{ g2h(day.date) }}</div>
                  <div class="text-gray-400 text-[10px] sm:text-xs">
                    {{ day.date }}
                  </div>
                </td>
                <td class="p-2 border border-gray-300">
                  {{ type === "morning" ? t("Morning") : t("Afternoon") }}
                </td>
                <td class="p-2 border border-gray-300">
                  {{ punch.in }}
                </td>
                <td class="p-2 border border-gray-300">
                  {{ punch.out }}
                </td>
                <td class="p-2 border border-gray-300">
                  {{ punch.percent }}
                </td>
                <td class="p-2 border border-gray-300">
                  {{ punch.retzifus }}
                </td>
                <td class="p-2 border border-gray-300">
                  <div v-if="questionsFor(punch).length" class="space-y-1">
                    <div
                      v-for="item in questionsFor(punch)"
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
                        @click.stop="openDetailsWithQuestion(punch, type, item.dir)"
                      />
                    </div>
                  </div>
                  <span v-else class="text-gray-400">-</span>
                </td>
                <td class="p-2 border border-gray-300 text-center">
                  <div class="flex items-center justify-center gap-1">
                    <component :is="button_text(punch)" />
                    <UButton
                      v-if="is_editable(punch.id, punch.day, punch.session) === 'p'"
                      color="error"
                      variant="soft"
                      icon="i-lucide-trash-2"
                      size="xs"
                      @click.stop="deletePending(punch)"
                    />
                  </div>
                </td>
              </tr>
            </template>
          </template>
        </tbody>
      </table>
    </div>
  </div>

  <!-- session details modal -->
  <UModal v-model:open="detailsModal">
    <template #header>
      <div class="flex justify-between w-full">
        <h2 class="text-xl font-bold text-primary">{{ t("Session Details") }}</h2>
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
        <!-- Date + session, centered at the top -->
        <div class="text-center">
          <p class="font-semibold text-gray-900">
            {{ g2h(details.day) }}
            <span class="text-gray-400 text-sm">({{ details.day }})</span>
          </p>
          <p class="text-sm text-gray-600">{{ details.label }}</p>
        </div>

        <!-- Clock-In question -->
        <div
          v-if="details.question_in"
          class="border border-gray-200 rounded-lg p-3 space-y-2"
        >
          <UBadge color="neutral" variant="soft" size="sm">
            {{ t("Clock-In Question") }}
          </UBadge>

          <p
            class="whitespace-normal break-words leading-snug font-medium text-gray-900"
          >
            {{ details.question_in.question_text }}
          </p>

          <div class="flex items-center justify-between gap-2">
            <p class="text-sm">
              <span class="text-gray-500">{{ t("Answer") }}:</span>
              <span
                v-if="details.question_in.response"
                class="font-medium text-gray-900"
              >
                {{ details.question_in.response.response }}
              </span>
            </p>

            <UButton
              v-if="
                (details.question_in.can_answer ||
                  details.question_in.can_change) &&
                activeQuestion?.dir !== 'in'
              "
              :label="details.question_in.response ? t('Change') : t('Answer')"
              :icon="
                details.question_in.response
                  ? 'i-lucide-square-pen'
                  : 'i-lucide-message-circle-reply'
              "
              size="sm"
              color="primary"
              variant="soft"
              @click="openQuestionEditor('in', details.question_in)"
            />
          </div>

          <!-- inline answer editor -->
          <div
            v-if="activeQuestion?.dir === 'in'"
            class="border-t border-gray-200 pt-3 space-y-3"
          >
            <URadioGroup v-model="selectedButton" :items="answerOptions" />

            <div class="flex justify-end items-center gap-2">
              <UButton
                color="neutral"
                variant="solid"
                size="sm"
                :label="t('Cancel')"
                @click="closeQuestionEditor"
              />
              <UButton
                size="sm"
                :loading="isSavingResponse"
                :disabled="isSavingResponse"
                :label="t('Save')"
                @click="saveResponse"
              />
            </div>
          </div>
        </div>

        <!-- Times / percent / retzifus, with the Edit Times button beside them -->
        <div
          class="flex flex-col sm:flex-row sm:items-center gap-3 border-t border-gray-200 pt-4"
        >
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm flex-1">
            <div class="bg-gray-50 rounded-lg p-2">
              <p class="text-xs text-gray-500">{{ t("In") }}</p>
              <p class="font-medium text-gray-900">{{ details.in }}</p>
            </div>
            <div class="bg-gray-50 rounded-lg p-2">
              <p class="text-xs text-gray-500">{{ t("Out") }}</p>
              <p class="font-medium text-gray-900">{{ details.out }}</p>
            </div>
            <div class="bg-gray-50 rounded-lg p-2">
              <p class="text-xs text-gray-500">{{ t("Percent") }}</p>
              <p class="font-medium text-gray-900">{{ details.percent }}</p>
            </div>
            <div class="bg-gray-50 rounded-lg p-2">
              <p class="text-xs text-gray-500">{{ t("Retzifus") }}</p>
              <p class="font-medium text-gray-900">{{ details.retzifus }}</p>
            </div>
          </div>

          <UButton
            icon="la:pen"
            :label="t('Edit Times')"
            color="primary"
            variant="outline"
            class="shrink-0"
            @click="editTimesFromDetails"
          />
        </div>

        <!-- Clock-Out question -->
        <div v-if="details.question_out" class="space-y-3">
          <h3 class="font-semibold text-gray-900">{{ t("Questions") }}</h3>

          <div class="border border-gray-200 rounded-lg p-3 space-y-2">
            <UBadge color="neutral" variant="soft" size="sm">
              {{ t("Clock-Out Question") }}
            </UBadge>

            <p
              class="whitespace-normal break-words leading-snug font-medium text-gray-900"
            >
              {{ details.question_out.question_text }}
            </p>

            <div class="flex items-center justify-between gap-2">
              <p class="text-sm">
                <span class="text-gray-500">{{ t("Answer") }}:</span>
                <span
                  v-if="details.question_out.response"
                  class="font-medium text-gray-900"
                >
                  {{ details.question_out.response.response }}
                </span>
              </p>

              <UButton
                v-if="
                  (details.question_out.can_answer ||
                    details.question_out.can_change) &&
                  activeQuestion?.dir !== 'out'
                "
                :label="details.question_out.response ? t('Change') : t('Answer')"
                :icon="
                  details.question_out.response
                    ? 'i-lucide-square-pen'
                    : 'i-lucide-message-circle-reply'
                "
                size="sm"
                color="primary"
                variant="soft"
                @click="openQuestionEditor('out', details.question_out)"
              />
            </div>

            <!-- inline answer editor -->
            <div
              v-if="activeQuestion?.dir === 'out'"
              class="border-t border-gray-200 pt-3 space-y-3"
            >
              <URadioGroup v-model="selectedButton" :items="answerOptions" />

              <div class="flex justify-end items-center gap-2">
                <UButton
                  color="neutral"
                  variant="solid"
                  size="sm"
                  :label="t('Cancel')"
                  @click="closeQuestionEditor"
                />
                <UButton
                  size="sm"
                  :loading="isSavingResponse"
                  :disabled="isSavingResponse"
                  :label="t('Save')"
                  @click="saveResponse"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </UModal>

  <!-- edit clocking modal -->
  <UModal v-model:open="editClockingModal">
    <!-- Custom Header -->
    <template #header>
      <div class="flex justify-between w-full">
        <h2 class="text-xl font-bold text-primary">{{ t("Edit Clocking") }}</h2>

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
          <UFormField :label="t('In')" class="flex gap-4 items-center">
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
          <UFormField :label="t('Out')" class="flex gap-4 items-center">
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

        <UFormField :label="t('Notes')" name="notes">
          <UTextarea
            v-model="state.notes"
            :placeholder="t('Enter your notes...')"
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
            {{ t("Cancel") }}
          </UButton>
          <UButton
            type="submit"
            :loading="isSubmitting"
            :disabled="isSubmitting"
          >
            {{ t("Confirm") }}
          </UButton>
        </div>
      </UForm>
    </template>
  </UModal>

  <UModal
    v-model:open="deletePendingModal"
    :title="t('Confirm Delete Pending Request')"
    :close="{
      color: 'primary',
      variant: 'outline',
      class: 'rounded-full',
    }"
  >
    <template #body>
      <div>
        <p>{{ t("Are you sure you want to delete this pending request?") }}</p>
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
          {{ t("Cancel") }}
        </UButton>
        <UButton
          color="error"
          variant="solid"
          class="mt-4"
          :loading="isSubmitting"
          :disabled="isSubmitting"
          @click="confirmDeletePending()"
        >
          {{ t("Delete") }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>
