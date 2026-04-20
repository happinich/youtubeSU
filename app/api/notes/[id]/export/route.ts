import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { SummaryJSON } from "@/lib/summarize";

function secToTimestamp(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function summaryToMarkdown(title: string, url: string, summary: SummaryJSON): string {
  const lines: string[] = [];

  lines.push(`# ${title}`);
  lines.push(`> ${url}`);
  lines.push("");

  lines.push("## TL;DR");
  lines.push(summary.tldr);
  lines.push("");

  if (summary.tags?.length) {
    lines.push(summary.tags.map((t) => `\`${t}\``).join(" "));
    lines.push("");
  }

  if (summary.key_points?.length) {
    lines.push("## 핵심 포인트");
    for (const kp of summary.key_points) {
      lines.push(`### [${secToTimestamp(kp.timestamp_sec)}] ${kp.title}`);
      lines.push(kp.content);
      lines.push("");
    }
  }

  if (summary.sections?.length) {
    lines.push("## 섹션별 요약");
    for (const sec of summary.sections) {
      lines.push(`### ${sec.title} (${secToTimestamp(sec.start_sec)} ~ ${secToTimestamp(sec.end_sec)})`);
      lines.push(sec.summary);
      lines.push("");
    }
  }

  if (summary.quotes?.length) {
    lines.push("## 인상적인 발언");
    for (const q of summary.quotes) {
      lines.push(`> ${q}`);
      lines.push("");
    }
  }

  if (summary.action_items?.length) {
    lines.push("## 실행 아이템");
    for (const a of summary.action_items) {
      lines.push(`- ${a}`);
    }
    lines.push("");
  }

  if (summary.background) {
    lines.push("## 배경 지식");
    lines.push(summary.background);
    lines.push("");
  }

  if (summary.opposing_views) {
    lines.push("## 반대 관점 / 한계");
    lines.push(summary.opposing_views);
    lines.push("");
  }

  return lines.join("\n");
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const { id } = await params;

  const note = await prisma.note.findUnique({
    where: { id },
    select: { userId: true, isPublic: true, sourceTitle: true, sourceUrl: true, summary: true },
  });

  if (!note) return NextResponse.json({ error: "노트를 찾을 수 없습니다." }, { status: 404 });

  const isOwner = session?.user?.id && note.userId === session.user.id;
  const isAnonymous = !note.userId;
  if (!isOwner && !isAnonymous && !note.isPublic) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  if (!note.summary) {
    return NextResponse.json({ error: "아직 요약이 없습니다." }, { status: 400 });
  }

  const summary = note.summary as unknown as SummaryJSON;
  const title = note.sourceTitle ?? "YouTube 요약";
  const url = note.sourceUrl ?? "";
  const markdown = summaryToMarkdown(title, url, summary);

  const filename = `${title.replace(/[^a-zA-Z0-9가-힣 ]/g, "").trim().slice(0, 50)}.md`;

  return new NextResponse(markdown, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
    },
  });
}
