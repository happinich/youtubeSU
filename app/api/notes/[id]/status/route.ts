import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      let attempts = 0;
      const maxAttempts = 150;

      const poll = async () => {
        try {
          const note = await prisma.note.findUnique({
            where: { id },
            select: { status: true, sourceTitle: true, sourceThumbnail: true },
          });

          if (!note) {
            send({ status: "ERROR", message: "노트를 찾을 수 없습니다." });
            controller.close();
            return;
          }

          const payload: Record<string, unknown> = {
            status: note.status,
            title: note.sourceTitle,
            thumbnail: note.sourceThumbnail,
          };
          // sourceTitle에 오류 메시지를 저장해두므로 ERROR 시 노출
          if (note.status === "ERROR") {
            payload.message = note.sourceTitle ?? "처리 중 오류가 발생했습니다.";
          }
          send(payload);

          if (note.status === "DONE" || note.status === "ERROR") {
            controller.close();
            return;
          }

          attempts++;
          if (attempts >= maxAttempts) {
            send({ status: "ERROR", message: "처리 시간이 초과되었습니다." });
            controller.close();
            return;
          }

          setTimeout(poll, 2000);
        } catch {
          controller.close();
        }
      };

      await poll();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
