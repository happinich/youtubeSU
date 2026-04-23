import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json([], { status: 200 });

  const highlights = await prisma.highlight.findMany({
    where: { noteId: id, userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(highlights);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { text, color = "yellow", startSec } = await req.json();
  if (!text?.trim()) return NextResponse.json({ error: "text required" }, { status: 400 });

  const highlight = await prisma.highlight.create({
    data: { noteId: id, userId: session.user.id, text: text.trim(), color, startSec: startSec ?? null },
  });
  return NextResponse.json(highlight, { status: 201 });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: noteId } = await params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { highlightId } = await req.json();
  await prisma.highlight.deleteMany({ where: { id: highlightId, noteId, userId: session.user.id } });
  return NextResponse.json({ ok: true });
}
