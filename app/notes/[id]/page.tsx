import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { extractVideoId } from "@/lib/youtube";
import { SessionProvider } from "next-auth/react";
import { Header } from "@/components/layout/Header";
import { NoteViewer } from "@/components/notes/NoteViewer";
import { NoteProcessing } from "@/components/notes/NoteProcessing";
import type { SummaryJSON } from "@/lib/summarize";

export default async function NotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const note = await prisma.note.findUnique({
    where: { id },
    include: { transcriptSegments: { orderBy: { seq: "asc" } } },
  });

  if (!note) notFound();

  const videoId = note.sourceUrl ? extractVideoId(note.sourceUrl) : null;

  return (
    <SessionProvider>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="container py-6 flex-1">
          <div className="mb-4">
            <h1 className="text-xl font-bold line-clamp-2">
              {note.sourceTitle ?? "영상 처리 중..."}
            </h1>
            {note.sourceUrl && (
              <a
                href={note.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:underline mt-1 inline-block"
              >
                {note.sourceUrl}
              </a>
            )}
          </div>

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
