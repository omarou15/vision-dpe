import { describe, it, expect } from "vitest";
import { cn } from "@/utils/cn";

describe("cn() - Tailwind class merger", () => {
  it("combine des classes simples", () => {
    expect(cn("px-4", "py-2")).toBe("px-4 py-2");
  });

  it("deduplique les classes conflictuelles", () => {
    expect(cn("px-4", "px-6")).toBe("px-6");
  });

  it("gere les valeurs conditionnelles", () => {
    expect(cn("base", false && "hidden", true && "visible")).toBe(
      "base visible"
    );
  });

  it("gere undefined et null", () => {
    expect(cn("base", undefined, null, "end")).toBe("base end");
  });
});
