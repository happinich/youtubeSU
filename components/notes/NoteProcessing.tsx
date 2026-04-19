"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Loader2 } from "lucide-react";

interface Props {
  noteId: string;
  initialStatus: string;
  videoId: string | null;
}

export function NoteProcessing({ noteId, initialStatus, videoId }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "DONE" || status === "ERROR") return;

    const es = new EventSource(`/api/notes/${noteId}/status`);

    es.onmessage = (event) => {
      const data = JSON.parse(event.data) as { status: string; message?: string };
      setStatus(data.status);
      if (data.status === "DONE") {
        es.close();
        router.refresh();
      } else if (data.status === "ERROR") {
        setError(data.message ?? "처리 중 오류가 발생했습니다.");
        es.close();
      }
    };

    es.onerror = () => {
      es.close();
    };

    return () => es.close();
  }, [noteId, status, router]);

  if (status === "ERROR") {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-destructive">
        <AlertCircle className="h-12 w-12" />
        <p className="text-lg font-medium">처리 실패</p>
        <p className="text-sm text-muted-foreground">{error || "다시 시도해 주세요."}</p>
      </div>
    );
  }

  const statusText = status === "PROCESSING" ? "요약을 생성하고 있습니다..." : "처리를 준비하고 있습니다...";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        {videoId ? (
          <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black">
            <iframe
              src={`https://www.youtube.com/embed/${videoId}`}
              className="absolute inset-0 w-full h-full"
              allowFullScreen
            />
          </div>
        ) : (
          <Skeleton className="w-full aspect-video rounded-xl" />
        )}
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">{statusText}</span>
        </div>
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-12 w-3/4" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-5/6" />
        <Skeleton className="h-12 w-full" />
      </div>
    </div>
  );
}
