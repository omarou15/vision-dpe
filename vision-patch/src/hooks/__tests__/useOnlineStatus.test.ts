import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

describe("useOnlineStatus", () => {
  beforeEach(() => {
    // Reset to online
    Object.defineProperty(navigator, "onLine", {
      value: true,
      writable: true,
      configurable: true,
    });
  });

  it("returns true when online", () => {
    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current).toBe(true);
  });

  it("returns false when offline", () => {
    Object.defineProperty(navigator, "onLine", { value: false });
    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current).toBe(false);
  });

  it("updates when going offline", () => {
    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current).toBe(true);

    act(() => {
      Object.defineProperty(navigator, "onLine", { value: false });
      window.dispatchEvent(new Event("offline"));
    });

    expect(result.current).toBe(false);
  });

  it("updates when going online", () => {
    Object.defineProperty(navigator, "onLine", { value: false });
    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current).toBe(false);

    act(() => {
      Object.defineProperty(navigator, "onLine", { value: true });
      window.dispatchEvent(new Event("online"));
    });

    expect(result.current).toBe(true);
  });
});
