/**
 * Shows a modal prompting the user for a PDF password.
 * @param fileName - The name of the PDF file requiring a password.
 * @param isRetry - If true, shows an "Incorrect password" message.
 * @returns The entered password string, or null if the user cancelled.
 */
export function promptForPassword(fileName: string, isRetry: boolean): Promise<string | null> {
  return new Promise((resolve) => {
    // Store the element that triggered the modal so focus can be restored on close
    const triggerElement = document.activeElement as HTMLElement | null;

    // Backdrop
    const backdrop = document.createElement("div");
    backdrop.style.cssText =
      "position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:50;display:flex;align-items:center;justify-content:center;";

    // Modal panel
    const modal = document.createElement("div");
    modal.style.cssText =
      'background:#fff;padding:32px;min-width:320px;max-width:420px;width:90%;font-family:"Bebas Neue",sans-serif;';
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-labelledby", "password-modal-title");

    // Title
    const title = document.createElement("div");
    title.id = "password-modal-title";
    title.textContent = "PASSWORD REQUIRED";
    title.style.cssText = "font-size:24px;letter-spacing:0.05em;color:#111;margin-bottom:6px;";

    // File name
    const fileLabel = document.createElement("div");
    fileLabel.textContent = fileName;
    fileLabel.style.cssText =
      "font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#888;margin-bottom:16px;font-family:monospace;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;";

    // Error message (only when retrying)
    const errorMsg = document.createElement("div");
    errorMsg.textContent = "Incorrect password. Try again.";
    errorMsg.setAttribute("aria-live", "polite");
    errorMsg.style.cssText =
      "color:#ff0000;font-size:12px;letter-spacing:0.05em;margin-bottom:12px;font-family:monospace;" +
      (isRetry ? "" : "display:none;");

    // Password input
    const input = document.createElement("input");
    input.type = "password";
    input.placeholder = "Enter password";
    input.style.cssText =
      "width:100%;box-sizing:border-box;padding:10px 12px;border:1px solid #ddd;outline:none;font-size:14px;font-family:monospace;margin-bottom:20px;";
    input.addEventListener("focus", () => {
      input.style.borderColor = "#111";
    });
    input.addEventListener("blur", () => {
      input.style.borderColor = "#ddd";
    });

    // Button row
    const buttonRow = document.createElement("div");
    buttonRow.style.cssText = "display:flex;gap:12px;justify-content:flex-end;";

    const cancelBtn = document.createElement("button");
    cancelBtn.textContent = "Cancel";
    cancelBtn.style.cssText =
      'padding:8px 20px;border:1px solid #111;background:#fff;color:#111;cursor:pointer;font-family:"Bebas Neue",sans-serif;font-size:14px;letter-spacing:0.05em;';

    const unlockBtn = document.createElement("button");
    unlockBtn.textContent = "Unlock";
    unlockBtn.style.cssText =
      'padding:8px 20px;border:1px solid #111;background:#111;color:#fff;cursor:pointer;font-family:"Bebas Neue",sans-serif;font-size:14px;letter-spacing:0.05em;';

    buttonRow.appendChild(cancelBtn);
    buttonRow.appendChild(unlockBtn);

    modal.appendChild(title);
    modal.appendChild(fileLabel);
    modal.appendChild(errorMsg);
    modal.appendChild(input);
    modal.appendChild(buttonRow);
    backdrop.appendChild(modal);
    document.body.appendChild(backdrop);

    // Focus the input after mounting
    requestAnimationFrame(() => input.focus());

    const cleanup = () => {
      document.body.removeChild(backdrop);
      triggerElement?.focus();
    };

    const submit = () => {
      cleanup();
      resolve(input.value);
    };

    const cancel = () => {
      cleanup();
      resolve(null);
    };

    unlockBtn.addEventListener("click", submit);
    cancelBtn.addEventListener("click", cancel);

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") submit();
    });

    // Focus trap: Tab/Shift+Tab cycles within [input, cancelBtn, unlockBtn]
    // Escape closes the modal from anywhere in the backdrop
    const focusable = [input, cancelBtn, unlockBtn];
    backdrop.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        cancel();
        return;
      }
      if (e.key === "Tab") {
        const currentIndex = focusable.indexOf(document.activeElement as HTMLElement);
        e.preventDefault();
        if (e.shiftKey) {
          const prevIndex = currentIndex <= 0 ? focusable.length - 1 : currentIndex - 1;
          focusable[prevIndex].focus();
        } else {
          const nextIndex = currentIndex >= focusable.length - 1 ? 0 : currentIndex + 1;
          focusable[nextIndex].focus();
        }
      }
    });

    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) cancel();
    });
  });
}
