<script setup>
definePageMeta({
  layout: "sidebar",
  middleware: ["auth"],
});

const columns = [
  { accessorKey: "morning_in", header: "Morning In" },
  { accessorKey: "morning_out", header: "Morning Out" },
  { accessorKey: "retzifus_morning", header: "Retzifus" },
  { accessorKey: "afternoon_in", header: "Afternoon In" },
  { accessorKey: "afternoon_out", header: "Afternoon out" },
  { accessorKey: "retzifus_evening", header: "Retzifus" },
];
const data = [
  {
    morning_in: "09:00 AM",
    morning_out: "01:00 PM",
    retzifus_morning: "00:10",
    afternoon_in: "02:00 PM",
    afternoon_out: "06:00 PM",
    retzifus_evening: "00:05",
  },
  {
    morning_in: "09:15 AM",
    morning_out: "01:10 PM",
    retzifus_morning: "00:00",
    afternoon_in: "02:05 PM",
    afternoon_out: "06:10 PM",
    retzifus_evening: "00:15",
  },
  {
    morning_in: "08:50 AM",
    morning_out: "12:45 PM",
    retzifus_morning: "00:05",
    afternoon_in: "01:45 PM",
    afternoon_out: "05:30 PM",
    retzifus_evening: "00:00",
  },
];
</script>
<template>
  <div>
    <UButton
      variant="outline"
      color="primary"
      to="/clockings"
      icon="i-lucide-arrow-left"
    >
      Back to Clockings
    </UButton>
  </div>
  <div class="flex justify-between items-center gap-4">
    <h2 class="text-xl font-bold my-4">Requests</h2>
    <div class="flex justify-end gap-2">
      <UButton icon="" label="Approve All" color="success" variant="solid" />
      <UButton icon="" label="Reject All" color="error" variant="solid" />
    </div>
  </div>
  <!-- Clockings Table -->
  <UTable :columns="columns" :data="data" class="flex-1 mt-6" />
</template>
