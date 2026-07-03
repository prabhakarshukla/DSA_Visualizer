"use client";

import type React from "react";

import { GraphCard } from "./graph-card";
import { GraphEdges } from "./graph-edges";
import { GraphNodes } from "./graph-nodes";

type GraphCanvasProps<TNode, TEdge> = {
  title: string;
  subtitle?: string;
  nodes: TNode[];
  edges: TEdge[];
  width: number;
  height: number;
  getNodePoint: (node: TNode) => { x: number; y: number };
  renderEdge: (args: {
    edge: TEdge;
    index: number;
    geometry: { path: string; arrowPoints: string; label: { x: number; y: number } };
    fromPoint: { x: number; y: number };
    toPoint: { x: number; y: number };
  }) => React.ReactNode;
  renderNode: (args: {
    node: TNode;
    index: number;
    point: { x: number; y: number };
  }) => React.ReactNode;
  headerActions?: React.ReactNode;
  canvasClassName?: string;
  className?: string;
  emptyState?: React.ReactNode;
  footer?: React.ReactNode;
  onMouseDown?: React.MouseEventHandler<SVGSVGElement>;
  onMouseMove?: React.MouseEventHandler<SVGSVGElement>;
  onMouseUp?: React.MouseEventHandler<SVGSVGElement>;
  onMouseLeave?: React.MouseEventHandler<SVGSVGElement>;
  onClick?: React.MouseEventHandler<SVGSVGElement>;
};

export function GraphCanvas<TNode, TEdge>({
  title,
  subtitle,
  nodes,
  edges,
  width,
  height,
  getNodePoint,
  renderEdge,
  renderNode,
  headerActions,
  canvasClassName = "",
  className = "",
  emptyState,
  footer,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onMouseLeave,
  onClick,
}: GraphCanvasProps<TNode, TEdge>) {
  return (
    <GraphCard className={className}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[#4B5320]">{title}</h2>
          {subtitle && <p className="mt-1 text-sm text-[#556B2F]">{subtitle}</p>}
        </div>
        {headerActions}
      </div>

      <div className={`mt-4 flex justify-center overflow-x-auto rounded-2xl bg-[#F1E8C7] p-4 ${canvasClassName}`.trim()}>
        <svg
          width={width}
          height={height}
          className="flex-shrink-0"
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseLeave}
          onClick={onClick}
        >
          <GraphEdges nodes={nodes} edges={edges} width={width} height={height} getNodePoint={getNodePoint} renderEdge={renderEdge} />
          <GraphNodes nodes={nodes} width={width} height={height} getNodePoint={getNodePoint} renderNode={renderNode} />
        </svg>
      </div>

      {nodes.length === 0 && emptyState}
      {footer}
    </GraphCard>
  );
}
