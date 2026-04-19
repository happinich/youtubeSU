"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, Clock, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

interface NoteItem {
  id: string;
  sourceTitle: string | null;
  sourceThumbnail: string | null;
  sourceUrl: string;
  durationSec: number | null;
  status: string;
  createdAt: string;
}

function StatusBadge({ status }: { status: string }) {
  if (status === "DONE") return <Badge className="bg-green-100 text-green-800 border-green-200"><CheckCircle2 className="h-3 w-3 mr-1" />완료</Badge>;
  if (status === "PROCESSING") return <Badge variant="secondary"><Loader2 className="h-3 w-3 mr-1 animate-spin" />처리 중</Badge>;
  if (status === "ERROR") return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />오류</Badge>;
  return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />대기 중</Badge>;
}

export function NoteGrid({ initialNotes }: { initialNotes: NoteItem[] }) {
  const [notes, setNotes] = useState(initialNotes);

  async function handleDelete(id: string) {
    if (!confirm("이 노트를 삭제하시겠습니까?")) return;
    await fetch(`/api/notes/${id}`, { method: "DELETE" });
    setNotes((prev) => prev.filter((n) => n.id !== id));
  }

  if (notes.length === 0) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <p className="text-lg mb-2">아직 저장된 노트가 없습니다.</p>
        <p className="text-sm">YouTube URL을 입력해서 첫 번째 요약을 만들어보세요.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {notes.map((note) => (
        <Card key={note.id} className="group relative overflow-hidden hover:shadow-md transition-shadow">
          <Link href={`/notes/${note.id}`}>
            <div className="relative aspect-video bg-muted">
              {note.sourceThumbnail ? (
                <Image src={note.sourceThumbnail} alt={note.sourceTitle ?? ""} fill className="object-cover" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                  <svg viewBox="0 0 24 24" className="h-12 w-12 fill-current opacity-20">
                    <path d="M23 7l-7 5 7 5V7z" />
                    <rect width="15" height="14" x="1" y="5" rx="2" ry="2" />
                  </svg>
                </div>
              )}
            </div>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <StatusBadge status={note.status} />
                <span className="text-xs text-muted-foreground shrink-0">
                  {formatDistanceToNow(new Date(note.createdAt), { addSuffix: true, locale: ko })}
                </span>
              </div>
              <p className="font-medium text-sm line-clamp-2 leading-snug">
                {note.sourceTitle ?? note.sourceUrl}
              </p>
            </CardContent>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 bg-background/80"
            onClick={() => handleDelete(note.id)}
          >
            <Trash2 className="h-3.5 w-3.5 text-destructive" />
          </Button>
        </Card>
      ))}
    </div>
  );
}
