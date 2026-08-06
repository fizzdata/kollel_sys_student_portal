import * as yup from "yup";

export const useChangePassword = () => {
  const api = useApi();

  const isSubmitting = ref(false);
  const state = reactive({
    old_password: null,
    password: null,
    password_confirmation: null,
  });

  const schema = yup.object({
    old_password: yup.string().min(1).required("Password is required"),
    password: yup.string().min(1, "Must be at least 8 characters").required("Password is required"),
    password_confirmation: yup
      .string()
      .oneOf([yup.ref("password")], "Passwords must match")
      .required("Confirm Password is required"),
  });

  const reset = () => {
    state.old_password = null;
    state.password = null;
    state.password_confirmation = null;
  };

  const submit = async () => {
    isSubmitting.value = true;
    try {
      const response = await api("/student-portal/change-password", {
        method: "POST",
        body: {
          old_password: state.old_password,
          password: state.password,
          password_confirmation: state.password_confirmation,
        },
      });

      if (response?.success) {
        reset();
      }

      return response;
    } finally {
      isSubmitting.value = false;
    }
  };

  return { schema, state, isSubmitting, reset, submit };
};
