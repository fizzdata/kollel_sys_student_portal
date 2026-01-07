<script setup>
definePageMeta({
  layout: "sidebar",
  middleware: ["auth"],
});
</script>
<template>
  <UContainer>
    <UCard class="mt-6">
      <template #header> Transaction Page </template>

      <p>This is the Transaction page content.</p>
    </UCard>
  </UContainer>
</template>
