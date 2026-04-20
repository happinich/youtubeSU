"use client";

import { useState } from "react";
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

export function NoteRow({ note, onDelete }: { note: NoteRowItem; onDelete: (id: string) => void }) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const dur = formatDur(note.durationSec);

  const tags = note.tags ?? (note.sourceTitle ? [] : []);

  return (
    <div
      onClick={() => router.push(`/notes/${note.id}`)}
      style={{
        display: "grid", gridTemplateColumns: "120px 1fr auto",
        gap: 18, alignItems: "center",
        padding: 14, borderRadius: 12,
        background: "var(--st-paper)", border: "1px solid var(--st-line)",
        marginBottom: 8, cursor: "pointer",
        transition: "border-color .15s",
        position: "relative",
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
      </div>

      {/* Meta */}
      <div style={{ minWidth: 0 }}>
        <div style={{ font: "600 15px var(--font-inter, Inter)", letterSpacing: "-0.01em", color: "var(--st-ink)", margin: "0 0 4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {note.sourceTitle ?? note.sourceUrl}
        </div>
        {note.tldr && (
          <div style={{ fontSize: 13, color: "var(--st-ink-2)", margin: "0 0 8px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {note.tldr}
          </div>
        )}
        <div style={{ display: "flex", gap: 6 }}>
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
      <div style={{ textAlign: "right", font: "500 11px var(--font-mono, monospace)", color: "var(--st-ink-3)", position: "relative" }}>
        <div>{formatDistanceToNow(new Date(note.createdAt), { addSuffix: true, locale: ko })}</div>
        <button
          onClick={e => { e.stopPropagation(); setMenuOpen(o => !o); }}
          style={{ fontSize: 16, color: "var(--st-ink-4)", marginTop: 4, background: "none", border: "none", cursor: "pointer" }}
        >⋯</button>
        {menuOpen && (
          <div
            style={{ position: "absolute", right: 0, top: "100%", background: "var(--st-paper)", border: "1px solid var(--st-line)", borderRadius: 8, boxShadow: "0 8px 24px -4px oklch(0.2 0 0 / 0.15)", zIndex: 10, minWidth: 120 }}
            onClick={e => e.stopPropagation()}
          >
            <button onClick={() => { setMenuOpen(false); if (confirm("이 노트를 삭제하시겠습니까?")) onDelete(note.id); }}
              style={{ display: "block", width: "100%", padding: "10px 14px", textAlign: "left", background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "oklch(0.45 0.1 25)", fontWeight: 500 }}>
              삭제
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
