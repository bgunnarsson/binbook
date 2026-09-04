import { useEffect, useRef } from "react";
import { useStore } from "../store";
import { sendChat } from "../api";

export function ChatPanel() {
  const chatOpen = useStore((s) => s.chatOpen);
  const chatMsgs = useStore((s) => s.chatMsgs);
  const chatInput = useStore((s) => s.chatInput);
  const chatBusy = useStore((s) => s.chatBusy);
  const selected = useStore((s) => s.selected);
  const stories = useStore((s) => s.stories);
  const liveArgs = useStore((s) => s.liveArgs);
  const setChatOpen = useStore((s) => s.setChatOpen);
  const setChatInput = useStore((s) => s.setChatInput);
  const pushChat = useStore((s) => s.pushChat);
  const setChatBusy = useStore((s) => s.setChatBusy);

  const listRef = useRef<HTMLDivElement>(null);
  // The deps are the trigger, not something the body reads: a new message or a
  // change in busy state is what should scroll the transcript to the end.
  // biome-ignore lint/correctness/useExhaustiveDependencies: the deps are the trigger
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [chatMsgs, chatBusy]);

  const send = async (text: string) => {
    const t = text.trim();
    if (!t || chatBusy) { return; }
    const story = selected ? stories.find((s) => s.id === selected.storyId) : undefined;
    const prior = useStore.getState().chatMsgs.map((m) => ({ role: m.role, content: m.text }));
    pushChat({ role: "user", text: t });
    setChatInput("");
    setChatBusy(true);
    const system =
      "You are the AI assistant inside binbook, a framework-agnostic component workbench (a Storybook alternative). Be concise and practical. " +
      (story ? `The user is viewing the "${story.title} / ${selected!.variant}" story; its current args are ${JSON.stringify(liveArgs)}. ` : "") +
      "Prefer framework-agnostic HTML examples unless a specific framework is requested. Use plain text (no markdown headers).";
    const reply = await sendChat({ system, messages: [...prior, { role: "user", content: t }] });
    if (reply.error === "not_configured") {
      pushChat({ role: "assistant", text: "The assistant isn't configured yet. Set ANTHROPIC_API_KEY in the environment where you run `binbook dev`, then restart the dev server." });
    } else if (reply.error) {
      pushChat({ role: "assistant", text: "Sorry — I hit an error: " + reply.error });
    } else {
      pushChat({ role: "assistant", text: reply.text || "(no response)" });
    }
    setChatBusy(false);
  };

  const story = selected ? stories.find((s) => s.id === selected.storyId) : undefined;
  const componentName = story?.title?.split("/").pop() ?? "component";
  const suggestions = [
    `Explain the ${componentName} variants`,
    "Generate a story for this component",
    "How do I use it in plain HTML?",
  ];

  return (
    <>
      {!chatOpen && (
        <button
          type="button"
          aria-label="Open assistant"
          title="Ask the assistant"
          onClick={() => setChatOpen(true)}
          className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-ink shadow-2xl transition hover:brightness-105 active:scale-95"
        >
          {/* The button already carries the accessible name; the mark itself
              says nothing a reader needs. */}
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            focusable="false"
            style={{ pointerEvents: "none" }}
          >
            <rect x="3" y="4.5" width="18" height="13" rx="4.5" fill="currentColor" />
            <circle cx="9" cy="11" r="1.35" fill="#12141d" />
            <circle cx="12" cy="11" r="1.35" fill="#12141d" />
            <circle cx="15" cy="11" r="1.35" fill="#12141d" />
          </svg>
        </button>
      )}

      {chatOpen && (
        // The scrim is a mouse convenience; the panel has a close button, and
        // Escape is the keyboard route. Nothing here for a reader to operate.
        // biome-ignore lint/a11y/noStaticElementInteractions: click-to-dismiss only, keyboard route is elsewhere
        <div
          className="fixed inset-0 z-40 bg-black/50"
          role="presentation"
          onClick={() => setChatOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 right-0 bottom-0 z-50 flex w-96 max-w-[92vw] flex-col border-l border-line bg-panel transition-transform duration-200 ${
          chatOpen ? "translate-x-0" : "translate-x-full"
        }`}
        aria-hidden={!chatOpen}
      >
        <div className="flex flex-none items-center gap-3 border-b border-line px-5 py-4">
          <div className="flex h-7 w-7 flex-none items-center justify-center rounded-md bg-accent font-bold text-accent-ink">
            ◆
          </div>
          <div className="min-w-0 flex-1 leading-tight">
            <div className="text-sm font-bold text-text">Assistant</div>
            <div className="mt-0.5 text-[11px] text-dim">Ask about your components</div>
          </div>
          <button
            type="button"
            aria-label="Close assistant"
            title="Close"
            onClick={() => setChatOpen(false)}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-line-soft bg-transparent text-dim hover:border-line hover:text-text"
          >
            ✕
          </button>
        </div>

        <div ref={listRef} className="flex flex-1 flex-col gap-3 overflow-auto p-4">
          {chatMsgs.length === 0 ? (
            <div className="my-auto px-1 py-3.5">
              <div className="mb-4 text-[13px] leading-relaxed text-muted">
                Hi! I can explain components, generate stories, and show framework-specific usage. Try one of these:
              </div>
              <div className="flex flex-col gap-2">
                {suggestions.map((label) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => send(label)}
                    className="rounded-lg border border-line bg-inset px-3.5 py-2.5 text-left text-[12.5px] text-accent-bright hover:border-accent"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            chatMsgs.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] whitespace-pre-wrap rounded-xl px-3.5 py-2.5 text-[12.5px] leading-relaxed ${
                    m.role === "user"
                      ? "border border-accent/40 bg-accent/10 text-text"
                      : "border border-line bg-[#171a24] text-[#cfd3e4]"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))
          )}
          {chatBusy && (
            <div className="flex justify-start">
              <div className="animate-pulse rounded-xl border border-line bg-[#171a24] px-3.5 py-2.5 text-[12.5px] text-dim">
                Thinking…
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-none items-center gap-2.5 border-t border-line px-4 py-3.5">
          <input
            aria-label="Message the assistant"
            placeholder="Ask anything…"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(chatInput);
              }
            }}
            className="min-w-0 flex-1 rounded-lg border border-line-input bg-inset px-3.5 py-2.5 text-[12.5px] text-text outline-none placeholder:text-dim focus:border-accent"
          />
          <button
            type="button"
            aria-label="Send"
            title="Send"
            onClick={() => send(chatInput)}
            className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-accent text-accent-ink hover:brightness-105 active:scale-95"
          >
            ↑
          </button>
        </div>
      </aside>
    </>
  );
}
