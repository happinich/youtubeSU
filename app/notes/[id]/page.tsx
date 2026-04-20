import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { extractVideoId } from "@/lib/youtube";
import { auth } from "@/auth";
import { SessionProvider } from "next-auth/react";
import { NoteViewer } from "@/components/notes/NoteViewer";
import { NoteProcessing } from "@/components/notes/NoteProcessing";
import Link from "next/link";
import type { SummaryJSON } from "@/lib/summarize";

export default async function NotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();

  const note = await prisma.note.findUnique({
    where: { id },
    include: { transcriptSegments: { orderBy: { seq: "asc" } } },
  });

  if (!note) notFound();

  const videoId = note.sourceUrl ? extractVideoId(note.sourceUrl) : null;

  return (
    <SessionProvider>
      <div style={{ minHeight: "100vh", background: "var(--st-paper-2)", fontFamily: "var(--font-inter, Inter), var(--font-noto, sans-serif)" }}>
        {/* Top bar */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "12px 40px", background: "var(--st-paper)", borderBottom: "1px solid var(--st-line)", position: "sticky", top: 0, zIndex: 10 }}>
          <Link href="/dashboard" style={{ color: "var(--st-ink-2)", fontSize: 13, fontWeight: 500, textDecoration: "none" }}>← 대시보드</Link>
          <Link href="/" style={{ fontWeight: 800, fontSize: 17, letterSpacing: "-0.02em", textDecoration: "none", color: "var(--st-ink)" }}>
            SummaryTube<span style={{ color: "var(--st-accent)" }}>.</span>
          </Link>
          <div style={{ flex: 1, minWidth: 0, font: "600 14px var(--font-inter, Inter)", color: "var(--st-ink-2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {note.sourceTitle}
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {note.status === "DONE" && (
              <a href={`/api/notes/${note.id}/export`} download
                style={{ background: "var(--st-paper)", border: "1px solid var(--st-line)", color: "var(--st-ink-2)", fontSize: 12, fontWeight: 500, padding: "6px 12px", borderRadius: 8, cursor: "pointer", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 5 }}>
                ⇩ Markdown
              </a>
            )}
            {note.sourceUrl && (
              <a href={note.sourceUrl} target="_blank" rel="noopener noreferrer"
                style={{ background: "var(--st-paper)", border: "1px solid var(--st-line)", color: "var(--st-ink-2)", fontSize: 12, fontWeight: 500, padding: "6px 12px", borderRadius: 8, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 5 }}>
                ↗ YouTube
              </a>
            )}
          </div>
        </div>

        {note.status === "DONE" && note.summary && videoId ? (
          <NoteViewer
            noteId={note.id}
            videoId={videoId}
            summary={note.summary as unknown as SummaryJSON}
            segments={note.transcriptSegments}
            sourceTitle={note.sourceTitle}
            durationSec={note.durationSec}
          />
        ) : (
          <div style={{ padding: "40px" }}>
            <NoteProcessing noteId={note.id} initialStatus={note.status} videoId={videoId} />
          </div>
        )}
      </div>
    </SessionProvider>
  );
}
