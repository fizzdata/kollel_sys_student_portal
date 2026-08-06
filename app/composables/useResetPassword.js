export const useResetPassword = () => {
  const api = useApi();

  const step = ref("phone");
  const question = ref("");
  const isSubmitting = ref(false);
  const state = reactive({
    phone: undefined,
    answer: undefined,
  });

  const apiMessage = (response, fallback) =>
    response?._data?.errors ||
    response?._data?.message ||
    response?.data?.message ||
    response?.message ||
    fallback;

  const reset = () => {
    step.value = "phone";
    question.value = "";
    state.phone = undefined;
    state.answer = undefined;
  };

  const requestQuestion = async (org_pin) => {
    isSubmitting.value = true;
    try {
      const response = await api("/student-portal/password-reset/1", {
        method: "POST",
        body: { org_pin, phone: state.phone },
      });

      if (response?.success) {
        question.value = response.question;
        step.value = "answer";
      }

      return response;
    } finally {
      isSubmitting.value = false;
    }
  };

  const submitAnswer = async (org_pin) => {
    isSubmitting.value = true;
    try {
      return await api("/student-portal/password-reset/2", {
        method: "POST",
        body: { org_pin, phone: state.phone, answer: state.answer },
      });
    } finally {
      isSubmitting.value = false;
    }
  };

  return {
    step,
    question,
    state,
    isSubmitting,
    apiMessage,
    reset,
    requestQuestion,
    submitAnswer,
  };
};
