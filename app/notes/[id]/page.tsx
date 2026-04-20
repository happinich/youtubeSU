import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { extractVideoId } from "@/lib/youtube";
import { auth } from "@/auth";
import { SessionProvider } from "next-auth/react";
import { Header } from "@/components/layout/Header";
import { NoteViewer } from "@/components/notes/NoteViewer";
import { NoteProcessing } from "@/components/notes/NoteProcessing";
import { NoteHeader } from "@/components/notes/NoteHeader";
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
  const isOwner = !!session?.user?.id && note.userId === session.user.id;

  return (
    <SessionProvider>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="container py-6 flex-1">
          <NoteHeader
            noteId={note.id}
            initialTitle={note.sourceTitle ?? "영상 처리 중..."}
            sourceUrl={note.sourceUrl ?? ""}
            isOwner={isOwner}
            showExport={note.status === "DONE"}
          />

          {note.status === "DONE" && note.summary && videoId ? (
            <NoteViewer
              noteId={note.id}
              videoId={videoId}
              summary={note.summary as unknown as SummaryJSON}
              segments={note.transcriptSegments}
            />
          ) : (
            <NoteProcessing noteId={note.id} initialStatus={note.status} videoId={videoId} />
          )}
        </main>
      </div>
    </SessionProvider>
  );
}
