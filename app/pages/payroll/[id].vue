<script setup>
import {
  today,
  DateFormatter,
  getLocalTimeZone,
} from "@internationalized/date";
import { id } from "@nuxt/ui/runtime/locale/index.js";
import { object, string, number } from "yup";

definePageMeta({
  layout: "sidebar",
  middleware: ["auth"],
});

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

const deductionItems = ref([
  {
    label: "Deduction",
    value: true,
  },
  {
    label: "Bonus",
    value: false,
  },
]);
const amountTypeItems = ref([
  {
    label: "Fixed",
    value: "fixed",
  },
  {
    label: "Percentage",
    value: "percentage",
  },
]);

const applyOnceItems = ref(["Apply Once", "Each Time"]);

const operaterLabels = ref({});
const metricLabels = ref({});

const operaterLabelsStatic = {
  equals: "Equals to",
  not_equals: "Not Equals to",
  greater_than: "Greater Than",
  less_than: "Less Than",
  greater_than_or_equal: "Greater Than or Equal to",
  less_than_or_equal: "Less Than or Equal to",
};

const route = useRoute();
const groupId = route.params.id;
const loading = ref(false);
const api = useApi();
const router = useRouter();
const ruleId = ref(null);

const rules = ref([]);
const processRules = ref([]);
const rulesModalOpen = ref(false);
const operatorOptions = ref([]);
const metricOptions = ref([]);
const isSubmitting = ref(false);
const toast = useToast();
const fetchingRulesOptions = ref(false);
const fetchingGroupDetails = ref(null);
const deleteModal = ref(false);
const showModal = ref(false);

const isModalOpen = async () => {
  showModal.value = true;
  await fetchProcessRules({
    from_date: calendarRange.value.start?.toString(),
    till_date: calendarRange.value.end?.toString(),
  });
};

// Form State and Schema
const schema = object({
  metric: string().required("Metric is required"),
  operator: string().required("Operator is required"),
  value: string().required("Value is required"),
  second_value: string().nullable(),
  is_deduction: string().required("Is Deduction is required"),
  amount_type: string().required("Amount Type is required"),
  amount: number()
    .typeError("Amount must be a number")
    .required("Amount is required")
    .min(0, "Amount cannot be negative"),
  apply_once: string().required("Apply Rules is required"),
  description: string(),
});

const rulesform = ref({
  id: null,
  metric: "",
  operator: "",
  value: "",
  second_value: "",
  is_deduction: "",
  amount_type: "",
  amount: "",
  apply_once: "Apply Once",
  description: "",
  reference_id: "",
});

const rulesState = reactive({ ...rulesform.value });

const resetRulesForm = () => {
  Object.assign(rulesform.value, {
    id: null,
    metric: "",
    operator: "",
    value: "",
    second_value: "",
    is_deduction: "",
    amount_type: "",
    amount: "",
    apply_once: "Apply Once",
    description: "",
    reference_id: "",
  });
  Object.assign(rulesState, rulesform.value);
};

// MM/dd/yyyy
const fetchProcessRules = async (date) => {
  await rulesOptionsFetch(); // Ensure labels are loaded
  try {
    loading.value = true;
    const response = await api(`/api/payroll/process-rules/group/${groupId}`, {
      method: "GET",
      params: {
        from_date: date?.from_date,
        till_date: date?.till_date,
      },
    });

    if (response?.success) {
      processRules.value = response?.data;
    }
  } catch (err) {
    console.log("🚀 ~ fetchProcessRules ~ err:", err);
  } finally {
    loading.value = false;
  }
};

const editRules = (rules) => {
  rulesOptionsFetch();

  // Open modal instantly
  rulesModalOpen.value = true;

  // Fill form instantly
  rulesform.value.id = rules.id;
  rulesState.metric = rules.metric;
  rulesState.operator = rules.operator;
  rulesState.value = rules.value;
  rulesState.second_value = rules.second_value;
  rulesState.is_deduction = rules.is_deduction === 1 ? true : false;
  rulesState.amount_type = rules.amount_type;
  rulesState.amount = rules.amount;
  rulesState.apply_once = rules.apply_once === 1 ? "Apply Once" : "Each Time";
  rulesState.description = rules.description;
  rulesState.reference_id = rules.reference_id;
  rulesState.session = rules.session;
  rulesState.session = rules.session;
};

const confirmDeleteRules = async () => {
  try {
    isSubmitting.value = true;

    const response = await api(
      `/api/payroll/group/${groupId}/rules/${rulesform.value.id}`,
      {
        method: "DELETE",
      }
    );

    if (response?.success) {
      toast.add({
        title: "Success",
        description: response?.message || "Rules deleted successfully",
        color: "success",
        duration: 2000,
      });

      await fetchRules();
      // Reset form state after deletion
      resetRulesForm();
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
    isSubmitting.value = false;
    deleteModal.value = false; // Close the modal
  }
};

const onSubmit = async (event) => {
  try {
    isSubmitting.value = true;

    const endpoint = rulesform.value.id
      ? `/api/payroll/group/${groupId}/rules/${rulesform.value.id}`
      : `/api/payroll/group/${groupId}/rules`;

    const payload = {
      ...event.data,
      is_deduction: event.data.is_deduction === "true" ? true : false,
      apply_once: event.data.apply_once === "Apply Once" ? true : false,
    };

    delete payload.id;
    const response = await api(endpoint, {
      method: rulesform.value.id ? "PUT" : "POST",
      body: payload,
    });

    if (response?.success) {
      toast.add({
        title: "Success",
        description: response?.message || "New Rules created successfully",
        color: "success",
        duration: 2000,
      });

      await fetchRules();
      // Reset form state after submission
      resetRulesForm();
    } else {
      toast.add({
        title: "Failed",
        description:
          response?._data.errors ||
          response?._data.message ||
          "Failed to create New Rules",
        color: "error",
        duration: 2000,
      });
    }
  } catch (error) {
    console.error("Error creating Rules:", error);
  } finally {
    isSubmitting.value = false;
    rulesModalOpen.value = false; // Close the modal
  }
};

const fetchGroupDetail = async () => {
  try {
    const response = await api(`/api/payroll/groups/${groupId}`);

    if (response?.success) {
      fetchingGroupDetails.value = response?.group;
    }
  } catch (err) {
    console.log("🚀 ~ fetchStudents ~ err:", err);
  }
};

const rulesOptionsFetch = async () => {
  try {
    fetchingRulesOptions.value = true;
    const response = await api(`/api/payroll/rules-options`);

    if (response?.success) {
      // Metrics dropdown
      metricOptions.value = response.metrics.map((m) => ({
        label: m.description, // human-friendly label
        value: m.metric, // internal value
      }));

      // Operators dropdown
      operatorOptions.value = response.operators.map((op) => ({
        label: op.description, // human-friendly label
        value: op.operator, // internal value
      }));

      // Set labels for display
      metricLabels.value = response.metrics.reduce((acc, m) => {
        acc[m.metric] = m.description;
        return acc;
      }, {});
      operaterLabels.value = response.operators.reduce((acc, op) => {
        acc[op.operator] = op.description;
        return acc;
      }, {});
    }
  } catch (error) {
    console.error("An error occurred:", error.message);
  } finally {
    fetchingRulesOptions.value = false;
  }
};

const fetchRules = async () => {
  try {
    const response = await api(`/api/payroll/group/${groupId}/rules`);

    if (response?.success) {
      rules.value = response.pay_rules;
    }
  } catch (err) {
    console.log("🚀 ~ fetchGroups ~ err:", err);
  }
};

const ismodalOpen = async () => {
  rulesModalOpen.value = true;
  await rulesOptionsFetch();
};

const deleteRule = (rule) => {
  deleteModal.value = true;

  rulesform.value.id = rule.id;
};

onMounted(async () => {
  loading.value = true;
  await fetchRules();
  await fetchGroupDetail();
  loading.value = false;
});

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
  <div>
    <UButton
      variant="outline"
      color="primary"
      to="/payroll"
      icon="i-lucide-arrow-left"
    >
      Back to Payroll List
    </UButton>

    <div v-if="loading" class="flex items-center justify-center pt-10 w-full">
      <BaseSpinner :show-loader="loading" size="md" />
    </div>

    <div v-else>
      <div class="flex justify-between items-center gap-2">
        <div class="mt-4">
          <h1><strong>Group Name:</strong> {{ fetchingGroupDetails?.name }}</h1>
          <p>
            <strong> Group Amount: </strong>
            {{ fetchingGroupDetails?.amount }}
          </p>
        </div>
        <div class="flex gap-2">
          <UButton
            @click="isModalOpen"
            icon=""
            label=" Processing Rules / Conditions"
            class="mb-4"
            variant="outline"
          />
          <UButton
            @click="ismodalOpen"
            icon="i-lucide-plus"
            label=" Create your Rules / Conditions"
            class="mb-4"
            variant="outline"
          />
        </div>
      </div>

      <div v-if="rules.length === 0" class="text-center text-gray-500 mt-10">
        No Rules found. Please add some rules.
      </div>

      <div v-else>
        <h3 class="font-bold text-xl mb-4">Rules ({{ rules?.length }})</h3>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          <UCard
            v-for="rule in rules"
            :key="rule.id"
            class="rounded-2xl shadow hover:shadow-xl transition-shadow duration-300"
          >
            <div>
              <label>
                If {{ metricLabels[rule.metric] }} is
                {{ operaterLabels[rule.operator] }} {{ rule.value }},
                {{ rule.is_deduction ? "Deduction" : "Bonus" }} is
                {{ rule.amount_type }}
                {{ rule.amount }}
                {{ rule.amount_type === "fixed" ? "dollars" : "percent" }},
                {{ rule.apply_once ? "once" : "each time" }}
              </label>
            </div>
            <div
              class="flex justify-between items-baseline text-end gap-6 text-gray-500"
            >
              <p class="text-xs mt-2">
                {{ rule.description }}
              </p>
              <div class="flex gap-2 items-center">
                <UButton
                  icon="i-lucide-square-pen"
                  size="md"
                  color="success"
                  variant="soft"
                  @click="editRules(rule)"
                />

                <UButton
                  icon="i-lucide-trash-2"
                  size="md"
                  color="error"
                  variant="soft"
                  @click="deleteRule(rule)"
                />
              </div>
            </div>
          </UCard>
        </div>
      </div>
    </div>
  </div>

  <UModal v-model:open="rulesModalOpen">
    <!-- Custom Header -->
    <template #header>
      <div class="flex justify-between w-full">
        <h2 class="text-xl font-bold text-primary">
          {{ rulesform.id ? "Edit Rules" : " Create New Rules" }}
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
              rulesModalOpen = false;
              resetRulesForm();
            }
          "
        >
        </UButton>
      </div>
    </template>
    <template #body>
      <div
        v-if="fetchingRulesOptions"
        class="flex items-center justify-center pt-10 w-full"
      >
        <BaseSpinner :show-loader="fetchingRulesOptions" size="md" />
      </div>

      <UForm
        v-else
        :state="rulesState"
        :schema="schema"
        class=""
        @submit="onSubmit"
      >
        <div class="grid grid-cols-2 gap-4">
          <UFormField label="Metric" name="metric">
            <USelect
              v-model="rulesState.metric"
              :items="metricOptions"
              placeholder="Please Select"
              class="w-full"
            />
          </UFormField>
          <UFormField label="Operator" name="operator">
            <USelect
              v-model="rulesState.operator"
              :items="operatorOptions"
              placeholder="Please Select"
              class="w-full"
            />
          </UFormField>
          <UFormField label="Value" name="value">
            <UInput
              v-model="rulesState.value"
              placeholder="Enter your value"
              class="w-full"
              type="number"
            />
          </UFormField>
          <UFormField label="Second Operator" name="second_operator">
            <USelect
              v-model="rulesState.second_operator"
              :items="operatorOptions"
              placeholder="Please Select"
              class="w-full"
            />
          </UFormField>
          <UFormField label="Second Value" name="second_value">
            <UInput
              v-model="rulesState.second_value"
              placeholder="Enter second value"
              class="w-full"
              type="number"
            />
          </UFormField>
          <UFormField label="Session Number" name="session">
            <UInput
              v-model="rulesState.session"
              placeholder="Enter session number"
              class="w-full"
              type="number"
            />
          </UFormField>
          <UFormField label="Is Deduction" name="is_deduction">
            <USelect
              v-model="rulesState.is_deduction"
              :items="deductionItems"
              placeholder="Please Select"
              class="w-full"
            />
          </UFormField>
          <UFormField label="Amount Type" name="amount_type">
            <USelect
              v-model="rulesState.amount_type"
              :items="amountTypeItems"
              placeholder="Please Select"
              class="w-full"
            />
          </UFormField>
          <UFormField label="Amount" name="amount">
            <UInput
              v-model="rulesState.amount"
              placeholder="Enter your amount"
              class="w-full"
              type="number"
            />
          </UFormField>
          <UFormField label="Apply Rules" name="apply_once">
            <URadioGroup
              v-model="rulesState.apply_once"
              :items="applyOnceItems"
            />
          </UFormField>
          <UFormField label="Description" name="description">
            <UInput
              v-model="rulesState.description"
              placeholder="Please enter description"
              class="w-full"
            />
          </UFormField>
          <UFormField label="Reference" name="reference_id">
            <UInput
              v-model.number="rulesState.reference_id"
              placeholder="Enter your reference id"
              class="w-full"
              type="number"
            />
          </UFormField>
        </div>
        <div class="mt-8 flex gap-2 justify-end">
          <UButton
            @click="rulesModalOpen = false"
            color="neutral"
            class="justify-center"
          >
            Cancel
          </UButton>
          <UButton
            type="submit"
            :loading="isSubmitting"
            :disabled="isSubmitting"
            class="justify-center"
          >
            {{ rulesform.id ? "Update" : "Submit" }}
          </UButton>
        </div>
      </UForm>
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
          <!-- <span v-if="rulesform?.name" class="font-bold">
            {{ rulesform?.name }}
          </span> -->
          these Rules?
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
          @click="confirmDeleteRules()"
        >
          Delete
        </UButton>
      </div>
    </template>
  </UModal>

  <!-- Modal for Processing Rules -->
  <UModal v-model:open="showModal" fullscreen>
    <template #header>
      <div class="flex justify-between w-full">
        <h2 class="text-xl font-bold text-primary">Processing Rules</h2>

        <!-- Close Button -->
        <UButton
          size="sm"
          variant="outline"
          color="primary"
          class="rounded-full p-2"
          icon="i-lucide-x"
          @click="
            () => {
              showModal = false;
            }
          "
        >
        </UButton>
      </div>
    </template>
    <template #body>
      <UFormField label="Select Date Range" class="text-lg font-bold mb-4">
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
        v-if="processRules.length === 0"
        class="text-center text-gray-500 mt-10"
      >
        No Rules found. Please add some rules.
      </div>
      <div
        v-else
        class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-6"
      >
        <UCard
          v-for="processRule in processRules"
          :key="processRule.name"
          class="rounded-2xl shadow hover:shadow-xl transition-shadow duration-300"
        >
          <div>
            <h1>Name: {{ processRule.name }}</h1>
            <p>Base Price: {{ processRule.base_price }}</p>
            <p>Net Value: {{ processRule.net_value }}</p>
          </div>

          <span>Rules:</span>
          <ul class="space-y-1">
            <li
              v-for="(ruleItem, index) in processRule.rules"
              :key="index"
              class="text-sm flex justify-between border-l-4 pl-2 py-1 border-gray-200 hover:border-indigo-500 transition-colors"
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
                    ? ruleItem.applies.net_value + "%"
                    : "$" + ruleItem.applies.net_value
                }}
              </span>
            </li>
          </ul>
        </UCard>
      </div>
    </template>
  </UModal>
</template>
