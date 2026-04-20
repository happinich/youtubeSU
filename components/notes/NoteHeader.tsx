"use client";

import { useState } from "react";
import { Pencil, Check, X, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface NoteHeaderProps {
  noteId: string;
  initialTitle: string;
  sourceUrl: string;
  isOwner: boolean;
  showExport: boolean;
}

export function NoteHeader({ noteId, initialTitle, sourceUrl, isOwner, showExport }: NoteHeaderProps) {
  const [title, setTitle] = useState(initialTitle);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(initialTitle);

  async function saveTitle() {
    const trimmed = draft.trim();
    if (!trimmed || trimmed === title) { setEditing(false); return; }
    await fetch(`/api/notes/${noteId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sourceTitle: trimmed }),
    });
    setTitle(trimmed);
    setEditing(false);
  }

  function cancelEdit() {
    setDraft(title);
    setEditing(false);
  }

  return (
    <div className="mb-4">
      <div className="flex items-start gap-2">
        {editing ? (
          <div className="flex items-center gap-2 flex-1">
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") saveTitle(); if (e.key === "Escape") cancelEdit(); }}
              className="text-xl font-bold h-auto py-1"
              autoFocus
            />
            <Button size="icon" variant="ghost" onClick={saveTitle}><Check className="h-4 w-4 text-green-600" /></Button>
            <Button size="icon" variant="ghost" onClick={cancelEdit}><X className="h-4 w-4 text-muted-foreground" /></Button>
          </div>
        ) : (
          <div className="flex items-start gap-2 flex-1">
            <h1 className="text-xl font-bold line-clamp-2 flex-1">{title}</h1>
            {isOwner && (
              <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0 mt-0.5" onClick={() => { setDraft(title); setEditing(true); }}>
                <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            )}
          </div>
        )}
        {showExport && (
          <a href={`/api/notes/${noteId}/export`} download>
            <Button size="sm" variant="outline" className="shrink-0">
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Markdown
            </Button>
          </a>
        )}
      </div>
      {sourceUrl && (
        <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:underline mt-1 inline-block">
          {sourceUrl}
        </a>
      )}
    </div>
  );
}
