import { TOAST_DISMISS_TIMEOUT_MS } from "../constants";

export type ToastType = "success" | "error" | "info";

export interface ToastDetail {
  message: string;
  type: ToastType;
}

export const TOAST_EVENT_NAME = "quire:toast";

export function showToast(message: string, type: ToastType): void {
  document.dispatchEvent(
    new CustomEvent<ToastDetail>(TOAST_EVENT_NAME, {
      detail: { message, type },
    })
  );
}

export function getToastDismissTimeout(): number {
  return TOAST_DISMISS_TIMEOUT_MS;
}
