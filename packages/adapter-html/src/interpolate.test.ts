import { expect, test } from "vitest";
import { interpolate } from "./interpolate";

test("substitutes and escapes text values", () => {
  expect(interpolate("<b>{{label}}</b>", { label: "<x>" })).toBe("<b>&lt;x&gt;</b>");
});

test("class interpolation", () => {
  expect(interpolate('class="btn btn--{{variant}}"', { variant: "ghost" })).toBe(
    'class="btn btn--ghost"',
  );
});

test("boolean attribute true renders the bare attribute", () => {
  expect(interpolate("<button {{disabled}}>x</button>", { disabled: true })).toBe(
    "<button disabled>x</button>",
  );
});

test("boolean attribute false renders nothing", () => {
  expect(interpolate("<button {{disabled}}>x</button>", { disabled: false })).toBe(
    "<button >x</button>",
  );
});

test("unknown args become empty string", () => {
  expect(interpolate("[{{missing}}]", {})).toBe("[]");
});

test("number values render as text", () => {
  expect(interpolate("count: {{n}}", { n: 3 })).toBe("count: 3");
});
