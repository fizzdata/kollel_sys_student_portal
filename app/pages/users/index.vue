<script setup>
definePageMeta({
  layout: "sidebar",
  middleware: ["auth"],
});
</script>
<template>
  <UContainer>
    <UCard class="mt-6">
      <template #header> Users Page </template>

      <p>This is the users page content.</p>
    </UCard>
  </UContainer>
</template>
