"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle, Info, Pause, Play, Plus, RotateCcw, Shuffle, Trash2, Zap, Download, AlertTriangle, Activity, Layers, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { GRAPH_COLORS, NODE_RADIUS, EDGE_STROKE_WIDTH, EDGE_STROKE_WIDTH_ACTIVE, generateNodePosition } from "@/components/graph-engine";

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

type VisualizationStep = {
  explanation: string;
  type?: "init" | "select" | "relax" | "skip" | "complete" | "cycle";
  timestamp: number;
};

type TimelineSnapshot = {
  stepNumber: number;
  explanation: string;
  currentNode: number | null;
  activeEdge: WeightedEdge | null;
  relaxingEdge: WeightedEdge | null;
  updatedNode: number | null;
  processedEdges: string[];
  relaxationCounter: number;
  iteration: number;
  distances: Record<number, number>;
  previousNodes: Record<number, number | null>;
  completionMessage: string;
  hasNegativeCycle: boolean;
  cycleNodes: number[];
  cycleEdges: WeightedEdge[];
};

const NODE_RADIUS_LOCAL = NODE_RADIUS;
const ARROW_GAP = 6;
const ARROW_LENGTH = 14;
const ARROW_WIDTH = 11;

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

const getNegativeCycleNodes = (previousNodes: Record<number, number | null>, startNode: number, nodeCount: number) => {
  let current = startNode;

  for (let i = 0; i < nodeCount; i += 1) {
    const parent = previousNodes[current];
    if (parent === null || parent === undefined) break;
    current = parent;
  }

  const cycleNodes: number[] = [];
  const seen = new Set<number>();
  let walker: number | null = current;

  while (walker !== null && !seen.has(walker)) {
    seen.add(walker);
    cycleNodes.unshift(walker);
    walker = previousNodes[walker] ?? null;
  }

  if (walker !== null) {
    cycleNodes.unshift(walker);
  }

  return Array.from(new Set(cycleNodes)).reverse();
};

const hasDirectedNegativeCycle = (nodes: GraphNode[], edges: WeightedEdge[]) => {
  const dist: Record<number, number> = {};
  nodes.forEach((node) => {
    dist[node.id] = 0;
  });

  for (let i = 0; i < Math.max(nodes.length - 1, 0); i += 1) {
    let updated = false;
    for (const edge of edges) {
      if (dist[edge.from] + edge.weight < dist[edge.to]) {
        dist[edge.to] = dist[edge.from] + edge.weight;
        updated = true;
      }
    }
    if (!updated) break;
  }

  for (const edge of edges) {
    if (dist[edge.from] + edge.weight < dist[edge.to]) {
      return true;
    }
  }

  return false;
};

export default function BellmanFordPage() {
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<WeightedEdge[]>([]);
  const [nextNodeId, setNextNodeId] = useState(1);
  const [edgeFrom, setEdgeFrom] = useState<number | null>(null);
  const [edgeTo, setEdgeTo] = useState<number | null>(null);
  const [weightInput, setWeightInput] = useState("");
  const [showWeightInput, setShowWeightInput] = useState(false);
  const [sourceNode, setSourceNode] = useState<number | null>(null);
  const [draggingNode, setDraggingNode] = useState<number | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const [algorithmState, setAlgorithmState] = useState<AlgorithmState>("idle");
  const [speed, setSpeed] = useState<SpeedLevel>("medium");
  const [steps, setSteps] = useState<VisualizationStep[]>([
    { explanation: "Build a directed weighted graph and start Bellman-Ford.", timestamp: Date.now(), type: "init" },
  ]);
  const [distances, setDistances] = useState<Record<number, number>>({});
  const [previousNodes, setPreviousNodes] = useState<Record<number, number | null>>({});
  const [currentNode, setCurrentNode] = useState<number | null>(null);
  const [activeEdge, setActiveEdge] = useState<WeightedEdge | null>(null);
  const [relaxingEdge, setRelaxingEdge] = useState<WeightedEdge | null>(null);
  const [updatedNode, setUpdatedNode] = useState<number | null>(null);
  const [processedEdges, setProcessedEdges] = useState<string[]>([]);
  const [relaxationCounter, setRelaxationCounter] = useState(0);
  const [iteration, setIteration] = useState(0);
  const [finalDistance, setFinalDistance] = useState<number | null>(null);
  const [hasNegativeCycle, setHasNegativeCycle] = useState(false);
  const [cycleNodes, setCycleNodes] = useState<number[]>([]);
  const [cycleEdges, setCycleEdges] = useState<WeightedEdge[]>([]);
  const [completionMessage, setCompletionMessage] = useState("");
  const [currentStepMessage, setCurrentStepMessage] = useState("Add a source node and start the algorithm.");
  const [timelineSteps, setTimelineSteps] = useState<TimelineSnapshot[]>([]);
  const [currentTimelineIndex, setCurrentTimelineIndex] = useState(0);
  const [isAutoplay, setIsAutoplay] = useState(false);

  const pauseRef = useRef(false);
  const cancelRef = useRef(false);

  const svgWidth = 700;
  const svgHeight = 460;

  const isRunning = algorithmState === "running";
  const isPaused = algorithmState === "paused";
  const isLocked = isRunning || isPaused || isAutoplay;
  const progressPercentage = nodes.length === 0 ? 0 : Math.round((processedEdges.length / Math.max(edges.length * Math.max(nodes.length - 1, 1), 1)) * 100);
  const statusMessage = isRunning ? "Relaxing edges..." : isPaused ? "Paused" : algorithmState === "completed" ? "Completed" : "Ready";
  const displayedDistances = Object.keys(distances).length > 0 ? distances : Object.fromEntries(nodes.map((node) => [node.id, Infinity]));
  const nodeIds = useMemo(() => nodes.map((node) => node.id).sort((a, b) => a - b), [nodes]);
  const isGraphEditable = !isLocked;
  const hasNegativeWeights = useMemo(() => edges.some((edge) => edge.weight < 0), [edges]);
  const generatedGraphStats = useMemo(() => {
    const minWeight = edges.length > 0 ? Math.min(...edges.map((edge) => edge.weight)) : 0;
    const maxWeight = edges.length > 0 ? Math.max(...edges.map((edge) => edge.weight)) : 0;
    return { minWeight, maxWeight };
  }, [edges]);
  const shortestPathEdges = useMemo(() => {
    if (sourceNode === null || Object.keys(previousNodes).length === 0 || hasNegativeCycle) return [];

    return edges.filter((edge) => previousNodes[edge.to] === edge.from);
  }, [edges, previousNodes, sourceNode, hasNegativeCycle]);
  const shortestPathNodeIds = useMemo(() => {
    const pathNodes = new Set<number>();
    if (sourceNode !== null && nodeIds.length > 0 && !hasNegativeCycle) {
      pathNodes.add(sourceNode);
    }
    shortestPathEdges.forEach((edge) => {
      pathNodes.add(edge.from);
      pathNodes.add(edge.to);
    });
    return pathNodes;
  }, [shortestPathEdges, sourceNode, nodeIds.length, hasNegativeCycle]);
  const displayedTimelineStep = timelineSteps[currentTimelineIndex] ?? null;
  const negativeCycleNodeSet = useMemo(() => new Set(cycleNodes), [cycleNodes]);
  const shortestPathEdgeSet = useMemo(() => new Set(shortestPathEdges.map((edge) => `${edge.from}-${edge.to}`)), [shortestPathEdges]);

  useEffect(() => {
    if (!isAutoplay || timelineSteps.length === 0) return;

    const interval = setInterval(() => {
      setCurrentTimelineIndex((prevIndex) => {
        if (prevIndex >= timelineSteps.length - 1) {
          setIsAutoplay(false);
          return prevIndex;
        }

        const nextIndex = prevIndex + 1;
        applyTimelineSnapshot(timelineSteps[nextIndex]);
        return nextIndex;
      });
    }, speed === "slow" ? 2200 : speed === "medium" ? 1400 : 800);

    return () => clearInterval(interval);
  }, [isAutoplay, timelineSteps, speed]);

  const speedSleep = (ms: number) => sleep(ms * getSpeedMultiplier(speed));

  const resetAlgorithmState = () => {
    cancelRef.current = true;
    pauseRef.current = false;
    setIsAutoplay(false);
    setAlgorithmState("idle");
    setSteps([
      { explanation: "Build a directed weighted graph and start Bellman-Ford.", timestamp: Date.now(), type: "init" },
    ]);
    setDistances({});
    setPreviousNodes({});
    setCurrentNode(null);
    setActiveEdge(null);
    setRelaxingEdge(null);
    setUpdatedNode(null);
    setProcessedEdges([]);
    setRelaxationCounter(0);
    setIteration(0);
    setFinalDistance(null);
    setHasNegativeCycle(false);
    setCycleNodes([]);
    setCycleEdges([]);
    setCompletionMessage("");
    setCurrentStepMessage("Add a source node and start the algorithm.");
    setTimelineSteps([]);
    setCurrentTimelineIndex(0);
  };

  const captureTimelineSnapshot = (stepNumber: number, explanation: string, nextState?: Partial<TimelineSnapshot>) => {
    const snapshot: TimelineSnapshot = {
      stepNumber,
      explanation,
      currentNode,
      activeEdge,
      relaxingEdge,
      updatedNode,
      processedEdges: [...processedEdges],
      relaxationCounter,
      iteration,
      distances: { ...distances },
      previousNodes: { ...previousNodes },
      completionMessage,
      hasNegativeCycle,
      cycleNodes: [...cycleNodes],
      cycleEdges: [...cycleEdges],
      ...nextState,
    };
    setTimelineSteps((prev) => [...prev, snapshot]);
    setCurrentTimelineIndex((prev) => prev + 1);
  };

  const applyTimelineSnapshot = (snapshot: TimelineSnapshot) => {
    setCurrentNode(snapshot.currentNode);
    setActiveEdge(snapshot.activeEdge);
    setRelaxingEdge(snapshot.relaxingEdge);
    setUpdatedNode(snapshot.updatedNode);
    setProcessedEdges(snapshot.processedEdges);
    setRelaxationCounter(snapshot.relaxationCounter);
    setIteration(snapshot.iteration);
    setDistances(snapshot.distances);
    setPreviousNodes(snapshot.previousNodes);
    setCompletionMessage(snapshot.completionMessage);
    setHasNegativeCycle(snapshot.hasNegativeCycle);
    setCycleNodes(snapshot.cycleNodes);
    setCycleEdges(snapshot.cycleEdges);
    setCurrentStepMessage(snapshot.explanation);
  };

  const handlePreviousStep = () => {
    if (timelineSteps.length === 0 || currentTimelineIndex <= 0) return;
    const nextIndex = currentTimelineIndex - 1;
    setCurrentTimelineIndex(nextIndex);
    applyTimelineSnapshot(timelineSteps[nextIndex]);
  };

  const handleNextStep = () => {
    if (timelineSteps.length === 0 || currentTimelineIndex >= timelineSteps.length - 1) return;
    const nextIndex = currentTimelineIndex + 1;
    setCurrentTimelineIndex(nextIndex);
    applyTimelineSnapshot(timelineSteps[nextIndex]);
  };

  const toggleAutoplay = () => {
    if (timelineSteps.length === 0) return;
    setIsAutoplay((prev) => !prev);
  };

  const applyGraphPreset = (preset: "simple-dag" | "course-scheduling" | "task-dependency" | "build-dependency") => {
    if (isLocked) return;

    const presetData: Record<typeof preset, { nodes: GraphNode[]; edges: WeightedEdge[]; source: number }> = {
      "simple-dag": {
        nodes: Array.from({ length: 5 }, (_, index) => {
          const position = generateNodePosition(5, index);
          return { id: index + 1, x: position.x, y: position.y };
        }),
        edges: [
          { from: 1, to: 2, weight: 4 },
          { from: 1, to: 3, weight: 2 },
          { from: 2, to: 4, weight: 1 },
          { from: 3, to: 4, weight: 3 },
          { from: 4, to: 5, weight: 2 },
        ],
        source: 1,
      },
      "course-scheduling": {
        nodes: Array.from({ length: 6 }, (_, index) => {
          const position = generateNodePosition(6, index);
          return { id: index + 1, x: position.x, y: position.y };
        }),
        edges: [
          { from: 1, to: 3, weight: 1 },
          { from: 1, to: 4, weight: 2 },
          { from: 2, to: 4, weight: 2 },
          { from: 3, to: 5, weight: 1 },
          { from: 4, to: 6, weight: 3 },
          { from: 5, to: 6, weight: 1 },
        ],
        source: 1,
      },
      "task-dependency": {
        nodes: Array.from({ length: 6 }, (_, index) => {
          const position = generateNodePosition(6, index);
          return { id: index + 1, x: position.x, y: position.y };
        }),
        edges: [
          { from: 1, to: 2, weight: 3 },
          { from: 1, to: 3, weight: 6 },
          { from: 2, to: 4, weight: -2 },
          { from: 3, to: 4, weight: 1 },
          { from: 4, to: 5, weight: 4 },
          { from: 5, to: 6, weight: 2 },
        ],
        source: 1,
      },
      "build-dependency": {
        nodes: Array.from({ length: 7 }, (_, index) => {
          const position = generateNodePosition(7, index);
          return { id: index + 1, x: position.x, y: position.y };
        }),
        edges: [
          { from: 1, to: 2, weight: 5 },
          { from: 1, to: 3, weight: 1 },
          { from: 2, to: 4, weight: 2 },
          { from: 2, to: 5, weight: -1 },
          { from: 3, to: 5, weight: 4 },
          { from: 4, to: 6, weight: 3 },
          { from: 5, to: 6, weight: 2 },
          { from: 6, to: 7, weight: 1 },
        ],
        source: 1,
      },
    };

    const nextGraph = presetData[preset];
    setNodes(nextGraph.nodes);
    setEdges(nextGraph.edges);
    setNextNodeId(nextGraph.nodes.length + 1);
    setSourceNode(nextGraph.source);
    setEdgeFrom(null);
    setEdgeTo(null);
    setWeightInput("");
    setShowWeightInput(false);
    resetAlgorithmState();
    setSteps([
      { explanation: `Loaded the ${preset.replace(/-/g, " ")} preset.`, timestamp: Date.now(), type: "init" },
      { explanation: `Source node set to ${nextGraph.source}.`, timestamp: Date.now(), type: "init" },
    ]);
  };

  const applyBellmanPreset = (preset: "positive" | "negative" | "cycle" | "mixed") => {
    if (isLocked) return;

    const presets: Record<typeof preset, { nodes: GraphNode[]; edges: WeightedEdge[]; source: number }> = {
      positive: {
        nodes: Array.from({ length: 5 }, (_, index) => {
          const position = generateNodePosition(5, index);
          return { id: index + 1, x: position.x, y: position.y };
        }),
        edges: [
          { from: 1, to: 2, weight: 4 },
          { from: 1, to: 3, weight: 2 },
          { from: 2, to: 4, weight: 3 },
          { from: 3, to: 4, weight: 1 },
          { from: 4, to: 5, weight: 5 },
        ],
        source: 1,
      },
      negative: {
        nodes: Array.from({ length: 5 }, (_, index) => {
          const position = generateNodePosition(5, index);
          return { id: index + 1, x: position.x, y: position.y };
        }),
        edges: [
          { from: 1, to: 2, weight: 6 },
          { from: 1, to: 3, weight: 7 },
          { from: 2, to: 3, weight: 8 },
          { from: 2, to: 4, weight: 5 },
          { from: 2, to: 5, weight: -4 },
          { from: 3, to: 4, weight: -3 },
          { from: 4, to: 5, weight: 9 },
        ],
        source: 1,
      },
      cycle: {
        nodes: Array.from({ length: 4 }, (_, index) => {
          const position = generateNodePosition(4, index);
          return { id: index + 1, x: position.x, y: position.y };
        }),
        edges: [
          { from: 1, to: 2, weight: 1 },
          { from: 2, to: 3, weight: -2 },
          { from: 3, to: 4, weight: -2 },
          { from: 4, to: 2, weight: -1 },
        ],
        source: 1,
      },
      mixed: {
        nodes: Array.from({ length: 6 }, (_, index) => {
          const position = generateNodePosition(6, index);
          return { id: index + 1, x: position.x, y: position.y };
        }),
        edges: [
          { from: 1, to: 2, weight: 5 },
          { from: 1, to: 3, weight: 2 },
          { from: 2, to: 4, weight: -3 },
          { from: 3, to: 4, weight: 4 },
          { from: 4, to: 5, weight: 1 },
          { from: 5, to: 6, weight: -2 },
          { from: 6, to: 3, weight: 1 },
        ],
        source: 1,
      },
    };

    const nextGraph = presets[preset];
    setNodes(nextGraph.nodes);
    setEdges(nextGraph.edges);
    setNextNodeId(nextGraph.nodes.length + 1);
    setSourceNode(nextGraph.source);
    setEdgeFrom(null);
    setEdgeTo(null);
    setWeightInput("");
    setShowWeightInput(false);
    resetAlgorithmState();
    setSteps([
      { explanation: `Loaded the ${preset} preset.`, timestamp: Date.now(), type: "init" },
      { explanation: `Source node set to ${nextGraph.source}.`, timestamp: Date.now(), type: "init" },
    ]);
  };

  const generateRandomGraph = () => {
    if (isLocked) return;

    const nodeCount = 7;
    const newNodes = Array.from({ length: nodeCount }, (_, index) => {
      const position = generateNodePosition(nodeCount, index);
      return { id: index + 1, x: position.x, y: position.y };
    });

    const newEdges: WeightedEdge[] = [];
    for (let from = 1; from <= nodeCount; from += 1) {
      for (let to = 1; to <= nodeCount; to += 1) {
        if (from === to) continue;
        if (Math.random() < 0.28) {
          const weight = Math.floor(Math.random() * 16) - 5;
          const exists = newEdges.some((edge) => edge.from === from && edge.to === to);
          if (!exists) {
            newEdges.push({ from, to, weight });
          }
        }
      }
    }

    if (newEdges.length < nodeCount + 2) {
      for (let i = 1; i < nodeCount; i += 1) {
        if (!newEdges.some((edge) => edge.from === i && edge.to === i + 1)) {
          newEdges.push({ from: i, to: i + 1, weight: Math.floor(Math.random() * 11) - 2 });
        }
      }
    }

    setNodes(newNodes);
    setEdges(newEdges);
    setNextNodeId(nodeCount + 1);
    setSourceNode(1);
    setEdgeFrom(null);
    setEdgeTo(null);
    setWeightInput("");
    setShowWeightInput(false);
    resetAlgorithmState();
    setSteps([{ explanation: "Generated a random directed weighted graph.", timestamp: Date.now(), type: "init" }]);
  };

  const handleAddNode = () => {
    if (!isGraphEditable) return;
    const position = generateNodePosition(nodes.length + 1, nodes.length);
    const newNode = { id: nextNodeId, x: position.x, y: position.y };
    setNodes((prev) => [...prev, newNode]);
    setNextNodeId((prev) => prev + 1);
    resetAlgorithmState();
  };

  const handleClearGraph = () => {
    if (!isGraphEditable) return;
    setNodes([]);
    setEdges([]);
    setNextNodeId(1);
    setSourceNode(null);
    setEdgeFrom(null);
    setEdgeTo(null);
    setWeightInput("");
    setShowWeightInput(false);
    resetAlgorithmState();
  };

  const handleDeleteSelectedNode = () => {
    if (!isGraphEditable || edgeFrom === null || edgeTo !== null) return;
    const nodeId = edgeFrom;
    setNodes((prev) => prev.filter((node) => node.id !== nodeId));
    setEdges((prev) => prev.filter((edge) => edge.from !== nodeId && edge.to !== nodeId));
    if (sourceNode === nodeId) setSourceNode(null);
    setEdgeFrom(null);
    setEdgeTo(null);
    resetAlgorithmState();
  };

  const handleConnectNodes = () => {
    if (!isGraphEditable || edgeFrom === null || edgeTo === null || edgeFrom === edgeTo) return;
    setShowWeightInput(true);
  };

  const handleAddEdge = () => {
    if (edgeFrom === null || edgeTo === null) return;
    const weight = parseInt(weightInput, 10);
    if (Number.isNaN(weight)) return;

    const exists = edges.some((edge) => edge.from === edgeFrom && edge.to === edgeTo);
    if (!exists) {
      setEdges((prev) => [...prev, { from: edgeFrom, to: edgeTo, weight }]);
      resetAlgorithmState();
    }

    setEdgeFrom(null);
    setEdgeTo(null);
    setWeightInput("");
    setShowWeightInput(false);
  };

  const handleRemoveEdge = () => {
    if (!isGraphEditable || edgeFrom === null || edgeTo === null) return;
    setEdges((prev) => prev.filter((edge) => !(edge.from === edgeFrom && edge.to === edgeTo)));
    setEdgeFrom(null);
    setEdgeTo(null);
    setWeightInput("");
    setShowWeightInput(false);
    resetAlgorithmState();
  };

  const handleSvgMouseDown = (event: React.MouseEvent<SVGSVGElement>) => {
    if (!isGraphEditable) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    for (const node of nodes) {
      const distance = Math.hypot(x - node.x, y - node.y);
      if (distance < 5) {
        setDraggingNode(node.id);
        setDragStart({ x: x - node.x, y: y - node.y });
        return;
      }
    }
  };

  const handleSvgMouseMove = (event: React.MouseEvent<SVGSVGElement>) => {
    if (draggingNode === null) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100 - dragStart.x;
    const y = ((event.clientY - rect.top) / rect.height) * 100 - dragStart.y;

    setNodes((prev) =>
      prev.map((node) =>
        node.id === draggingNode ? { ...node, x: Math.max(5, Math.min(95, x)), y: Math.max(5, Math.min(95, y)) } : node
      )
    );
  };

  const handleSvgMouseUp = () => {
    setDraggingNode(null);
  };

  const handleSvgClick = (event: React.MouseEvent<SVGSVGElement>) => {
    if (!isGraphEditable || draggingNode !== null) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    for (const node of nodes) {
      const distance = Math.hypot(x - node.x, y - node.y);
      if (distance < 5) {
        if (edgeFrom === node.id) {
          setEdgeFrom(null);
          setEdgeTo(null);
          setShowWeightInput(false);
        } else if (edgeFrom === null) {
          setEdgeFrom(node.id);
          setEdgeTo(null);
          setShowWeightInput(false);
        } else if (edgeTo === node.id) {
          setEdgeTo(null);
          setShowWeightInput(false);
        } else {
          setEdgeTo(node.id);
        }
        return;
      }
    }
  };

  const waitGate = async (ms: number) => {
    await speedSleep(ms);
    while (pauseRef.current) {
      await sleep(200);
    }
    return !cancelRef.current;
  };

  const buildSnapshot = (nextState: Partial<TimelineSnapshot>): TimelineSnapshot => ({
    stepNumber: nextState.stepNumber ?? timelineSteps.length + 1,
    explanation: nextState.explanation ?? currentStepMessage,
    currentNode: nextState.currentNode ?? currentNode,
    activeEdge: nextState.activeEdge ?? activeEdge,
    relaxingEdge: nextState.relaxingEdge ?? relaxingEdge,
    updatedNode: nextState.updatedNode ?? updatedNode,
    processedEdges: nextState.processedEdges ?? [...processedEdges],
    relaxationCounter: nextState.relaxationCounter ?? relaxationCounter,
    iteration: nextState.iteration ?? iteration,
    distances: nextState.distances ?? { ...distances },
    previousNodes: nextState.previousNodes ?? { ...previousNodes },
    completionMessage: nextState.completionMessage ?? completionMessage,
    hasNegativeCycle: nextState.hasNegativeCycle ?? hasNegativeCycle,
    cycleNodes: nextState.cycleNodes ?? [...cycleNodes],
    cycleEdges: nextState.cycleEdges ?? [...cycleEdges],
  });

  const runBellmanFord = async () => {
    if (isLocked || nodes.length === 0 || sourceNode === null) return;

    cancelRef.current = false;
    pauseRef.current = false;
    setAlgorithmState("running");
    setSteps([{ explanation: "Starting Bellman-Ford shortest path computation.", timestamp: Date.now(), type: "init" }]);
    setCurrentStepMessage("Initializing distances.");

    const dist: Record<number, number> = {};
    const prev: Record<number, number | null> = {};
    nodes.forEach((node) => {
      dist[node.id] = Infinity;
      prev[node.id] = null;
    });
    dist[sourceNode] = 0;

    setDistances({ ...dist });
    setPreviousNodes({ ...prev });
    setCurrentNode(sourceNode);
    setActiveEdge(null);
    setRelaxingEdge(null);
    setUpdatedNode(null);
    setProcessedEdges([]);
    setRelaxationCounter(0);
    setIteration(0);
    setFinalDistance(null);
    setHasNegativeCycle(false);
    setCycleNodes([]);
    setCycleEdges([]);
    setCompletionMessage("");

    const history: VisualizationStep[] = [
      { explanation: `Source node ${sourceNode} set to distance 0.`, timestamp: Date.now(), type: "init" },
    ];
    setSteps(history);
    setCurrentStepMessage(`Source node ${sourceNode} set to distance 0.`);
    setTimelineSteps([]);
    setCurrentTimelineIndex(0);

    if (!(await waitGate(700))) return;

    const totalIterations = Math.max(nodes.length - 1, 1);
    let localProcessedEdges: string[] = [];
    let localRelaxationCounter = 0;

    for (let i = 0; i < totalIterations; i += 1) {
      setIteration(i + 1);
      setCurrentStepMessage(`Relaxation pass ${i + 1} of ${totalIterations}.`);
      setSteps((prev) => [...prev, { explanation: `Pass ${i + 1}: relax all edges.`, timestamp: Date.now(), type: "select" }]);
      setTimelineSteps((timelinePrev) => [...timelinePrev, buildSnapshot({ stepNumber: timelinePrev.length + 1, explanation: `Pass ${i + 1} of ${totalIterations}.`, iteration: i + 1 })]);
      setCurrentTimelineIndex((prev) => prev + 1);

      for (const edge of edges) {
        if (!(await waitGate(350))) return;

        localRelaxationCounter += 1;
        localProcessedEdges = [...localProcessedEdges, `${edge.from}-${edge.to}-${i}`];
        setRelaxationCounter(localRelaxationCounter);
        setProcessedEdges(localProcessedEdges);
        setCurrentNode(edge.from);
        setActiveEdge(edge);
        setRelaxingEdge(edge);
        setUpdatedNode(null);

        const fromDistance = dist[edge.from];
        const candidate = fromDistance === Infinity ? Infinity : fromDistance + edge.weight;
        const currentDistance = dist[edge.to];
        const explanation = fromDistance === Infinity
          ? `Skipping edge ${edge.from} -> ${edge.to} because node ${edge.from} is unreachable.`
          : candidate < currentDistance
            ? `Relaxing edge ${edge.from} -> ${edge.to}. Update distance of node ${edge.to}.`
            : `No update for edge ${edge.from} -> ${edge.to}.`;

        setSteps((prev) => [...prev, { explanation, timestamp: Date.now(), type: candidate < currentDistance ? "relax" : "skip" }]);
        setCurrentStepMessage(explanation);

        if (fromDistance !== Infinity && candidate < currentDistance) {
          dist[edge.to] = candidate;
          prev[edge.to] = edge.from;
          setDistances({ ...dist });
          setPreviousNodes({ ...prev });
          setUpdatedNode(edge.to);
          setFinalDistance(candidate);
          setSteps((prev) => [...prev, { explanation: `Node ${edge.to} updated to ${candidate}.`, timestamp: Date.now(), type: "relax" }]);
          setCurrentStepMessage(`Node ${edge.to} updated to ${candidate}.`);
        } else {
          setSteps((prev) => [...prev, { explanation: `No update for node ${edge.to}.`, timestamp: Date.now(), type: "skip" }]);
        }

        setTimelineSteps((timelinePrev) => [...timelinePrev, buildSnapshot({
          stepNumber: timelinePrev.length + 1,
          explanation,
          currentNode: edge.from,
          activeEdge: edge,
          relaxingEdge: edge,
          updatedNode: fromDistance !== Infinity && candidate < currentDistance ? edge.to : null,
          processedEdges: [...localProcessedEdges],
          relaxationCounter: localRelaxationCounter,
          iteration: i + 1,
          distances: { ...dist },
          previousNodes: { ...prev },
        })]);
        setCurrentTimelineIndex((prev) => prev + 1);

        if (!(await waitGate(420))) return;
      }

      setActiveEdge(null);
      setRelaxingEdge(null);
      setUpdatedNode(null);
      setCurrentStepMessage(`Completed pass ${i + 1} of ${totalIterations}.`);
      setSteps((prev) => [...prev, { explanation: `Completed pass ${i + 1} of ${totalIterations}.`, timestamp: Date.now(), type: "select" }]);

      if (!(await waitGate(250))) return;
    }

    setCurrentNode(null);
    setActiveEdge(null);
    setRelaxingEdge(null);
    setUpdatedNode(null);
    setIteration(totalIterations);

    if (!(await waitGate(500))) return;

    for (const edge of edges) {
      const fromDistance = dist[edge.from];
      if (fromDistance !== Infinity && fromDistance + edge.weight < dist[edge.to]) {
        const reconstructedCycleNodes = getNegativeCycleNodes(prev, edge.to, nodes.length);
        const reconstructedCycleEdges = edges.filter((candidateEdge) => reconstructedCycleNodes.some((nodeId, index) => {
          const nextNode = reconstructedCycleNodes[(index + 1) % reconstructedCycleNodes.length];
          return candidateEdge.from === nodeId && candidateEdge.to === nextNode;
        }));

        setHasNegativeCycle(true);
        setCycleNodes(reconstructedCycleNodes);
        setCycleEdges(reconstructedCycleEdges);
        setCompletionMessage("Negative cycle detected. Shortest paths are undefined.");
        setSteps((prev) => [...prev, { explanation: "Negative cycle detected during validation pass.", timestamp: Date.now(), type: "cycle" }]);
        setCurrentStepMessage("Negative cycle detected.");
        setTimelineSteps((timelinePrev) => [...timelinePrev, buildSnapshot({
          stepNumber: timelinePrev.length + 1,
          explanation: "Negative cycle detected.",
          hasNegativeCycle: true,
          cycleNodes: reconstructedCycleNodes,
          cycleEdges: reconstructedCycleEdges,
          completionMessage: "Negative cycle detected. Shortest paths are undefined.",
        })]);
        setCurrentTimelineIndex((prev) => prev + 1);
        setAlgorithmState("completed");
        return;
      }
    }

    const reachable = nodes.filter((node) => dist[node.id] !== Infinity).length;
    setCompletionMessage(`Completed. ${reachable} of ${nodes.length} nodes are reachable from source ${sourceNode}. Shortest path tree highlighted.`);
    setSteps((prev) => [...prev, { explanation: `Bellman-Ford completed from source ${sourceNode}.`, timestamp: Date.now(), type: "complete" }]);
    setCurrentStepMessage(`Completed. Shortest paths computed from node ${sourceNode}.`);
    setTimelineSteps((timelinePrev) => [...timelinePrev, buildSnapshot({
      stepNumber: timelinePrev.length + 1,
      explanation: `Bellman-Ford completed from source ${sourceNode}.`,
      completionMessage: `Completed. ${reachable} of ${nodes.length} nodes are reachable from source ${sourceNode}. Shortest path tree highlighted.`,
    })]);
    setCurrentTimelineIndex((prev) => prev + 1);
    setAlgorithmState("completed");
  };

  const handlePause = () => {
    if (!isRunning) return;
    pauseRef.current = true;
    setAlgorithmState("paused");
    setCurrentStepMessage("Paused.");
  };

  const handleResume = () => {
    if (!isPaused) return;
    pauseRef.current = false;
    setAlgorithmState("running");
    setCurrentStepMessage("Resumed.");
  };

  const timelineProgress = timelineSteps.length === 0 ? 0 : Math.round(((currentTimelineIndex + 1) / timelineSteps.length) * 100);

  const handleDownloadOrder = () => {
    if (nodes.length === 0) return;
    const ordered = nodeIds.map((id) => `${id}: ${displayedDistances[id] === Infinity ? "∞" : displayedDistances[id]}`);
    const blob = new Blob([`Bellman-Ford Distances\n${ordered.join("\n")}`], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "bellman-ford-distances.txt";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="min-h-screen bg-[#F1E8C7] px-4 py-10 text-[#4B5320] sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl space-y-6">
        <Link href="/graphs" className="inline-flex items-center text-sm font-medium text-[#556B2F] hover:text-[#4B5320]">
          &larr; Back to graphs
        </Link>

        <section className="rounded-3xl border border-[#D8CCA3] bg-[#F7F1DD]/90 p-6 shadow-[0_10px_30px_rgba(75,83,32,0.08)] sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-[#4B5320] sm:text-4xl">Bellman-Ford Algorithm Visualizer</h1>
              <p className="mt-3 max-w-3xl text-[#556B2F]">Visualize shortest path computation with support for negative edge weights.</p>
            </div>
            <div className="rounded-2xl border border-[#D8CCA3] bg-[#F1E8C7] px-4 py-3 text-right shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#7D8F3B]">Status</p>
              <p className="text-sm font-semibold text-[#4B5320]">{statusMessage}</p>
            </div>
          </div>
        </section>

        {hasNegativeCycle && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-red-300 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 shadow-sm">
            Negative Weight Cycle Detected.
          </motion.div>
        )}

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="space-y-6">
            <div className="rounded-3xl border border-[#D8CCA3] bg-[#F7F1DD]/90 p-6 shadow-[0_10px_30px_rgba(75,83,32,0.08)]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-[#4B5320]">Graph Visualization</h2>
                <div className="flex flex-wrap items-center gap-2 text-xs text-[#556B2F]">
                  <span className="rounded-full border border-[#AAB76A] bg-[#F1E8C7] px-3 py-1 font-semibold">Directed weighted graph</span>
                  <span className="rounded-full border border-[#AAB76A] bg-[#F1E8C7] px-3 py-1 font-semibold">Negative weights supported</span>
                </div>
              </div>

              <div className="mt-4 grid gap-3 rounded-2xl border border-[#D8CCA3] bg-[#F1E8C7] p-4 xl:grid-cols-4">
                <div className="space-y-2 xl:col-span-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#556B2F]">Edit Graph</p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <motion.button whileTap={{ scale: 0.98 }} onClick={handleAddNode} disabled={!isGraphEditable} className="rounded-xl bg-[#9CA763] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#7D8F3B] disabled:opacity-60">
                      <Plus className="mr-1 inline h-4 w-4" /> Add Node
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.98 }} onClick={handleConnectNodes} disabled={!isGraphEditable || edgeFrom === null || edgeTo === null} className="rounded-xl bg-[#7D8F3B] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#556B2F] disabled:opacity-60">
                      <Zap className="mr-1 inline h-4 w-4" /> Add Edge
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.98 }} onClick={handleRemoveEdge} disabled={!isGraphEditable || edgeFrom === null || edgeTo === null} className="rounded-xl border border-[#D8CCA3] bg-white px-3 py-2 text-xs font-semibold text-[#556B2F] transition hover:bg-[#F1E8C7] disabled:opacity-60">
                      <Trash2 className="mr-1 inline h-4 w-4" /> Remove
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.98 }} onClick={handleDeleteSelectedNode} disabled={!isGraphEditable || edgeFrom === null || edgeTo !== null} className="rounded-xl border border-[#D8CCA3] bg-white px-3 py-2 text-xs font-semibold text-[#556B2F] transition hover:bg-[#F1E8C7] disabled:opacity-60">
                      <Trash2 className="mr-1 inline h-4 w-4" /> Delete
                    </motion.button>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#556B2F]">Algorithm</p>
                  <div className="grid grid-cols-2 gap-2">
                    <motion.button whileTap={{ scale: 0.98 }} onClick={runBellmanFord} disabled={isLocked || nodes.length === 0 || sourceNode === null} className="rounded-xl bg-[#7D8F3B] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#556B2F] disabled:opacity-60">
                      <Play className="mr-1 inline h-4 w-4" /> Start
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.98 }} onClick={handlePause} disabled={!isRunning} className="rounded-xl border border-[#D8CCA3] bg-white px-3 py-2 text-xs font-semibold text-[#556B2F] transition hover:bg-[#F1E8C7] disabled:opacity-60">
                      <Pause className="mr-1 inline h-4 w-4" /> Pause
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.98 }} onClick={handleResume} disabled={!isPaused} className="rounded-xl border border-[#D8CCA3] bg-white px-3 py-2 text-xs font-semibold text-[#556B2F] transition hover:bg-[#F1E8C7] disabled:opacity-60">
                      <Play className="mr-1 inline h-4 w-4" /> Resume
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.98 }} onClick={resetAlgorithmState} disabled={isLocked} className="rounded-xl border border-[#7D8F3B] bg-white px-3 py-2 text-xs font-semibold text-[#7D8F3B] transition hover:bg-[#F1E8C7] disabled:opacity-60">
                      <RotateCcw className="mr-1 inline h-4 w-4" /> Reset
                    </motion.button>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#556B2F]">Graph Tools</p>
                  <div className="grid grid-cols-2 gap-2">
                    <motion.button whileTap={{ scale: 0.98 }} onClick={generateRandomGraph} disabled={!isGraphEditable} className="rounded-xl bg-[#9CA763] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#7D8F3B] disabled:opacity-60">
                      <Shuffle className="mr-1 inline h-4 w-4" /> Random Graph
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.98 }} onClick={handleClearGraph} disabled={!isGraphEditable} className="rounded-xl border border-[#D8CCA3] bg-white px-3 py-2 text-xs font-semibold text-[#7D8F3B] transition hover:bg-[#F1E8C7] disabled:opacity-60">
                      <RotateCcw className="mr-1 inline h-4 w-4" /> Clear
                    </motion.button>
                  </div>
                  <div className="rounded-xl border border-[#D8CCA3] bg-white px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-[#556B2F]">Slow</span>
                      <input
                        type="range"
                        min="0"
                        max="2"
                        step="1"
                        value={speed === "slow" ? 0 : speed === "medium" ? 1 : 2}
                        onChange={(event) => {
                          const value = parseInt(event.target.value, 10);
                          setSpeed(value === 0 ? "slow" : value === 1 ? "medium" : "fast");
                        }}
                        disabled={isLocked}
                        className="min-w-0 flex-1 cursor-pointer accent-[#7D8F3B] disabled:opacity-60"
                      />
                      <span className="text-xs font-medium text-[#556B2F]">Fast</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#556B2F]">Bellman-Ford Presets</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => applyBellmanPreset("positive")} disabled={!isGraphEditable} className="rounded-xl border border-[#D8CCA3] bg-white px-3 py-2 text-left text-xs font-semibold text-[#556B2F] transition hover:bg-[#F1E8C7] disabled:opacity-60">Positive weights</button>
                      <button onClick={() => applyBellmanPreset("negative")} disabled={!isGraphEditable} className="rounded-xl border border-[#D8CCA3] bg-white px-3 py-2 text-left text-xs font-semibold text-[#556B2F] transition hover:bg-[#F1E8C7] disabled:opacity-60">Negative weights</button>
                      <button onClick={() => applyBellmanPreset("cycle")} disabled={!isGraphEditable} className="rounded-xl border border-[#D8CCA3] bg-white px-3 py-2 text-left text-xs font-semibold text-[#556B2F] transition hover:bg-[#F1E8C7] disabled:opacity-60">Negative cycle</button>
                      <button onClick={() => applyBellmanPreset("mixed")} disabled={!isGraphEditable} className="rounded-xl border border-[#D8CCA3] bg-white px-3 py-2 text-left text-xs font-semibold text-[#556B2F] transition hover:bg-[#F1E8C7] disabled:opacity-60">Mixed graph</button>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 xl:col-span-1">
                </div>
              </div>

              <div className="mt-4 flex justify-center overflow-x-auto rounded-2xl bg-[#F1E8C7] p-4">
                <svg
                  width={svgWidth}
                  height={svgHeight}
                  className="flex-shrink-0 cursor-grab active:cursor-grabbing"
                  onMouseDown={handleSvgMouseDown}
                  onMouseMove={handleSvgMouseMove}
                  onMouseUp={handleSvgMouseUp}
                  onMouseLeave={handleSvgMouseUp}
                  onClick={handleSvgClick}
                >
                  {edges.map((edge, index) => {
                    const fromNode = nodes.find((node) => node.id === edge.from);
                    const toNode = nodes.find((node) => node.id === edge.to);
                    if (!fromNode || !toNode) return null;
                    const geometry = getEdgeGeometry(
                      { x: (fromNode.x / 100) * svgWidth, y: (fromNode.y / 100) * svgHeight },
                      { x: (toNode.x / 100) * svgWidth, y: (toNode.y / 100) * svgHeight }
                    );
                    if (!geometry) return null;
                    const isActiveEdge = activeEdge?.from === edge.from && activeEdge.to === edge.to;
                    const isRelaxingEdge = relaxingEdge?.from === edge.from && relaxingEdge.to === edge.to;
                    const isCycleEdge = hasNegativeCycle && cycleEdges.some((cycleEdge) => cycleEdge.from === edge.from && cycleEdge.to === edge.to);
                    const isShortestPathEdge = algorithmState === "completed" && !hasNegativeCycle && shortestPathEdges.some((pathEdge) => pathEdge.from === edge.from && pathEdge.to === edge.to);
                    const strokeColor = isActiveEdge ? "#556B2F" : isRelaxingEdge ? "#7D8F3B" : isCycleEdge ? "#DC2626" : isShortestPathEdge ? "#4B5320" : "#D8CCA3";
                    const strokeWidth = isActiveEdge || isCycleEdge || isShortestPathEdge ? "4" : "2.5";
                    const opacity = isActiveEdge ? 1 : isRelaxingEdge ? 1 : isCycleEdge ? 1 : isShortestPathEdge ? 1 : isRunning ? 0.34 : 0.72;

                    return (
                      <g key={`edge-${index}`}>
                        <motion.path
                          d={geometry.path}
                          fill="none"
                          stroke={strokeColor}
                          strokeWidth={strokeWidth}
                          strokeLinecap="round"
                          strokeDasharray={isShortestPathEdge ? "6 4" : undefined}
                          animate={{ opacity: isActiveEdge ? [0.55, 1, 0.55] : opacity }}
                          transition={{ repeat: isActiveEdge ? Infinity : 0, duration: 1.2 }}
                        />
                        <motion.polygon
                          points={geometry.arrowPoints}
                          fill={isCycleEdge ? "#DC2626" : isActiveEdge ? "#556B2F" : isShortestPathEdge ? "#4B5320" : "#7D8F3B"}
                          stroke={isCycleEdge ? "#DC2626" : isActiveEdge ? "#556B2F" : isShortestPathEdge ? "#4B5320" : "#7D8F3B"}
                          strokeLinejoin="round"
                          animate={{ opacity: isActiveEdge || isCycleEdge ? [0.75, 1, 0.75] : 0.95 }}
                          transition={{ repeat: isActiveEdge ? Infinity : 0, duration: 1.2 }}
                        />
                        <text
                          x={geometry.label.x}
                          y={geometry.label.y - 6}
                          textAnchor="middle"
                          className="pointer-events-none text-[11px] font-bold"
                          fill="#4B5320"
                        >
                          {edge.weight}
                        </text>
                      </g>
                    );
                  })}

                  <AnimatePresence>
                    {nodes.map((node) => {
                      const x = (node.x / 100) * svgWidth;
                      const y = (node.y / 100) * svgHeight;
                      const isCurrent = currentNode === node.id;
                      const isUpdated = updatedNode === node.id;
                      const isSource = sourceNode === node.id;
                      const isCycleNode = hasNegativeCycle && negativeCycleNodeSet.has(node.id);
                      const isShortestPathNode = algorithmState === "completed" && !hasNegativeCycle && shortestPathNodeIds.has(node.id);
                      const distance = displayedDistances[node.id] ?? Infinity;

                      let fillColor: string = GRAPH_COLORS.node.default.fill;
                      let strokeColor: string = GRAPH_COLORS.node.default.stroke;
                      if (isCycleNode) {
                        fillColor = GRAPH_COLORS.node.current.fill;
                        strokeColor = GRAPH_COLORS.node.current.stroke;
                      } else if (isShortestPathNode) {
                        fillColor = GRAPH_COLORS.node.completed.fill;
                        strokeColor = GRAPH_COLORS.node.completed.stroke;
                      } else if (isSource) {
                        fillColor = GRAPH_COLORS.node.visited.fill;
                        strokeColor = GRAPH_COLORS.node.visited.stroke;
                      }
                      if (isCurrent) {
                        fillColor = GRAPH_COLORS.node.current.fill;
                        strokeColor = GRAPH_COLORS.node.current.stroke;
                      }
                      if (isUpdated) {
                        fillColor = GRAPH_COLORS.node.visited.fill;
                        strokeColor = GRAPH_COLORS.node.visited.stroke;
                      }

                      return (
                        <motion.g
                          key={`node-${node.id}`}
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: isUpdated ? [1, 1.12, 1] : 1, opacity: 1 }}
                          whileHover={{ scale: 1.08 }}
                          transition={{ type: "spring", stiffness: 260, damping: 20 }}
                        >
                          <motion.circle
                            cx={x}
                            cy={y}
                            r={NODE_RADIUS}
                            fill={fillColor}
                            stroke={strokeColor}
                            strokeWidth={isCurrent || isUpdated || isSource ? EDGE_STROKE_WIDTH_ACTIVE : EDGE_STROKE_WIDTH}
                            animate={{ r: isCurrent || isUpdated || isShortestPathNode || isCycleNode ? NODE_RADIUS + 4 : NODE_RADIUS }}
                            transition={{ duration: 0.3 }}
                          />
                          <text x={x} y={y - 2} textAnchor="middle" dominantBaseline="middle" className="pointer-events-none text-sm font-bold" fill={isShortestPathNode || isCycleNode ? "#F7F1DD" : "#4B5320"}>
                            {node.id}
                          </text>
                          <text x={x} y={y + 15} textAnchor="middle" className="pointer-events-none text-[10px] font-semibold" fill={isShortestPathNode || isCycleNode ? "#F7F1DD" : "#556B2F"}>
                            d:{distance === Infinity ? "∞" : distance}
                          </text>
                        </motion.g>
                      );
                    })}
                  </AnimatePresence>
                </svg>
              </div>

              {nodes.length === 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 rounded-2xl border-2 border-dashed border-[#D8CCA3] bg-[#F1E8C7] p-8 text-center">
                  <p className="text-sm text-[#556B2F]">Add nodes or generate a random graph to begin.</p>
                </motion.div>
              )}

              {showWeightInput && edgeFrom !== null && edgeTo !== null && (
                <div className="mt-4 rounded-2xl border border-[#D8CCA3] bg-[#F1E8C7] p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#556B2F]">Edge Weight</p>
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <input
                      value={weightInput}
                      onChange={(event) => setWeightInput(event.target.value)}
                      placeholder="Enter weight, e.g. -3"
                      className="w-full max-w-xs rounded-xl border border-[#D8CCA3] bg-white px-3 py-2 text-sm text-[#4B5320] outline-none focus:border-[#7D8F3B]"
                    />
                    <motion.button whileTap={{ scale: 0.98 }} onClick={handleAddEdge} className="rounded-xl bg-[#7D8F3B] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#556B2F]">
                      Add Edge
                    </motion.button>
                  </div>
                  <p className="mt-2 text-xs text-[#556B2F]">Directed edge from {edgeFrom} to {edgeTo}. Negative weights are allowed.</p>
                </div>
              )}

              <div className="mt-4 rounded-2xl border border-[#D8CCA3] bg-[#F1E8C7] p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#556B2F]">Selected Nodes</p>
                <p className="mt-2 text-sm font-mono text-[#4B5320]">
                  {edgeFrom ?? "-"} {edgeTo !== null && `-> ${edgeTo}`}
                </p>
                <p className="mt-2 text-xs text-[#556B2F]">First click selects the source. Second click selects the destination for a directed weighted edge.</p>
              </div>
            </div>
          </div>

          <div className={`space-y-4 ${isLocked ? "lg:sticky lg:top-4" : ""}`}>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-[#D8CCA3] bg-[#F7F1DD]/90 p-6 shadow-[0_10px_30px_rgba(75,83,32,0.08)]">
              <h3 className="text-lg font-semibold text-[#4B5320]">Live Algorithm Panel</h3>
              <div className="mt-4 space-y-4">
                <div className="rounded-2xl border border-[#D8CCA3] bg-[#F1E8C7] p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#556B2F]">Current Phase</p>
                  <p className="mt-1 text-sm font-semibold text-[#4B5320]">{currentStepMessage}</p>
                  <p className="mt-2 text-xs text-[#556B2F]">Iteration {iteration} of {Math.max(nodes.length - 1, 1)}</p>
                </div>
                <div className="rounded-2xl border border-[#D8CCA3] bg-[#F1E8C7] p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#556B2F]">Step-by-Step Mode</p>
                    <p className="text-xs font-semibold text-[#7D8F3B]">{timelineProgress}%</p>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <motion.button whileTap={{ scale: 0.98 }} onClick={handlePreviousStep} disabled={currentTimelineIndex === 0 || timelineSteps.length === 0} className="rounded-xl border border-[#D8CCA3] bg-white px-3 py-2 text-xs font-semibold text-[#556B2F] transition hover:bg-[#F7F1DD] disabled:opacity-60">
                      <ChevronRight className="mr-1 inline h-4 w-4 rotate-180" /> Previous
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.98 }} onClick={handleNextStep} disabled={currentTimelineIndex >= timelineSteps.length - 1 || timelineSteps.length === 0} className="rounded-xl border border-[#D8CCA3] bg-white px-3 py-2 text-xs font-semibold text-[#556B2F] transition hover:bg-[#F7F1DD] disabled:opacity-60">
                      Next <ChevronRight className="ml-1 inline h-4 w-4" />
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.98 }} onClick={toggleAutoplay} disabled={timelineSteps.length === 0} className="rounded-xl bg-[#7D8F3B] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#556B2F] disabled:opacity-60">
                      {isAutoplay ? <Pause className="mr-1 inline h-4 w-4" /> : <Play className="mr-1 inline h-4 w-4" />}
                      Auto Play
                    </motion.button>
                  </div>
                  {displayedTimelineStep && (
                    <p className="mt-3 rounded-xl border border-[#D8CCA3] bg-white px-3 py-2 text-sm text-[#4B5320]">
                      {displayedTimelineStep.explanation}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#556B2F]">Current Node</p>
                  <p className="mt-1 text-sm font-semibold text-[#4B5320]">{currentNode ?? "None"}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#556B2F]">Relaxation Counter</p>
                  <p className="mt-1 text-sm font-semibold text-[#4B5320]">{relaxationCounter}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#556B2F]">Distances</p>
                  <div className="mt-2 rounded-2xl border border-[#AAB76A] bg-[#F1E8C7] p-3">
                    {nodeIds.length ? (
                      nodeIds.map((id) => (
                        <div key={`distance-${id}`} className="flex items-center justify-between py-1 text-sm">
                          <span className="font-semibold text-[#4B5320]">Node {id}</span>
                          <span className="font-mono font-semibold text-[#556B2F]">{displayedDistances[id] === Infinity ? "∞" : displayedDistances[id]}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-[#556B2F]">Distances appear here.</p>
                    )}
                  </div>
                </div>

                {completionMessage && (
                  <div className={`rounded-2xl border p-3 text-sm font-semibold ${hasNegativeCycle ? "border-red-300 bg-red-50 text-red-700" : "border-[#AAB76A] bg-[#F1E8C7] text-[#4B5320]"}`}>
                    {completionMessage}
                  </div>
                )}

                {currentStepMessage && (
                  <div className="rounded-2xl border border-[#D8CCA3] bg-white px-3 py-2 text-sm text-[#4B5320]">
                    {currentStepMessage}
                  </div>
                )}

              </div>
            </motion.div>
          </div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex h-full flex-col rounded-3xl border border-[#D8CCA3] bg-[#F7F1DD]/90 p-6 shadow-[0_10px_30px_rgba(75,83,32,0.08)]">
            <div className="mb-4 flex items-center gap-2">
              <Download className="h-5 w-5 text-[#7D8F3B]" />
              <h3 className="text-lg font-semibold text-[#4B5320]">Export</h3>
            </div>
            <div className="space-y-3 text-sm text-[#556B2F]">
              <p>Download the computed distance table as a text file.</p>
              <motion.button whileTap={{ scale: 0.98 }} onClick={handleDownloadOrder} disabled={nodes.length === 0} className="inline-flex items-center rounded-xl bg-[#7D8F3B] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#556B2F] disabled:opacity-60">
                Export Distances
              </motion.button>
            </div>
          </motion.div>
        </div>

        <div className="rounded-3xl border border-[#D8CCA3] bg-[#F7F1DD]/90 p-6 shadow-[0_10px_30px_rgba(75,83,32,0.08)]">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-[#4B5320]">Timeline</h3>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#556B2F]">{steps.length} steps</p>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {steps.map((step, index) => {
              const active = index === steps.length - 1;
              return (
                <div key={`${step.timestamp}-${index}`} className={`rounded-full border px-3 py-1 text-xs font-semibold ${active ? "border-[#7D8F3B] bg-[#7D8F3B] text-white" : "border-[#D8CCA3] bg-[#F1E8C7] text-[#556B2F]"}`}>
                  {index + 1}. {step.type ?? "step"}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}
