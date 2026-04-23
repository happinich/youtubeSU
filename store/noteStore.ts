import { create } from "zustand";
import type { SummaryJSON } from "@/lib/summarize";

interface ChatMessage {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  createdAt: string;
}

interface TranscriptSegment {
  id: string;
  startSec: number;
  endSec: number;
  text: string;
  seq: number;
}

export interface Highlight {
  id: string;
  noteId: string;
  userId: string;
  text: string;
  startSec: number | null;
  color: string;
  createdAt: string;
}

interface NoteState {
  playerCurrentTime: number;
  setPlayerCurrentTime: (t: number) => void;
  chatMessages: ChatMessage[];
  setChatMessages: (msgs: ChatMessage[]) => void;
  addChatMessage: (msg: ChatMessage) => void;
  updateLastAssistantMessage: (delta: string) => void;
  segments: TranscriptSegment[];
  setSegments: (segs: TranscriptSegment[]) => void;
  summary: SummaryJSON | null;
  setSummary: (s: SummaryJSON | null) => void;
  highlights: Highlight[];
  setHighlights: (h: Highlight[]) => void;
  addHighlight: (h: Highlight) => void;
  removeHighlight: (id: string) => void;
}

export const useNoteStore = create<NoteState>((set) => ({
  playerCurrentTime: 0,
  setPlayerCurrentTime: (t) => set({ playerCurrentTime: t }),
  chatMessages: [],
  setChatMessages: (msgs) => set({ chatMessages: msgs }),
  addChatMessage: (msg) => set((s) => ({ chatMessages: [...s.chatMessages, msg] })),
  updateLastAssistantMessage: (delta) =>
    set((s) => {
      const msgs = [...s.chatMessages];
      const last = msgs[msgs.length - 1];
      if (last?.role === "ASSISTANT") {
        msgs[msgs.length - 1] = { ...last, content: last.content + delta };
      }
      return { chatMessages: msgs };
    }),
  segments: [],
  setSegments: (segs) => set({ segments: segs }),
  summary: null,
  setSummary: (s) => set({ summary: s }),
  highlights: [],
  setHighlights: (h) => set({ highlights: h }),
  addHighlight: (h) => set((s) => ({ highlights: [h, ...s.highlights] })),
  removeHighlight: (id) => set((s) => ({ highlights: s.highlights.filter(h => h.id !== id) })),
}));
