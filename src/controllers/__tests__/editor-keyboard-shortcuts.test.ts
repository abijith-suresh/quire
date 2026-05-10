import { describe, expect, it } from "vitest";
import { isEditableTarget } from "../editor-keyboard-shortcuts";

describe("editor keyboard shortcut helpers", () => {
  it("treats text inputs as editable targets", () => {
    expect(isEditableTarget(document.createElement("input"))).toBe(true);
    expect(isEditableTarget(document.createElement("textarea"))).toBe(true);
    expect(isEditableTarget(document.createElement("select"))).toBe(true);
  });

  it("treats contenteditable regions as editable targets", () => {
    const element = document.createElement("div");
    element.setAttribute("contenteditable", "true");

    expect(isEditableTarget(element)).toBe(true);
  });

  it("ignores non-editable elements", () => {
    expect(isEditableTarget(document.createElement("button"))).toBe(false);
    expect(isEditableTarget(document.createElement("div"))).toBe(false);
    expect(isEditableTarget(null)).toBe(false);
  });
});
