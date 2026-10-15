import { relaunch } from "@tauri-apps/plugin-process";
import { check } from "@tauri-apps/plugin-updater";

let updateCheckStarted = false;

const isTauriWindow = () =>
  import.meta.client &&
  typeof window !== "undefined" &&
  typeof (window as typeof window & { __TAURI_INTERNALS__?: unknown })
    .__TAURI_INTERNALS__ !== "undefined";

export default defineNuxtPlugin(() => {
  if (updateCheckStarted || !isTauriWindow() || !navigator.onLine) {
    return;
  }

  updateCheckStarted = true;

  queueMicrotask(async () => {
    try {
      const update = await check();

      if (!update) {
        return;
      }

      const version = update.version ?? "a new version";
      const notes = update.body ? `\n\n${update.body}` : "";
      const shouldInstall = window.confirm(
        `An update to ${version} is available. Install it now?${notes}`,
      );

      if (!shouldInstall) {
        return;
      }

      await update.downloadAndInstall();
      window.alert("The update was installed. The app will restart now.");
      await relaunch();
    } catch (error) {
      console.error("Tauri updater check failed:", error);
    }
  });
});
