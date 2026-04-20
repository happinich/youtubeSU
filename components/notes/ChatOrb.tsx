"use client";

import { useState, useRef, useEffect } from "react";
import { useNoteStore } from "@/store/noteStore";
import ReactMarkdown from "react-markdown";

export function ChatOrb({ noteId }: { noteId: string }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { chatMessages, setChatMessages, addChatMessage, updateLastAssistantMessage } = useNoteStore();

  useEffect(() => {
    fetch(`/api/notes/${noteId}/chat`).then(r => r.json()).then(msgs => setChatMessages(msgs)).catch(() => {});
  }, [noteId, setChatMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  async function sendMessage(text: string) {
    if (!text.trim() || streaming) return;
    setInput("");
    addChatMessage({ id: Date.now().toString(), role: "USER", content: text, createdAt: new Date().toISOString() });
    addChatMessage({ id: (Date.now()+1).toString(), role: "ASSISTANT", content: "", createdAt: new Date().toISOString() });
    setStreaming(true);
    try {
      const res = await fetch(`/api/notes/${noteId}/chat`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: text }) });
      if (!res.body) return;
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        updateLastAssistantMessage(decoder.decode(value));
      }
    } catch (e) { console.error(e); }
    finally { setStreaming(false); }
  }

  const suggested = ["이 영상의 핵심 요약", "초보자가 꼭 봐야 할 구간", "반대 의견·한계점은?"];

  return (
    <>
      {/* Orb button */}
      {!open && (
        <div style={{ position: "fixed", bottom: 28, right: 28, zIndex: 50, display: "flex", alignItems: "flex-end", gap: 12 }}>
          <div style={{ background: "var(--st-ink)", color: "var(--st-paper)", padding: "8px 14px", borderRadius: 10, fontSize: 12, fontWeight: 500, position: "relative", opacity: 0, pointerEvents: "none", transition: "opacity .2s" }} className="chat-orb-label">
            이 영상에 대해 질문하기
          </div>
          <button
            onClick={() => setOpen(true)}
            style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--st-accent)", color: "var(--st-ink)", border: "none", cursor: "pointer", fontSize: 22, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 24px -6px oklch(from var(--st-accent) l c h / 0.5)", position: "relative" }}
          >
            <span style={{ position: "absolute", inset: -4, borderRadius: "50%", border: "2px solid var(--st-accent)", animation: "st-orb-pulse 2.4s infinite", pointerEvents: "none" }} />
            💬
          </button>
        </div>
      )}

      {/* Chat panel */}
      {open && (
        <div style={{ position: "fixed", bottom: 28, right: 28, width: 400, maxHeight: "72vh", background: "var(--st-paper)", border: "1px solid var(--st-line)", borderRadius: 16, boxShadow: "0 24px 60px -20px oklch(0.2 0 0 / 0.3)", zIndex: 55, display: "flex", flexDirection: "column", overflow: "hidden", animation: "st-chat-in .24s cubic-bezier(.2,.9,.3,1.2)" }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: "1px solid var(--st-line)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, font: "700 14px var(--font-inter, Inter)", color: "var(--st-ink)" }}>
              <span style={{ width: 26, height: 26, borderRadius: "50%", background: "var(--st-accent)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>✨</span>
              이 영상에 물어보기
            </div>
            <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--st-ink-3)", fontSize: 18, padding: "4px 8px" }}>×</button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
            {chatMessages.length === 0 && (
              <>
                <div style={{ maxWidth: "86%", padding: "10px 13px", borderRadius: "12px 12px 12px 2px", background: "var(--st-accent-soft)", fontSize: 13.5, lineHeight: 1.5, alignSelf: "flex-start" }}>
                  <div style={{ font: "700 10px var(--font-mono, monospace)", color: "var(--st-accent-2)", marginBottom: 4, letterSpacing: "0.08em" }}>AI · 영상 기반</div>
                  영상 내용에 대해 무엇이든 물어보세요.
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
                  {suggested.map(s => (
                    <button key={s} onClick={() => sendMessage(s)}
                      style={{ font: "500 12px var(--font-inter, Inter)", padding: "6px 10px", borderRadius: 999, background: "var(--st-paper-2)", border: "1px solid var(--st-line)", color: "var(--st-ink-2)", cursor: "pointer" }}>
                      {s}
                    </button>
                  ))}
                </div>
              </>
            )}
            {chatMessages.map(msg => (
              <div key={msg.id} style={{ maxWidth: "86%", padding: "10px 13px", borderRadius: msg.role === "USER" ? "12px 12px 2px 12px" : "12px 12px 12px 2px", background: msg.role === "USER" ? "var(--st-paper-3)" : "var(--st-accent-soft)", fontSize: 13.5, lineHeight: 1.5, alignSelf: msg.role === "USER" ? "flex-end" : "flex-start", color: "var(--st-ink)" }}>
                {msg.role === "ASSISTANT" && <div style={{ font: "700 10px var(--font-mono, monospace)", color: "var(--st-accent-2)", marginBottom: 4, letterSpacing: "0.08em" }}>AI · 영상 기반</div>}
                {msg.role === "ASSISTANT" ? (
                  <ReactMarkdown className="prose prose-sm max-w-none">{msg.content || (streaming ? "…" : "")}</ReactMarkdown>
                ) : msg.content}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ borderTop: "1px solid var(--st-line)", padding: 10, display: "flex", alignItems: "center", gap: 8 }}>
            <input
              value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
              placeholder="질문을 입력하세요…" disabled={streaming}
              style={{ flex: 1, border: "1px solid var(--st-line)", background: "var(--st-paper-2)", borderRadius: 10, padding: "10px 12px", font: "500 13px var(--font-inter, Inter)", color: "var(--st-ink)", outline: "none" }}
            />
            <button onClick={() => sendMessage(input)} disabled={!input.trim() || streaming}
              style={{ background: "var(--st-accent)", color: "var(--st-ink)", border: "none", cursor: "pointer", width: 38, height: 38, borderRadius: 10, fontSize: 16, fontWeight: 700, opacity: !input.trim() || streaming ? 0.5 : 1 }}>
              ↑
            </button>
          </div>
        </div>
      )}
    </>
  );
}
