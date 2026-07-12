import type { ArgSpec } from "@bgunnarsson/binbook-types";

export type WidgetKind = "input" | "dropdown" | "checkbox" | "stepper" | "swatch";

export function widgetFor(spec: ArgSpec): WidgetKind {
  switch (spec.type) {
    case "text":
      return "input";
    case "select":
      return "dropdown";
    case "boolean":
      return "checkbox";
    case "number":
      return "stepper";
    case "color":
      return "swatch";
  }
}
