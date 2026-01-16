<template>
  <div>
    <h1>Welcome, {{ auth.user?.name }}</h1>
  </div>
</template>

<script setup>
const auth = useAuth();
console.log("🚀 ~ auth:", auth);
definePageMeta({ layout: "dashboard" });
</script>
