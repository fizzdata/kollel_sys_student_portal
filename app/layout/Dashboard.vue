<template>
  <div class="layout">
    <aside class="sidebar">
      <NuxtLink to="/dashboard">Dashboard</NuxtLink>
      <NuxtLink to="/clockings">Clockings</NuxtLink>
      <NuxtLink to="/transactions">Transactions</NuxtLink>
      <NuxtLink to="/update-password">Update Password</NuxtLink>
      <button @click="logout">Logout</button>
    </aside>

    <main>
      <slot />
    </main>
  </div>
</template>

<script setup>
const auth = useAuth()
const logout = () => auth.logout()
</script>