"use client";

import { motion } from "framer-motion";
import type React from "react";

import { toSvgPoint } from "./utils";

type GraphNodesProps<TNode> = {
  nodes: TNode[];
  width: number;
  height: number;
  getNodePoint: (node: TNode) => { x: number; y: number };
  renderNode: (args: {
    node: TNode;
    index: number;
    point: { x: number; y: number };
  }) => React.ReactNode;
};

export function GraphNodes<TNode>({ nodes, width, height, getNodePoint, renderNode }: GraphNodesProps<TNode>) {
  return (
    <g>
      {nodes.map((node, index) => {
        const point = toSvgPoint(getNodePoint(node), width, height);
        return (
          <motion.g
            key={`node-${(node as unknown as { id: number }).id ?? index}`}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.12 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
          >
            {renderNode({ node, index, point })}
          </motion.g>
        );
      })}
    </g>
  );
}
