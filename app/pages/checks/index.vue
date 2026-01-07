<script setup>
definePageMeta({
  layout: "sidebar",
  middleware: ["auth"],
});
</script>
<template>
  <UContainer>
    <UCard class="mt-6">
      <template #header> Checks Page </template>

      <p>This is the checks page content.</p>
    </UCard>
  </UContainer>
</template>
