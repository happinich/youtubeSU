import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { SessionProvider } from "next-auth/react";
import { DashboardClient } from "@/components/dashboard/DashboardClient";
import type { SummaryJSON } from "@/lib/summarize";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const notes = await prisma.note.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      sourceUrl: true,
      sourceTitle: true,
      sourceThumbnail: true,
      durationSec: true,
      status: true,
      isPublic: true,
      summary: true,
      createdAt: true,
    },
  });

  const gradients = [
    ["oklch(0.32 0.08 260)","oklch(0.22 0.06 280)"],
    ["oklch(0.78 0.1 60)","oklch(0.65 0.12 40)"],
    ["oklch(0.75 0.12 140)","oklch(0.6 0.14 160)"],
    ["oklch(0.72 0.14 20)","oklch(0.55 0.13 10)"],
    ["oklch(0.70 0.08 220)","oklch(0.52 0.10 200)"],
    ["oklch(0.62 0.08 300)","oklch(0.48 0.10 320)"],
  ];

  const serialized = notes.map((n, i) => {
    const summary = n.summary as Partial<SummaryJSON> | null;
    return {
      id: n.id,
      sourceUrl: n.sourceUrl,
      sourceTitle: n.sourceTitle,
      sourceThumbnail: n.sourceThumbnail,
      durationSec: n.durationSec,
      status: n.status,
      isPublic: n.isPublic,
      createdAt: n.createdAt.toISOString(),
      tldr: summary?.tldr ?? null,
      tags: summary?.tags?.slice(0, 3) ?? [],
      gradientFrom: gradients[i % gradients.length][0],
      gradientTo: gradients[i % gradients.length][1],
    };
  });

  const userName = session.user?.name?.split(" ")[0] ?? "사용자";

  return (
    <SessionProvider>
      <DashboardClient notes={serialized} userName={userName} />
    </SessionProvider>
  );
}
