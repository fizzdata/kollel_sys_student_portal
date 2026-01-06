<template>
  <div class="login">
    <h1>Login</h1>

    <form @submit.prevent="submit">
      <input v-model="email" placeholder="Email" />
      <input v-model="password" type="password" placeholder="Password" />
      <button>Login</button>
    </form>
  </div>
</template>

<script setup>
const email = ref('')
const password = ref('')
const auth = useAuth()

const submit = async () => {
  await auth.login(email.value, password.value)
  navigateTo('/dashboard')
}
</script>