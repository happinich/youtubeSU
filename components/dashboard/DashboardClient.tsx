"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { signOut, useSession } from "next-auth/react";
import { differenceInDays } from "date-fns";
import { NoteRow, type NoteRowItem } from "./NoteRow";

const FILTERS = [
  { key: "all", label: "전체" },
  { key: "youtube", label: "YouTube" },
  { key: "done", label: "완료" },
  { key: "processing", label: "처리 중" },
];

function groupNotes(notes: NoteRowItem[]) {
  const now = new Date();
  const groups: { label: string; items: NoteRowItem[] }[] = [
    { label: "오늘", items: [] },
    { label: "이번 주", items: [] },
    { label: "이전", items: [] },
  ];
  for (const n of notes) {
    const diff = differenceInDays(now, new Date(n.createdAt));
    if (diff < 1) groups[0].items.push(n);
    else if (diff < 7) groups[1].items.push(n);
    else groups[2].items.push(n);
  }
  return groups.filter(g => g.items.length > 0);
}

export function DashboardClient({ notes: initialNotes, userName }: { notes: NoteRowItem[]; userName: string }) {
  const { data: session } = useSession();
  const [notes, setNotes] = useState(initialNotes);
  const [filter, setFilter] = useState("all");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/notes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: url.trim() }) });
      if (res.ok) {
        const { id } = await res.json();
        window.location.href = `/notes/${id}`;
      } else {
        const d = await res.json();
        setError(d.error ?? "오류가 발생했습니다.");
        setLoading(false);
      }
    } catch { setError("네트워크 오류가 발생했습니다."); setLoading(false); }
  }

  function handleDelete(id: string) {
    fetch(`/api/notes/${id}`, { method: "DELETE" });
    setNotes(prev => prev.filter(n => n.id !== id));
  }

  const filtered = notes.filter(n => {
    if (filter === "all") return true;
    if (filter === "done") return n.status === "DONE";
    if (filter === "processing") return n.status === "PROCESSING" || n.status === "PENDING";
    return true;
  });

  const groups = groupNotes(filtered);

  return (
    <div style={{ background: "var(--st-paper-2)", minHeight: "100vh", color: "var(--st-ink)", fontFamily: "var(--font-inter, Inter), var(--font-noto, sans-serif)" }}>

      {/* Top nav */}
      <div className="db-topbar">
        <Link href="/" style={{ fontWeight: 800, fontSize: 18, letterSpacing: "-0.02em", textDecoration: "none", color: "var(--st-ink)" }}>
          SummaryTube<span style={{ color: "var(--st-accent)" }}>.</span>
        </Link>
        <nav style={{ display: "flex", gap: 6, marginLeft: 14 }}>
          {["노트","컬렉션","하이라이트","탐색"].map((l, i) => (
            <a key={l} href="#" style={{ color: i === 0 ? "var(--st-ink)" : "var(--st-ink-2)", textDecoration: "none", fontSize: 13, fontWeight: 500, padding: "6px 12px", borderRadius: 8, background: i === 0 ? "var(--st-paper-2)" : "none" }}>{l}</a>
          ))}
        </nav>
        <div style={{ marginLeft: "auto", display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--st-paper-2)", border: "1px solid var(--st-line)", borderRadius: 8, padding: "6px 10px", width: 200, color: "var(--st-ink-3)", fontSize: 13 }}>
            <span>⌕</span><span style={{ flex: 1 }}>검색…</span>
            <kbd style={{ font: "500 10px var(--font-mono, monospace)", background: "var(--st-paper)", border: "1px solid var(--st-line)", borderRadius: 4, padding: "1px 5px", color: "var(--st-ink-3)" }}>⌘K</kbd>
          </div>
          {session?.user?.image ? (
            <Image src={session.user.image} alt="" width={30} height={30} style={{ borderRadius: "50%", cursor: "pointer" }} onClick={() => signOut()} />
          ) : (
            <div style={{ width: 30, height: 30, borderRadius: "50%", background: "oklch(0.80 0.08 30)", cursor: "pointer" }} onClick={() => signOut()} />
          )}
        </div>
      </div>

      {/* Hero */}
      <div className="db-hero">
        <h2 style={{ font: "700 22px var(--font-inter, Inter)", letterSpacing: "-0.02em", margin: "0 0 16px" }}>
          안녕하세요, {userName} <span style={{ color: "var(--st-ink-3)", fontWeight: 500 }}>— 오늘도 한 영상 정리해볼까요?</span>
        </h2>
        <form onSubmit={handleSubmit} style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--st-paper-2)", border: "1.5px solid var(--st-line)", borderRadius: 14, padding: "6px 6px 6px 18px", maxWidth: 720, boxShadow: "0 4px 16px -8px oklch(0.3 0.03 80 / 0.12)" }}>
          <span style={{ color: "var(--st-ink-3)", fontSize: 14 }}>▶</span>
          <input type="text" placeholder="URL을 붙여넣거나 드롭하세요…" value={url} onChange={e => setUrl(e.target.value)} disabled={loading}
            style={{ flex: 1, border: "none", outline: "none", background: "transparent", font: "500 14px var(--font-inter, Inter)", color: "var(--st-ink)", padding: "10px 8px" }} />
          <button type="submit" disabled={loading || !url.trim()} style={{ background: "var(--st-accent)", color: "var(--st-ink)", border: "none", cursor: "pointer", padding: "9px 18px", borderRadius: 10, fontSize: 13, fontWeight: 700, opacity: loading || !url.trim() ? 0.5 : 1 }}>
            {loading ? "처리 중…" : "요약 →"}
          </button>
        </form>
        {error && <p style={{ color: "oklch(0.45 0.1 25)", fontSize: 12, marginTop: 6 }}>{error}</p>}
        <div style={{ display: "flex", gap: 8, maxWidth: 720, marginTop: 14, overflowX: "auto" }}>
          {FILTERS.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              style={{ font: "500 12px var(--font-inter, Inter)", border: "1px solid var(--st-line)", background: filter === f.key ? "var(--st-ink)" : "var(--st-paper)", color: filter === f.key ? "var(--st-paper)" : "var(--st-ink-2)", padding: "6px 12px", borderRadius: 999, cursor: "pointer", whiteSpace: "nowrap" }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Note list */}
      <div className="db-list">
        {groups.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "var(--st-ink-3)", fontSize: 14 }}>
            <p style={{ marginBottom: 8, fontWeight: 600, color: "var(--st-ink-2)" }}>아직 저장된 노트가 없어요.</p>
            <p>위에 YouTube URL을 입력해서 첫 번째 요약을 만들어보세요.</p>
          </div>
        ) : (
          groups.map(g => (
            <div key={g.label}>
              <div style={{ font: "500 11px var(--font-mono, monospace)", color: "var(--st-ink-3)", letterSpacing: "0.08em", textTransform: "uppercase", padding: "16px 0 10px", display: "flex", alignItems: "baseline", gap: 10 }}>
                {g.label} <span style={{ color: "var(--st-ink-4)" }}>{g.items.length}</span>
              </div>
              {g.items.map(n => <NoteRow key={n.id} note={n} onDelete={handleDelete} />)}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
