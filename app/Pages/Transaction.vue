<template>
  <UCard class="rounded-2xl shadow-sm">
    <div
      class="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-4 md:mb-0"
    >
      <h2 class="text-xl font-bold">Transactions</h2>
    </div>
  </UCard>

  <div>
    <h2>Transactions</h2>

    <ul>
      <li v-for="t in transactions?.transaction" :key="t.id">
        {{ t.date }} — ${{ t.amount }} — {{ t.type }}
      </li>
    </ul>
  </div>
</template>

<script setup>
definePageMeta({ layout: "sidebar" });

const auth = useAuth();
const config = useRuntimeConfig();
const api = useApi();
const transactions = ref({});

transactions.value = await api("/student-portal/transactions");
console.log("🚀 ~ transactions.value:", transactions.value);
</script>
