<script setup>
definePageMeta({
  layout: "sidebar",
  middleware: ["auth"],
});
</script>
<template>
  <UContainer>
    <UCard class="mt-6">
      <template #header> Students Page </template>

      <p>This is the Students page content.</p>
    </UCard>
  </UContainer>
</template>
