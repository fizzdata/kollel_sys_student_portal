<script setup>
import {
  today,
  DateFormatter,
  getLocalTimeZone,
} from "@internationalized/date";
import { object, string, number } from "yup";

definePageMeta({
  layout: "sidebar",
  middleware: ["auth"],
});
// const df = new DateFormatter("en-US", {
//   year: "numeric",
//   month: "2-digit",
//   day: "2-digit",
// });
const df = new DateFormatter("en-US", {
  dateStyle: "medium",
});
// Get today's date
const todayDate = today(getLocalTimeZone());

// Get date 10 days ago
const fromDate = todayDate.subtract({ days: 10 });

const calendarRange = ref({
  start: fromDate,
  end: todayDate,
});

const api = useApi();
const loading = ref(false);
const showModal = ref(false);
const open = ref(false);
const processRules = ref([]);
const newGroup = ref(false);
const isSubmitting = ref(false);
const toast = useToast();
const groups = ref([]);
const deleteModal = ref(false);
const fetchingGroups = ref(false);
const isGroupModalOpen = async () => {
  newGroup.value = true;
  resetGroupForm();
};

const isModalOpen = async () => {
  resetGroupForm();
  showModal.value = true;
  await fetchProcessRules({
    from_date: calendarRange.value.start?.toString(),
    till_date: calendarRange.value.end?.toString(),
  });
};

// MM/dd/yyyy
const fetchProcessRules = async (date) => {
  try {
    loading.value = true;
    const response = await api(`/api/payroll/process-rules`, {
      method: "GET",
      params: {
        from_date: date?.from_date,
        till_date: date?.till_date,
      },
    });

    // console.log(fetch);
    if (response?.success) {
      processRules.value = response?.data;
    }
  } catch (err) {
    console.log("🚀 ~ fetchProcessRules ~ err:", err);
  } finally {
    loading.value = false;
  }
};

const columns = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) =>
      h(
        resolveComponent("NuxtLink"),
        {
          to: `/payroll/${row.original.id}`, // dynamic route to user detail page
          class: "text-primary hover:underline",
        },
        row.original.name
      ),
  },
  { accessorKey: "amount", header: "Amount Name" },
  {
    header: "Quick Actions",
    cell: ({ row }) =>
      h("div", { class: "flex gap-2 items-center" }, [
        // Edit User Button
        h(
          resolveComponent("UTooltip"),
          { text: "Edit User" },
          {
            default: () =>
              h(resolveComponent("UButton"), {
                icon: "i-lucide-square-pen",
                size: "md",
                color: "success",
                variant: "soft",
                onClick: () => editGroup(row.original),
              }),
          }
        ),

        h(
          resolveComponent("UTooltip"),
          { text: "Delete User" },
          {
            default: () =>
              h(resolveComponent("UButton"), {
                icon: "i-lucide-trash-2",
                size: "md",
                color: "error",
                variant: "soft",
                onClick: () => deleteUser(row.original),
              }),
          }
        ),
      ]),
  },
];

const groupSchema = object({
  name: string().required("Name is required"),
  base_amount: number()
    .typeError("Base Amount must be a number")
    .required("Base Amount is required"),

  min_amount: number().typeError("Min Amount must be a number").nullable(),
});

const groupForm = ref({
  id: null,
  name: "",
  base_amount: null,
  min_amount: 0,
});

const groupState = reactive({ ...groupForm.value });

const resetGroupForm = () => {
  Object.assign(groupForm.value, {
    id: null,
    name: "",
    base_amount: null,
    min_amount: 0,
  });

  Object.assign(groupState, groupForm.value);
};

const handleClose = () => {
  resetGroupForm();
};

const onSubmit = async (event) => {
  try {
    isSubmitting.value = true;

    const endpoint = groupForm.value.id
      ? `/api/payroll/groups/${groupForm.value.id}`
      : `/api/payroll/groups`;

    const method = groupForm.value.id ? "PUT" : "POST";
    delete event.data.id;

    const payload = groupForm.value.id
      ? {
          name: event.data.name,
          amount: event.data.base_amount ?? event.data.min_amount,
          base_amount: event.data.base_amount,
          min_amount: event.data.min_amount,
        }
      : {
          name: event.data.name,
          base_amount: event.data.base_amount,
          min_amount: event.data.min_amount,
        };

    const response = await api(endpoint, {
      method: method,
      body: payload,
    });

    if (response?.success) {
      toast.add({
        title: "Success",
        description: response?.message || "Group created successfully",
        color: "success",
        duration: 2000,
      });

      // Reset form state after submission
      resetGroupForm();

      await fetchGroups();
    } else {
      toast.add({
        title: "Failed",
        description:
          response?._data.errors ||
          response?._data.message ||
          "Failed to create group",
        color: "error",
        duration: 2000,
      });
    }
  } catch (error) {
    console.error("Error creating group:", error);
  } finally {
    isSubmitting.value = false;
    newGroup.value = false; // Close the modal
  }
};

const fetchGroups = async () => {
  try {
    fetchingGroups.value = true;
    const response = await api(`/api/payroll/groups`, {
      method: "GET",
    });

    if (response?.success) {
      groups.value = response.wages_groups.map((g) => ({
        ...g,
        base_amount: g.amount, // backend uses "amount", UI uses "base_amount"
      }));
      // You can store the fetched groups in a reactive variable if needed
    }
  } catch (err) {
    console.log("🚀 ~ fetchGroups ~ err:", err);
  } finally {
    fetchingGroups.value = false;
  }
};

onMounted(async () => {
  // Initial fetch when component is mounted
  await fetchGroups();
});

const editGroup = (group) => {
  // Open modal instantly
  newGroup.value = true;

  // Fill form instantly
  groupForm.value.id = group.id;
  groupState.name = group.name;
  groupState.base_amount = group.amount;
  groupState.min_amount = group.min_amount;
};

const deleteUser = (group) => {
  deleteModal.value = true;

  groupForm.value.id = group.id;
  groupState.name = group.name;
};

const confirmDeleteGroup = async () => {
  try {
    isSubmitting.value = true;

    const response = await api(`/api/payroll/groups/${groupForm.value.id}`, {
      method: "DELETE",
    });

    if (response?.success) {
      toast.add({
        title: "Success",
        description: response?.message || "Group deleted successfully",
        color: "success",
        duration: 2000,
      });

      await fetchGroups();
      // Reset form state after deletion
      resetGroupForm();
    } else {
      toast.add({
        title: "Failed",
        description:
          response?._data.errors ||
          response?._data.message ||
          "Failed to delete group",
        color: "error",
        duration: 2000,
      });
    }
  } catch (error) {
    console.error("Error deleting group:", error);
  } finally {
    isSubmitting.value = false;
    deleteModal.value = false; // Close the modal
  }
};

// watch for datepicker changes
watch(
  () => calendarRange.value,
  async (val) => {
    if (!val?.start || !val?.end) return;

    // close popover
    open.value = false;

    // call API
    await fetchProcessRules({
      from_date: val.start.toString(),
      till_date: val.end.toString(),
    });
  },
  { deep: true }
);
</script>

<template>
  <div class="flex justify-between items-center gap-4">
    <h2 class="text-xl font-bold my-4">Groups</h2>
    <div class="flex justify-end gap-2">
      <UButton @click="isGroupModalOpen" icon="la:user-plus" label="New Group">
      </UButton>

      <UButton @click="isModalOpen" icon="" label="Process into ready checks">
      </UButton>
    </div>
  </div>
  <UTable
    :columns="columns"
    :loading="fetchingGroups"
    :data="groups"
    class="flex-1 mt-6"
  />

  <!-- Create Group Modal -->
  <UModal v-model:open="newGroup">
    <!-- Custom Header -->
    <template #header>
      <div class="flex justify-between w-full">
        <h2 class="text-xl font-bold text-primary">
          {{ groupForm.id ? "Update Group" : "Create New Group" }}
        </h2>

        <!-- Close Button -->
        <UButton
          size="sm"
          variant="outline"
          color="primary"
          class="rounded-full p-2"
          icon="i-lucide-x"
          @click="
            () => {
              handleClose();
              newGroup = false;
            }
          "
        >
        </UButton>
      </div>
    </template>
    <template #body>
      <UForm
        :schema="groupSchema"
        :state="groupState"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField label="Name" name="name">
          <UInput
            v-model="groupState.name"
            placeholder="Enter group name"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Base Amount" name="base_amount">
          <UInput
            v-model.number="groupState.base_amount"
            type="number"
            placeholder="Enter base amount"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Min Amount" name="min_amount">
          <UInput
            v-model.number="groupState.min_amount"
            type="number"
            placeholder="Enter min amount"
            min="0"
            class="w-full"
          />
        </UFormField>

        <div
          class="flex justify-end items-center gap-2 mt-4 border-t border-gray-200 pt-4"
        >
          <UButton
            color="neutral"
            variant="solid"
            @click="
              () => {
                handleClose();
                newGroup = false;
              }
            "
          >
            Cancel
          </UButton>
          <UButton
            type="submit"
            :loading="isSubmitting"
            :disabled="isSubmitting"
          >
            {{ groupForm.id ? "Update Group" : "Create Group" }}
          </UButton>
        </div>
      </UForm>
    </template>
  </UModal>

  <!-- Modal for Processing Rules -->
  <UModal
    v-model:open="showModal"
    title="Processing Rules"
    :close="{
      color: 'primary',
      variant: 'outline',
      class: 'rounded-full',
    }"
    fullscreen
  >
    <template #body>
      <UFormField label="Select Date Range" class="mb-4">
        <UPopover v-model:open="open">
          <UButton color="neutral" variant="subtle" icon="i-lucide-calendar">
            <template v-if="calendarRange.start">
              <template v-if="calendarRange.end">
                {{ df.format(calendarRange.start.toDate(getLocalTimeZone())) }}
                -
                {{ df.format(calendarRange.end.toDate(getLocalTimeZone())) }}
              </template>
              <template v-else>
                {{ df.format(calendarRange.start.toDate(getLocalTimeZone())) }}
              </template>
            </template>
            <template v-else> Pick a date </template>
          </UButton>

          <template #content>
            <UCalendar
              v-model="calendarRange"
              range
              :number-of-months="2"
              class="p-2"
            />
          </template>
        </UPopover>
      </UFormField>
      <div v-if="loading" class="flex items-center justify-center pt-10 w-full">
        <BaseSpinner :show-loader="loading" size="md" class="my-10 mx-auto" />
      </div>

      <div
        v-else-if="processRules?.length > 0"
        class="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-8"
      >
        <UCard
          v-for="student in processRules"
          :key="student.name"
          class="rounded-2xl shadow hover:shadow-xl transition-shadow duration-300"
        >
          <!-- Header: Student Name -->
          <template #header>
            <div class="text-lg font-semibold text-gray-800">
              {{ student.name }}
            </div>
          </template>

          <!-- Body: Prices and Rules -->
          <div class="space-y-4">
            <!-- Prices -->
            <div class="flex justify-between items-center">
              <span class="text-gray-500 font-medium">Base Price: </span>
              <span class="font-semibold text-text-primary"
                >${{ student.base_price }}</span
              >
            </div>
            <div class="flex justify-between items-center">
              <span class="text-gray-500 font-medium">Net Price: </span>
              <span class="font-semibold text-green-600"
                >${{ student.net_price }}</span
              >
            </div>

            <!-- Rules -->
            <div>
              <h3 class="text-gray-700 font-medium mb-2">Rules:</h3>
              <ul class="space-y-1">
                <li
                  v-for="(ruleItem, index) in student.rules"
                  :key="index"
                  class="text-sm flex justify-between border-l-4 pl-2 py-1 border-gray-200 hover:border-gray-500 transition-colors"
                >
                  <span class="truncate">{{ ruleItem.rule.description }}</span>
                  <span
                    :class="
                      ruleItem.applies.sign === '+'
                        ? 'text-green-500'
                        : 'text-red-500'
                    "
                    class="font-semibold"
                  >
                    {{ ruleItem.applies.sign }}
                    {{
                      ruleItem.applies.percent
                        ? ruleItem.applies.value + "%"
                        : "$" + ruleItem.applies.value
                    }}
                  </span>
                </li>
              </ul>
            </div>
          </div>

          <!-- Footer: Optional -->
          <!-- <template #footer>
            <div class="text-right text-sm text-gray-400">
              Last updated: {{ new Date().toLocaleDateString() }}
            </div>
          </template> -->
        </UCard>
      </div>

      <!-- Empty state -->
      <div
        v-else-if="processRules?.length === 0"
        class="text-center text-gray-400 mt-10"
      >
        No Processing Rules Found.
      </div>
    </template>
  </UModal>

  <!-- Modal for Delete Payroll -->
  <UModal
    v-model:open="deleteModal"
    title="Confirm Delete Group"
    :close="{
      color: 'primary',
      variant: 'outline',
      class: 'rounded-full',
    }"
  >
    <template #body>
      <div>
        <p>
          Are you sure you want to delete
          <span v-if="groupState?.name" class="font-bold">
            {{ groupState?.name }}
          </span>
          this group?
        </p>
      </div>
      <div class="flex gap-2 justify-end items-center">
        <UButton
          color="neutral"
          variant="solid"
          class="mt-4"
          @click="
            () => {
              deleteModal = false;
            }
          "
        >
          Cancel
        </UButton>
        <UButton
          color="error"
          variant="solid"
          class="mt-4"
          :loading="isSubmitting"
          :disabled="isSubmitting"
          @click="confirmDeleteGroup()"
        >
          Delete
        </UButton>
      </div>
    </template>
  </UModal>
</template>
