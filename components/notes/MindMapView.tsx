"use client";

import { useMemo, useCallback } from "react";
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
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { SummaryJSON } from "@/lib/summarize";

interface MindMapViewProps {
  summary: SummaryJSON;
  sourceTitle?: string | null;
  onSeek: (sec: number) => void;
}

function CenterNode({ data }: NodeProps) {
  return (
    <div style={{
      background: "var(--st-accent)", color: "var(--st-ink)", borderRadius: 14,
      padding: "14px 22px", fontWeight: 800, fontSize: 15, maxWidth: 220,
      textAlign: "center", lineHeight: 1.35, boxShadow: "0 8px 24px -6px oklch(0.72 0.15 55 / 0.45)",
      fontFamily: "var(--font-inter, Inter)",
    }}>
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Left} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Top} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
      {data.label as string}
    </div>
  );
}

function KeyPointNode({ data }: NodeProps) {
  return (
    <div
      style={{
        background: "var(--st-paper)", border: "1.5px solid var(--st-accent)",
        borderRadius: 10, padding: "10px 14px", maxWidth: 200,
        fontFamily: "var(--font-inter, Inter)", boxShadow: "0 4px 12px -4px oklch(0 0 0 / 0.1)",
        cursor: (data as { sec?: number }).sec !== undefined ? "pointer" : "default",
      }}
      onClick={() => {
        const sec = (data as { sec?: number }).sec;
        if (sec !== undefined && (data as { onSeek?: (s: number) => void }).onSeek) {
          (data as { onSeek: (s: number) => void }).onSeek(sec);
        }
      }}
    >
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
      <Handle type="target" position={Position.Right} style={{ opacity: 0 }} />
      <div style={{ font: "600 10px var(--font-mono, monospace)", color: "var(--st-accent-2)", marginBottom: 4, letterSpacing: "0.06em" }}>
        {(data as { time?: string }).time ?? "🔑 KEY POINT"}
      </div>
      <div style={{ font: "600 13px var(--font-inter, Inter)", color: "var(--st-ink)", lineHeight: 1.3 }}>
        {data.label as string}
      </div>
    </div>
  );
}

function SectionNode({ data }: NodeProps) {
  return (
    <div
      style={{
        background: "var(--st-paper-2)", border: "1px solid var(--st-line)",
        borderRadius: 10, padding: "10px 14px", maxWidth: 200,
        fontFamily: "var(--font-inter, Inter)", cursor: "pointer",
        boxShadow: "0 2px 8px -2px oklch(0 0 0 / 0.08)",
      }}
      onClick={() => {
        const sec = (data as { sec?: number }).sec;
        if (sec !== undefined && (data as { onSeek?: (s: number) => void }).onSeek) {
          (data as { onSeek: (s: number) => void }).onSeek(sec);
        }
      }}
    >
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
      <Handle type="target" position={Position.Right} style={{ opacity: 0 }} />
      <div style={{ font: "500 10px var(--font-mono, monospace)", color: "var(--st-ink-3)", marginBottom: 4, letterSpacing: "0.06em" }}>
        {(data as { time?: string }).time ?? "📑 SECTION"}
      </div>
      <div style={{ font: "600 13px var(--font-inter, Inter)", color: "var(--st-ink)", lineHeight: 1.3 }}>
        {data.label as string}
      </div>
    </div>
  );
}

function TagNode({ data }: NodeProps) {
  return (
    <div style={{
      background: "var(--st-paper-2)", border: "1px solid var(--st-line-2)",
      borderRadius: 999, padding: "5px 12px",
      font: "500 11px var(--font-mono, monospace)", color: "var(--st-ink-3)",
    }}>
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
      <Handle type="target" position={Position.Right} style={{ opacity: 0 }} />
      #{data.label as string}
    </div>
  );
}

const nodeTypes = { center: CenterNode, keypoint: KeyPointNode, section: SectionNode, tag: TagNode };

function buildGraph(summary: SummaryJSON, title: string, onSeek: (s: number) => void) {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  nodes.push({ id: "center", type: "center", position: { x: 0, y: 0 }, data: { label: title || "영상 요약" } });

  const kps = summary.key_points ?? [];
  const secs = summary.sections ?? [];
  const tags = summary.tags ?? [];

  const kpTotal = kps.length;
  const secTotal = secs.length;
  const tagTotal = tags.length;

  // Key points — fan out to the right
  kps.forEach((kp, i) => {
    const angle = kpTotal === 1 ? 0 : ((i / (kpTotal - 1)) - 0.5) * Math.PI * 0.9;
    const r = 380;
    const x = Math.cos(angle) * r;
    const y = Math.sin(angle) * r;
    const id = `kp-${i}`;
    nodes.push({
      id, type: "keypoint", position: { x: 280 + x, y },
      data: { label: kp.title, time: `${Math.floor(kp.timestamp_sec / 60)}:${String(kp.timestamp_sec % 60).padStart(2, "0")}`, sec: kp.timestamp_sec, onSeek },
    });
    edges.push({ id: `e-kp-${i}`, source: "center", target: id, style: { stroke: "oklch(0.72 0.15 55)", strokeWidth: 1.5 }, animated: false });
  });

  // Sections — fan out to the left
  secs.forEach((sec, i) => {
    const angle = secTotal === 1 ? 0 : ((i / (secTotal - 1)) - 0.5) * Math.PI * 0.9;
    const r = 360;
    const x = Math.cos(angle) * r;
    const y = Math.sin(angle) * r;
    const id = `sec-${i}`;
    nodes.push({
      id, type: "section", position: { x: -280 - x, y },
      data: { label: sec.title, time: `${Math.floor(sec.start_sec / 60)}:${String(sec.start_sec % 60).padStart(2, "0")}`, sec: sec.start_sec, onSeek },
    });
    edges.push({ id: `e-sec-${i}`, source: "center", target: id, style: { stroke: "var(--st-line)", strokeWidth: 1.5 }, animated: false });
  });

  // Tags — fan out below
  tags.forEach((tag, i) => {
    const spread = (tagTotal - 1) * 130;
    const x = -spread / 2 + i * 130;
    const id = `tag-${i}`;
    nodes.push({
      id, type: "tag", position: { x, y: 320 },
      data: { label: tag },
    });
    edges.push({ id: `e-tag-${i}`, source: "center", target: id, style: { stroke: "var(--st-line-2)", strokeWidth: 1 }, animated: false });
  });

  return { nodes, edges };
}

export function MindMapView({ summary, sourceTitle, onSeek }: MindMapViewProps) {
  const title = sourceTitle ?? "영상 요약";
  const { nodes: initNodes, edges: initEdges } = useMemo(
    () => buildGraph(summary, title, onSeek),
    [summary, title, onSeek]
  );

  const [nodes, , onNodesChange] = useNodesState(initNodes);
  const [edges, , onEdgesChange] = useEdgesState(initEdges);

  return (
    <div style={{ width: "100%", height: "calc(100vh - 320px)", minHeight: 480, borderRadius: 14, overflow: "hidden", border: "1px solid var(--st-line)" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.3}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
        style={{ background: "var(--st-paper-2)" }}
      >
        <Background color="var(--st-line)" gap={24} size={1} />
        <Controls style={{ background: "var(--st-paper)", border: "1px solid var(--st-line)" }} />
        <MiniMap
          style={{ background: "var(--st-paper)", border: "1px solid var(--st-line)" }}
          maskColor="oklch(0 0 0 / 0.06)"
          nodeColor={() => "oklch(0.72 0.15 55 / 0.6)"}
        />
      </ReactFlow>
    </div>
  );
}
