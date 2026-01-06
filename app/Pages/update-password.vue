<template>
  <div>
    <h2>Update Password</h2>

    <form @submit.prevent="submit">
      <input v-model="current" type="password" placeholder="Current Password" />
      <input v-model="password" type="password" placeholder="New Password" />
      <button>Update</button>
    </form>
  </div>
</template>

<script setup>
definePageMeta({ layout: 'dashboard' })

const current = ref('')
const password = ref('')
const auth = useAuth()
const config = useRuntimeConfig()

const submit = async () => {
  await $fetch('/update-password', {
    baseURL: config.public.apiBase,
    method: 'POST',
    headers: { Authorization: `Bearer ${auth.token}` },
    body: { current: current.value, password: password.value }
  })
}
</script>