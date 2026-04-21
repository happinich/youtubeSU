"use client";

import { useMemo, createContext, useContext } from "react";
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
  EdgeProps,
  getBezierPath,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { SummaryJSON } from "@/lib/summarize";

// ── Seek context (avoids storing functions in node data) ──────────────────────
const SeekCtx = createContext<(sec: number) => void>(() => {});

// ── Custom edge: subtle bezier ────────────────────────────────────────────────
function SoftEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, style }: EdgeProps) {
  const [path] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition });
  return <path id={id} d={path} fill="none" strokeWidth={1.5} stroke="var(--st-line)" {...style as React.SVGProps<SVGPathElement>} />;
}

// ── Node components ───────────────────────────────────────────────────────────
function CenterNode({ data }: NodeProps) {
  return (
    <div style={{
      background: "var(--st-accent)", color: "var(--st-ink)", borderRadius: 16,
      padding: "16px 24px", fontWeight: 800, fontSize: 14, maxWidth: 240,
      textAlign: "center", lineHeight: 1.4,
      boxShadow: "0 8px 28px -6px oklch(0.72 0.15 55 / 0.5)",
      fontFamily: "var(--font-inter, Inter)",
      border: "none",
    }}>
      <Handle type="source" position={Position.Right} id="r" style={{ opacity: 0, pointerEvents: "none" }} />
      <Handle type="source" position={Position.Left}  id="l" style={{ opacity: 0, pointerEvents: "none" }} />
      <Handle type="source" position={Position.Top}   id="t" style={{ opacity: 0, pointerEvents: "none" }} />
      <Handle type="source" position={Position.Bottom} id="b" style={{ opacity: 0, pointerEvents: "none" }} />
      {data.label as string}
    </div>
  );
}

function KeyPointNode({ data }: NodeProps) {
  const onSeek = useContext(SeekCtx);
  const sec = data.sec as number | undefined;
  const time = data.time as string | undefined;
  return (
    <div
      onClick={() => sec !== undefined && onSeek(sec)}
      style={{
        background: "var(--st-paper)", border: "1.5px solid var(--st-accent)",
        borderRadius: 10, padding: "10px 14px", width: 200, cursor: sec !== undefined ? "pointer" : "default",
        fontFamily: "var(--font-inter, Inter)",
        boxShadow: "0 3px 10px -3px oklch(0.72 0.15 55 / 0.2)",
        transition: "box-shadow .15s",
      }}
    >
      <Handle type="target" position={Position.Left}  style={{ opacity: 0, pointerEvents: "none" }} />
      <Handle type="target" position={Position.Right} style={{ opacity: 0, pointerEvents: "none" }} />
      {time && (
        <div style={{ font: "600 10px var(--font-mono, monospace)", color: "var(--st-accent-2)", marginBottom: 5, letterSpacing: "0.06em" }}>
          🔑 {time}
        </div>
      )}
      <div style={{ font: "600 13px var(--font-inter, Inter)", color: "var(--st-ink)", lineHeight: 1.35 }}>
        {data.label as string}
      </div>
      {typeof data.content === "string" && data.content && (
        <div style={{ fontSize: 11, color: "var(--st-ink-3)", marginTop: 5, lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {data.content}
        </div>
      )}
    </div>
  );
}

function SectionNode({ data }: NodeProps) {
  const onSeek = useContext(SeekCtx);
  const sec = data.sec as number | undefined;
  const time = data.time as string | undefined;
  return (
    <div
      onClick={() => sec !== undefined && onSeek(sec)}
      style={{
        background: "var(--st-paper-2)", border: "1px solid var(--st-line)",
        borderRadius: 10, padding: "10px 14px", width: 190, cursor: "pointer",
        fontFamily: "var(--font-inter, Inter)",
        boxShadow: "0 2px 8px -2px oklch(0 0 0 / 0.07)",
      }}
    >
      <Handle type="target" position={Position.Left}  style={{ opacity: 0, pointerEvents: "none" }} />
      <Handle type="target" position={Position.Right} style={{ opacity: 0, pointerEvents: "none" }} />
      {time && (
        <div style={{ font: "500 10px var(--font-mono, monospace)", color: "var(--st-ink-3)", marginBottom: 5, letterSpacing: "0.06em" }}>
          📑 {time}
        </div>
      )}
      <div style={{ font: "600 13px var(--font-inter, Inter)", color: "var(--st-ink)", lineHeight: 1.35 }}>
        {data.label as string}
      </div>
    </div>
  );
}

function TagNode({ data }: NodeProps) {
  return (
    <div style={{
      background: "var(--st-accent-soft)", border: "1px solid oklch(0.72 0.15 55 / 0.3)",
      borderRadius: 999, padding: "5px 13px",
      font: "500 11px var(--font-mono, monospace)", color: "var(--st-accent-2)",
      whiteSpace: "nowrap",
    }}>
      <Handle type="target" position={Position.Top}   style={{ opacity: 0, pointerEvents: "none" }} />
      <Handle type="target" position={Position.Left}  style={{ opacity: 0, pointerEvents: "none" }} />
      #{data.label as string}
    </div>
  );
}

function TldrNode({ data }: NodeProps) {
  return (
    <div style={{
      background: "var(--st-accent-soft)", border: "1px solid oklch(0.72 0.15 55 / 0.25)",
      borderRadius: 12, padding: "12px 16px", maxWidth: 260,
      fontFamily: "var(--font-inter, Inter)",
    }}>
      <Handle type="target" position={Position.Top}    style={{ opacity: 0, pointerEvents: "none" }} />
      <Handle type="target" position={Position.Bottom} style={{ opacity: 0, pointerEvents: "none" }} />
      <div style={{ font: "700 10px var(--font-mono, monospace)", color: "var(--st-accent-2)", marginBottom: 6, letterSpacing: "0.1em" }}>TL;DR</div>
      <div style={{ font: "500 12px var(--font-inter, Inter)", color: "var(--st-ink)", lineHeight: 1.5 }}>
        {data.label as string}
      </div>
    </div>
  );
}

const nodeTypes = { center: CenterNode, keypoint: KeyPointNode, section: SectionNode, tag: TagNode, tldr: TldrNode };
const edgeTypes = { soft: SoftEdge };

// ── Layout builder ────────────────────────────────────────────────────────────
function fmtTime(sec: number) {
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
}

function buildGraph(summary: SummaryJSON, title: string) {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  const cx = 0, cy = 0;
  nodes.push({ id: "center", type: "center", position: { x: cx, y: cy }, data: { label: title || "영상 요약" } });

  const kps  = summary.key_points ?? [];
  const secs = summary.sections   ?? [];
  const tags = summary.tags       ?? [];

  // TL;DR — above center
  if (summary.tldr) {
    nodes.push({ id: "tldr", type: "tldr", position: { x: cx - 130, y: cy - 200 }, data: { label: summary.tldr } });
    edges.push({ id: "e-tldr", source: "center", target: "tldr", sourceHandle: "t", type: "soft", style: { stroke: "oklch(0.72 0.15 55 / 0.4)" } });
  }

  // Key points — right side, vertical fan
  const KP_GAP = 150;
  const kpStartY = cy - ((kps.length - 1) * KP_GAP) / 2;
  kps.forEach((kp, i) => {
    const id = `kp-${i}`;
    const depth = 420 + Math.abs(i - (kps.length - 1) / 2) * 30;
    nodes.push({
      id, type: "keypoint",
      position: { x: cx + depth, y: kpStartY + i * KP_GAP },
      data: { label: kp.title, content: kp.content, time: fmtTime(kp.timestamp_sec), sec: kp.timestamp_sec },
    });
    edges.push({ id: `e-kp-${i}`, source: "center", target: id, sourceHandle: "r", type: "soft", style: { stroke: "oklch(0.72 0.15 55 / 0.6)", strokeWidth: 2 } });
  });

  // Sections — left side, vertical fan
  const SEC_GAP = 140;
  const secStartY = cy - ((secs.length - 1) * SEC_GAP) / 2;
  secs.forEach((sec, i) => {
    const id = `sec-${i}`;
    const depth = 400 + Math.abs(i - (secs.length - 1) / 2) * 25;
    nodes.push({
      id, type: "section",
      position: { x: cx - depth - 190, y: secStartY + i * SEC_GAP },
      data: { label: sec.title, time: fmtTime(sec.start_sec), sec: sec.start_sec },
    });
    edges.push({ id: `e-sec-${i}`, source: "center", target: id, sourceHandle: "l", type: "soft", style: { stroke: "var(--st-ink-4)", strokeWidth: 1.5 } });
  });

  // Tags — below center, spread horizontally
  if (tags.length > 0) {
    const TAG_GAP = 130;
    const tagStartX = cx - ((tags.length - 1) * TAG_GAP) / 2;
    const tagY = cy + 240;
    tags.forEach((tag, i) => {
      const id = `tag-${i}`;
      nodes.push({ id, type: "tag", position: { x: tagStartX + i * TAG_GAP, y: tagY }, data: { label: tag } });
      edges.push({ id: `e-tag-${i}`, source: "center", target: id, sourceHandle: "b", type: "soft", style: { stroke: "oklch(0.72 0.15 55 / 0.3)" } });
    });
  }

  return { nodes, edges };
}

// ── Main component ────────────────────────────────────────────────────────────
interface MindMapViewProps {
  summary: SummaryJSON;
  sourceTitle?: string | null;
  onSeek: (sec: number) => void;
}

export function MindMapView({ summary, sourceTitle, onSeek }: MindMapViewProps) {
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
        width: "100%", height: "calc(100vh - 300px)", minHeight: 500,
        borderRadius: 14, overflow: "hidden", border: "1px solid var(--st-line)",
      }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          fitViewOptions={{ padding: 0.15 }}
          minZoom={0.2}
          maxZoom={2}
          proOptions={{ hideAttribution: true }}
          style={{ background: "var(--st-paper-2)" }}
          nodesDraggable
          nodesConnectable={false}
          elementsSelectable
        >
          <Background color="oklch(0.88 0.006 80)" gap={28} size={1} />
          <Controls
            showInteractive={false}
            style={{ background: "var(--st-paper)", border: "1px solid var(--st-line)", borderRadius: 10, boxShadow: "0 2px 8px -2px oklch(0 0 0 / 0.08)" }}
          />
          <MiniMap
            style={{ background: "var(--st-paper)", border: "1px solid var(--st-line)", borderRadius: 10 }}
            maskColor="oklch(0 0 0 / 0.05)"
            nodeColor={(n) => n.type === "center" ? "oklch(0.72 0.15 55)" : n.type === "keypoint" ? "oklch(0.72 0.15 55 / 0.3)" : "oklch(0.85 0.006 80)"}
          />
        </ReactFlow>
      </div>
    </SeekCtx.Provider>
  );
}
