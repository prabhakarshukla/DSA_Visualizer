import type { EdgeGeometry, Point } from "./types";

export const NODE_RADIUS = 24;
export const EDGE_STROKE_WIDTH = 2.5;
export const EDGE_STROKE_WIDTH_ACTIVE = 3.5;
export const EDGE_STROKE_WIDTH_SELECTED = 3;
export const EDGE_STROKE_WIDTH_PATH = 4;
export const EDGE_STROKE_WIDTH_MST = 4;
export const EDGE_STROKE_WIDTH_CYCLE = 4;

export const ARROW_GAP = 6;
export const ARROW_LENGTH = 14;
export const ARROW_WIDTH = 11;

export const GRAPH_COLORS = {
  node: {
    default: { fill: "#F7F1DD", stroke: "#D8CCA3" },
    current: { fill: "#AAB76A", stroke: "#556B2F" },
    visited: { fill: "#F1E8C7", stroke: "#7D8F3B" },
    completed: { fill: "#4B5320", stroke: "#4B5320" },
  },
  edge: {
    normal: "#D8CCA3",
    active: "#7D8F3B",
    selected: "#FED66A",
    shortestPath: "#4B5320",
    mst: "#4B5320",
    cycle: "#DC2626",
  },
  edgeArrow: {
    normal: "#7D8F3B",
    active: "#556B2F",
    selected: "#AAB76A",
    shortestPath: "#4B5320",
    mst: "#4B5320",
    cycle: "#DC2626",
  },
} as const;

export const generateNodePosition = (nodeCount: number, index: number) => {
  const angle = (index / Math.max(nodeCount, 1)) * 2 * Math.PI;
  const radius = 30 + nodeCount * 2;
  const x = 50 + radius * Math.cos(angle);
  const y = 50 + radius * Math.sin(angle);
  return { x: Math.max(5, Math.min(95, x)), y: Math.max(5, Math.min(95, y)) };
};

export const toSvgPoint = (node: { x: number; y: number }, width: number, height: number): Point => ({
  x: (node.x / 100) * width,
  y: (node.y / 100) * height,
});

export const getArrowPoints = (tip: Point, angle: number) => {
  const direction = { x: Math.cos(angle), y: Math.sin(angle) };
  const normal = { x: -direction.y, y: direction.x };
  const base = {
    x: tip.x - direction.x * ARROW_LENGTH,
    y: tip.y - direction.y * ARROW_LENGTH,
  };

  return [
    tip,
    {
      x: base.x + normal.x * (ARROW_WIDTH / 2),
      y: base.y + normal.y * (ARROW_WIDTH / 2),
    },
    {
      x: base.x - normal.x * (ARROW_WIDTH / 2),
      y: base.y - normal.y * (ARROW_WIDTH / 2),
    },
  ]
    .map((point) => `${point.x},${point.y}`)
    .join(" ");
};

export const getEdgeGeometry = (from: Point, to: Point): EdgeGeometry | null => {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const distance = Math.hypot(dx, dy);

  if (distance <= NODE_RADIUS * 2) return null;

  const unit = { x: dx / distance, y: dy / distance };
  const start = {
    x: from.x + unit.x * NODE_RADIUS,
    y: from.y + unit.y * NODE_RADIUS,
  };
  const end = {
    x: to.x - unit.x * (NODE_RADIUS + ARROW_GAP),
    y: to.y - unit.y * (NODE_RADIUS + ARROW_GAP),
  };
  const angle = Math.atan2(end.y - start.y, end.x - start.x);

  return {
    path: `M ${start.x} ${start.y} L ${end.x} ${end.y}`,
    arrowPoints: getArrowPoints(end, angle),
    label: {
      x: (start.x + end.x) / 2,
      y: (start.y + end.y) / 2,
    },
  };
};
