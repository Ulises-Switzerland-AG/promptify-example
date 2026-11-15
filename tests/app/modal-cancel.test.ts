import { describe, expect, it, vi } from "vitest";
import { handleModalCancel } from "@/app/components/modal-cancel";

const cancelEvent = (target: object, currentTarget: object) => ({ target, currentTarget, preventDefault: vi.fn() });

describe("Prompt modal cancel handling", () => {
  it("replaces Escape on the modal itself with a URL-backed dismissal", () => {
    const modal = {};
    const event = cancelEvent(modal, modal);
    const dismiss = vi.fn();
    handleModalCancel(event, dismiss);
    expect(event.preventDefault).toHaveBeenCalled();
    expect(dismiss).toHaveBeenCalledOnce();
  });

  it("leaves Escape on a nested dialog alone so it closes itself", () => {
    const event = cancelEvent({}, {});
    const dismiss = vi.fn();
    handleModalCancel(event, dismiss);
    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(dismiss).not.toHaveBeenCalled();
  });
});
