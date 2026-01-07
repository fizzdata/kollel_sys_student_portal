<script setup>
definePageMeta({
  layout: "sidebar",
  middleware: ["auth"],
});
</script>
<template>
  <UContainer>
    <UCard class="mt-6">
      <template #header> Payments Management Page </template>

      <p>This is the Payments Managements page content.</p>
    </UCard>
  </UContainer>
</template>
