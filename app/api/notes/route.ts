import { NextRequest, NextResponse } from "next/server";
import { waitUntil } from "@vercel/functions";

export const maxDuration = 60;
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getCachedSummary, setCachedSummary } from "@/lib/redis";
import { extractVideoId, getTranscript, getVideoMetadata, transcriptToText } from "@/lib/youtube";
import { summarize } from "@/lib/summarize";

async function processNote(noteId: string, videoId: string) {
  try {
    await prisma.note.update({ where: { id: noteId }, data: { status: "PROCESSING" } });

    const [metadata, segments] = await Promise.all([
      getVideoMetadata(videoId),
      getTranscript(videoId),
    ]);

    await prisma.note.update({
      where: { id: noteId },
      data: {
        sourceTitle: metadata.title,
        sourceThumbnail: metadata.thumbnail,
        durationSec: metadata.durationSec,
      },
    });

    if (segments.length > 0) {
      await prisma.transcriptSegment.createMany({
        data: segments.map((s) => ({ ...s, noteId })),
      });
    }

    const transcript = transcriptToText(segments);
    const summary = await summarize(transcript, metadata.title, metadata.durationSec);

    await prisma.note.update({
      where: { id: noteId },
      data: { transcript, summary: summary as object, status: "DONE" },
    });

    await setCachedSummary(videoId, noteId);
  } catch (error) {
    console.error("Note processing failed:", error);
    const message = error instanceof Error ? error.message : String(error);
    await prisma.note.update({
      where: { id: noteId },
      data: {
        status: "ERROR",
        sourceTitle: `오류: ${message.slice(0, 200)}`,
      },
    });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const body = await req.json();
  const { url } = body as { url: string };

  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "URL이 필요합니다." }, { status: 400 });
  }

  const videoId = extractVideoId(url);
  if (!videoId) {
    return NextResponse.json({ error: "유효한 YouTube URL이 아닙니다." }, { status: 400 });
  }

  const cachedNoteId = await getCachedSummary(videoId);
  if (cachedNoteId) {
    const cached = await prisma.note.findUnique({ where: { id: cachedNoteId } });
    if (cached && cached.status === "DONE") {
      if (session?.user?.id) {
        const existing = await prisma.note.findFirst({
          where: { sourceUrl: url, userId: session.user.id },
        });
        if (existing) return NextResponse.json({ id: existing.id, cached: true });

        const copy = await prisma.note.create({
          data: {
            userId: session.user.id,
            sourceUrl: url,
            sourceTitle: cached.sourceTitle,
            sourceThumbnail: cached.sourceThumbnail,
            durationSec: cached.durationSec,
            transcript: cached.transcript,
            summary: cached.summary ?? undefined,
            status: "DONE",
          },
        });
        return NextResponse.json({ id: copy.id, cached: true });
      }
      return NextResponse.json({ id: cachedNoteId, cached: true });
    }
  }

  const note = await prisma.note.create({
    data: {
      userId: session?.user?.id ?? null,
      sourceUrl: url,
      status: "PENDING",
    },
  });

  // waitUntil keeps the Vercel function alive until processing completes
  waitUntil(processNote(note.id, videoId));

  return NextResponse.json({ id: note.id, status: "PENDING" }, { status: 201 });
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 50);
  const skip = (page - 1) * limit;

  const [notes, total] = await Promise.all([
    prisma.note.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      select: {
        id: true,
        sourceUrl: true,
        sourceTitle: true,
        sourceThumbnail: true,
        durationSec: true,
        status: true,
        isPublic: true,
        createdAt: true,
      },
    }),
    prisma.note.count({ where: { userId: session.user.id } }),
  ]);

  return NextResponse.json({ notes, total, page, limit });
}
