<template>
  <div class="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">

    <div class="mb-2 flex justify-between items-center">
      <span class="text-xs font-semibold text-gray-600 dark:text-gray-300">Attendance</span>
      <span class="text-xs text-gray-400 dark:text-gray-500">Last Session</span>
    </div>

    <div class="w-full h-6 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden relative">

      <!-- IN -->
      <div
        v-if="showIn"
        class="h-full bg-green-500 text-[10px] font-semibold text-white flex items-center justify-center transition-all duration-700 ease-out"
        :style="{ width: percent_in }"
      >
        IN
      </div>

      <!-- OUT -->
      <div
        v-if="showOut"
        class="h-full bg-blue-500 text-[10px] font-semibold text-white flex items-center justify-center transition-all duration-700 ease-out"
        :style="{ width: percent_out }"
      >
        OUT
      </div>

    </div>

    <div class="mt-2 flex justify-between text-xs text-gray-500 dark:text-gray-400">
      <span>{{ percent_in }}</span>
      <span>{{ percent_out }}</span>
    </div>

  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'

const props = defineProps({
  percent_in: { type: String, default: '0%' },
  percent_out: { type: String, default: '0%' }
})

const showIn = ref(false)
const showOut = ref(false)

const evaluate = () => {
  const inVal = parseInt(props.percent_in)
  const outVal = parseInt(props.percent_out)

  showIn.value = inVal > 0
  showOut.value = outVal > 0
}

onMounted(evaluate)
watch(() => [props.percent_in, props.percent_out], evaluate)
</script>