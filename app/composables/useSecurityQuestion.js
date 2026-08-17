import * as yup from "yup";

export const useSecurityQuestion = () => {
  const api = useApi();
  const { t } = useAppLocale();

  const isLoading = ref(false);
  const isSubmitting = ref(false);
  const hasQuestion = ref(false);
  const state = reactive({
    question: null,
    answer: null,
  });

  const schema = computed(() =>
    yup.object({
      question: yup.string().required(t("Security question is required")),
      answer: yup.string().required(t("Answer is required")),
    }),
  );

  const fetchQuestion = async () => {
    isLoading.value = true;
    try {
      const response = await api("/student-portal/security-question", {
        method: "GET",
      });

      if (response?.success && response?.question) {
        state.question = response.question;
        hasQuestion.value = true;
      }

      return response;
    } finally {
      isLoading.value = false;
    }
  };

  const save = async () => {
    isSubmitting.value = true;
    try {
      const response = await api("/student-portal/security-question", {
        method: "POST",
        body: {
          question: state.question,
          answer: state.answer,
        },
      });

      if (response?.success) {
        hasQuestion.value = true;
        state.answer = null;
      }

      return response;
    } finally {
      isSubmitting.value = false;
    }
  };

  return { schema, state, isLoading, isSubmitting, hasQuestion, fetchQuestion, save };
};
