type ConnectivityState = {
  isOnline: boolean;
  isChecking: boolean;
  lastFailureAt: number | null;
};

const RETRY_INTERVAL_MS = 10000;
const PROBE_TIMEOUT_MS = 5000;

let initialized = false;
let retryTimer: number | null = null;

const clearRetryTimer = () => {
  if (retryTimer !== null && import.meta.client) {
    window.clearInterval(retryTimer);
    retryTimer = null;
  }
};

export const useConnectivity = () => {
  const config = useRuntimeConfig();
  const state = useState<ConnectivityState>("app-connectivity", () => ({
    isOnline: import.meta.client ? navigator.onLine : true,
    isChecking: false,
    lastFailureAt: null,
  }));

  const markOnline = () => {
    state.value.isOnline = true;
    state.value.lastFailureAt = null;
    clearRetryTimer();
  };

  const markOffline = () => {
    state.value.isOnline = false;
    state.value.lastFailureAt = Date.now();
  };

  const probeConnection = async () => {
    if (!import.meta.client || state.value.isChecking) {
      return state.value.isOnline;
    }

    state.value.isChecking = true;

    try {
      const probeUrl = new URL(config.public.API_URL);
      probeUrl.searchParams.set("_connectivity", Date.now().toString());

      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);

      try {
        await fetch(probeUrl.toString(), {
          method: "GET",
          cache: "no-store",
          credentials: "omit",
          headers: {
            Accept: "application/json",
          },
          signal: controller.signal,
        });
      } finally {
        window.clearTimeout(timeout);
      }

      markOnline();
      return true;
    } catch {
      markOffline();
      return false;
    } finally {
      state.value.isChecking = false;
    }
  };

  const ensureRetryLoop = () => {
    if (!import.meta.client || retryTimer !== null) {
      return;
    }

    retryTimer = window.setInterval(async () => {
      if (state.value.isOnline) {
        clearRetryTimer();
        return;
      }

      if (!navigator.onLine) {
        return;
      }

      await probeConnection();
    }, RETRY_INTERVAL_MS);
  };

  if (import.meta.client && !initialized) {
    initialized = true;

    window.addEventListener("online", () => {
      probeConnection();
    });

    window.addEventListener("offline", () => {
      markOffline();
      ensureRetryLoop();
    });

    if (!navigator.onLine) {
      markOffline();
      ensureRetryLoop();
    }
  }

  if (!state.value.isOnline) {
    ensureRetryLoop();
  }

  return {
    isOnline: computed(() => state.value.isOnline),
    isChecking: computed(() => state.value.isChecking),
    markOnline,
    markOffline: () => {
      markOffline();
      ensureRetryLoop();
    },
    probeConnection,
  };
};
