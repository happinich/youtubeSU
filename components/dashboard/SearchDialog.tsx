"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { NoteRowItem } from "./NoteRow";

interface SearchDialogProps {
  notes: NoteRowItem[];
}

export function SearchDialog({ notes }: SearchDialogProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(o => !o);
        setQuery("");
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  const results = query.trim()
    ? notes.filter(n => {
        const q = query.toLowerCase();
        return (
          n.sourceTitle?.toLowerCase().includes(q) ||
          n.tldr?.toLowerCase().includes(q) ||
          n.tags?.some(t => t.toLowerCase().includes(q))
        );
      }).slice(0, 8)
    : notes.slice(0, 6);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={() => setOpen(false)}
        style={{ position: "fixed", inset: 0, background: "oklch(0.2 0 0 / 0.4)", zIndex: 200, backdropFilter: "blur(4px)" }}
      />

      {/* Dialog */}
      <div style={{
        position: "fixed", top: "20%", left: "50%", transform: "translateX(-50%)",
        width: "min(600px, 90vw)", background: "var(--st-paper)",
        border: "1px solid var(--st-line)", borderRadius: 16,
        boxShadow: "0 32px 80px -20px oklch(0.2 0 0 / 0.4)",
        zIndex: 201, overflow: "hidden",
        animation: "st-chat-in .18s cubic-bezier(.2,.9,.3,1.1)",
      }}>
        {/* Input */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", borderBottom: "1px solid var(--st-line)" }}>
          <span style={{ fontSize: 16, color: "var(--st-ink-3)" }}>⌕</span>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="노트 검색…"
            style={{ flex: 1, border: "none", outline: "none", background: "transparent", font: "500 15px var(--font-inter, Inter)", color: "var(--st-ink)" }}
          />
          <kbd style={{ font: "500 11px var(--font-mono, monospace)", background: "var(--st-paper-2)", border: "1px solid var(--st-line)", borderRadius: 5, padding: "2px 7px", color: "var(--st-ink-3)" }}>ESC</kbd>
        </div>

        {/* Results */}
        <div style={{ maxHeight: 380, overflowY: "auto" }}>
          {results.length === 0 ? (
            <div style={{ padding: "32px 18px", textAlign: "center", color: "var(--st-ink-3)", fontSize: 14 }}>
              검색 결과가 없어요
            </div>
          ) : (
            <>
              {query.trim() === "" && (
                <div style={{ font: "500 10px var(--font-mono, monospace)", color: "var(--st-ink-3)", letterSpacing: "0.08em", textTransform: "uppercase", padding: "10px 18px 6px" }}>
                  최근 노트
                </div>
              )}
              {results.map(n => (
                <button
                  key={n.id}
                  onClick={() => { setOpen(false); router.push(`/notes/${n.id}`); }}
                  style={{
                    display: "flex", alignItems: "center", gap: 14,
                    width: "100%", padding: "12px 18px", background: "none",
                    border: "none", borderBottom: "1px solid var(--st-line-2)",
                    cursor: "pointer", textAlign: "left",
                    transition: "background .1s",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = "var(--st-paper-2)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "none")}
                >
                  {/* Thumbnail */}
                  <div style={{
                    width: 52, height: 30, borderRadius: 5, overflow: "hidden", flexShrink: 0,
                    background: `linear-gradient(135deg, ${n.gradientFrom ?? "oklch(0.75 0.1 220)"}, ${n.gradientTo ?? "oklch(0.6 0.12 260)"})`,
                  }}>
                    {n.sourceThumbnail && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={n.sourceThumbnail} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    )}
                  </div>

                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ font: "600 14px var(--font-inter, Inter)", color: "var(--st-ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 2 }}>
                      {n.sourceTitle ?? n.sourceUrl}
                    </div>
                    {n.tldr && (
                      <div style={{ fontSize: 12, color: "var(--st-ink-3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {n.tldr}
                      </div>
                    )}
                  </div>

                  <span style={{ font: "500 11px var(--font-mono, monospace)", color: "var(--st-ink-4)", flexShrink: 0 }}>↗</span>
                </button>
              ))}
            </>
          )}
        </div>

        <div style={{ padding: "8px 18px", borderTop: "1px solid var(--st-line-2)", display: "flex", gap: 16 }}>
          {[["↵", "열기"], ["ESC", "닫기"], ["⌘K", "토글"]].map(([key, label]) => (
            <span key={key} style={{ font: "500 11px var(--font-mono, monospace)", color: "var(--st-ink-4)", display: "flex", gap: 5, alignItems: "center" }}>
              <kbd style={{ background: "var(--st-paper-2)", border: "1px solid var(--st-line)", borderRadius: 4, padding: "1px 5px" }}>{key}</kbd>
              {label}
            </span>
          ))}
        </div>
      </div>
    </>
  );
}
