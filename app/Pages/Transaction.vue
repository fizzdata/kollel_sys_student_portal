<script setup>
import * as yup from "yup";
import { getDayOfWeek, yiddish_date } from "~/common/Gregorian_to_Hebrew.js";

definePageMeta({ layout: "sidebar" });

const api = useApi();
const loading = ref(false);
const balanceLoading = ref(false);
const balance = ref(null);
const transaction = ref([]);
const generateChecksModal = ref(false);
const transferModal = ref(false);
const isSubmitting = ref(false);
const isTransferSubmitting = ref(false);
const toast = useToast();
const payeeOptions = ref([]);
const transferStudentOptions = ref([]);
const currentPage = ref(1);
const pageSize = ref(25);
const totalTransactions = ref(0);
const totalPages = ref(1);

const { $printJS } = useNuxtApp();

const state = reactive({
  payee: "",
  amount: "",
  memo: "",
});
const isDefaultMemoLocked = ref(false);
const generateCheckResetForm = () => {
  state.payee = null;
  state.amount = "";
  state.memo = "";
  isDefaultMemoLocked.value = false;
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

const transferState = reactive({
  transfer_to_student_id: null,
  amount: "",
  memo: "",
});

const transferSchema = yup.object({
  transfer_to_student_id: yup
    .number()
    .typeError("Student is required")
    .required("Student is required")
    .integer("Student must be an integer"),

  amount: yup
    .number()
    .typeError("Amount is required")
    .required("Amount is required")
    .min(0.01, "Amount must be at least 0.01"),

  memo: yup.string().nullable().max(255, "Memo must not exceed 255 characters"),
});

const resetTransferForm = () => {
  transferState.transfer_to_student_id = null;
  transferState.amount = "";
  transferState.memo = "";
};

const fetchTransactionSetup = async () => {
  try {
    balanceLoading.value = true;
    const response = await api(`/student-portal/transactions`);

    if (response?.success) {
      balance.value = response?.ballance || "0";
      payeeOptions.value = (response.payees || []).map((payee) => ({
  label: payee.name,
  value: payee.id,
  memo: payee.default_memo
}))
      transferStudentOptions.value = (response.transfer_students || []).map((s) => ({
  label: `${s.first_yiddish_name} ${s.last_yiddish_name || ""}`.trim(),
  value: s.id
}));
    } else {
      toast.add({
        title: "Error",
        description: response?.message || "Failed to fetch transaction setup",
        color: "error",
      });
    }
  } catch (error) {
    console.error("Setup fetch error:", error);
    toast.add({
      title: "Error",
      description: "An unexpected error occurred while fetching setup data",
      color: "error",
    });
  } finally {
    balanceLoading.value = false;
  }
};

const fetchTransactions = async (page = currentPage.value) => {
  try {
    loading.value = true;
    const response = await api(
      `/student-portal/transactions/list?page=${page}&page_size=${pageSize.value}`,
    );

    if (response?.success) {
      currentPage.value = Number(response?.page || page || 1);
      pageSize.value = Number(response?.page_size || pageSize.value);
      totalTransactions.value = Number(response?.total_transactions || 0);
      totalPages.value = Number(response?.total_pages || 1);
      transaction.value = response?.transaction || [];
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

const goToPreviousPage = async () => {
  if (currentPage.value <= 1 || loading.value) return;
  await fetchTransactions(currentPage.value - 1);
};

const goToNextPage = async () => {
  if (currentPage.value >= totalPages.value || loading.value) return;
  await fetchTransactions(currentPage.value + 1);
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

      await fetchTransactionSetup();
      await fetchTransactions();
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

const onTransferSubmit = async (event) => {
  try {
    isTransferSubmitting.value = true;
    const response = await api(`/student-portal/transfer`, {
      method: "POST",
      body: event.data,
    });

    if (response?.success) {
      toast.add({
        title: "Success",
        description: response?.message || "Transfer completed",
        color: "success",
        duration: 2000,
      });

      await fetchTransactionSetup();
      await fetchTransactions();
      transferModal.value = false;
    } else {
      toast.add({
        title: "Error",
        description: response?.message || "Failed to transfer",
        color: "error",
      });
    }
  } catch (error) {
    console.error("Transfer error:", error);
    toast.add({
      title: "Error",
      description: "An unexpected error occurred while transferring",
      color: "error",
    });
  } finally {
    isTransferSubmitting.value = false;
    transferModal.value = false;
    resetTransferForm();
  }
};
onMounted(async () => {
  await fetchTransactionSetup();
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
  return money(Number(amount || 0));
};

// Balance comes back from the API pre-formatted as a currency string (e.g. "$123.45")
const balanceDisplay = computed(() => {
  const parsed = parseFloat(String(balance.value ?? "0").replace(/[^0-9.-]/g, ""));
  return money(Number.isFinite(parsed) ? parsed : 0);
});

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
    meta: {
      class: {
        th: "w-[45%]",
      },
    },
    cell: ({ row }) =>
      h(
        "div",
        {
          class:
            "whitespace-normal break-words leading-snug max-w-[20rem] md:max-w-[30rem]",
        },
        row.original.description || "-",
      ),
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
  {
    accessorKey: "running_balance",
    header: "Balance",
    meta: {
      class: {
        th: "w-24",
      },
    },
    cell: ({ row }) => money(row.original.running_balance || 0),
  },
];

const handleChange = (event) => {
  const selectedValue =
    event && typeof event === "object" ? event.value : event;
  const data = payeeOptions.value.find((item) => item.value === selectedValue);
  const defaultMemo = data?.memo || "";

  state.memo = defaultMemo;
  isDefaultMemoLocked.value = defaultMemo.trim().length > 0;
};
</script>
<template>
  <div>
    <UCard class="rounded-2xl shadow-sm">
    <div
      class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <!-- Left Content -->
      <div class="space-y-1">
        <h2 class="text-2xl font-semibold text-gray-900">Transactions</h2>
      </div>

      <div class="flex gap-2 self-start sm:self-auto">
        <UButton
          @click="transferModal = true"
          icon="i-lucide-arrow-right-left"
          label="Transfer"
          size="lg"
        />
        <UButton
          @click="generateChecksModal = true"
          icon="i-lucide-banknote"
          label="Create Check"
          size="lg"
        />
      </div>
    </div>

    <div class="mt-6 flex flex-col items-center justify-center text-center">
      <p class="text-sm text-gray-500">Available Balance</p>
      <USkeleton v-if="balanceLoading" class="h-12 w-40 mt-1" />
      <p v-else class="text-5xl font-bold text-primary mt-1">
        {{ balanceDisplay }}
      </p>
    </div>
    </UCard>

    <UCard class="my-8 rounded-2xl">
    <UTable
      :columns="columns"
      :loading="loading"
      :data="transaction"
      class="flex-1 mt-6"
    />

    <div class="mt-4 flex flex-wrap items-center justify-between gap-3">
      <p class="text-sm text-gray-600">
        Page {{ currentPage }} of {{ totalPages }}
        ({{ totalTransactions }} transactions)
      </p>

      <div class="flex items-center gap-2">
        <UButton
          label="Previous"
          variant="outline"
          :disabled="loading || currentPage <= 1"
          @click="goToPreviousPage"
        />
        <UButton
          label="Next"
          variant="outline"
          :disabled="loading || currentPage >= totalPages"
          @click="goToNextPage"
        />
      </div>
    </div>

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
  <USelectMenu
  v-model="state.payee"
    :items="payeeOptions"
    value-key="value"
    label-key="label"
  placeholder="Please Select"
  searchable
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
                :readonly="isDefaultMemoLocked"
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

  <!-- Modal for Transfer -->
    <UModal
      :open="transferModal"
      @update:open="(value) => (transferModal = value)"
    >
    <template #header>
      <div class="flex justify-between w-full">
        <h2 class="text-xl font-bold text-primary">Transfer To Student</h2>

        <UButton
          size="sm"
          variant="outline"
          color="primary"
          class="rounded-full p-2"
          icon="i-lucide-x"
          @click="
            () => {
              transferModal = false;
              resetTransferForm();
            }
          "
        >
        </UButton>
      </div>
    </template>

    <template #body>
      <div>
        <UForm
          :schema="transferSchema"
          :state="transferState"
          class="space-y-4"
          @submit="onTransferSubmit"
        >
          <div class="flex flex-col gap-4">
           <UFormField label="Student" name="transfer_to_student_id">
  <USelectMenu
  v-model="transferState.transfer_to_student_id"
    :items="transferStudentOptions"
    value-key="value"
    label-key="label"
  placeholder="Please Select"
  searchable
  class="w-full"
/>
</UFormField>

            <UFormField label="Amount" name="amount">
              <UInput
                v-model="transferState.amount"
                placeholder="Enter amount"
                class="w-full"
                size="lg"
              />
            </UFormField>

            <UFormField label="Memo" name="memo">
              <UInput
                v-model="transferState.memo"
                placeholder="Enter memo"
                class="w-full"
                size="lg"
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
                  transferModal = false;
                  resetTransferForm();
                }
              "
            >
              Cancel
            </UButton>
            <UButton
              type="submit"
              :loading="isTransferSubmitting"
              :disabled="isTransferSubmitting"
            >
              Confirm
            </UButton>
          </div>
        </UForm>
      </div>
    </template>
    </UModal>
  </div>
</template>
