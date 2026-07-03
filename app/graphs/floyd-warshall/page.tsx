"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Download,
  Layers,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Shuffle,
  SkipBack,
  SkipForward,
  Trash2,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { GRAPH_COLORS, NODE_RADIUS, EDGE_STROKE_WIDTH, EDGE_STROKE_WIDTH_ACTIVE, EDGE_STROKE_WIDTH_PATH } from "@/components/graph-engine";

type GraphNode = {
  id: number;
  x: number;
  y: number;
};

type WeightedEdge = {
  from: number;
  to: number;
  weight: number;
};

type AlgorithmState = "idle" | "running" | "paused" | "completed";
type SpeedLevel = "slow" | "medium" | "fast";

type Point = {
  x: number;
  y: number;
};

type EdgeGeometry = {
  path: string;
  arrowPoints: string;
  label: Point;
};

type FloydSnapshot = {
  stepNumber: number;
  explanation: string;
  k: number | null;
  i: number | null;
  j: number | null;
  activeEdge: WeightedEdge | null;
  distances: Record<number, Record<number, number>>;
  predecessor: Record<number, Record<number, number | null>>;
  updatedCell: { i: number; j: number } | null;
  highlightedPathEdges: Array<{ from: number; to: number }>;
  hasNegativeCycle: boolean;
  negativeCycleNodes: number[];
  completionMessage: string;
};

const NODE_RADIUS_LOCAL = NODE_RADIUS;
const ARROW_GAP = 6;
const ARROW_LENGTH = 14;
const ARROW_WIDTH = 11;
const SVG_WIDTH = 700;
const SVG_HEIGHT = 460;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const getSpeedMultiplier = (speedLevel: SpeedLevel) => {
  switch (speedLevel) {
    case "slow":
      return 1.8;
    case "medium":
      return 1;
    case "fast":
      return 0.5;
  }
};

const generateNodePosition = (nodeCount: number, index: number) => {
  const angle = (index / Math.max(nodeCount, 1)) * 2 * Math.PI;
  const radius = 30 + nodeCount * 2;
  const x = 50 + radius * Math.cos(angle);
  const y = 50 + radius * Math.sin(angle);
  return { x: Math.max(8, Math.min(92, x)), y: Math.max(10, Math.min(90, y)) };
};

const toSvgPoint = (node: GraphNode): Point => ({
  x: (node.x / 100) * SVG_WIDTH,
  y: (node.y / 100) * SVG_HEIGHT,
});

const getArrowPoints = (tip: Point, angle: number) => {
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

const getEdgeGeometry = (from: Point, to: Point): EdgeGeometry | null => {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const distance = Math.hypot(dx, dy);

  if (distance <= NODE_RADIUS_LOCAL * 2) return null;

  const unit = { x: dx / distance, y: dy / distance };
  const start = {
    x: from.x + unit.x * NODE_RADIUS_LOCAL,
    y: from.y + unit.y * NODE_RADIUS_LOCAL,
  };
  const end = {
    x: to.x - unit.x * (NODE_RADIUS_LOCAL + ARROW_GAP),
    y: to.y - unit.y * (NODE_RADIUS_LOCAL + ARROW_GAP),
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

const createEmptyMatrix = (nodes: GraphNode[]) => {
  const matrix: Record<number, Record<number, number>> = {};
  const predecessor: Record<number, Record<number, number | null>> = {};

  nodes.forEach((row) => {
    matrix[row.id] = {};
    predecessor[row.id] = {};
    nodes.forEach((col) => {
      matrix[row.id][col.id] = row.id === col.id ? 0 : Infinity;
      predecessor[row.id][col.id] = row.id === col.id ? row.id : null;
    });
  });

  return { matrix, predecessor };
};

const buildMatrixFromEdges = (nodes: GraphNode[], edges: WeightedEdge[]) => {
  const { matrix, predecessor } = createEmptyMatrix(nodes);

  edges.forEach((edge) => {
    if (edge.weight < matrix[edge.from][edge.to]) {
      matrix[edge.from][edge.to] = edge.weight;
      predecessor[edge.from][edge.to] = edge.from;
    }
  });

  return { matrix, predecessor };
};

const cloneMatrix = (matrix: Record<number, Record<number, number>>) =>
  Object.fromEntries(Object.entries(matrix).map(([row, values]) => [Number(row), { ...values }])) as Record<number, Record<number, number>>;

const clonePredecessor = (predecessor: Record<number, Record<number, number | null>>) =>
  Object.fromEntries(Object.entries(predecessor).map(([row, values]) => [Number(row), { ...values }])) as Record<number, Record<number, number | null>>;

const reconstructPathEdges = (
  source: number,
  target: number,
  predecessor: Record<number, Record<number, number | null>>,
) => {
  const path: Array<{ from: number; to: number }> = [];
  const seen = new Set<number>();
  let current = target;

  while (current !== source) {
    if (seen.has(current)) return [];
    seen.add(current);

    const previous = predecessor[source]?.[current];
    if (previous === null || previous === undefined) return [];

    path.unshift({ from: previous, to: current });
    current = previous;
  }

  return path;
};

const detectNegativeCycleNodes = (nodes: GraphNode[], matrix: Record<number, Record<number, number>>) =>
  nodes.filter((node) => (matrix[node.id]?.[node.id] ?? Infinity) < 0).map((node) => node.id);

const buildPresetGraph = (preset: "sparse" | "dense" | "weighted" | "negative") => {
  const nodeCount = preset === "sparse" ? 5 : preset === "dense" ? 7 : preset === "weighted" ? 6 : 5;
  const nodes = Array.from({ length: nodeCount }, (_, index) => {
    const position = generateNodePosition(nodeCount, index);
    return { id: index + 1, x: position.x, y: position.y };
  });

  const edges: WeightedEdge[] = [];

  if (preset === "sparse") {
    edges.push(
      { from: 1, to: 2, weight: 5 },
      { from: 2, to: 3, weight: 2 },
      { from: 3, to: 5, weight: 4 },
      { from: 1, to: 4, weight: 9 },
    );
  } else if (preset === "dense") {
    edges.push(
      { from: 1, to: 2, weight: 3 },
      { from: 1, to: 3, weight: 8 },
      { from: 1, to: 4, weight: 5 },
      { from: 2, to: 3, weight: 1 },
      { from: 2, to: 5, weight: 6 },
      { from: 3, to: 4, weight: 2 },
      { from: 3, to: 6, weight: 4 },
      { from: 4, to: 5, weight: 7 },
      { from: 4, to: 7, weight: 3 },
      { from: 5, to: 6, weight: 2 },
      { from: 6, to: 7, weight: 1 },
      { from: 2, to: 7, weight: 9 },
      { from: 5, to: 7, weight: 4 },
    );
  } else if (preset === "weighted") {
    edges.push(
      { from: 1, to: 2, weight: 7 },
      { from: 1, to: 3, weight: 4 },
      { from: 2, to: 4, weight: 6 },
      { from: 2, to: 5, weight: 3 },
      { from: 3, to: 4, weight: 5 },
      { from: 4, to: 6, weight: 2 },
      { from: 5, to: 6, weight: 8 },
      { from: 3, to: 5, weight: 1 },
    );
  } else {
    edges.push(
      { from: 1, to: 2, weight: 1 },
      { from: 2, to: 3, weight: -2 },
      { from: 3, to: 4, weight: -2 },
      { from: 4, to: 2, weight: -1 },
      { from: 1, to: 5, weight: 6 },
      { from: 5, to: 3, weight: 2 },
    );
  }

  return { nodes, edges };
};

export default function FloydWarshallPage() {
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<WeightedEdge[]>([]);
  const [nextNodeId, setNextNodeId] = useState(1);
  const [algorithmState, setAlgorithmState] = useState<AlgorithmState>("idle");
  const [speed, setSpeed] = useState<SpeedLevel>("medium");
  const [steps, setSteps] = useState<FloydSnapshot[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [distances, setDistances] = useState<Record<number, Record<number, number>>>({});
  const [predecessor, setPredecessor] = useState<Record<number, Record<number, number | null>>>({});
  const [currentK, setCurrentK] = useState<number | null>(null);
  const [currentI, setCurrentI] = useState<number | null>(null);
  const [currentJ, setCurrentJ] = useState<number | null>(null);
  const [activeEdge, setActiveEdge] = useState<WeightedEdge | null>(null);
  const [updatedCell, setUpdatedCell] = useState<{ i: number; j: number } | null>(null);
  const [highlightedPathEdges, setHighlightedPathEdges] = useState<Array<{ from: number; to: number }>>([]);
  const [hasNegativeCycle, setHasNegativeCycle] = useState(false);
  const [negativeCycleNodes, setNegativeCycleNodes] = useState<number[]>([]);
  const [completionMessage, setCompletionMessage] = useState("Press Start to compute all-pairs shortest paths.");
  const [draggingNode, setDraggingNode] = useState<number | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [edgeFrom, setEdgeFrom] = useState<number | null>(null);
  const [edgeTo, setEdgeTo] = useState<number | null>(null);
  const [weightInput, setWeightInput] = useState("");
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("Click a source node, then a target node, to add a directed edge.");

  const pauseRef = useRef(false);
  const cancelRef = useRef(false);

  const isRunning = algorithmState === "running";
  const isPaused = algorithmState === "paused";
  const isLocked = isRunning || isPaused;

  const speedSleep = (ms: number) => sleep(ms * getSpeedMultiplier(speed));

  const nodeIds = useMemo(() => [...nodes].sort((a, b) => a.id - b.id).map((node) => node.id), [nodes]);
  const totalPossiblePairs = nodeIds.length * Math.max(nodeIds.length - 1, 0);
  const computedPairs = useMemo(() => {
    let count = 0;
    nodeIds.forEach((from) => {
      nodeIds.forEach((to) => {
        if (from !== to && distances[from]?.[to] !== undefined && distances[from]?.[to] !== Infinity) {
          count += 1;
        }
      });
    });
    return count;
  }, [distances, nodeIds]);

  const graphStats = useMemo(() => {
    const negativeEdges = edges.filter((edge) => edge.weight < 0).length;
    const minWeight = edges.length > 0 ? Math.min(...edges.map((edge) => edge.weight)) : 0;
    const maxWeight = edges.length > 0 ? Math.max(...edges.map((edge) => edge.weight)) : 0;
    return { negativeEdges, minWeight, maxWeight };
  }, [edges]);

  const progressPercentage = useMemo(() => {
    if (steps.length === 0) return 0;
    return Math.round((currentStepIndex / Math.max(steps.length - 1, 1)) * 100);
  }, [currentStepIndex, steps.length]);

  const displayMatrix = useMemo(() => {
    if (Object.keys(distances).length > 0) return distances;
    return createEmptyMatrix(nodes).matrix;
  }, [distances, nodes]);

  const edgeGeometryMap = useMemo(() => {
    const nodeLookup = new Map(nodes.map((node) => [node.id, node]));
    return edges
      .map((edge) => {
        const from = nodeLookup.get(edge.from);
        const to = nodeLookup.get(edge.to);
        if (!from || !to) return null;
        const geometry = getEdgeGeometry(toSvgPoint(from), toSvgPoint(to));
        if (!geometry) return null;
        return { edge, geometry };
      })
      .filter(Boolean) as Array<{ edge: WeightedEdge; geometry: EdgeGeometry }>;
  }, [edges, nodes]);

  const resetAlgorithmState = () => {
    cancelRef.current = true;
    pauseRef.current = false;
    setAlgorithmState("idle");
    setSteps([]);
    setCurrentStepIndex(0);
    setDistances({});
    setPredecessor({});
    setCurrentK(null);
    setCurrentI(null);
    setCurrentJ(null);
    setActiveEdge(null);
    setUpdatedCell(null);
    setHighlightedPathEdges([]);
    setHasNegativeCycle(false);
    setNegativeCycleNodes([]);
    setCompletionMessage("Press Start to compute all-pairs shortest paths.");
    setModalMessage("Click a source node, then a target node, to add a directed edge.");
  };

  const captureStep = (stepNumber: number, explanation: string, nextState?: Partial<FloydSnapshot>) => {
    const snapshot: FloydSnapshot = {
      stepNumber,
      explanation,
      k: currentK,
      i: currentI,
      j: currentJ,
      activeEdge,
      distances: cloneMatrix(distances),
      predecessor: clonePredecessor(predecessor),
      updatedCell,
      highlightedPathEdges: [...highlightedPathEdges],
      hasNegativeCycle,
      negativeCycleNodes: [...negativeCycleNodes],
      completionMessage,
      ...nextState,
    };

    setSteps((prev) => [...prev, snapshot]);
    setCurrentStepIndex((prev) => prev + 1);
  };

  const applySnapshot = (snapshot: FloydSnapshot) => {
    setCurrentK(snapshot.k);
    setCurrentI(snapshot.i);
    setCurrentJ(snapshot.j);
    setActiveEdge(snapshot.activeEdge);
    setDistances(snapshot.distances);
    setPredecessor(snapshot.predecessor);
    setUpdatedCell(snapshot.updatedCell);
    setHighlightedPathEdges(snapshot.highlightedPathEdges);
    setHasNegativeCycle(snapshot.hasNegativeCycle);
    setNegativeCycleNodes(snapshot.negativeCycleNodes);
    setCompletionMessage(snapshot.completionMessage);
    setModalMessage(snapshot.explanation);
  };

  const handlePreviousStep = () => {
    if (steps.length === 0 || currentStepIndex <= 0) return;
    const nextIndex = currentStepIndex - 1;
    setCurrentStepIndex(nextIndex);
    applySnapshot(steps[nextIndex]);
  };

  const handleNextStep = () => {
    if (steps.length === 0 || currentStepIndex >= steps.length - 1) return;
    const nextIndex = currentStepIndex + 1;
    setCurrentStepIndex(nextIndex);
    applySnapshot(steps[nextIndex]);
  };

  const handleAddNode = () => {
    if (isLocked) return;
    const newId = nextNodeId;
    const position = generateNodePosition(nodes.length + 1, nodes.length);
    setNodes([...nodes, { id: newId, x: position.x, y: position.y }]);
    setNextNodeId(newId + 1);
    resetAlgorithmState();
  };

  const handleDeleteNode = (id: number) => {
    if (isLocked) return;
    setNodes(nodes.filter((node) => node.id !== id));
    setEdges(edges.filter((edge) => edge.from !== id && edge.to !== id));
    if (edgeFrom === id) setEdgeFrom(null);
    if (edgeTo === id) setEdgeTo(null);
    resetAlgorithmState();
  };

  const handleDeleteEdge = (edgeIndex: number) => {
    if (isLocked) return;
    setEdges(edges.filter((_, index) => index !== edgeIndex));
    resetAlgorithmState();
  };

  const handleAddEdge = () => {
    if (edgeFrom === null || edgeTo === null || !weightInput) return;
    const weight = parseInt(weightInput, 10);
    if (Number.isNaN(weight)) return;

    setEdges([...edges, { from: edgeFrom, to: edgeTo, weight }]);
    setEdgeFrom(null);
    setEdgeTo(null);
    setWeightInput("");
    setShowWeightModal(false);
    resetAlgorithmState();
  };

  const handleNodeClick = (nodeId: number, event: React.MouseEvent) => {
    event.stopPropagation();
    if (isLocked) return;

    if (edgeFrom === null) {
      setEdgeFrom(nodeId);
      setModalMessage(`Selected source node ${nodeId}. Pick a target node next.`);
      return;
    }

    if (edgeFrom === nodeId) {
      setEdgeFrom(null);
      setEdgeTo(null);
      setModalMessage("Source selection cleared.");
      return;
    }

    setEdgeTo(nodeId);
    setWeightInput("");
    setShowWeightModal(true);
  };

  const handleSvgMouseDown = (event: React.MouseEvent<SVGSVGElement>) => {
    if (isLocked) return;
    const svg = event.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    for (const node of nodes) {
      const dx = x - node.x;
      const dy = y - node.y;
      if (Math.hypot(dx, dy) <= 28) {
        setDraggingNode(node.id);
        setDragStart({ x: dx, y: dy });
        return;
      }
    }
  };

  const handleSvgMouseMove = (event: React.MouseEvent<SVGSVGElement>) => {
    if (draggingNode === null || isLocked) return;
    const svg = event.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    setNodes((prev) =>
      prev.map((node) =>
        node.id === draggingNode
          ? {
              ...node,
              x: Math.max(6, Math.min(94, x - dragStart.x)),
              y: Math.max(8, Math.min(92, y - dragStart.y)),
            }
          : node,
      ),
    );
  };

  const handleSvgMouseUp = () => {
    if (draggingNode !== null) {
      setDraggingNode(null);
    }
  };

  const generateGraph = (nodeCount = 6) => {
    if (isLocked) return;

    const newNodes: GraphNode[] = [];
    for (let i = 0; i < nodeCount; i += 1) {
      const position = generateNodePosition(nodeCount, i);
      newNodes.push({ id: i + 1, x: position.x, y: position.y });
    }

    const newEdges: WeightedEdge[] = [];
    const edgeTarget = Math.max(nodeCount + 2, Math.floor(nodeCount * 1.6));

    for (let fromIndex = 0; fromIndex < nodeCount; fromIndex += 1) {
      for (let toIndex = fromIndex + 1; toIndex < nodeCount; toIndex += 1) {
        if (newEdges.length >= edgeTarget) break;
        if (Math.random() < 0.45) {
          const from = newNodes[fromIndex].id;
          const to = newNodes[toIndex].id;
          const weight = Math.floor(Math.random() * 13) - 4;
          newEdges.push({ from, to, weight });
        }
      }
    }

    if (newEdges.length === 0 && newNodes.length > 1) {
      newEdges.push({ from: 1, to: 2, weight: 3 });
    }

    setNodes(newNodes);
    setEdges(newEdges);
    setNextNodeId(nodeCount + 1);
    setEdgeFrom(null);
    setEdgeTo(null);
    setWeightInput("");
    setShowWeightModal(false);
    resetAlgorithmState();
    setModalMessage("Generated a directed graph with possible negative weights and no cycles.");
  };

  const applyPreset = (preset: "sparse" | "dense" | "weighted" | "negative") => {
    if (isLocked) return;

    const presetGraph = buildPresetGraph(preset);
    setNodes(presetGraph.nodes);
    setEdges(presetGraph.edges);
    setNextNodeId(presetGraph.nodes.length + 1);
    setEdgeFrom(null);
    setEdgeTo(null);
    setWeightInput("");
    setShowWeightModal(false);
    resetAlgorithmState();

    const presetLabel =
      preset === "sparse"
        ? "Sparse graph"
        : preset === "dense"
          ? "Dense graph"
          : preset === "weighted"
            ? "Weighted graph"
            : "Negative edge graph";
    setModalMessage(`${presetLabel} loaded. Press Start to animate the dynamic programming sweep.`);
  };

  const handleReset = () => {
    pauseRef.current = false;
    cancelRef.current = true;
    setAlgorithmState("idle");
    resetAlgorithmState();
    cancelRef.current = false;
  };

  const runFloydWarshall = async () => {
    if (nodes.length === 0) return;

    pauseRef.current = false;
    cancelRef.current = false;

    setAlgorithmState("running");
    setSteps([]);
    setCurrentStepIndex(0);
    setCurrentK(null);
    setCurrentI(null);
    setCurrentJ(null);
    setActiveEdge(null);
    setUpdatedCell(null);
    setHighlightedPathEdges([]);

    const { matrix: initialMatrix, predecessor: initialPredecessor } = buildMatrixFromEdges(nodes, edges);
    let workingDistances = cloneMatrix(initialMatrix);
    let workingPredecessor = clonePredecessor(initialPredecessor);

    setDistances(workingDistances);
    setPredecessor(workingPredecessor);

    let stepNumber = 0;
    captureStep(stepNumber, "Matrix initialized from the directed edge list.", {
      k: null,
      i: null,
      j: null,
      activeEdge: null,
      updatedCell: null,
      distances: cloneMatrix(workingDistances),
      predecessor: clonePredecessor(workingPredecessor),
      highlightedPathEdges: [],
    });

    for (const k of nodeIds) {
      if (cancelRef.current) return;

      setCurrentK(k);
      setCurrentI(null);
      setCurrentJ(null);
      setActiveEdge(null);
      setUpdatedCell(null);
      setHighlightedPathEdges([]);
      stepNumber += 1;
      captureStep(stepNumber, `Animating iteration for intermediate node ${k}.`, {
        k,
        i: null,
        j: null,
        activeEdge: null,
        updatedCell: null,
        distances: cloneMatrix(workingDistances),
        predecessor: clonePredecessor(workingPredecessor),
        highlightedPathEdges: [],
      });
      await speedSleep(450);

      for (const i of nodeIds) {
        for (const j of nodeIds) {
          if (cancelRef.current) return;

          while (pauseRef.current) {
            await sleep(120);
            if (cancelRef.current) return;
          }

          const viaIK = workingDistances[i][k];
          const viaKJ = workingDistances[k][j];
          const edgeToK = edges.find((edge) => edge.from === i && edge.to === k) ?? null;
          const edgeFromK = edges.find((edge) => edge.from === k && edge.to === j) ?? null;

          setCurrentI(i);
          setCurrentJ(j);
          setActiveEdge(edgeToK ?? edgeFromK);
          setUpdatedCell(null);
          setHighlightedPathEdges([]);

          if (viaIK === Infinity || viaKJ === Infinity) {
            stepNumber += 1;
            captureStep(stepNumber, `Checking path ${i} → ${k} → ${j}. Keeping existing distance for ${i} → ${j}.`, {
              k,
              i,
              j,
              activeEdge: edgeToK ?? edgeFromK,
              updatedCell: null,
              distances: cloneMatrix(workingDistances),
              predecessor: clonePredecessor(workingPredecessor),
              highlightedPathEdges: [],
            });
            await speedSleep(220);
            continue;
          }

          const candidate = viaIK + viaKJ;
          stepNumber += 1;
          captureStep(stepNumber, `Checking path ${i} → ${k} → ${j}.`, {
            k,
            i,
            j,
            activeEdge: edgeToK ?? edgeFromK,
            updatedCell: null,
            distances: cloneMatrix(workingDistances),
            predecessor: clonePredecessor(workingPredecessor),
            highlightedPathEdges: [],
          });
          await speedSleep(260);

          if (candidate < workingDistances[i][j]) {
            workingDistances = cloneMatrix(workingDistances);
            workingPredecessor = clonePredecessor(workingPredecessor);
            workingDistances[i][j] = candidate;
            workingPredecessor[i][j] = workingPredecessor[k][j] ?? k;
            const updatedPathEdges = reconstructPathEdges(i, j, workingPredecessor);
            setDistances(workingDistances);
            setPredecessor(workingPredecessor);
            setUpdatedCell({ i, j });
            setHighlightedPathEdges(updatedPathEdges);
            stepNumber += 1;
            captureStep(stepNumber, `Updating shortest distance for ${i} → ${j} through ${k}.`, {
              k,
              i,
              j,
              activeEdge: edgeToK ?? edgeFromK,
              updatedCell: { i, j },
              distances: cloneMatrix(workingDistances),
              predecessor: clonePredecessor(workingPredecessor),
              highlightedPathEdges: updatedPathEdges,
            });
            await speedSleep(300);
          } else {
            stepNumber += 1;
            captureStep(stepNumber, `Checking path ${i} → ${k} → ${j}. Keeping existing distance for ${i} → ${j}.`, {
              k,
              i,
              j,
              activeEdge: edgeToK ?? edgeFromK,
              updatedCell: null,
              distances: cloneMatrix(workingDistances),
              predecessor: clonePredecessor(workingPredecessor),
              highlightedPathEdges: [],
            });
            await speedSleep(220);
          }
        }
      }
    }

    setCurrentK(null);
    setCurrentI(null);
    setCurrentJ(null);
    setActiveEdge(null);
    setUpdatedCell(null);
    setHighlightedPathEdges([]);
    setAlgorithmState("completed");
    const finalNegativeCycleNodes = detectNegativeCycleNodes(nodes, workingDistances);
    const finalHasNegativeCycle = finalNegativeCycleNodes.length > 0;
    const finalMessage = finalHasNegativeCycle
      ? "Negative Cycle Detected."
      : "Floyd-Warshall finished computing all-pairs shortest paths.";

    setHasNegativeCycle(finalHasNegativeCycle);
    setNegativeCycleNodes(finalNegativeCycleNodes);
    setCompletionMessage(finalMessage);
    if (finalHasNegativeCycle) {
      setModalMessage(finalMessage);
    }

    stepNumber += 1;
    captureStep(stepNumber, finalMessage, {
      k: null,
      i: null,
      j: null,
      activeEdge: null,
      updatedCell: null,
      distances: cloneMatrix(workingDistances),
      predecessor: clonePredecessor(workingPredecessor),
      highlightedPathEdges: [],
      hasNegativeCycle: finalHasNegativeCycle,
      negativeCycleNodes: finalNegativeCycleNodes,
      completionMessage: finalMessage,
    });
  };

  const handleStart = async () => {
    if (nodes.length === 0 || isRunning) return;
    await runFloydWarshall();
  };

  const handlePause = () => {
    if (!isRunning) return;
    pauseRef.current = true;
    setAlgorithmState("paused");
  };

  const handleResume = () => {
    if (!isPaused) return;
    pauseRef.current = false;
    setAlgorithmState("running");
  };

  const highlightedPathEdgeSet = useMemo(
    () => new Set(highlightedPathEdges.map((edge) => `${edge.from}-${edge.to}`)),
    [highlightedPathEdges],
  );

  const negativeCycleNodeSet = useMemo(() => new Set(negativeCycleNodes), [negativeCycleNodes]);

  const matrixTimeline = useMemo(
    () => steps.slice(Math.max(0, steps.length - 12)),
    [steps],
  );

  useEffect(() => {
    return () => {
      cancelRef.current = true;
      pauseRef.current = false;
    };
  }, []);

  return (
    <main className="min-h-screen bg-[#F1E8C7] px-4 py-8 text-[#4B5320] sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl space-y-6">
        <div className="flex items-center justify-between gap-3">
          <Link href="/graphs" className="inline-flex items-center text-sm font-medium text-[#556B2F] hover:text-[#4B5320]">
            &larr; Back to graphs
          </Link>
          <span className="rounded-full border border-[#D8CCA3] bg-[#F7F1DD]/90 px-3 py-1 text-xs font-medium text-[#556B2F] shadow-sm">
            Floyd-Warshall · O(V³)
          </span>
        </div>

        <section className="rounded-[2rem] border border-[#D8CCA3] bg-[#F7F1DD]/95 p-6 shadow-[0_16px_40px_rgba(15,23,42,0.08)] sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#AAB76A]/50 bg-[#F1E8C7] px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[#556B2F]">
                <Layers className="h-3.5 w-3.5" />
                Graph Visualizer
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-[#4B5320] sm:text-4xl lg:text-5xl">
                Floyd-Warshall Algorithm Visualizer
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-[#556B2F] sm:text-base">
                Visualize all-pairs shortest path computation using Dynamic Programming.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:w-[28rem]">
              <div className="rounded-2xl border border-[#D8CCA3] bg-[#F1E8C7]/60 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-[#7A8650]">Status</p>
                <p className="mt-1 text-lg font-semibold text-[#4B5320]">{algorithmState.toUpperCase()}</p>
              </div>
              <div className="rounded-2xl border border-[#D8CCA3] bg-[#F1E8C7]/60 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-[#7A8650]">Matrix Pairs</p>
                <p className="mt-1 text-lg font-semibold text-[#4B5320]">{computedPairs}/{totalPossiblePairs || 1}</p>
              </div>
              <div className="rounded-2xl border border-[#D8CCA3] bg-[#F1E8C7]/60 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-[#7A8650]">Progress</p>
                <p className="mt-1 text-lg font-semibold text-[#4B5320]">{progressPercentage}%</p>
              </div>
            </div>
            <p className="mt-4 text-sm text-[#556B2F]">Time Complexity: <span className="font-semibold text-[#4B5320]">O(V³)</span></p>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
          <div className="rounded-[2rem] border border-[#D8CCA3] bg-[#F7F1DD]/95 p-5 shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-[#4B5320]">Graph Canvas</h2>
                <p className="text-sm text-[#556B2F]">Directed edges, draggable nodes, and dynamic programming updates.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleAddNode}
                  disabled={isLocked}
                  className="inline-flex items-center gap-2 rounded-2xl border border-[#D8CCA3] bg-white px-3.5 py-2 text-sm font-medium text-[#4B5320] shadow-sm transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Plus className="h-4 w-4" />
                  Add Node
                </button>
                <button
                  onClick={() => generateGraph(7)}
                  disabled={isLocked}
                  className="inline-flex items-center gap-2 rounded-2xl border border-[#AAB76A]/70 bg-[#4B5320] px-3.5 py-2 text-sm font-medium text-[#F7F1DD] shadow-sm transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Shuffle className="h-4 w-4" />
                  Generate Random Graph
                </button>
                <button
                  onClick={handleReset}
                  className="inline-flex items-center gap-2 rounded-2xl border border-[#D8CCA3] bg-[#F1E8C7] px-3.5 py-2 text-sm font-medium text-[#4B5320] shadow-sm transition hover:-translate-y-0.5"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset
                </button>
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                {[
                  { label: "Sparse graph", value: "sparse" },
                  { label: "Dense graph", value: "dense" },
                  { label: "Weighted graph", value: "weighted" },
                  { label: "Negative edge graph", value: "negative" },
                ].map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() => applyPreset(preset.value as "sparse" | "dense" | "weighted" | "negative")}
                    disabled={isLocked}
                    className="rounded-full border border-[#D8CCA3] bg-white px-3 py-1.5 text-xs font-medium text-[#556B2F] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[1.75rem] border border-[#D8CCA3] bg-[radial-gradient(circle_at_top,#fbf7ea_0%,#f7f1dd_45%,#f1e8c7_100%)]">
              <svg
                viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
                className="h-[460px] w-full cursor-crosshair"
                onMouseDown={handleSvgMouseDown}
                onMouseMove={handleSvgMouseMove}
                onMouseUp={handleSvgMouseUp}
                onMouseLeave={handleSvgMouseUp}
              >
                <defs>
                  <linearGradient id="fwEdgeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#7A8650" />
                    <stop offset="100%" stopColor="#4B5320" />
                  </linearGradient>
                  <linearGradient id="fwActiveGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#F59E0B" />
                    <stop offset="100%" stopColor="#B45309" />
                  </linearGradient>
                  <filter id="fwGlow">
                    <feGaussianBlur stdDeviation="4" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {edgeGeometryMap.map(({ edge, geometry }) => {
                  const isActive = activeEdge?.from === edge.from && activeEdge?.to === edge.to;
                  const isShortestPathEdge = highlightedPathEdgeSet.has(`${edge.from}-${edge.to}`);
                  return (
                    <g key={`${edge.from}-${edge.to}-${edge.weight}`}>
                      <path
                        d={geometry.path}
                        fill="none"
                        stroke={isActive ? GRAPH_COLORS.edge.active : isShortestPathEdge ? GRAPH_COLORS.edge.shortestPath : GRAPH_COLORS.edge.normal}
                        strokeWidth={isActive ? EDGE_STROKE_WIDTH_ACTIVE : isShortestPathEdge ? EDGE_STROKE_WIDTH_PATH : EDGE_STROKE_WIDTH}
                        opacity={isActive || isShortestPathEdge ? 1 : 0.72}
                        filter={isActive || isShortestPathEdge ? "url(#fwGlow)" : undefined}
                      />
                      <polygon
                        points={geometry.arrowPoints}
                        fill={isActive ? GRAPH_COLORS.edge.active : isShortestPathEdge ? GRAPH_COLORS.edge.shortestPath : GRAPH_COLORS.edge.normal}
                        opacity={isActive || isShortestPathEdge ? 1 : 0.88}
                      />
                      <rect
                        x={geometry.label.x - 13}
                        y={geometry.label.y - 11}
                        width={26}
                        height={22}
                        rx={8}
                        fill={isShortestPathEdge ? "#ecfdf5" : GRAPH_COLORS.node.default.fill}
                        stroke={isActive ? GRAPH_COLORS.edge.selected : isShortestPathEdge ? GRAPH_COLORS.edge.shortestPath : GRAPH_COLORS.node.default.stroke}
                      />
                      <text
                        x={geometry.label.x}
                        y={geometry.label.y + 4}
                        textAnchor="middle"
                        className="fill-[#4B5320] text-[11px] font-semibold"
                      >
                        {edge.weight}
                      </text>
                      <button
                        type="button"
                        aria-label={`Delete edge ${edge.from} to ${edge.to}`}
                        onClick={() => handleDeleteEdge(edges.findIndex((candidate) => candidate === edge))}
                        className="hidden"
                      />
                    </g>
                  );
                })}

                {nodes.map((node) => {
                  const isCurrentK = currentK === node.id;
                  const isCurrentI = currentI === node.id;
                  const isCurrentJ = currentJ === node.id;
                  const isUpdated = updatedCell?.i === node.id || updatedCell?.j === node.id;
                  const isNegativeCycleNode = negativeCycleNodeSet.has(node.id);
                  const point = toSvgPoint(node);
                  return (
                    <g key={node.id} onMouseDown={(event) => handleNodeClick(node.id, event)}>
                      <motion.circle
                        cx={point.x}
                        cy={point.y}
                        r={isNegativeCycleNode ? NODE_RADIUS + 7 : isCurrentK ? NODE_RADIUS + 3 : isCurrentI || isCurrentJ ? NODE_RADIUS : NODE_RADIUS - 2}
                        fill={isNegativeCycleNode ? GRAPH_COLORS.node.current.fill : isCurrentK ? GRAPH_COLORS.node.completed.fill : isCurrentI || isCurrentJ ? GRAPH_COLORS.node.current.fill : GRAPH_COLORS.node.default.fill}
                        stroke={isNegativeCycleNode ? GRAPH_COLORS.edge.cycle : isUpdated ? GRAPH_COLORS.edge.selected : GRAPH_COLORS.node.current.stroke}
                        strokeWidth={isNegativeCycleNode ? EDGE_STROKE_WIDTH_ACTIVE : isCurrentK ? EDGE_STROKE_WIDTH_ACTIVE : EDGE_STROKE_WIDTH}
                        filter={isUpdated || isNegativeCycleNode ? "url(#fwGlow)" : undefined}
                        animate={{ scale: isNegativeCycleNode ? [1, 1.08, 1] : isCurrentK ? 1.08 : 1 }}
                        transition={{ duration: isNegativeCycleNode ? 1.2 : 0.25, repeat: isNegativeCycleNode ? Infinity : 0 }}
                      />
                      <text
                        x={point.x}
                        y={point.y + 5}
                        textAnchor="middle"
                        className={`text-sm font-bold ${isCurrentK || isCurrentI || isCurrentJ ? "fill-[#F7F1DD]" : "fill-[#4B5320]"}`}
                      >
                        {node.id}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          <aside className="space-y-4 rounded-[2rem] border border-[#D8CCA3] bg-[#F7F1DD]/95 p-5 shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
            <div className="rounded-3xl border border-[#D8CCA3] bg-[#F1E8C7]/70 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-[#7A8650]">Live Algorithm Panel</p>
                  <h3 className="mt-1 text-lg font-semibold text-[#4B5320]">Dynamic Programming Sweep</h3>
                </div>
                <span className="rounded-full border border-[#D8CCA3] bg-white px-3 py-1 text-xs font-medium text-[#556B2F]">{algorithmState}</span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <button
                  onClick={handleStart}
                  disabled={isRunning}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#4B5320] px-3.5 py-2.5 text-sm font-medium text-[#F7F1DD] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Play className="h-4 w-4" />
                  Start
                </button>
                <button
                  onClick={handlePause}
                  disabled={!isRunning}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#D8CCA3] bg-white px-3.5 py-2.5 text-sm font-medium text-[#4B5320] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Pause className="h-4 w-4" />
                  Pause
                </button>
                <button
                  onClick={handleResume}
                  disabled={!isPaused}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#D8CCA3] bg-white px-3.5 py-2.5 text-sm font-medium text-[#4B5320] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Zap className="h-4 w-4" />
                  Resume
                </button>
                <button
                  onClick={handleReset}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#D8CCA3] bg-white px-3.5 py-2.5 text-sm font-medium text-[#4B5320] transition hover:-translate-y-0.5"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset
                </button>
              </div>

              <div className="mt-4 space-y-3 rounded-2xl border border-[#D8CCA3] bg-[#F7F1DD] p-4 text-sm text-[#556B2F]">
                <div className="flex items-center justify-between gap-3">
                  <span>Speed</span>
                  <span className="font-medium capitalize text-[#4B5320]">{speed}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="1"
                  value={speed === "slow" ? 0 : speed === "medium" ? 1 : 2}
                  onChange={(event) => setSpeed(event.target.value === "0" ? "slow" : event.target.value === "1" ? "medium" : "fast")}
                  className="w-full accent-[#4B5320]"
                />
                <div className="grid grid-cols-3 gap-2 text-xs uppercase tracking-[0.16em] text-[#7A8650]">
                  <span className="rounded-xl border border-[#D8CCA3] bg-white px-2 py-1 text-center">Slow</span>
                  <span className="rounded-xl border border-[#D8CCA3] bg-white px-2 py-1 text-center">Medium</span>
                  <span className="rounded-xl border border-[#D8CCA3] bg-white px-2 py-1 text-center">Fast</span>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-[#D8CCA3] bg-[#F1E8C7]/70 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-[#7A8650]">Graph Statistics</p>
                  <h3 className="mt-1 text-lg font-semibold text-[#4B5320]">Current Graph</h3>
                </div>
                <Download className="h-4 w-4 text-[#7A8650]" />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-[#556B2F]">
                <div className="rounded-2xl border border-[#D8CCA3] bg-[#F7F1DD] p-3">
                  <p className="text-xs uppercase tracking-[0.18em]">Nodes</p>
                  <p className="mt-1 text-xl font-semibold text-[#4B5320]">{nodes.length}</p>
                </div>
                <div className="rounded-2xl border border-[#D8CCA3] bg-[#F7F1DD] p-3">
                  <p className="text-xs uppercase tracking-[0.18em]">Edges</p>
                  <p className="mt-1 text-xl font-semibold text-[#4B5320]">{edges.length}</p>
                </div>
                <div className="rounded-2xl border border-[#D8CCA3] bg-[#F7F1DD] p-3">
                  <p className="text-xs uppercase tracking-[0.18em]">Negative Edges</p>
                  <p className="mt-1 text-xl font-semibold text-[#4B5320]">{graphStats.negativeEdges}</p>
                </div>
                <div className="rounded-2xl border border-[#D8CCA3] bg-[#F7F1DD] p-3">
                  <p className="text-xs uppercase tracking-[0.18em]">Weights</p>
                  <p className="mt-1 text-xl font-semibold text-[#4B5320]">{graphStats.minWeight} to {graphStats.maxWeight}</p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-[#D8CCA3] bg-[#F1E8C7]/70 p-4">
              <div className="flex items-center gap-2 text-[#4B5320]">
                <BookOpen className="h-4 w-4" />
                <h3 className="text-lg font-semibold">Live Notes</h3>
              </div>
              <p className="mt-3 text-sm leading-6 text-[#556B2F]">{modalMessage}</p>
              <div className="mt-4 rounded-2xl border border-[#D8CCA3] bg-[#F7F1DD] p-3 text-sm text-[#4B5320]">
                <p className="font-medium">Current Step</p>
                <p className="mt-1 text-[#556B2F]">{steps[currentStepIndex]?.explanation ?? "Press Start to animate the dynamic programming sweep."}</p>
              </div>
            </div>
          </aside>
        </section>

        <section className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
          {[
            {
              title: "All-Pairs Matrix",
              value: `${nodeIds.length} × ${nodeIds.length}`,
              description: "Distance table updated in place after every intermediate vertex.",
              icon: Layers,
            },
            {
              title: "Dynamic Programming",
              value: `k = ${currentK ?? "-"}`,
              description: "Each vertex becomes an allowed intermediate in order.",
              icon: Zap,
            },
            {
              title: "Directed Weights",
              value: graphStats.negativeEdges > 0 ? "Negative edges enabled" : "Positive and negative weights",
              description: "The visualizer supports directed edges with negative weights.",
              icon: ArrowRight,
            },
            {
              title: "Timeline",
              value: `${steps.length} snapshots`,
              description: "Replay matrix updates with step navigation.",
              icon: BookOpen,
            },
          ].map((card) => {
            const Icon = card.icon;
            return (
              <motion.article
                key={card.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-[1.75rem] border border-[#D8CCA3] bg-[#F7F1DD]/95 p-4 shadow-[0_12px_24px_rgba(15,23,42,0.06)]"
              >
                <div className="flex items-center justify-between">
                  <div className="rounded-2xl bg-[#4B5320] p-2 text-[#F7F1DD]"><Icon className="h-4 w-4" /></div>
                  <span className="text-xs uppercase tracking-[0.18em] text-[#7A8650]">Premium</span>
                </div>
                <h3 className="mt-3 text-base font-semibold text-[#4B5320]">{card.title}</h3>
                <p className="mt-1 text-xl font-bold text-[#556B2F]">{card.value}</p>
                <p className="mt-2 text-sm leading-6 text-[#556B2F]">{card.description}</p>
              </motion.article>
            );
          })}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[2rem] border border-[#D8CCA3] bg-[#F7F1DD]/95 p-5 shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-[#4B5320]">Distance Matrix</h2>
                <p className="text-sm text-[#556B2F]">Current shortest distances between every ordered pair of nodes.</p>
              </div>
              <div className="flex items-center gap-2 text-sm text-[#556B2F]">
                <span className="rounded-full border border-[#D8CCA3] bg-white px-3 py-1">Step {currentStepIndex + 1} / {Math.max(steps.length, 1)}</span>
              </div>
            </div>

            <div className="mt-4 overflow-x-auto rounded-[1.5rem] border border-[#D8CCA3] bg-[#F1E8C7]/70 p-3">
              <table className="min-w-full border-separate border-spacing-2 text-sm">
                <thead>
                  <tr>
                    <th className="rounded-xl px-3 py-2 text-left text-xs uppercase tracking-[0.18em] text-[#7A8650]">From / To</th>
                    {nodeIds.map((id) => (
                      <th key={id} className="rounded-xl px-3 py-2 text-center text-xs uppercase tracking-[0.18em] text-[#7A8650]">{id}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {nodeIds.map((rowId) => (
                    <tr key={rowId}>
                      <th className={`rounded-xl border px-3 py-2 text-left text-sm font-semibold transition ${currentI === rowId ? "border-[#F59E0B] bg-[#FEF3C7] text-[#92400E]" : "border-[#D8CCA3] bg-white text-[#4B5320]"}`}>
                        {rowId}
                      </th>
                      {nodeIds.map((colId) => {
                        const value = displayMatrix[rowId]?.[colId];
                        const isActiveCell = currentI === rowId && currentJ === colId;
                        const isCurrentRow = currentI === rowId;
                        const isCurrentColumn = currentJ === colId;
                        const isDiagonal = rowId === colId;
                        return (
                          <td
                            key={colId}
                            className={`rounded-xl border px-3 py-2 text-center font-medium transition ${
                              isActiveCell
                                ? "border-[#F59E0B] bg-[#FEF3C7] text-[#92400E]"
                                : isCurrentRow && isCurrentColumn
                                  ? "border-[#fbbf24] bg-[#fff7ed] text-[#92400E]"
                                  : isCurrentRow
                                    ? "border-[#fbbf24] bg-[#fef9c3] text-[#92400E]"
                                    : isCurrentColumn
                                      ? "border-[#86efac] bg-[#ecfdf5] text-[#166534]"
                                : isDiagonal
                                  ? "border-[#AAB76A] bg-[#EEF4D2] text-[#4B5320]"
                                  : "border-[#D8CCA3] bg-white text-[#556B2F]"
                            }`}
                          >
                            {value === Infinity ? "∞" : value}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-4 rounded-[2rem] border border-[#D8CCA3] bg-[#F7F1DD]/95 p-5 shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-[#4B5320]">Algorithm Panel</h2>
                <p className="text-sm text-[#556B2F]">Track the current intermediate vertex and path relaxation decisions.</p>
              </div>
              <div className="flex gap-2">
                <button onClick={handlePreviousStep} className="rounded-2xl border border-[#D8CCA3] bg-white p-2 text-[#4B5320] transition hover:-translate-y-0.5">
                  <SkipBack className="h-4 w-4" />
                </button>
                <button onClick={handleNextStep} className="rounded-2xl border border-[#D8CCA3] bg-white p-2 text-[#4B5320] transition hover:-translate-y-0.5">
                  <SkipForward className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="rounded-3xl border border-[#D8CCA3] bg-[#F1E8C7]/70 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-[#7A8650]">Step Summary</p>
              <p className="mt-2 text-sm leading-6 text-[#556B2F]">
                {steps[currentStepIndex]?.explanation ?? "Press Start to animate the dynamic programming sweep."}
              </p>
              <p className="mt-2 text-xs uppercase tracking-[0.18em] text-[#7A8650]">Current iteration: k = {currentK ?? "-"}</p>
            </div>

            <div className="rounded-3xl border border-[#D8CCA3] bg-[#F1E8C7]/70 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-[#7A8650]">Matrix Timeline</p>
                  <h3 className="mt-1 text-lg font-semibold text-[#4B5320]">Recent Steps</h3>
                </div>
                <span className="rounded-full border border-[#D8CCA3] bg-white px-3 py-1 text-xs font-medium text-[#556B2F]">
                  {steps.length} steps
                </span>
              </div>
              <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
                {matrixTimeline.map((step, index) => {
                  const absoluteIndex = Math.max(0, steps.length - matrixTimeline.length) + index;
                  const isActive = absoluteIndex === currentStepIndex;
                  return (
                    <button
                      key={`${step.stepNumber}-${step.explanation}`}
                      onClick={() => {
                        setCurrentStepIndex(absoluteIndex);
                        applySnapshot(step);
                      }}
                      className={`min-w-[9rem] rounded-2xl border px-3 py-2 text-left text-xs transition ${
                        isActive
                          ? "border-[#F59E0B] bg-[#FEF3C7] text-[#92400E]"
                          : "border-[#D8CCA3] bg-white text-[#556B2F] hover:-translate-y-0.5"
                      }`}
                    >
                      <p className="font-semibold">Step {step.stepNumber}</p>
                      <p className="mt-1 line-clamp-3 leading-5">{step.explanation}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-[#D8CCA3] bg-[#F1E8C7]/70 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[#7A8650]">Current k</p>
                <p className="mt-1 text-2xl font-bold text-[#4B5320]">{currentK ?? "-"}</p>
              </div>
              <div className="rounded-2xl border border-[#D8CCA3] bg-[#F1E8C7]/70 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[#7A8650]">Updated Cell</p>
                <p className="mt-1 text-2xl font-bold text-[#4B5320]">{updatedCell ? `${updatedCell.i}, ${updatedCell.j}` : "-"}</p>
              </div>
            </div>

            <div className="rounded-3xl border border-[#D8CCA3] bg-[#F1E8C7]/70 p-4">
              <div className="flex items-center gap-2 text-[#4B5320]">
                <AlertTriangle className="h-4 w-4" />
                <h3 className="text-lg font-semibold">Design Notes</h3>
              </div>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-[#556B2F]">
                <li>Directed weighted graphs support negative edge weights.</li>
                <li>Random generation uses one-way edges to avoid negative cycles.</li>
                <li>Drag nodes to reposition the visualization before running.</li>
              </ul>
            </div>

            {hasNegativeCycle ? (
              <div className="rounded-3xl border border-red-300 bg-red-50 p-4 text-red-800">
                <p className="text-sm font-semibold">Negative Cycle Detected.</p>
                <p className="mt-1 text-sm">Affected nodes are highlighted on the graph and the final matrix contains a negative diagonal entry.</p>
              </div>
            ) : null}
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            {
              title: "Dynamic Programming",
              description: "Allow one more intermediate vertex in every sweep.",
            },
            {
              title: "Negative Edges",
              description: "Costs may be negative, as long as the graph has no negative cycles.",
            },
            {
              title: "All Pairs",
              description: "The matrix stores shortest distances for every source-target pair.",
            },
            {
              title: "Premium Layout",
              description: "Matches the established graph-module shell, cards, and canvas styling.",
            },
          ].map((item) => (
            <article key={item.title} className="rounded-[1.5rem] border border-[#D8CCA3] bg-[#F7F1DD]/95 p-4 shadow-[0_12px_24px_rgba(15,23,42,0.06)]">
              <h3 className="text-base font-semibold text-[#4B5320]">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-[#556B2F]">{item.description}</p>
            </article>
          ))}
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {[
            {
              title: "Dynamic Programming Concept",
              description: "Each pass allows a new intermediate vertex to participate in shortest-path updates.",
            },
            {
              title: "Floyd-Warshall Explained",
              description: "The algorithm computes the best distance for every ordered pair in a single cubic sweep.",
            },
            {
              title: "Time Complexity",
              description: "The runtime is O(V³), which is practical for dense graphs and all-pairs queries.",
            },
            {
              title: "Floyd-Warshall vs Dijkstra",
              description: "Dijkstra is single-source and requires non-negative edges; Floyd-Warshall handles all pairs.",
            },
            {
              title: "Floyd-Warshall vs Bellman-Ford",
              description: "Bellman-Ford is single-source and detects negative cycles; Floyd-Warshall generalizes to all pairs.",
            },
          ].map((card, index) => (
            <motion.article
              key={card.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="rounded-[1.5rem] border border-[#D8CCA3] bg-[#F7F1DD]/95 p-4 shadow-[0_12px_24px_rgba(15,23,42,0.06)]"
            >
              <div className="flex items-center gap-2 text-[#4B5320]">
                <Layers className="h-4 w-4" />
                <h3 className="text-base font-semibold">{card.title}</h3>
              </div>
              <p className="mt-2 text-sm leading-6 text-[#556B2F]">{card.description}</p>
            </motion.article>
          ))}
        </section>

        <AnimatePresence>
          {showWeightModal ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-[#1f2a12]/40 px-4"
            >
              <div className="w-full max-w-md rounded-[1.75rem] border border-[#D8CCA3] bg-[#F7F1DD] p-5 shadow-[0_24px_60px_rgba(15,23,42,0.18)]">
                <h3 className="text-lg font-semibold text-[#4B5320]">Add Edge Weight</h3>
                <p className="mt-1 text-sm text-[#556B2F]">Create a directed edge with a positive or negative weight.</p>
                <input
                  type="number"
                  value={weightInput}
                  onChange={(event) => setWeightInput(event.target.value)}
                  className="mt-4 w-full rounded-2xl border border-[#D8CCA3] bg-white px-4 py-3 text-[#4B5320] outline-none focus:border-[#4B5320]"
                  placeholder="Enter weight"
                />
                <div className="mt-4 flex justify-end gap-2">
                  <button
                    onClick={() => setShowWeightModal(false)}
                    className="rounded-2xl border border-[#D8CCA3] bg-white px-4 py-2 text-sm font-medium text-[#4B5320]"
                  >
                    Cancel
                  </button>
                  <button onClick={handleAddEdge} className="rounded-2xl bg-[#4B5320] px-4 py-2 text-sm font-medium text-[#F7F1DD]">
                    Add Edge
                  </button>
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </main>
  );
}