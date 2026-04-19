"use client";

import { useState, useRef, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNoteStore } from "@/store/noteStore";
import { Send, Loader2, Bot, User } from "lucide-react";
import ReactMarkdown from "react-markdown";

export function ChatPanel({ noteId }: { noteId: string }) {
  const { chatMessages, setChatMessages, addChatMessage, updateLastAssistantMessage } = useNoteStore();
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/notes/${noteId}/chat`)
      .then((r) => r.json())
      .then((msgs) => setChatMessages(msgs))
      .catch(() => {});
  }, [noteId, setChatMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || streaming) return;

    const userMsg = input.trim();
    setInput("");

    addChatMessage({
      id: Date.now().toString(),
      role: "USER",
      content: userMsg,
      createdAt: new Date().toISOString(),
    });

    addChatMessage({
      id: (Date.now() + 1).toString(),
      role: "ASSISTANT",
      content: "",
      createdAt: new Date().toISOString(),
    });

    setStreaming(true);

    try {
      const res = await fetch(`/api/notes/${noteId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg }),
      });

      if (!res.body) return;
      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        updateLastAssistantMessage(decoder.decode(value));
      }
    } catch (err) {
      console.error("Chat error:", err);
    } finally {
      setStreaming(false);
    }
  }

  return (
    <div className="flex flex-col h-[500px]">
      <ScrollArea className="flex-1 pr-2">
        <div className="space-y-4 pb-2">
          {chatMessages.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Bot className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">영상 내용에 대해 무엇이든 물어보세요.</p>
            </div>
          )}
          {chatMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === "USER" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "ASSISTANT" && (
                <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                  msg.role === "USER"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                {msg.role === "ASSISTANT" ? (
                  <ReactMarkdown className="prose prose-sm dark:prose-invert max-w-none">
                    {msg.content || (streaming ? "..." : "")}
                  </ReactMarkdown>
                ) : (
                  msg.content
                )}
              </div>
              {msg.role === "USER" && (
                <div className="h-7 w-7 rounded-full bg-secondary flex items-center justify-center shrink-0 mt-0.5">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>
      <form onSubmit={sendMessage} className="flex gap-2 pt-2 border-t mt-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="영상에 대해 질문하세요..."
          disabled={streaming}
          className="flex-1"
        />
        <Button type="submit" size="icon" disabled={!input.trim() || streaming}>
          {streaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>
    </div>
  );
}
