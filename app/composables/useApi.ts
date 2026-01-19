
export const useApi = () => {
  const config = useRuntimeConfig();
  const baseUrl = config.public.API_URL;
  const token = useCookie("kollel_stundent_token");

  return async (url: string, options: any = {}) => {
    try {
      // Don't set Content-Type if body is FormData (let browser set multipart/form-data)
      const headers: any = {
        Accept: "application/json",
        ...(token.value ? { Authorization: `Bearer ${token.value}` } : {}),
      };

      // Only set Content-Type if NOT FormData
      if (!(options.body instanceof FormData)) {
        headers["Content-Type"] = "application/json";
      }

      return await $fetch(url, {
        baseURL: baseUrl,
        headers,
        ...options,
      });
    } catch (error: any) {
      if (error.response?._data?.reLogin === true) {
        token.value = null; // Clear cookie correctly
        navigateTo('/')
      }

      // ✅ Return the full error response if available
      if (error.response) {
        return error.response; // This allows you to see the actual response error
      }

      // ✅ Return a structured error object instead of throwing
      return {
        success: false,
        message: error?.data?.message || "An unexpected error occurred.",
        status: error?.status || 500,
      };
    }
  };
};



