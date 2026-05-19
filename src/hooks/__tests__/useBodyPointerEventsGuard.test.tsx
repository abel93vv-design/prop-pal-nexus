import { describe, it, expect, afterEach } from "vitest";
import { render, act } from "@testing-library/react";
import {
  sanitizeBody,
  useBodyPointerEventsGuard,
} from "../useBodyPointerEventsGuard";

function Harness() {
  useBodyPointerEventsGuard();
  return null;
}

afterEach(() => {
  document.body.style.pointerEvents = "";
  document.body.removeAttribute("data-scroll-locked");
  document.body.style.removeProperty("overflow");
  document.body.style.removeProperty("padding-right");
  document.body.innerHTML = "";
});

describe("Body pointer-events guard (Radix leak fix)", () => {
  it("sanitizeBody clears pointer-events:none when no overlay is open", () => {
    document.body.style.pointerEvents = "none";
    sanitizeBody();
    expect(document.body.style.pointerEvents).toBe("");
  });

  it("sanitizeBody removes data-scroll-locked and overflow lock", () => {
    document.body.setAttribute("data-scroll-locked", "1");
    document.body.style.overflow = "hidden";
    document.body.style.paddingRight = "15px";
    sanitizeBody();
    expect(document.body.hasAttribute("data-scroll-locked")).toBe(false);
    expect(document.body.style.overflow).toBe("");
    expect(document.body.style.paddingRight).toBe("");
  });

  it("sanitizeBody keeps locks while a Radix dialog is open", () => {
    const dialog = document.createElement("div");
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("data-state", "open");
    document.body.appendChild(dialog);
    document.body.style.pointerEvents = "none";

    sanitizeBody();

    expect(document.body.style.pointerEvents).toBe("none");
  });

  it("sanitizeBody keeps locks while a Radix popper (Select) is open", () => {
    const popper = document.createElement("div");
    popper.setAttribute("data-radix-popper-content-wrapper", "");
    document.body.appendChild(popper);
    document.body.style.pointerEvents = "none";

    sanitizeBody();

    expect(document.body.style.pointerEvents).toBe("none");
  });

  it("hook auto-cleans body once the overlay is removed (simulates dialog close)", async () => {
    // Mount the hook
    render(<Harness />);

    // Simulate Radix opening a dialog and locking the body
    const dialog = document.createElement("div");
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("data-state", "open");
    document.body.appendChild(dialog);

    await act(async () => {
      document.body.style.pointerEvents = "none";
      document.body.setAttribute("data-scroll-locked", "1");
      // While dialog is open, observer should NOT clear
      await new Promise((r) => setTimeout(r, 10));
    });
    expect(document.body.style.pointerEvents).toBe("none");

    // Simulate Radix closing the dialog but leaving body locked (the bug)
    await act(async () => {
      dialog.remove();
      // Trigger an attribute mutation so the observer fires
      document.body.style.pointerEvents = "none";
      await new Promise((r) => setTimeout(r, 10));
    });

    expect(document.body.style.pointerEvents).toBe("");
    expect(document.body.hasAttribute("data-scroll-locked")).toBe(false);

  it("cleans body locks left over BEFORE the guard mounts (login → dashboard freeze)", async () => {
    // Simulate Radix having left the body locked while we were on /auth,
    // before the global guard mounts.
    document.body.style.pointerEvents = "none";
    document.body.setAttribute("data-scroll-locked", "1");
    document.body.style.overflow = "hidden";
    document.body.style.paddingRight = "15px";

    await act(async () => {
      render(<Harness />);
      // initial sanitize runs synchronously on mount
    });

    expect(document.body.style.pointerEvents).toBe("");
    expect(document.body.hasAttribute("data-scroll-locked")).toBe(false);
    expect(document.body.style.overflow).toBe("");
    expect(document.body.style.paddingRight).toBe("");
  });
});
