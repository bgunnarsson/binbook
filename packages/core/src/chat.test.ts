import { afterEach, beforeEach, expect, test } from "vitest";
import { runChat } from "./chat";

let saved: string | undefined;
beforeEach(() => { saved = process.env.ANTHROPIC_API_KEY; delete process.env.ANTHROPIC_API_KEY; });
afterEach(() => { if (saved === undefined) delete process.env.ANTHROPIC_API_KEY; else process.env.ANTHROPIC_API_KEY = saved; });

test("returns not_configured when no API key is set", async () => {
  const reply = await runChat({ messages: [{ role: "user", content: "hi" }] });
  expect(reply.error).toBe("not_configured");
  expect(reply.text).toBeUndefined();
});
