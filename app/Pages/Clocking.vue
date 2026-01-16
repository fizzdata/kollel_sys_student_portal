<template>
  <div>
    <!-- Date Range Selector -->
    <select
      class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
      v-model="date_from"
      @change="reloadClockings"
    >
      <option value="30">Last 30 Days</option>
      <option value="90">Last 3 Months</option>
      <option value="180">Last 6 Months</option>
    </select>

    <!-- Charts -->
    <div>
      <h3 class="text-center">Morning</h3>
      <Chart :percent_in="pc_in_1" :percent_out="pc_out_1" />

      <h3 class="text-center">Afternoon</h3>
      <Chart :percent_in="pc_in_2" :percent_out="pc_out_2" />
    </div>

    <!-- Clockings Table -->
    <table
      id="table"
      class="m-auto divide-y divide-gray-200 text-sm mt-2 text-center"
    >
      <thead class="bg-gray-100" style="position: sticky; top: 10px">
        <tr>
          <th class="px-4 py-2 text-left font-medium">Date</th>
          <th class="px-4 py-2 text-left font-medium">Morning In</th>
          <th class="px-4 py-2 text-left font-medium">Morning Out</th>
          <th class="px-4 py-2 text-left font-medium">Retzifus</th>
          <th></th>
          <th class="px-4 py-2 text-left font-medium">Total Morning</th>
          <th class="px-4 py-2 text-left font-medium">Afternoon In</th>
          <th class="px-4 py-2 text-left font-medium">Afternoon Out</th>
          <th class="px-4 py-2 text-left font-medium">Retzifus</th>
          <th></th>
          <th class="px-4 py-2 text-left font-medium">Total Afternoon</th>
        </tr>
      </thead>

      <tbody class="divide-y divide-gray-200">
        <LoadClocking
          :clockings="clockings"
          :pending_requests="pending_requests"
          :last_editable_date="last_editable_date"
          @edit_clicked="displayModel"
        />
      </tbody>
    </table>

    <!-- Edit Modal -->
    <EditModel
      :showModel="showModel"
      :model="model"
      @canceled_clicked="showModel = false"
      @reload="reloadClockings"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
definePageMeta({
  layout: "sidebar",
});
const config = useRuntimeConfig();
const api = useApi();
const date_from = ref(30);
const date_to = ref(new Date().toISOString().slice(0, 10));

const showModel = ref(false);
const model = ref({});

const pending_requests = ref({});
const clockings = ref({});
const last_editable_date = ref("");

const pc_in_1 = ref(0);
const pc_out_1 = ref(0);
const pc_in_2 = ref(0);
const pc_out_2 = ref(0);

const displayModel = (m) => {
  model.value = m;
  showModel.value = true;
};

const daysAgo = () => {
  const today = new Date();
  return new Date(today.setDate(today.getDate() - date_from.value))
    .toISOString()
    .slice(0, 10);
};

const reloadClockings = async () => {
  const res = await api("/clockings", {
    query: {
      date_from: daysAgo(),
      date_to: date_to.value,
    },
  });

  clockings.value = res.clockings;
  pending_requests.value = res.pending_requests;
  last_editable_date.value = res.last_editable_date.slice(0, 10);

  pc_in_1.value = Math.round(res.percent1.in) + "%";
  pc_out_1.value = Math.round(res.percent1.out) + "%";
  pc_in_2.value = Math.round(res.percent2.in) + "%";
  pc_out_2.value = Math.round(res.percent2.out) + "%";
};

onMounted(() => {
  reloadClockings();
});
</script>
