"use client";

import { motion } from "framer-motion";
import type React from "react";

import { getEdgeGeometry, toSvgPoint } from "./utils";

type GraphEdgesProps<TNode, TEdge> = {
  nodes: TNode[];
  edges: TEdge[];
  width: number;
  height: number;
  getNodePoint: (node: TNode) => { x: number; y: number };
  renderEdge: (args: {
    edge: TEdge;
    index: number;
    geometry: NonNullable<ReturnType<typeof getEdgeGeometry>>;
    fromPoint: { x: number; y: number };
    toPoint: { x: number; y: number };
  }) => React.ReactNode;
};

export function GraphEdges<TNode, TEdge>({ nodes, edges, width, height, getNodePoint, renderEdge }: GraphEdgesProps<TNode, TEdge>) {
  return (
    <g>
      {edges.map((edge, index) => {
        const edgeRecord = edge as unknown as { from: number; to: number };
        const fromNode = nodes.find((node) => (node as unknown as { id: number }).id === edgeRecord.from);
        const toNode = nodes.find((node) => (node as unknown as { id: number }).id === edgeRecord.to);
        if (!fromNode || !toNode) return null;

        const fromPoint = toSvgPoint(getNodePoint(fromNode), width, height);
        const toPoint = toSvgPoint(getNodePoint(toNode), width, height);
        const geometry = getEdgeGeometry(fromPoint, toPoint);
        if (!geometry) return null;

        return <g key={`edge-${index}`}>{renderEdge({ edge, index, geometry, fromPoint, toPoint })}</g>;
      })}
    </g>
  );
}

export function GraphEdgePath({
  path,
  stroke,
  strokeWidth,
  strokeDasharray,
  animate,
}: {
  path: string;
  stroke: string;
  strokeWidth: string | number;
  strokeDasharray?: string;
  animate?: boolean;
}) {
  return (
    <motion.path
      d={path}
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeDasharray={strokeDasharray}
      strokeLinecap="round"
      strokeLinejoin="round"
      animate={animate ? { opacity: [0.6, 1, 0.6] } : { opacity: 0.7 }}
      transition={{ repeat: animate ? Number.POSITIVE_INFINITY : 0, duration: 1.4 }}
    />
  );
}
