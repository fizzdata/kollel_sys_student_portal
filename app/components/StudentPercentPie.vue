<script setup>
import { computed } from "vue";
import { Pie } from "vue-chartjs";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

const props = defineProps({
  values: {
    type: Array,
    required: true,
  },
});

const chartData = computed(() => ({
  labels: ["This Month", "Last Month"],
  datasets: [
    {
      data: props.values,
      backgroundColor: ["#22c55e", "#94a3b8"],
      borderWidth: 0,
    },
  ],
}));

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
};
</script>

<template>
  <div class="flex justify-center">
    <div class="w-64 h-64">
      <Pie :data="chartData" :options="chartOptions" />
    </div>
  </div>
</template>
