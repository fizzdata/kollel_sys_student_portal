import * as yup from "yup";

// "0" is the default password set by the reset flow (see backend AuthController).
// When isDefaultPassword is true, the caller already knows the student is on
// that default, so there's no point asking them to re-type it.
const DEFAULT_PASSWORD = "0";

export const useChangePassword = (isDefaultPassword = false) => {
  const api = useApi();
  const { t } = useAppLocale();

  const isSubmitting = ref(false);
  const state = reactive({
    old_password: isDefaultPassword ? DEFAULT_PASSWORD : null,
    password: null,
    password_confirmation: null,
  });

  const schema = computed(() =>
    yup.object({
      old_password: isDefaultPassword
        ? yup.string().notRequired()
        : yup.string().required(t("Current password is required")),
      password: yup
        .string()
        .min(4, t("Must be at least 4 characters"))
        .required(t("Password is required")),
      password_confirmation: yup
        .string()
        .oneOf([yup.ref("password")], t("Passwords must match"))
        .required(t("Confirm Password is required")),
    }),
  );

  const reset = () => {
    state.old_password = isDefaultPassword ? DEFAULT_PASSWORD : null;
    state.password = null;
    state.password_confirmation = null;
  };

  const submit = async () => {
    isSubmitting.value = true;
    try {
      const response = await api("/student-portal/change-password", {
        method: "POST",
        body: {
          old_password: isDefaultPassword
            ? DEFAULT_PASSWORD
            : state.old_password,
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
