<template>
  <div>
    <h2>Transactions</h2>

    <ul>
      <li v-for="t in transactions" :key="t.id">
        {{ t.date }} — ${{ t.amount }} — {{ t.type }}
      </li>
    </ul>
  </div>
</template>

<script setup>
definePageMeta({ layout: 'dashboard' })

const auth = useAuth()
const config = useRuntimeConfig()

const transactions = await $fetch('/transactions', {
  baseURL: config.public.apiBase,
  headers: { Authorization: `Bearer ${auth.token}` }
})
</script>