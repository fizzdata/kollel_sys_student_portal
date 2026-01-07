<script setup>
definePageMeta({
  layout: "sidebar",
  middleware: ["auth"],
});
</script>
<template>
  <UContainer>
    <UCard class="mt-6">
      <template #header> Schedule Page </template>

      <p>This is the schedule page content.</p>
    </UCard>
  </UContainer>
</template>
