"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Youtube } from "lucide-react";

export function UrlInputBar({ large = false }: { large?: boolean }) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "오류가 발생했습니다.");
        return;
      }

      const { id } = await res.json();
      router.push(`/notes/${id}`);
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl">
      <div className={`flex gap-2 ${large ? "flex-col sm:flex-row" : ""}`}>
        <div className="relative flex-1">
          <Youtube className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="url"
            placeholder="YouTube URL을 붙여넣으세요..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className={`pl-9 ${large ? "h-12 text-base" : ""}`}
            disabled={loading}
          />
        </div>
        <Button type="submit" disabled={loading || !url.trim()} className={large ? "h-12 px-6" : ""}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "요약하기"}
        </Button>
      </div>
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
    </form>
  );
}
