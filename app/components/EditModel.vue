<template>
  <div
    v-show="showModel"
    class="fixed top-0 left-0 right-0 z-50 w-full p-4 overflow-x-hidden overflow-y-auto
           h-[calc(100%-1rem)] max-h-full bg-black/40"
  >
    <div class="relative w-full max-w-md mx-auto max-h-full">
      <div class="relative bg-white rounded-lg shadow dark:bg-gray-700">

        <!-- Close button -->
        <button
          type="button"
          class="absolute top-3 right-2.5 text-gray-400 hover:bg-gray-200 hover:text-gray-900
                 rounded-lg text-sm w-8 h-8 inline-flex justify-center items-center
                 dark:hover:bg-gray-600 dark:hover:text-white"
          @click="close"
        >
          <svg class="w-3 h-3" fill="none" viewBox="0 0 14 14">
            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6" />
          </svg>
        </button>

        <div class="px-6 py-6 lg:px-8">
          <h3 class="mb-4 text-xl font-medium text-gray-900 dark:text-white">Edit</h3>

          <form class="space-y-6" @submit.prevent="submitEdit">
            
            <!-- Time Inputs -->
            <div class="flex justify-between">
              <div class="flex items-start">
                <div class="flex items-center h-5">

                  <label class="mr-2 text-sm font-medium">In</label>
                  <input
                    type="time"
                    step="1"
                    class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg
                           focus:ring-blue-500 focus:border-blue-500 p-2.5 dark:bg-gray-600
                           dark:border-gray-500 dark:text-white"
                    v-model="model.in"
                    required
                  />

                  <label class="m-2 text-sm font-medium">Out</label>
                  <input
                    type="time"
                    step="1"
                    class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg
                           focus:ring-blue-500 focus:border-blue-500 p-2.5 dark:bg-gray-600
                           dark:border-gray-500 dark:text-white"
                    v-model="model.out"
                    required
                  />

                  <input
                    type="checkbox"
                    v-model="model.retzifus"
                    id="retzifus"
                    class="w-4 h-4 border border-gray-300 rounded bg-gray-50 focus:ring-3
                           focus:ring-blue-300 dark:bg-gray-600 dark:border-gray-500"
                  />
                </div>

                <label for="retzifus" class="ml-2 text-sm font-medium dark:text-gray-300">
                  Retzifus
                </label>
              </div>
            </div>

            <!-- Notes -->
            <textarea
              class="w-full h-12 border border-gray-300 rounded bg-gray-50 focus:ring-3
                     focus:ring-blue-300 dark:bg-gray-600 dark:border-gray-500"
              placeholder="הערות"
              v-model="model.notes"
              required
            ></textarea>

            <!-- Submit -->
            <button
              type="submit"
              class="w-full text-white bg-blue-700 hover:bg-blue-800 focus:ring-4
                     focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm
                     px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700"
            >
              Submit
            </button>

          </form>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  showModel: Boolean,
  model: { type: Object, required: true }
})

const emit = defineEmits(['canceled_clicked', 'reload'])

const submitting = ref(false)

const config = useRuntimeConfig()

const submitEdit = async () => {
  if (!props.model.notes || props.model.notes.trim() === '') {
    msg('error', 'Reason is required')
    return
  }

  submitting.value = true

  try {
    const res = await $fetch('/yingerman/clockings/edit', {
      baseURL: config.public.apiBase,
      method: 'POST',
      body: props.model
    })

    if (res.success) {
      emit('canceled_clicked')
      msg('success', res.msg)
      emit('reload')
    } else {
      msg('error', res.msg)
    }
  } catch (e) {
    console.error(e)
  }

  setTimeout(() => (submitting.value = false), 2500)
}

const close = () => {
  emit('canceled_clicked')
}
</script>