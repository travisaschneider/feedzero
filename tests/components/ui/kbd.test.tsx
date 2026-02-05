import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Kbd } from "@/components/ui/kbd.tsx";

describe("Kbd", () => {
  it("renders a <kbd> element", () => {
    const { container } = render(<Kbd>J</Kbd>);
    const kbd = container.querySelector("kbd");
    expect(kbd).not.toBeNull();
  });

  it("renders children text", () => {
    const { container } = render(<Kbd>Esc</Kbd>);
    expect(container.textContent).toBe("Esc");
  });

  it("applies default styling classes", () => {
    const { container } = render(<Kbd>K</Kbd>);
    const kbd = container.querySelector("kbd")!;
    expect(kbd.className).toContain("font-mono");
    expect(kbd.className).toContain("border");
    expect(kbd.className).toContain("rounded");
  });

  it("merges additional className", () => {
    const { container } = render(<Kbd className="ml-2">N</Kbd>);
    const kbd = container.querySelector("kbd")!;
    expect(kbd.className).toContain("ml-2");
    expect(kbd.className).toContain("font-mono");
  });

  it("passes through HTML attributes", () => {
    const { container } = render(<Kbd data-testid="my-kbd">O</Kbd>);
    const kbd = container.querySelector("kbd")!;
    expect(kbd.getAttribute("data-testid")).toBe("my-kbd");
  });

  it("has light blue background", () => {
    const { container } = render(<Kbd>J</Kbd>);
    const kbd = container.querySelector("kbd")!;
    expect(kbd.className).toContain("bg-blue-50");
  });

  it("has larger height than before (h-6 instead of h-5)", () => {
    const { container } = render(<Kbd>J</Kbd>);
    const kbd = container.querySelector("kbd")!;
    expect(kbd.className).toContain("h-6");
    expect(kbd.className).not.toContain("h-5");
  });

  it("has larger text size (text-xs instead of text-[10px])", () => {
    const { container } = render(<Kbd>J</Kbd>);
    const kbd = container.querySelector("kbd")!;
    expect(kbd.className).toContain("text-xs");
    expect(kbd.className).not.toContain("text-[10px]");
  });

  it("has blue text color", () => {
    const { container } = render(<Kbd>J</Kbd>);
    const kbd = container.querySelector("kbd")!;
    expect(kbd.className).toContain("text-blue-700");
  });
});
