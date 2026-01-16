<script setup>
import {
  today,
  DateFormatter,
  getLocalTimeZone,
} from "@internationalized/date";
const props = defineProps({
  students: { type: Array, default: [] }, // or whatever type
  fetchingGroupStudents: { type: Boolean, default: false },
  metricLabels: Object,
  operaterLabels: Object,
});

const emit = defineEmits(["refresh"]);
// Get today's date
const todayDate = today(getLocalTimeZone());

// Get date 7 days ago
const fromDate = todayDate.subtract({ days: 7 });

const calendarRange = ref({
  start: fromDate,
  end: todayDate,
});

const route = useRoute();
console.log("props", props.students);

// const fetchingGroupStudents = ref(false);
const groupId = route.params.id;
const selectedStudent = ref(null);
const isStudentDeleting = ref(false);

const api = useApi();
const toast = useToast();
const processStudentModal = ref(false);
const processStudentCheckModal = ref(false);
const processStudentDepositModal = ref(false);
const processRulesLoading = ref(false);
const checkProcessRulesLoading = ref(false);
const depositProcessRulesLoading = ref(false);
const processRules = ref([]);
const checkProcessRules = ref(null);
const depositProcessRules = ref(null);
const fetchProcessRules = async (data) => {
  try {
    if (selectedStudent.value) {
      processRulesLoading.value = true;
      const response = await api(
        `/api/payroll/students/${selectedStudent.value.id}/process`,
        {
          method: "GET",
          params: {
            from_date: data?.from_date,
            till_date: data?.till_date,
          },
        }
      );

      if (response?.success) {
        processRules.value = Array.isArray(response?.data)
          ? response.data
          : Object.values(response?.data || {});
      }
    }
  } catch (error) {
    console.error("Error deleting Rules:", error);
  } finally {
    processRulesLoading.value = false;
  }
};

const fetchCheckProcessRules = async (data) => {
  try {
    if (selectedStudent.value) {
      checkProcessRulesLoading.value = true;
      const response = await api(
        `/api/payroll/students/${selectedStudent.value.id}/process/check`,
        {
          method: "POST",
          params: {
            from_date: data?.from_date,
            till_date: data?.till_date,
          },
        }
      );
      console.log("responseresponse", response);

      if (response?.success) {
        const byteCharacters = atob(response.data);
        const byteNumbers = new Array(byteCharacters.length);

        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }

        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: "application/pdf" });

        // Create a URL for the blob
        const fileURL = URL.createObjectURL(blob);
        checkProcessRules.value = {
          type: "pdf",
          url: fileURL,
        };
        console.log("🚀 ~ fetchCheckProcessRules ~ fileURL:", fileURL);
      }
    }
  } catch (error) {
    console.error("Error deleting Rules:", error);
  } finally {
    checkProcessRulesLoading.value = false;
  }
};

const fetchDepositProcessRules = async (data) => {
  try {
    if (selectedStudent.value) {
      depositProcessRulesLoading.value = true;
      const response = await api(
        `/api/payroll/students/${selectedStudent.value.id}/process/deposit`,
        {
          method: "POST",
          params: {
            from_date: data?.from_date,
            till_date: data?.till_date,
          },
        }
      );

      if (response) {
        depositProcessRules.value = response?.message;
      }
    }
  } catch (error) {
    console.error("Error deleting Rules:", error);
  } finally {
    depositProcessRulesLoading.value = false;
  }
};

const handleRemoveStudent = async (student) => {
  try {
    isStudentDeleting.value = true;
    const response = await api(`/api/payroll/students/${student.id}/group`, {
      method: "DELETE",
    });

    if (response?.success) {
      toast.add({
        title: "Success",
        description:
          response?.message || "Student removed from group successfully",
        color: "success",
        duration: 2000,
      });

      emit("refresh");
    } else {
      toast.add({
        title: "Failed",
        description:
          response?._data.errors ||
          response?._data.message ||
          "Failed to delete Rules",
        color: "error",
        duration: 2000,
      });
    }
  } catch (error) {
    console.error("Error deleting Rules:", error);
  } finally {
    isStudentDeleting.value = false;
  }
};

const handleProcessStudent = async (student) => {
  selectedStudent.value = student;
  processStudentModal.value = true;
  await fetchProcessRules({
    from_date: calendarRange.value.start?.toString(),
    till_date: calendarRange.value.end?.toString(),
  });
};

const handleStudentProcessCheckClick = async (student) => {
  selectedStudent.value = student;
  processStudentCheckModal.value = true;
  await fetchCheckProcessRules({
    from_date: calendarRange.value.start?.toString(),
    till_date: calendarRange.value.end?.toString(),
  });
};

const handleStudentProcessDepositClick = async (student) => {
  selectedStudent.value = student;
  processStudentDepositModal.value = true;
  await fetchDepositProcessRules({
    from_date: calendarRange.value.start?.toString(),
    till_date: calendarRange.value.end?.toString(),
  });
};

const studentColumns = [
  { accessorKey: "first_yiddish_name", header: "First Yiddish Name" },
  { accessorKey: "last_yiddish_name", header: "Last Yiddish Name" },
  {
    header: "Quick Actions",
    cell: ({ row }) =>
      h("div", { class: "flex gap-2 items-center" }, [
        // Process Student Button
        h(
          resolveComponent("UTooltip"),
          { text: "Process Student" },
          {
            default: () =>
              h(resolveComponent("UButton"), {
                icon: "i-lucide-user-check",
                size: "md",
                color: "success",
                variant: "soft",
                onClick: () => handleProcessStudent(row.original),
              }),
          }
        ),

        // Process Check Button
        h(
          resolveComponent("UTooltip"),
          { text: "Process Check" },
          {
            default: () =>
              h(resolveComponent("UButton"), {
                icon: "i-lucide-check-square",
                size: "md",
                color: "info",
                variant: "soft",
                onClick: () => handleStudentProcessCheckClick(row.original),
              }),
          }
        ),

        // Process Depost Button
        h(
          resolveComponent("UTooltip"),
          { text: "Process Depost" },
          {
            default: () =>
              h(resolveComponent("UButton"), {
                icon: "i-lucide-wallet",
                size: "md",
                color: "warning",
                variant: "soft",
                onClick: () => handleStudentProcessDepositClick(row.original),
              }),
          }
        ),

        // Edit Student Button
        h(
          resolveComponent("UTooltip"),
          { text: "Remove Student" },
          {
            default: () =>
              h(resolveComponent("UButton"), {
                icon: "i-lucide-trash-2",
                size: "md",
                color: "error",
                variant: "soft",
                loading:
                  isStudentDeleting.value &&
                  selectedStudent.value === row.original.id,
                disabled: isStudentDeleting.value,
                onClick: () => handleRemoveStudent(row.original),
              }),
          }
        ),
      ]),
  },
];

const onDateChange = async (val) => {
  if (!val?.start || !val?.end) return;

  await fetchProcessRules({
    from_date: val.start.toString(),
    till_date: val.end.toString(),
  });
};

const onCheckDateChange = async (val) => {
  if (!val?.start || !val?.end) return;

  await fetchCheckProcessRules({
    from_date: val.start.toString(),
    till_date: val.end.toString(),
  });
};

const onDepositDateChange = async (val) => {
  if (!val?.start || !val?.end) return;

  await fetchDepositProcessRules({
    from_date: val.start.toString(),
    till_date: val.end.toString(),
  });
};
</script>

<template>
  <!-- Students Table -->
  <UCard>
    <UTable
      :columns="studentColumns"
      :loading="fetchingGroupStudents"
      :data="students"
      class="flex-1 mt-6"
    />
  </UCard>

  <!-- Student Processing Rules Modal -->
  <CommonRulesModal
    v-model="processStudentModal"
    title="Student Processing Rules"
    :rules="processRules"
    :loading="processRulesLoading"
    :metric-labels="metricLabels"
    :operater-labels="operaterLabels"
    type="process"
    @date-change="onDateChange"
  />

  <!-- Student Processing Check Modal -->
  <CommonRulesModal
    v-model="processStudentCheckModal"
    title="Student Processing Check Rules"
    :rules="checkProcessRules"
    :loading="checkProcessRulesLoading"
    :message="checkProcessRules"
    type="check"
    @date-change="onCheckDateChange"
  />

  <!-- Student Processing Deposit Modal -->
  <CommonRulesModal
    v-model="processStudentDepositModal"
    title="Student Processing Deposit Rules"
    :rules="depositProcessRules"
    :loading="depositProcessRulesLoading"
    :message="depositProcessRules"
    type="deposit"
    @date-change="onDepositDateChange"
  />
</template>
