"use client";

import { useEffect, useRef } from "react";
import { useNoteStore } from "@/store/noteStore";
import { formatSeconds } from "@/lib/utils";

const COLORS: { key: string; bg: string; border: string; label: string }[] = [
  { key: "yellow", bg: "oklch(0.96 0.08 85)",  border: "oklch(0.82 0.12 85)",  label: "노랑" },
  { key: "green",  bg: "oklch(0.95 0.07 145)", border: "oklch(0.78 0.12 145)", label: "초록" },
  { key: "blue",   bg: "oklch(0.94 0.06 230)", border: "oklch(0.76 0.1 230)",  label: "파랑" },
  { key: "pink",   bg: "oklch(0.95 0.07 0)",   border: "oklch(0.80 0.12 0)",   label: "분홍" },
];

function colorStyle(key: string) {
  return COLORS.find(c => c.key === key) ?? COLORS[0];
}

interface HighlightPanelProps {
  noteId: string;
  onSeek: (sec: number) => void;
}

export function HighlightPanel({ noteId, onSeek }: HighlightPanelProps) {
  const { highlights, setHighlights, addHighlight, removeHighlight } = useNoteStore();
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;
    fetch(`/api/notes/${noteId}/highlights`)
      .then(r => r.json())
      .then(data => Array.isArray(data) && setHighlights(data))
      .catch(() => {});
  }, [noteId, setHighlights]);

  async function handleDelete(id: string) {
    removeHighlight(id);
    await fetch(`/api/notes/${noteId}/highlights`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ highlightId: id }),
    });
  }

  if (highlights.length === 0) {
    return (
      <div style={{ padding: "60px 0", textAlign: "center", color: "var(--st-ink-3)", fontFamily: "var(--font-inter, Inter)" }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>✏️</div>
        <div style={{ font: "600 15px var(--font-inter, Inter)", color: "var(--st-ink-2)", marginBottom: 6 }}>저장된 하이라이트가 없어요</div>
        <div style={{ fontSize: 13 }}>요약 탭에서 텍스트를 드래그하면 저장할 수 있어요</div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "var(--font-inter, Inter)" }}>
      <div style={{ font: "500 11px var(--font-mono, monospace)", color: "var(--st-ink-3)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 20 }}>
        하이라이트 {highlights.length}개
      </div>
      {highlights.map(h => {
        const c = colorStyle(h.color);
        return (
          <div key={h.id} style={{
            background: c.bg, border: `1px solid ${c.border}`,
            borderRadius: 10, padding: "12px 16px", marginBottom: 10,
            position: "relative",
          }}>
            <div style={{ fontSize: 14, color: "var(--st-ink)", lineHeight: 1.6, marginBottom: h.startSec != null ? 8 : 0 }}>
              "{h.text}"
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {h.startSec != null && (
                <button
                  onClick={() => onSeek(h.startSec!)}
                  style={{ font: "600 11px var(--font-mono, monospace)", color: "var(--st-ink-2)", background: "oklch(1 0 0 / 0.6)", border: `1px solid ${c.border}`, padding: "3px 8px", borderRadius: 5, cursor: "pointer" }}
                >
                  ▶ {formatSeconds(h.startSec)}
                </button>
              )}
              <div style={{ flex: 1 }} />
              <button
                onClick={() => handleDelete(h.id)}
                style={{ fontSize: 12, color: "var(--st-ink-3)", background: "none", border: "none", cursor: "pointer", padding: "2px 6px", borderRadius: 4 }}
              >✕</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Selection toolbar (rendered inside SummaryPanel) ──────────────────────────
interface SelectionToolbarProps {
  noteId: string;
  currentSec: number;
}

export function SelectionToolbar({ noteId, currentSec }: SelectionToolbarProps) {
  const { addHighlight } = useNoteStore();
  const toolbarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onMouseUp = () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || !sel.toString().trim()) {
        if (toolbarRef.current) toolbarRef.current.style.display = "none";
        return;
      }
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      if (toolbarRef.current) {
        toolbarRef.current.style.display = "flex";
        toolbarRef.current.style.top = `${rect.top + window.scrollY - 48}px`;
        toolbarRef.current.style.left = `${rect.left + rect.width / 2}px`;
        toolbarRef.current.style.transform = "translateX(-50%)";
      }
    };
    const onMouseDown = (e: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) {
        toolbarRef.current.style.display = "none";
      }
    };
    document.addEventListener("mouseup", onMouseUp);
    document.addEventListener("mousedown", onMouseDown);
    return () => {
      document.removeEventListener("mouseup", onMouseUp);
      document.removeEventListener("mousedown", onMouseDown);
    };
  }, []);

  async function save(color: string) {
    const sel = window.getSelection();
    const text = sel?.toString().trim();
    if (!toolbarRef.current || !text) return;
    toolbarRef.current.style.display = "none";
    sel?.removeAllRanges();

    const res = await fetch(`/api/notes/${noteId}/highlights`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, color, startSec: currentSec > 0 ? currentSec : null }),
    });
    if (res.ok) {
      const h = await res.json();
      addHighlight(h);
    }
  }

  return (
    <div
      ref={toolbarRef}
      style={{
        display: "none", position: "absolute", zIndex: 100,
        background: "var(--st-ink)", borderRadius: 10,
        padding: "6px 8px", gap: 6, alignItems: "center",
        boxShadow: "0 4px 16px -4px oklch(0 0 0 / 0.4)",
      }}
    >
      <span style={{ font: "500 11px var(--font-inter, Inter)", color: "oklch(0.85 0 0)", marginRight: 4, whiteSpace: "nowrap" }}>하이라이트</span>
      {COLORS.map(c => (
        <button
          key={c.key}
          onClick={() => save(c.key)}
          title={c.label}
          style={{
            width: 18, height: 18, borderRadius: "50%",
            background: c.bg, border: `2px solid ${c.border}`,
            cursor: "pointer",
          }}
        />
      ))}
    </div>
  );
}
