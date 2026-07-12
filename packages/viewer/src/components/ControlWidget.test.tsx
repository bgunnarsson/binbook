import { render, screen, fireEvent } from "@testing-library/react";
import { test, expect, vi } from "vitest";
import { ControlWidget } from "./ControlWidget";
import type { ArgSpec } from "@bgunnarsson/binbook-types";

test("text widget fires onChange with the new value", () => {
  const onChange = vi.fn();
  const spec: ArgSpec = { type: "text", default: "hi" };
  render(<ControlWidget name="label" spec={spec} value="hi" onChange={onChange} />);
  fireEvent.change(screen.getByLabelText("label"), { target: { value: "bye" } });
  expect(onChange).toHaveBeenCalledWith("label", "bye");
});
