import { invoke } from "@tauri-apps/api/core";

export type PrintOutcome = "printed" | "queued" | "not_seen" | "error";

export interface PrintReport {
  outcome: PrintOutcome;
  printer?: string | null;
  detail?: string;
}

export const isTauriApp = () =>
  import.meta.client &&
  typeof (window as typeof window & { __TAURI_INTERNALS__?: unknown })
    .__TAURI_INTERNALS__ !== "undefined";

// Silent native print with spooler confirmation (kiosk only).
export const printCheckNative = async (pdfBase64: string): Promise<PrintReport> => {
  try {
    const r = await invoke<{ printer?: string | null; status: PrintOutcome; detail?: string }>(
      "print_check",
      { pdfBase64 },
    );
    return { outcome: r.status, printer: r.printer, detail: r.detail };
  } catch (e) {
    return { outcome: "error", detail: String(e) };
  }
};
