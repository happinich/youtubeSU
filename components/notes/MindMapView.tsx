"use client";

import { useMemo, createContext, useContext, useRef } from "react";
import {
  ReactFlow,
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Position,
  Handle,
  NodeProps,
  ReactFlowProvider,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { SummaryJSON } from "@/lib/summarize";

// ── seek callback via context (never goes into node data) ─────────────────────
const SeekCtx = createContext<(sec: number) => void>(() => {});

// ── util ──────────────────────────────────────────────────────────────────────
const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

// ── node components ───────────────────────────────────────────────────────────
function CenterNode({ data }: NodeProps) {
  return (
    <div style={{
      background: "var(--st-accent)", color: "var(--st-ink)", borderRadius: 16,
      padding: "16px 22px", maxWidth: 230, textAlign: "center",
      font: "800 14px/1.4 var(--font-inter, Inter)",
      boxShadow: "0 8px 28px -6px oklch(0.72 0.15 55 / 0.55)",
    }}>
      <Handle type="source" position={Position.Right}  id="r" style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Left}   id="l" style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Top}    id="t" style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Bottom} id="b" style={{ opacity: 0 }} />
      {String(data.label)}
    </div>
  );
}

function TldrNode({ data }: NodeProps) {
  return (
    <div style={{
      background: "var(--st-accent-soft)", border: "1px solid oklch(0.72 0.15 55 / 0.3)",
      borderRadius: 12, padding: "12px 16px", maxWidth: 260,
      fontFamily: "var(--font-inter, Inter)",
    }}>
      <Handle type="target" position={Position.Bottom} style={{ opacity: 0 }} />
      <div style={{ font: "700 9px var(--font-mono, monospace)", color: "var(--st-accent-2)", marginBottom: 6, letterSpacing: "0.1em" }}>TL;DR</div>
      <div style={{ font: "500 12px/1.5 var(--font-inter, Inter)", color: "var(--st-ink)" }}>{String(data.label)}</div>
    </div>
  );
}

function KeyPointNode({ data }: NodeProps) {
  const onSeek = useContext(SeekCtx);
  return (
    <div
      onClick={() => typeof data.sec === "number" && onSeek(data.sec)}
      style={{
        background: "var(--st-paper)", border: "1.5px solid var(--st-accent)",
        borderRadius: 10, padding: "10px 14px", width: 210,
        cursor: typeof data.sec === "number" ? "pointer" : "default",
        fontFamily: "var(--font-inter, Inter)",
        boxShadow: "0 3px 12px -4px oklch(0.72 0.15 55 / 0.25)",
      }}
    >
      <Handle type="target" position={Position.Left}  style={{ opacity: 0 }} />
      <Handle type="target" position={Position.Right} style={{ opacity: 0 }} />
      {typeof data.time === "string" && data.time && (
        <div style={{ font: "600 10px var(--font-mono, monospace)", color: "var(--st-accent-2)", marginBottom: 5, letterSpacing: "0.06em" }}>
          🔑 {data.time}
        </div>
      )}
      <div style={{ font: "600 13px/1.35 var(--font-inter, Inter)", color: "var(--st-ink)" }}>{String(data.label)}</div>
      {typeof data.content === "string" && data.content && (
        <div style={{
          fontSize: 11, color: "var(--st-ink-3)", marginTop: 5, lineHeight: 1.45,
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
        }}>{data.content}</div>
      )}
    </div>
  );
}

function SectionNode({ data }: NodeProps) {
  const onSeek = useContext(SeekCtx);
  return (
    <div
      onClick={() => typeof data.sec === "number" && onSeek(data.sec)}
      style={{
        background: "var(--st-paper-2)", border: "1px solid var(--st-line)",
        borderRadius: 10, padding: "10px 14px", width: 200, cursor: "pointer",
        fontFamily: "var(--font-inter, Inter)",
        boxShadow: "0 2px 8px -3px oklch(0 0 0 / 0.08)",
      }}
    >
      <Handle type="target" position={Position.Left}  style={{ opacity: 0 }} />
      <Handle type="target" position={Position.Right} style={{ opacity: 0 }} />
      {typeof data.time === "string" && data.time && (
        <div style={{ font: "500 10px var(--font-mono, monospace)", color: "var(--st-ink-3)", marginBottom: 5, letterSpacing: "0.06em" }}>
          📑 {data.time}
        </div>
      )}
      <div style={{ font: "600 13px/1.35 var(--font-inter, Inter)", color: "var(--st-ink)" }}>{String(data.label)}</div>
    </div>
  );
}

function TagNode({ data }: NodeProps) {
  return (
    <div style={{
      background: "var(--st-accent-soft)", border: "1px solid oklch(0.72 0.15 55 / 0.35)",
      borderRadius: 999, padding: "5px 13px", whiteSpace: "nowrap",
      font: "500 11px var(--font-mono, monospace)", color: "var(--st-accent-2)",
    }}>
      <Handle type="target" position={Position.Top}  style={{ opacity: 0 }} />
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
      #{String(data.label)}
    </div>
  );
}

const NODE_TYPES = { center: CenterNode, tldr: TldrNode, keypoint: KeyPointNode, section: SectionNode, tag: TagNode };

// ── graph layout ──────────────────────────────────────────────────────────────
function buildGraph(summary: SummaryJSON, title: string) {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  nodes.push({
    id: "center", type: "center",
    position: { x: 0, y: 0 },
    data: { label: title },
  });

  // TL;DR — above
  if (summary.tldr) {
    nodes.push({ id: "tldr", type: "tldr", position: { x: -130, y: -220 }, data: { label: summary.tldr } });
    edges.push({ id: "e-tldr", source: "center", sourceHandle: "t", target: "tldr", type: "smoothstep", style: { stroke: "oklch(0.72 0.15 55 / 0.45)", strokeWidth: 1.5 } });
  }

  // Key points — right side
  const kps = summary.key_points ?? [];
  const KP_GAP = 160;
  const kpStartY = -((kps.length - 1) * KP_GAP) / 2;
  kps.forEach((kp, i) => {
    const id = `kp-${i}`;
    const xOffset = 420 + Math.abs(i - (kps.length - 1) / 2) * 20;
    nodes.push({
      id, type: "keypoint",
      position: { x: xOffset, y: kpStartY + i * KP_GAP },
      data: { label: kp.title, content: kp.content, time: fmt(kp.timestamp_sec), sec: kp.timestamp_sec },
    });
    edges.push({
      id: `e-kp-${i}`, source: "center", sourceHandle: "r", target: id,
      type: "smoothstep",
      style: { stroke: "oklch(0.72 0.15 55 / 0.55)", strokeWidth: 2 },
    });
  });

  // Sections — left side
  const secs = summary.sections ?? [];
  const SEC_GAP = 148;
  const secStartY = -((secs.length - 1) * SEC_GAP) / 2;
  secs.forEach((sec, i) => {
    const id = `sec-${i}`;
    const xOffset = 400 + Math.abs(i - (secs.length - 1) / 2) * 18;
    nodes.push({
      id, type: "section",
      position: { x: -(xOffset + 200), y: secStartY + i * SEC_GAP },
      data: { label: sec.title, time: fmt(sec.start_sec), sec: sec.start_sec },
    });
    edges.push({
      id: `e-sec-${i}`, source: "center", sourceHandle: "l", target: id,
      type: "smoothstep",
      style: { stroke: "var(--st-ink-4)", strokeWidth: 1.5 },
    });
  });

  // Tags — below
  const tags = summary.tags ?? [];
  if (tags.length > 0) {
    const TAG_GAP = 120;
    const tagStartX = -((tags.length - 1) * TAG_GAP) / 2;
    tags.forEach((tag, i) => {
      const id = `tag-${i}`;
      nodes.push({ id, type: "tag", position: { x: tagStartX + i * TAG_GAP, y: 260 }, data: { label: tag } });
      edges.push({
        id: `e-tag-${i}`, source: "center", sourceHandle: "b", target: id,
        type: "smoothstep",
        style: { stroke: "oklch(0.72 0.15 55 / 0.35)", strokeWidth: 1 },
      });
    });
  }

  return { nodes, edges };
}

// ── exported component ────────────────────────────────────────────────────────
export interface MindMapViewProps {
  summary: SummaryJSON;
  sourceTitle?: string | null;
  onSeek: (sec: number) => void;
}

function MindMapInner({ summary, sourceTitle, onSeek }: MindMapViewProps) {
  const title = sourceTitle ?? "영상 요약";
  const { nodes: initNodes, edges: initEdges } = useMemo(
    () => buildGraph(summary, title),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [summary, title]
  );

  const [nodes, , onNodesChange] = useNodesState(initNodes);
  const [edges, , onEdgesChange] = useEdgesState(initEdges);

  return (
    <SeekCtx.Provider value={onSeek}>
      <div style={{
        width: "100%",
        height: "calc(100vh - 300px)",
        minHeight: 520,
        borderRadius: 14,
        overflow: "hidden",
        border: "1px solid var(--st-line)",
      }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={NODE_TYPES}
          fitView
          fitViewOptions={{ padding: 0.18 }}
          minZoom={0.2}
          maxZoom={2.5}
          proOptions={{ hideAttribution: true }}
          nodesConnectable={false}
          style={{ background: "var(--st-paper-2)", fontFamily: "var(--font-inter, Inter)" }}
        >
          <Background color="oklch(0.88 0.005 80)" gap={28} size={1} />
          <Controls
            showInteractive={false}
            style={{
              background: "var(--st-paper)", border: "1px solid var(--st-line)",
              borderRadius: 10, boxShadow: "0 2px 8px -2px oklch(0 0 0 / 0.07)",
            }}
          />
          <MiniMap
            style={{ background: "var(--st-paper)", border: "1px solid var(--st-line)", borderRadius: 10 }}
            maskColor="oklch(0 0 0 / 0.04)"
            nodeColor={(n) =>
              n.type === "center"   ? "oklch(0.72 0.15 55)" :
              n.type === "keypoint" ? "oklch(0.82 0.1 55)"  :
              n.type === "tag"      ? "oklch(0.88 0.06 55)" :
              "oklch(0.88 0.004 80)"
            }
          />
        </ReactFlow>
      </div>
    </SeekCtx.Provider>
  );
}

export function MindMapView(props: MindMapViewProps) {
  return (
    <ReactFlowProvider>
      <MindMapInner {...props} />
    </ReactFlowProvider>
  );
}
