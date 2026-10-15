<script setup>
const { t } = useAppLocale();
const { isOnline, isChecking, probeConnection } = useConnectivity();
</script>

<template>
  <div
    v-if="!isOnline"
    class="fixed inset-x-0 top-0 z-[100] border-b border-amber-300 bg-amber-50 px-4 py-3 text-amber-950 shadow-sm"
    role="status"
    aria-live="polite"
  >
    <div class="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div class="flex items-start gap-3">
        <UIcon name="i-lucide-wifi-off" class="mt-0.5 h-5 w-5 shrink-0" />
        <div>
          <p class="font-semibold">
            {{ t("You are not connected to the internet.") }}
          </p>
          <p class="text-sm">
            {{ t("Please check the network connection.") }}
          </p>
        </div>
      </div>

      <UButton
        color="warning"
        variant="soft"
        :loading="isChecking"
        :disabled="isChecking"
        @click="probeConnection"
      >
        {{ t("Try again") }}
      </UButton>
    </div>
  </div>
</template>
