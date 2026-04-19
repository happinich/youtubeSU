import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { SessionProvider } from "next-auth/react";
import { Header } from "@/components/layout/Header";
import { NoteGrid } from "@/components/dashboard/NoteGrid";
import { UrlInputBar } from "@/components/dashboard/UrlInputBar";

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
      createdAt: true,
    },
  });

  const serialized = notes.map((n) => ({
    ...n,
    createdAt: n.createdAt.toISOString(),
  }));

  return (
    <SessionProvider>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="container py-8 flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <h1 className="text-2xl font-bold">내 노트</h1>
            <UrlInputBar />
          </div>
          <NoteGrid initialNotes={serialized} />
        </main>
      </div>
    </SessionProvider>
  );
}
