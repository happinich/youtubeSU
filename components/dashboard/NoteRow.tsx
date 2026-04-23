"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

export interface NoteRowItem {
  id: string;
  sourceTitle: string | null;
  sourceThumbnail: string | null;
  sourceUrl: string;
  durationSec: number | null;
  status: string;
  createdAt: string;
  isPublic?: boolean;
  tldr?: string | null;
  tags?: string[];
  gradientFrom?: string;
  gradientTo?: string;
}

function formatDur(sec: number | null) {
  if (!sec) return "";
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  if (h > 0) return `${h}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
  return `${m}:${String(s).padStart(2,"0")}`;
}

interface NoteRowProps {
  note: NoteRowItem;
  onDelete: (id: string) => void;
  onUpdate?: (id: string, patch: Partial<NoteRowItem>) => void;
}

export function NoteRow({ note, onDelete, onUpdate }: NoteRowProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [titleInput, setTitleInput] = useState(note.sourceTitle ?? "");
  const [isPublic, setIsPublic] = useState(note.isPublic ?? false);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const dur = formatDur(note.durationSec);

  useEffect(() => {
    if (renaming) setTimeout(() => inputRef.current?.focus(), 30);
  }, [renaming]);

  // close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  async function handleRename() {
    const val = titleInput.trim();
    if (!val || val === note.sourceTitle) { setRenaming(false); return; }
    setRenaming(false);
    await fetch(`/api/notes/${note.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sourceTitle: val }) });
    onUpdate?.(note.id, { sourceTitle: val });
  }

  async function handleTogglePublic() {
    const next = !isPublic;
    setIsPublic(next);
    setMenuOpen(false);
    await fetch(`/api/notes/${note.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isPublic: next }) });
    onUpdate?.(note.id, { isPublic: next });
  }

  function copyShareLink() {
    navigator.clipboard.writeText(`${window.location.origin}/notes/${note.id}`);
    setMenuOpen(false);
  }

  const tags = note.tags ?? [];

  return (
    <div
      onClick={() => !renaming && router.push(`/notes/${note.id}`)}
      style={{
        display: "grid", gridTemplateColumns: "120px 1fr auto",
        gap: 18, alignItems: "center",
        padding: 14, borderRadius: 12,
        background: "var(--st-paper)", border: "1px solid var(--st-line)",
        marginBottom: 8, cursor: renaming ? "default" : "pointer",
        transition: "border-color .15s", position: "relative",
      }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--st-ink-4)")}
      onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--st-line)")}
    >
      {/* Thumbnail */}
      <div style={{
        width: 120, height: 68, borderRadius: 8, overflow: "hidden", position: "relative", flexShrink: 0,
        background: `linear-gradient(135deg, ${note.gradientFrom ?? "oklch(0.75 0.1 220)"}, ${note.gradientTo ?? "oklch(0.6 0.12 260)"})`,
      }}>
        {note.sourceThumbnail && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={note.sourceThumbnail} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        )}
        {dur && (
          <span style={{ position: "absolute", bottom: 4, right: 4, font: "500 10px var(--font-mono, monospace)", background: "oklch(0.15 0 0 / 0.8)", color: "white", padding: "2px 5px", borderRadius: 3 }}>{dur}</span>
        )}
        {isPublic && (
          <span style={{ position: "absolute", top: 4, left: 4, font: "500 9px var(--font-mono, monospace)", background: "var(--st-accent)", color: "var(--st-ink)", padding: "2px 6px", borderRadius: 3 }}>공개</span>
        )}
      </div>

      {/* Meta */}
      <div style={{ minWidth: 0 }}>
        {renaming ? (
          <input
            ref={inputRef}
            value={titleInput}
            onChange={e => setTitleInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") handleRename(); if (e.key === "Escape") setRenaming(false); }}
            onBlur={handleRename}
            onClick={e => e.stopPropagation()}
            style={{ font: "600 15px var(--font-inter, Inter)", color: "var(--st-ink)", border: "1.5px solid var(--st-accent)", borderRadius: 6, padding: "4px 8px", outline: "none", width: "100%", background: "var(--st-paper-2)" }}
          />
        ) : (
          <div style={{ font: "600 15px var(--font-inter, Inter)", letterSpacing: "-0.01em", color: "var(--st-ink)", margin: "0 0 4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {note.sourceTitle ?? note.sourceUrl}
          </div>
        )}
        {note.tldr && !renaming && (
          <div style={{ fontSize: 13, color: "var(--st-ink-2)", margin: "0 0 8px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {note.tldr}
          </div>
        )}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {note.status !== "DONE" && (
            <span style={{ font: "500 11px var(--font-mono, monospace)", padding: "2px 8px", borderRadius: 999, background: note.status === "ERROR" ? "oklch(0.95 0.05 25)" : "var(--st-paper-2)", color: note.status === "ERROR" ? "oklch(0.45 0.1 25)" : "var(--st-ink-3)", border: "1px solid var(--st-line-2)" }}>
              {note.status === "PROCESSING" ? "처리 중" : note.status === "ERROR" ? "오류" : "대기 중"}
            </span>
          )}
          {tags.map((t, i) => (
            <span key={i} style={{ font: "500 11px var(--font-mono, monospace)", padding: "2px 8px", borderRadius: 999, background: i === 0 ? "var(--st-accent-soft)" : "var(--st-paper-2)", color: i === 0 ? "var(--st-ink)" : "var(--st-ink-3)", border: `1px solid ${i === 0 ? "transparent" : "var(--st-line-2)"}` }}>
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* Right */}
      <div style={{ textAlign: "right", font: "500 11px var(--font-mono, monospace)", color: "var(--st-ink-3)", position: "relative" }} ref={menuRef}>
        <div>{formatDistanceToNow(new Date(note.createdAt), { addSuffix: true, locale: ko })}</div>
        <button
          onClick={e => { e.stopPropagation(); setMenuOpen(o => !o); }}
          style={{ fontSize: 18, color: "var(--st-ink-4)", marginTop: 4, background: "none", border: "none", cursor: "pointer", lineHeight: 1, padding: "2px 6px", borderRadius: 6 }}
        >⋯</button>

        {menuOpen && (
          <div
            style={{ position: "absolute", right: 0, top: "100%", background: "var(--st-paper)", border: "1px solid var(--st-line)", borderRadius: 10, boxShadow: "0 8px 28px -4px oklch(0.2 0 0 / 0.15)", zIndex: 20, minWidth: 148, overflow: "hidden" }}
            onClick={e => e.stopPropagation()}
          >
            {[
              { label: "✏️ 제목 수정", action: () => { setMenuOpen(false); setRenaming(true); } },
              { label: isPublic ? "🔒 비공개로" : "🌐 공개 링크", action: handleTogglePublic },
              { label: "🔗 링크 복사", action: copyShareLink },
              { label: "🗑 삭제", action: () => { setMenuOpen(false); if (confirm("이 노트를 삭제하시겠습니까?")) onDelete(note.id); }, danger: true },
            ].map(item => (
              <button
                key={item.label}
                onClick={item.action}
                style={{ display: "block", width: "100%", padding: "10px 14px", textAlign: "left", background: "none", border: "none", cursor: "pointer", fontSize: 13, color: (item as { danger?: boolean }).danger ? "oklch(0.45 0.1 25)" : "var(--st-ink-2)", fontWeight: 500, fontFamily: "var(--font-inter, Inter)" }}
                onMouseEnter={e => (e.currentTarget.style.background = "var(--st-paper-2)")}
                onMouseLeave={e => (e.currentTarget.style.background = "none")}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
