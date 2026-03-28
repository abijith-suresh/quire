import { describe, expect, it, vi } from "vitest";
import { getToastDismissTimeout, showToast, TOAST_EVENT_NAME, type ToastDetail } from "../toast";

describe("toast utility", () => {
  it("dispatches the shared toast event", () => {
    const listener = vi.fn();
    document.addEventListener(TOAST_EVENT_NAME, listener, { once: true });

    showToast("Saved", "success");

    expect(listener).toHaveBeenCalledTimes(1);
    const event = listener.mock.calls[0][0] as CustomEvent<ToastDetail>;
    expect(event.detail).toEqual({ message: "Saved", type: "success" });
  });

  it("uses the shared dismiss timeout", () => {
    expect(getToastDismissTimeout()).toBe(3000);
  });
});
