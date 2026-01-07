<script setup>
import {
  today,
  DateFormatter,
  getLocalTimeZone,
  Time,
} from "@internationalized/date";

definePageMeta({
  layout: "sidebar",
  middleware: ["auth"],
});

const isActive = ref(false);
const CreateClockingModal = ref(false);
const df = new DateFormatter("en-US", {
  dateStyle: "medium",
});

const inValue = shallowRef(new Time(10, 30, 0));
const outValue = shallowRef(new Time(12, 30, 0));
const isSubmitting = ref(false);

// Get today's date
const todayDate = today(getLocalTimeZone());

// Get date 10 days ago
const fromDate = todayDate.subtract({ days: 7 });

const calendarRange = ref({
  start: fromDate,
  end: todayDate,
});
const toggleSwitch = async () => {
  isActive.value = !isActive.value;
};

const modelValue = shallowRef(today(getLocalTimeZone()));

const state = ref({
  user: "",
});

const columns = [
  { accessorKey: "date", header: "Date" },
  { accessorKey: "name", header: "Name" },
  { accessorKey: "morning_in", header: "Morning In" },
  { accessorKey: "morning_out", header: "Morning Out" },
  { accessorKey: "retzifus_morning", header: "Retzifus" },
  { accessorKey: "total_morning", header: "Total morning" },
  { accessorKey: "afternoon_in", header: "Afternoon In" },
  { accessorKey: "afternoon_out", header: "Afternoon out" },
  { accessorKey: "retzifus_evening", header: "Retzifus" },
  { accessorKey: "total_afternoon", header: "Total Afternoon" },
];
const data = [
  {
    date: "2026-01-01",
    name: "John Doe",
    morning_in: "09:00 AM",
    morning_out: "01:00 PM",
    retzifus_morning: "00:10",
    total_morning: "03:50",
    afternoon_in: "02:00 PM",
    afternoon_out: "06:00 PM",
    retzifus_evening: "00:05",
    total_afternoon: "03:55",
  },
  {
    date: "2026-01-01",
    name: "Jane Smith",
    morning_in: "09:15 AM",
    morning_out: "01:10 PM",
    retzifus_morning: "00:00",
    total_morning: "03:55",
    afternoon_in: "02:05 PM",
    afternoon_out: "06:10 PM",
    retzifus_evening: "00:15",
    total_afternoon: "03:50",
  },
  {
    date: "2026-01-02",
    name: "Michael Lee",
    morning_in: "08:50 AM",
    morning_out: "12:45 PM",
    retzifus_morning: "00:05",
    total_morning: "03:50",
    afternoon_in: "01:45 PM",
    afternoon_out: "05:30 PM",
    retzifus_evening: "00:00",
    total_afternoon: "03:45",
  },
  {
    date: "2026-01-02",
    name: "Sara Khan",
    morning_in: "09:05 AM",
    morning_out: "01:00 PM",
    retzifus_morning: "00:20",
    total_morning: "03:35",
    afternoon_in: "02:10 PM",
    afternoon_out: "06:00 PM",
    retzifus_evening: "00:10",
    total_afternoon: "03:40",
  },
];
</script>
<template>
  <div class="flex justify-between items-center gap-4">
    <h2 class="text-xl font-bold my-4">This Weeks Clockings</h2>
    <div class="flex justify-end gap-2">
      <UButton
        @click="CreateClockingModal = true"
        icon="i-lucide-plus"
        label="Create New Clockings"
        class="text-white"
        color="primary"
        variant="solid"
      />

      <UButton icon="i-lucide-file-text" label="Export to PDF" />
    </div>
  </div>
  <div class="flex justify-between">
    <div class="flex gap-4 items-center">
      <UPopover v-model:open="open">
        <UButton
          color="neutral"
          variant="outline"
          size="lg"
          icon="i-lucide-calendar"
        >
          <template v-if="calendarRange.start">
            <template v-if="calendarRange.end">
              {{ df.format(calendarRange.start.toDate(getLocalTimeZone())) }}
              -
              {{ df.format(calendarRange.end.toDate(getLocalTimeZone())) }}
            </template>
            <template v-else>
              {{ df.format(calendarRange.start.toDate(getLocalTimeZone())) }}
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
          />
        </template>
      </UPopover>
      <USwitch
        :model-value="isActive"
        @update:model-value="toggleSwitch"
        label="Show only with error"
        :ui="{ base: 'cursor-pointer' }"
      />
    </div>
    <UButton
      to="/clockings/requests"
      icon=""
      label="Requests"
      variant="outline"
    />
  </div>
  <!-- Clockings Table -->
  <UTable :columns="columns" :data="data" class="flex-1 mt-6" />

  <!-- Modal for Create New User -->
  <UModal v-model:open="CreateClockingModal">
    <!-- Custom Header -->
    <template #header>
      <div class="flex justify-between w-full">
        <h2 class="text-xl font-bold text-primary">Create New Clockings</h2>

        <!-- Close Button -->
        <UButton
          size="sm"
          variant="outline"
          color="primary"
          class="rounded-full p-2"
          icon="i-lucide-x"
          @click="CreateClockingModal = false"
        >
        </UButton>
      </div>
    </template>

    <template #body>
      <div>
        <UForm :state="state" class="space-y-4" @submit="onSubmit">
          <div class="flex flex-col gap-4">
            <UFormField label="User" name="user">
              <USelect
                v-model="state.user"
                :items="items"
                class="w-full"
                size="lg"
                placeholder="Select User"
              />
            </UFormField>
            <UFormField label="Day" name="day">
              <UPopover class="w-full">
                <UButton
                  color="neutral"
                  variant="outline"
                  icon="i-lucide-calendar"
                  size="lg"
                >
                  {{
                    modelValue
                      ? df.format(modelValue.toDate(getLocalTimeZone()))
                      : "Select a date"
                  }}
                </UButton>

                <template #content>
                  <UCalendar v-model="modelValue" class="p-2" />
                </template>
              </UPopover>
            </UFormField>
          </div>
          <div class="grid grid-cols-2 my-6 place-items-center">
            <UFormField label="In" class="flex gap-4 items-center">
              <UInputTime size="lg" :default-value="inValue" />
            </UFormField>

            <UFormField label="Out" class="flex gap-4 items-center">
              <UInputTime size="lg" :default-value="outValue" />
            </UFormField>
          </div>
          <div
            class="flex justify-end items-center gap-2 mt-4 border-t border-gray-200 pt-4"
          >
            <UButton
              color="neutral"
              variant="solid"
              @click="CreateClockingModal = false"
            >
              Cancel
            </UButton>
            <UButton
              type="submit"
              :loading="isSubmitting"
              :disabled="isSubmitting"
            >
              Create Clockings
            </UButton>
          </div>
        </UForm>
      </div>
    </template>
  </UModal>
</template>
