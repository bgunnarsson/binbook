import { expect, test } from "vitest";
import { resolveArgs } from "./resolve-args";
import type { ArgSchema } from "@bgunnarsson/binbook-types";

const schema: ArgSchema = {
  label: { type: "text", default: "Click me" },
  variant: { type: "select", options: ["primary", "ghost"], default: "primary" },
  disabled: { type: "boolean", default: false },
};

test("uses defaults when nothing overrides", () => {
  expect(resolveArgs(schema, {}, {})).toEqual({ label: "Click me", variant: "primary", disabled: false });
});

test("variant args override defaults", () => {
  expect(resolveArgs(schema, { variant: "ghost" }, {})).toMatchObject({ variant: "ghost" });
});

test("live args override variant and defaults", () => {
  expect(resolveArgs(schema, { variant: "ghost" }, { variant: "primary", label: "Buy" })).toMatchObject({
    variant: "primary",
    label: "Buy",
  });
});

test("ignores live keys not declared in the schema", () => {
  expect(resolveArgs(schema, {}, { bogus: 1 })).not.toHaveProperty("bogus");
});
