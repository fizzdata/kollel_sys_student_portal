<script setup>
import { ref } from "vue";
import {
  DateFormatter,
  getLocalTimeZone,
  today,
} from "@internationalized/date";

const props = defineProps({
  modelValue: Boolean,
  title: { type: String, default: "Processing Rules" },
  type: { type: String, default: "process" },
  message: { type: String, default: "" },
  rules: { type: Array, default: () => [] },
  loading: Boolean,
  metricLabels: Object,
  operaterLabels: Object,
});

const emit = defineEmits(["update:modelValue", "date-change"]);

const calendarOpen = ref(false);
// Get today's date
const todayDate = today(getLocalTimeZone());

// Get date 7 days ago
const fromDate = todayDate.subtract({ days: 7 });

// Default range: last 7 days
const calendarRange = ref({
  start: fromDate,
  end: todayDate,
});

const df = new DateFormatter("en-US", { dateStyle: "medium" });

const formatDate = (date) =>
  date ? df.format(date.toDate(getLocalTimeZone())) : "";

watch(
  calendarRange,
  (val) => {
    if (val?.start && val?.end) {
      calendarOpen.value = false; // ✅ close popover
    }
  },
  { deep: true }
);
</script>

<template>
  <UModal
    :open="modelValue"
    fullscreen
    @update:open="$emit('update:modelValue', $event)"
  >
    <!-- Header -->
    <template #header>
      <div class="flex justify-between w-full items-center">
        <h2 class="text-xl font-bold text-primary">
          {{ title }}
        </h2>

        <UButton
          size="sm"
          variant="outline"
          color="primary"
          class="rounded-full p-2"
          icon="i-lucide-x"
          @click="$emit('update:modelValue', false)"
        />
      </div>
    </template>

    <!-- Body -->
    <template #body>
      <!-- Date Range -->
      <UFormField label="Select Date Range" class="text-lg font-bold mb-4">
        <UPopover v-model:open="calendarOpen">
          <UButton
            color="neutral"
            variant="subtle"
            icon="i-lucide-calendar"
            size="lg"
          >
            <template v-if="calendarRange.start">
              <template v-if="calendarRange.end">
                {{ formatDate(calendarRange.start) }} -
                {{ formatDate(calendarRange.end) }}
              </template>
              <template v-else>
                {{ formatDate(calendarRange.start) }}
              </template>
            </template>
            <template v-else> Pick a date </template>
          </UButton>

          <template #content>
            <UCalendar
              v-model="calendarRange"
              range
              :number-of-months="2"
              class="p-2"
              @update:modelValue="emit('date-change', calendarRange)"
            />
          </template>
        </UPopover>
      </UFormField>

      <!-- Loader -->
      <div v-if="loading" class="flex items-center justify-center pt-10 w-full">
        <BaseSpinner :show-loader="loading" size="md" />
      </div>

      <!-- Cards -->
      <div
        v-else-if="rules?.length && type === 'process'"
        class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-6"
      >
        <UCard
          v-for="rule in rules"
          :key="rule.id"
          class="rounded-2xl shadow hover:shadow-xl transition-shadow"
        >
          <template #header>
            <div class="text-lg font-semibold">
              {{ rule.name }}
            </div>
          </template>

          <div class="space-y-4">
            <div class="flex justify-between">
              <span class="text-gray-500">Base Price</span>
              <span class="font-semibold">${{ rule.base_price }}</span>
            </div>

            <div class="flex justify-between">
              <span class="text-gray-500">Net Price</span>
              <span class="font-semibold text-green-600">
                ${{ rule.net_price }}
              </span>
            </div>

            <div v-if="rule?.rules?.length">
              <h3 class="font-medium mb-2">Rules</h3>

              <ul class="space-y-1">
                <li
                  v-for="(item, index) in rule.rules"
                  :key="index"
                  class="text-sm border-l-4 pl-2 py-1 border-gray-200"
                >
                  If {{ metricLabels[item.rule.metric] }}
                  {{ operaterLabels[item.rule.operator] }}
                  {{ item.rule.value }},
                  {{ item.rule.is_deduction ? "Deduction" : "Bonus" }}
                  {{ item.rule.amount }}
                  {{ item.rule.amount_type === "fixed" ? "dollars" : "%" }}
                  ({{ item.rule.apply_once ? "once" : "each time" }})
                </li>
              </ul>
            </div>
          </div>
        </UCard>
      </div>

      <div
        v-else-if="type === 'check' && message.type === 'pdf'"
        class="w-full h-full"
      >
        <iframe :src="message.url" class="w-full h-[80vh] border rounded" />
      </div>

      <div v-else-if="type === 'check'">
        <div v-if="message" class="text-center text-gray-500 mt-10">
          {{ message }}
        </div>
        <div
          v-else
          class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-6"
        >
          No Checks found. Please add some Checks.
        </div>
      </div>

      <div v-else-if="type === 'deposit'">
        <div v-if="message" class="text-center text-gray-500 mt-10">
          {{ message }}
        </div>
        <div
          v-else
          class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-6"
        >
          No Checks found. Please add some Checks.
        </div>
      </div>

      <!-- Empty -->
      <div v-else class="text-center text-gray-500 mt-10">
        No Rules found. Please add some rules.
      </div>
    </template>
  </UModal>
</template>
