import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const messages = await prisma.chatMessage.findMany({
    where: { noteId: id },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(messages);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const { id } = await params;
  const { message } = (await req.json()) as { message: string };

  if (!message?.trim()) {
    return NextResponse.json({ error: "메시지가 필요합니다." }, { status: 400 });
  }

  const note = await prisma.note.findUnique({
    where: { id },
    select: { id: true, sourceTitle: true, summary: true, transcript: true },
  });

  if (!note) return NextResponse.json({ error: "노트를 찾을 수 없습니다." }, { status: 404 });

  await prisma.chatMessage.create({
    data: {
      noteId: id,
      userId: session?.user?.id ?? null,
      role: "USER",
      content: message,
    },
  });

  const history = await prisma.chatMessage.findMany({
    where: { noteId: id },
    orderBy: { createdAt: "asc" },
    take: 20,
  });

  const summaryText = note.summary ? JSON.stringify(note.summary, null, 2) : "요약 없음";
  const transcriptSnippet = note.transcript ? note.transcript.slice(0, 8000) : "자막 없음";

  const systemPrompt = `당신은 YouTube 영상 내용에 대해 답변하는 AI 어시스턴트입니다.
영상 제목: ${note.sourceTitle ?? "알 수 없음"}

[영상 요약]
${summaryText}

[자막 일부]
${transcriptSnippet}

위 영상 내용을 바탕으로 사용자의 질문에 한국어로 친절하게 답변하세요.
영상에 없는 내용은 없다고 말하고, 영상 내용 기반으로만 답변하세요.`;

  const messages = history.slice(0, -1).map((m) => ({
    role: m.role === "USER" ? ("user" as const) : ("assistant" as const),
    content: m.content,
  }));
  messages.push({ role: "user", content: message });

  const encoder = new TextEncoder();
  let fullResponse = "";

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const streamResponse = await client.messages.stream({
          model: "claude-sonnet-4-6",
          max_tokens: 2048,
          system: [
            {
              type: "text",
              text: systemPrompt,
              cache_control: { type: "ephemeral" },
            },
          ],
          messages,
        });

        for await (const chunk of streamResponse) {
          if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
            fullResponse += chunk.delta.text;
            controller.enqueue(encoder.encode(chunk.delta.text));
          }
        }

        await prisma.chatMessage.create({
          data: {
            noteId: id,
            userId: null,
            role: "ASSISTANT",
            content: fullResponse,
          },
        });
      } catch (error) {
        console.error("Chat error:", error);
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
