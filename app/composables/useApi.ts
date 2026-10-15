
export const useApi = () => {
  const config = useRuntimeConfig();
  const baseUrl = config.public.API_URL;
  const token = useCookie("kollel_stundent_token");
  const { markOffline, markOnline } = useConnectivity();
  const offlineMessage =
    "You are not connected to the internet. Please check the network connection.";

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

      const response = await $fetch(url, {
        baseURL: baseUrl,
        headers,
        ...options,
      });

      markOnline();
      return response;
    } catch (error: any) {
      if (error.response?._data?.reLogin === true) {
        token.value = null; // Clear cookie correctly
        navigateTo('/')
      }

      // ✅ Return the full error response if available
      if (error.response) {
        markOnline();
        return error.response; // This allows you to see the actual response error
      }

      markOffline();

      // ✅ Return a structured error object instead of throwing
      return {
        success: false,
        message: offlineMessage,
        status: 0,
        _data: {
          message: offlineMessage,
        },
      };
    }
  };
};


