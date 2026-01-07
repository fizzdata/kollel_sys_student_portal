<script setup>
definePageMeta({
  layout: "sidebar",
  middleware: ["auth"],
});

const route = useRoute();
const studentId = route.params.id;
const loading = ref(false);
const api = useApi();

const fetchStudentDetail = async () => {
  try {
    loading.value = true;
    const response = await api(`/api/students/${studentId}`);
    console.log("🚀 ~ fetchStudentDetail ~ response:", response);

    return;
    if (response?.success) {
      users.value = response?.Students;
      console.log(users.value);
    } else if (!response?.success) {
      // isValidId.value = false;
      // errorMessage.value = response?.msg || "Org not found";
    }
  } catch (err) {
    console.log("🚀 ~ fetchStudents ~ err:", err);
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  await fetchStudentDetail();
});
</script>

<template>
  <div>
    <UButton
      variant="outline"
      color="primary"
      to="/students"
      icon="i-lucide-arrow-left"
    >
      Back to Students
    </UButton>

    <UCard class="mt-6">
      <template #header> User Detail Page Page </template>

      <p>This is the user detail page content.</p>
    </UCard>
  </div>
</template>
