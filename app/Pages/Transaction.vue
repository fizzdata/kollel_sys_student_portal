<script setup>
import * as yup from "yup";
import { getDayOfWeek, yiddish_date } from "~/common/Gregorian_to_Hebrew.js";

definePageMeta({ layout: "sidebar" });

const api = useApi();
const loading = ref(false);
const balance = ref(null);
const transaction = ref([]);
const generateChecksModal = ref(false);
const isSubmitting = ref(false);
const toast = useToast();
const payeeOptions = ref([]);

const { $printJS } = useNuxtApp();

const state = reactive({
  payee: "",
  amount: "",
  memo: "",
});
const generateCheckResetForm = () => {
  state.payee = "";
  state.amount = "";
  state.memo = "";
};
const schema = yup.object({
  payee: yup
    .number()
    .typeError("Payee is required")
    .required("Payee is required")
    .integer("Payee must be an integer"),

  amount: yup
    .number()
    .typeError("Amount is required")
    .required("Amount is required")
    .min(0.01, "Amount must be at least 0.01"),

  memo: yup.string().nullable().max(255, "Memo must not exceed 255 characters"),
});

const fetchTransactions = async () => {
  try {
    loading.value = true;
    const response = await api(`/student-portal/transactions`);

    if (response?.success) {
      transaction.value = response?.transaction || [];
      balance.value = response?.ballance || "0";
      payeeOptions.value = response.payees.map((payee) => ({
        label: payee.name,
        value: payee.id,
        memo: payee.default_memo,
      }));
    } else {
      toast.add({
        title: "Error",
        description: response?.message || "Failed to fetch Transactions",
        color: "error",
      });
    }
  } catch (error) {
    console.error("Fetch error:", error);
    toast.add({
      title: "Error",
      description: "An unexpected error occurred while fetching transactions",
      color: "error",
    });
  } finally {
    loading.value = false;
  }
};
const onSubmit = async (event) => {
  try {
    isSubmitting.value = true;
    const response = await api(`/student-portal/generate-check`, {
      method: "POST",
      body: event.data,
    });

    if (response?.success) {
      toast.add({
        title: "Success",
        description: response?.message || "Generate Check Successfully",
        color: "success",
        duration: 2000,
      });

      $printJS({
        printable: response.pdf,
        type: "pdf",
        base64: true,
      });

      fetchTransactions();
      generateChecksModal.value = false;
    } else {
      toast.add({
        title: "Error",
        description: response?.message || "Failed to Generate Check",
        color: "error",
      });
    }
  } catch (error) {
    console.error("Fetch error:", error);
    toast.add({
      title: "Error",
      description: "An unexpected error occurred while generate check",
      color: "error",
    });
  } finally {
    isSubmitting.value = false;
    generateChecksModal.value = false;
    generateCheckResetForm();
  }
};
onMounted(async () => {
  await fetchTransactions();
});

function money(amount) {
  // Create our number formatter.
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",

    // These options are needed to round to whole numbers if that's what you want.
    //minimumFractionDigits: 0, // (this suffices for whole numbers, but will print 2500.10 as $2,500.1)
    //maximumFractionDigits: 0, // (causes 2500.99 to be printed as $2,501)
  });

  return formatter.format(amount);
}

const deposit = (amount) => {
  if (amount >= 0) {
    return money(amount);
  } else {
    return "-";
  }
};

const columns = [
  {
    accessorKey: "date",
    header: "Date",
    meta: {
      class: {
        th: "w-40",
      },
    },
    cell: ({ row }) => {
      const date = row.original.date;

      return h("div", { class: "leading-tight" }, [
        h(
          "div",
          { class: "font-medium text-gray-900" },
          `${getDayOfWeek(date)}, ${yiddish_date(date)}`,
        ),
        h("div", { class: "text-xs text-gray-500" }, date),
      ]);
    },
  },
  {
    accessorKey: "description",
    header: "Description",
  },
  {
    accessorKey: "amount",
    header: "Amount",
    meta: {
      class: {
        th: "w-20",
      },
    },
    cell: ({ row }) => deposit(row.original.amount),
  },
];

const handleChange = (event) => {
  const data = payeeOptions.value.find((item) => item.value === event);
  state.memo = data?.memo;
};
</script>
<template>
  <UCard class="rounded-2xl shadow-sm">
    <div
      class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <!-- Left Content -->
      <div class="space-y-1">
        <h2 class="text-2xl font-semibold text-gray-900">Transactions</h2>

        <!-- <div class="text-sm text-gray-600 flex gap-2 items-center text-center">
          Balance:

          <USkeleton v-if="loading" class="h-5 w-12" />
          <span v-else class="font-semibold text-gray-900">
            {{ balance }}
          </span>
        </div> -->
      </div>

      <!-- Action Button -->
      <UButton
        @click="generateChecksModal = true"
        icon="i-lucide-circle-check-big"
        label="Create Check"
        size="lg"
        class="self-start sm:self-auto"
      />
    </div>
  </UCard>

  <UCard class="my-8 rounded-2xl">
    <UTable
      :columns="columns"
      :loading="loading"
      :data="transaction"
      class="flex-1 mt-6"
    />

    <!-- <div class="overflow-x-auto">
      <table class="min-w-full table-fixed w-full border-collapse">
        <thead>
          <tr class="bg-gray-100">
            <th class="text-left p-3 w-64">Date</th>
            <th class="text-left p-3 w-[28rem]">Description</th>
            <th class="text-right p-3 w-32">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td class="p-3" colspan="3">
              <div class="flex gap-2 items-center">
                <USkeleton class="h-5 w-24" />
                <USkeleton class="h-5 w-80" />
                <USkeleton class="h-5 w-16 ml-auto" />
              </div>
            </td>
          </tr>

          <tr v-else-if="!transaction?.length">
            <td class="p-3 text-gray-500" colspan="3">No transactions</td>
          </tr>

          <tr v-else v-for="(t, i) in transaction" :key="i" class="border-t">
            <td class="p-3 align-top">
              <div class="leading-tight">
                <div class="font-medium text-gray-900">
                  {{ getDayOfWeek(t.date) }}, {{ yiddish_date(t.date) }}
                </div>
                <div class="text-xs text-gray-500">{{ t.date }}</div>
              </div>
            </td>

            <td class="p-3 align-top">
              <div
                class="whitespace-normal break-words text-gray-900 max-w-[28rem] leading-snug"
              >
                {{ t.description }}
              </div>
            </td>

            <td class="p-3 text-right align-top">
              {{ deposit(t.amount) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div> -->
  </UCard>

  <!-- Modal for Generate Checks -->
  <UModal v-model:open="generateChecksModal">
    <!-- Custom Header -->
    <template #header>
      <div class="flex justify-between w-full">
        <h2 class="text-xl font-bold text-primary">Generate Check</h2>

        <!-- Close Button -->
        <UButton
          size="sm"
          variant="outline"
          color="primary"
          class="rounded-full p-2"
          icon="i-lucide-x"
          @click="
            () => {
              generateChecksModal = false;
              generateCheckResetForm();
            }
          "
        >
        </UButton>
      </div>
    </template>

    <template #body>
      <div>
        <UForm
          :schema="schema"
          :state="state"
          class="space-y-4"
          @submit="onSubmit"
        >
          <div class="flex flex-col gap-4">
            <UFormField label="Payee" name="payee">
              <USelect
                v-model="state.payee"
                :items="payeeOptions"
                placeholder="Please Select"
                class="w-full"
                @update:model-value="handleChange"
              />
            </UFormField>
            <UFormField label="Amount" name="amount">
              <UInput
                v-model="state.amount"
                placeholder="Enter amount"
                class="w-full"
                size="lg"
              />
            </UFormField>
            <UFormField label="Memo" name="memo">
              <UInput
                v-model="state.memo"
                placeholder="Enter memo"
                class="w-full"
                size="lg"
                readonly
              />
            </UFormField>
          </div>
          <div
            class="flex justify-end items-center gap-2 mt-4 border-t border-gray-200 pt-4"
          >
            <UButton
              color="neutral"
              variant="solid"
              @click="
                () => {
                  generateChecksModal = false;
                  generateCheckResetForm();
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
              Confirm
            </UButton>
          </div>
        </UForm>
      </div>
    </template>
  </UModal>
</template>
