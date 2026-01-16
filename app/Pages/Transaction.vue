<template>
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
