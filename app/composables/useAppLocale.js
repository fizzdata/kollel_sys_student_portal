import yi from "~/i18n/yi.json";

const dictionaries = { yi };
const ONE_YEAR = 60 * 60 * 24 * 365;

export const useAppLocale = () => {
  const locale = useCookie("kollel_sys_locale", {
    default: () => "en",
    maxAge: ONE_YEAR,
  });

  const setLocale = (value) => {
    locale.value = value;
  };

  const toggleLocale = () => {
    setLocale(locale.value === "yi" ? "en" : "yi");
  };

  const t = (key) => dictionaries[locale.value]?.[key] ?? key;

  useHead({
    htmlAttrs: {
      lang: computed(() => locale.value),
      dir: computed(() => (locale.value === "yi" ? "rtl" : "ltr")),
    },
  });

  return { locale, setLocale, toggleLocale, t };
};
