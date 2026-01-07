<script setup>
definePageMeta({
  layout: "sidebar",
  middleware: ["auth"],
});
</script>
<template>
  <UContainer>
    <UCard class="mt-6">
      <template #header> College Checks Page </template>

      <p>This is the College checks page content.</p>
    </UCard>
  </UContainer>
</template>
