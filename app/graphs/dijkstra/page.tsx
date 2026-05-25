"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Plus,
  Trash2,
  Settings,
  RotateCcw,
  Play,
  Pause,
  Zap,
  Info,
  Sliders,
  Download,
  Edit2,
  Layers,
  TrendingUp,
  BookOpen,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useState, useMemo } from "react";

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

type DijkstraState = {
  unvisited: Set<number>;
  distances: Record<number, number>;
  previous: Record<number, number | null>;
  visited: Set<number>;
  currentNode: number | null;
  priorityQueue: Array<{ node: number; distance: number }>;
};

type SpeedLevel = "slow" | "medium" | "fast";

type VisualizationStep = {
  explanation: string;
  type?: "init" | "select" | "relax" | "skip" | "complete";
};

type GraphDensity = "sparse" | "medium" | "dense";

type AlgorithmSnapshot = {
  step: number;
  state: DijkstraState;
  explanation: string;
};

type EditMode = "select" | "addNode" | "addEdge" | "editWeight" | null;

type ExecutionMode = "auto" | "manual";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const generateNodePosition = (nodeCount: number, index: number) => {
  const angle = (index / Math.max(nodeCount, 1)) * 2 * Math.PI;
  const radius = 30 + nodeCount * 2;
  const x = 50 + radius * Math.cos(angle);
  const y = 50 + radius * Math.sin(angle);
  return { x: Math.max(5, Math.min(95, x)), y: Math.max(5, Math.min(95, y)) };
};

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

export default function DijkstraPage() {
  // Graph state
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<WeightedEdge[]>([]);
  const [nextNodeId, setNextNodeId] = useState(1);

  // Algorithm state
  const [algorithmState, setAlgorithmState] = useState<AlgorithmState>("idle");
  const [dijkstraState, setDijkstraState] = useState<DijkstraState>({
    unvisited: new Set(),
    distances: {},
    previous: {},
    visited: new Set(),
    currentNode: null,
    priorityQueue: [],
  });

  // Execution mode
  const [executionMode, setExecutionMode] = useState<ExecutionMode>("auto");
  const [currentStep, setCurrentStep] = useState(0);
  const [snapshots, setSnapshots] = useState<AlgorithmSnapshot[]>([]);

  // UI state
  const [sourceNode, setSourceNode] = useState<number | null>(null);
  const [destinationNode, setDestinationNode] = useState<number | null>(null);
  const [speed, setSpeed] = useState<SpeedLevel>("medium");
  const [steps, setSteps] = useState<VisualizationStep[]>([
    { explanation: "Select a source node to start Dijkstra's algorithm." },
  ]);
  const [activeEdge, setActiveEdge] = useState<{ from: number; to: number } | null>(null);
  const [relaxingEdge, setRelaxingEdge] = useState<{ from: number; to: number; weight: number } | null>(null);
  const [draggingNode, setDraggingNode] = useState<number | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [sourceOrDestMode, setSourceOrDestMode] = useState<"source" | "dest" | null>(null);
  const [nodesProcessed, setNodesProcessed] = useState(0);
  const [distancesUpdated, setDistancesUpdated] = useState(0);
  const [editMode, setEditMode] = useState<EditMode>(null);
  const [graphDensity, setGraphDensity] = useState<GraphDensity>("medium");
  const [showGenerateOptions, setShowGenerateOptions] = useState(false);
  const [nodeCountInput, setNodeCountInput] = useState(8);
  const [maxWeightInput, setMaxWeightInput] = useState(10);
  const [showLegend, setShowLegend] = useState(false);
  const [expandedInfoCard, setExpandedInfoCard] = useState<number | null>(null);

  const speedSleep = (ms: number) => sleep(ms * getSpeedMultiplier(speed));

  const weightedAdjacencyList = useMemo(() => {
    const list: Record<number, Array<{ nodeId: number; weight: number }>> = {};
    nodes.forEach((n) => {
      list[n.id] = [];
    });
    edges.forEach((e) => {
      list[e.from].push({ nodeId: e.to, weight: e.weight });
      list[e.to].push({ nodeId: e.from, weight: e.weight });
    });
    return list;
  }, [nodes, edges]);

  const hasNegativeWeights = useMemo(() => {
    return edges.some((e) => e.weight < 0);
  }, [edges]);

  const shortestPath = useMemo(() => {
    if (!destinationNode || algorithmState !== "completed") return null;

    const path: number[] = [];
    let current: number | null = destinationNode;
    while (current !== null) {
      path.unshift(current);
      const prev: number | null = dijkstraState.previous[current] ?? null;
      current = prev;
    }

    if (path[0] !== sourceNode) return null;

    const distance = dijkstraState.distances[destinationNode];
    return {
      path,
      distance: distance === Infinity ? "unreachable" : distance,
    };
  }, [destinationNode, dijkstraState, algorithmState, sourceNode]);

  const shortestPathEdges = useMemo(() => {
    if (!shortestPath?.path) return [];
    const pathEdges: Array<{ from: number; to: number }> = [];
    for (let i = 0; i < shortestPath.path.length - 1; i++) {
      pathEdges.push({ from: shortestPath.path[i], to: shortestPath.path[i + 1] });
    }
    return pathEdges;
  }, [shortestPath]);

  // Calculate total path cost
  const totalPathCost = useMemo(() => {
    if (!shortestPath?.path) return 0;
    let cost = 0;
    for (let i = 0; i < shortestPath.path.length - 1; i++) {
      const from = shortestPath.path[i];
      const to = shortestPath.path[i + 1];
      const edge = edges.find(
        (e) => (e.from === from && e.to === to) || (e.from === to && e.to === from)
      );
      if (edge) cost += edge.weight;
    }
    return cost;
  }, [shortestPath, edges]);

  // Progress tracking
  const progressPercentage = useMemo(() => {
    if (nodes.length === 0) return 0;
    return Math.round((nodesProcessed / nodes.length) * 100);
  }, [nodesProcessed, nodes.length]);

  const handleAddNode = () => {
    const newId = nextNodeId;
    const position = generateNodePosition(nodes.length, nodes.length);
    setNodes([...nodes, { id: newId, x: position.x, y: position.y }]);
    setNextNodeId(newId + 1);
  };

  const handleDeleteNode = (id: number) => {
    setNodes(nodes.filter((n) => n.id !== id));
    setEdges(edges.filter((e) => e.from !== id && e.to !== id));
    if (sourceNode === id) setSourceNode(null);
    if (destinationNode === id) setDestinationNode(null);
  };

  const handleGenerateGraphWithConfig = (config: { nodes: number; density: GraphDensity; maxWeight: number }) => {
    const nodeCount = config.nodes;
    const newNodes: GraphNode[] = [];
    for (let i = 0; i < nodeCount; i++) {
      const position = generateNodePosition(nodeCount, i);
      newNodes.push({ id: i + 1, x: position.x, y: position.y });
    }

    const newEdges: WeightedEdge[] = [];

    // Calculate density ratio
    const densityRatio = config.density === "sparse" ? 0.2 : config.density === "medium" ? 0.5 : 0.8;
    const maxEdges = Math.floor((nodeCount * (nodeCount - 1)) / 2 * densityRatio);

    for (let i = 0; i < maxEdges; i++) {
      const from = newNodes[Math.floor(Math.random() * newNodes.length)].id;
      const to = newNodes[Math.floor(Math.random() * newNodes.length)].id;
      const weight = Math.floor(Math.random() * (config.maxWeight - 1)) + 1;
      if (from !== to) {
        const exists = newEdges.some(
          (e) => (e.from === from && e.to === to) || (e.from === to && e.to === from)
        );
        if (!exists) {
          newEdges.push({ from, to, weight });
        }
      }
    }

    setNodes(newNodes);
    setEdges(newEdges);
    setNextNodeId(nodeCount + 1);
    handleReset();
    setSourceNode(1);
    setDestinationNode(nodeCount);
    setShowGenerateOptions(false);
  };

  const handleClearGraph = () => {
    setNodes([]);
    setEdges([]);
    setNextNodeId(1);
    setSourceNode(null);
    setDestinationNode(null);
    handleReset();
  };

  const handleSvgMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (algorithmState === "running" || editMode === "addEdge") return;
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    for (const node of nodes) {
      const distance = Math.sqrt((x - node.x) ** 2 + (y - node.y) ** 2);
      if (distance < 5) {
        if (editMode === "addNode") return;
        setDraggingNode(node.id);
        setDragStart({ x: x - node.x, y: y - node.y });
        return;
      }
    }
  };

  const handleSvgMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (draggingNode === null || editMode === "addEdge") return;

    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100 - dragStart.x;
    const y = ((e.clientY - rect.top) / rect.height) * 100 - dragStart.y;

    setNodes(
      nodes.map((n) =>
        n.id === draggingNode
          ? { ...n, x: Math.max(5, Math.min(95, x)), y: Math.max(5, Math.min(95, y)) }
          : n
      )
    );
  };

  const handleSvgMouseUp = () => {
    setDraggingNode(null);
  };

  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (algorithmState === "running" || draggingNode !== null) return;

    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    // Handle add node mode
    if (editMode === "addNode") {
      const newId = nextNodeId;
      setNodes([...nodes, { id: newId, x, y }]);
      setNextNodeId(newId + 1);
      return;
    }

    // Handle source/dest selection
    for (const node of nodes) {
      const distance = Math.sqrt((x - node.x) ** 2 + (y - node.y) ** 2);
      if (distance < 5) {
        if (sourceOrDestMode === "source") {
          setSourceNode(node.id);
          setSourceOrDestMode(null);
        } else if (sourceOrDestMode === "dest") {
          setDestinationNode(node.id);
          setSourceOrDestMode(null);
        }
        return;
      }
    }
  };

  const handleReset = () => {
    setAlgorithmState("idle");
    setDijkstraState({
      unvisited: new Set(),
      distances: {},
      previous: {},
      visited: new Set(),
      currentNode: null,
      priorityQueue: [],
    });
    setSteps([{ explanation: "Select a source node to start Dijkstra's algorithm." }]);
    setActiveEdge(null);
    setRelaxingEdge(null);
    setNodesProcessed(0);
    setDistancesUpdated(0);
    setCurrentStep(0);
    setSnapshots([]);
  };

  const handleStartAlgorithm = async () => {
    if (sourceNode === null || nodes.length === 0) return;
    if (hasNegativeWeights) {
      alert(
        "⚠️ Dijkstra does not support negative edge weights. Results may be incorrect.\nPlease use Bellman-Ford algorithm instead."
      );
      return;
    }

    setAlgorithmState("running");
    setSteps([]);
    setActiveEdge(null);
    setRelaxingEdge(null);
    setNodesProcessed(0);
    setDistancesUpdated(0);
    setCurrentStep(0);
    setSnapshots([]);

    const distances: Record<number, number> = {};
    const previous: Record<number, number | null> = {};
    const unvisited = new Set<number>();
    const visited = new Set<number>();

    nodes.forEach((n) => {
      distances[n.id] = Infinity;
      previous[n.id] = null;
      unvisited.add(n.id);
    });

    distances[sourceNode] = 0;

    setDijkstraState({
      unvisited,
      distances,
      previous,
      visited,
      currentNode: sourceNode,
      priorityQueue: [{ node: sourceNode, distance: 0 }],
    });

    setSteps([
      { explanation: `🟢 Starting Dijkstra from source node ${sourceNode}`, type: "init" },
      { explanation: `Set distance[${sourceNode}] = 0, all others = ∞`, type: "init" },
      { explanation: `Added node ${sourceNode} to priority queue`, type: "init" },
    ]);

    // Save initial snapshot
    let snapshotIdx = 0;
    const newSnapshots: AlgorithmSnapshot[] = [
      {
        step: snapshotIdx++,
        state: { unvisited: new Set(unvisited), distances: { ...distances }, previous: { ...previous }, visited: new Set(visited), currentNode: sourceNode, priorityQueue: [] },
        explanation: "Initialize: All nodes unvisited",
      },
    ];

    if (executionMode === "manual") {
      await speedSleep(1200);
    } else {
      await speedSleep(1200);
    }

    let processed = 0;
    let updated = 0;

    while (unvisited.size > 0) {
      let minNode: number | null = null;
      let minDistance = Infinity;

      for (const node of unvisited) {
        if (distances[node] < minDistance) {
          minDistance = distances[node];
          minNode = node;
        }
      }

      if (minNode === null || minDistance === Infinity) {
        break;
      }

      if (executionMode === "manual") {
        while (algorithmState === "paused") {
          await sleep(100);
        }
      }

      setDijkstraState((prev) => ({
        ...prev,
        currentNode: minNode,
      }));

      processed++;
      setNodesProcessed(processed);

      setSteps((prev) => [
        ...prev,
        {
          explanation: `🔵 Selected node ${minNode} (min distance: ${minDistance}) from priority queue`,
          type: "select",
        },
      ]);
      await speedSleep(700);

      setSteps((prev) => [
        ...prev,
        {
          explanation: `Checking neighbors of node ${minNode}...`,
          type: "select",
        },
      ]);
      await speedSleep(500);

      const neighbors = weightedAdjacencyList[minNode] || [];
      for (const { nodeId: neighbor, weight } of neighbors) {
        if (!visited.has(neighbor)) {
          const newDistance = distances[minNode] + weight;
          const oldDistance = distances[neighbor];

          setRelaxingEdge({ from: minNode, to: neighbor, weight });
          setSteps((prev) => [
            ...prev,
            {
              explanation: `✏️ Relaxing edge ${minNode}→${neighbor} (weight: ${weight})`,
              type: "relax",
            },
          ]);
          await speedSleep(400);

          if (newDistance < oldDistance) {
            distances[neighbor] = newDistance;
            previous[neighbor] = minNode;
            updated++;
            setDistancesUpdated(updated);

            setSteps((prev) => [
              ...prev,
              {
                explanation: `✅ Found shorter path! Distance ${neighbor}: ${oldDistance === Infinity ? "∞" : oldDistance} → ${newDistance} via node ${minNode}`,
                type: "relax",
              },
            ]);

            setDijkstraState((prev) => ({
              ...prev,
              distances: { ...distances },
              previous: { ...previous },
            }));

            await speedSleep(600);
          } else {
            setSteps((prev) => [
              ...prev,
              {
                explanation: `⏭️ No improvement. Current distance ${oldDistance === Infinity ? "∞" : oldDistance} is better than ${newDistance}`,
                type: "skip",
              },
            ]);
            await speedSleep(400);
          }
        }
      }

      unvisited.delete(minNode);
      visited.add(minNode);

      setRelaxingEdge(null);
      setDijkstraState((prev) => ({
        ...prev,
        unvisited: new Set(unvisited),
        visited: new Set(visited),
        distances: { ...distances },
        previous: { ...previous },
      }));

      // Save snapshot
      newSnapshots.push({
        step: snapshotIdx++,
        state: {
          unvisited: new Set(unvisited),
          distances: { ...distances },
          previous: { ...previous },
          visited: new Set(visited),
          currentNode: minNode,
          priorityQueue: [],
        },
        explanation: `Processed node ${minNode}`,
      });

      setActiveEdge(null);
      await speedSleep(500);
    }

    setSnapshots(newSnapshots);
    setAlgorithmState("completed");
    setDijkstraState((prev) => ({
      ...prev,
      currentNode: null,
    }));
    setRelaxingEdge(null);
    setSteps((prev) => [
      ...prev,
      {
        explanation: `✓ Algorithm completed. Processed ${processed} nodes, updated ${updated} distances.`,
        type: "complete",
      },
    ]);
  };

  const handlePause = () => {
    setAlgorithmState("paused");
  };

  const handleResume = () => {
    if (algorithmState === "paused") {
      setAlgorithmState("running");
    }
  };

  const handleNextStep = () => {
    if (currentStep < snapshots.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const svgHeight = 400;
  const svgWidth = 600;

  // Educational info cards data
  const infoCards = [
    {
      title: "What is Dijkstra?",
      content:
        "Dijkstra's algorithm finds the shortest path from a source node to all other nodes in a weighted graph with non-negative weights. It uses a greedy approach, always picking the unvisited node with minimum distance.",
      icon: "🎯",
    },
    {
      title: "Why Does Greedy Work?",
      content:
        "Dijkstra's greedy choice (always pick minimum distance node) is optimal because once we visit a node, we've found its true shortest distance. No unvisited node can offer a shorter path through remaining nodes since all weights are non-negative.",
      icon: "⚡",
    },
    {
      title: "When Dijkstra Fails?",
      content:
        "Dijkstra assumes non-negative edge weights. If negative weights exist: (1) The algorithm may not find correct shortest paths (2) Negative cycles make 'shortest' undefined. Use Bellman-Ford instead for negative weights.",
      icon: "⚠️",
    },
  ];

  return (
    <main className="min-h-screen bg-[#F1E8C7] px-4 py-10 text-[#4B5320] sm:px-6 lg:px-8">
      <svg style={{ position: "absolute", width: 0, height: 0 }}>
        <defs>
          <filter id="relaxGlow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="pathGlow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      </svg>

      <div className="mx-auto w-full max-w-7xl space-y-6">
        <Link href="/graphs" className="inline-flex items-center text-sm font-medium text-[#556B2F] hover:text-[#4B5320]">
          &larr; Back to graphs
        </Link>

        {hasNegativeWeights && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border-2 border-red-400 bg-red-50 p-4 flex items-start gap-3"
          >
            <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-900">Negative Weights Detected</p>
              <p className="text-sm text-red-700 mt-1">
                Dijkstra does not support negative edge weights. Results may be incorrect. Please use Bellman-Ford algorithm instead.
              </p>
            </div>
          </motion.div>
        )}

        <section className="rounded-3xl border border-[#D8CCA3] bg-[#F7F1DD]/90 p-6 shadow-[0_10px_30px_rgba(75,83,32,0.08)] sm:p-8">
          <h1 className="text-3xl font-bold tracking-tight text-[#4B5320] sm:text-4xl">Premium Dijkstra Simulator</h1>
          <p className="mt-3 max-w-3xl text-[#556B2F]">
            Interactive shortest path visualization with advanced controls, educational insights, and step-by-step execution.
          </p>
        </section>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          <div className="lg:col-span-3">
            <div className="space-y-6">
              <div className="rounded-3xl border border-[#D8CCA3] bg-[#F7F1DD]/90 p-6 shadow-[0_10px_30px_rgba(75,83,32,0.08)]">
                <h2 className="mb-4 text-lg font-semibold text-[#4B5320]">Graph Visualization</h2>

                <div className="flex justify-center overflow-x-auto rounded-2xl bg-[#F1E8C7] p-4">
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
                    {edges.map((edge, idx) => {
                      const fromNode = nodes.find((n) => n.id === edge.from);
                      const toNode = nodes.find((n) => n.id === edge.to);
                      if (!fromNode || !toNode) return null;

                      const x1 = (fromNode.x / 100) * svgWidth;
                      const y1 = (fromNode.y / 100) * svgHeight;
                      const x2 = (toNode.x / 100) * svgWidth;
                      const y2 = (toNode.y / 100) * svgHeight;

                      const isRelaxing = relaxingEdge && relaxingEdge.from === edge.from && relaxingEdge.to === edge.to;
                      const isOnPath =
                        shortestPathEdges.some((pe) => (pe.from === edge.from && pe.to === edge.to) || (pe.from === edge.to && pe.to === edge.from)) &&
                        algorithmState === "completed";

                      const midX = (x1 + x2) / 2;
                      const midY = (y1 + y2) / 2;

                      return (
                        <g key={`edge-${idx}`}>
                          <motion.line
                            x1={x1}
                            y1={y1}
                            x2={x2}
                            y2={y2}
                            stroke={isOnPath ? "#4B5320" : isRelaxing ? "#FF8C42" : "#D8CCA3"}
                            strokeWidth={isOnPath ? "4" : isRelaxing ? "3" : "2"}
                            strokeDasharray={isOnPath ? "5,5" : "0"}
                            filter={isRelaxing ? "url(#relaxGlow)" : isOnPath ? "url(#pathGlow)" : "none"}
                            animate={{
                              opacity: isOnPath ? 1 : isRelaxing ? [0.6, 1, 0.6] : 0.6,
                              strokeDashoffset: isOnPath ? [0, -10] : 0,
                            }}
                            transition={{
                              opacity: { duration: 0.4 },
                              strokeDashoffset: { repeat: Infinity, duration: 1 },
                            }}
                            className="transition-all"
                          />
                          <text
                            x={midX}
                            y={midY - 5}
                            textAnchor="middle"
                            className={`text-xs font-bold ${isOnPath ? "fill-[#4B5320]" : edge.weight < 0 ? "fill-red-600" : "fill-[#556B2F]"}`}
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
                        const isVisited = dijkstraState.visited.has(node.id);
                        const isActive = dijkstraState.currentNode === node.id;
                        const isSource = sourceNode === node.id;
                        const isDest = destinationNode === node.id;
                        const isOnPath = shortestPath?.path.includes(node.id) && algorithmState === "completed";
                        const nodeRadius = 24;

                        let fillColor = "#F7F1DD";
                        let strokeColor = "#D8CCA3";

                        if (isOnPath && algorithmState === "completed") {
                          fillColor = "#4B5320";
                          strokeColor = "#4B5320";
                        } else if (isActive) {
                          fillColor = "#AAB76A";
                          strokeColor = "#556B2F";
                        } else if (isSource || isDest) {
                          fillColor = "#FED66A";
                          strokeColor = "#AAB76A";
                        } else if (isVisited) {
                          fillColor = "#F1E8C7";
                          strokeColor = "#7D8F3B";
                        }

                        return (
                          <motion.g
                            key={`node-${node.id}`}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            whileHover={{ scale: 1.15 }}
                            transition={{ type: "spring", stiffness: 260, damping: 20 }}
                          >
                            <motion.circle
                              cx={x}
                              cy={y}
                              r={nodeRadius}
                              fill={fillColor}
                              stroke={strokeColor}
                              strokeWidth={isSource || isDest || isActive || isOnPath ? "4" : "3"}
                              animate={{
                                r: isActive ? 28 : isSource || isDest || isOnPath ? 26 : nodeRadius,
                              }}
                              transition={{ duration: 0.3 }}
                              className="transition-all duration-300"
                            />
                            <text
                              x={x}
                              y={y}
                              textAnchor="middle"
                              dominantBaseline="middle"
                              className={`pointer-events-none text-sm font-bold ${isOnPath && algorithmState === "completed" ? "fill-[#F7F1DD]" : "fill-[#4B5320]"}`}
                            >
                              {node.id}
                            </text>
                          </motion.g>
                        );
                      })}
                    </AnimatePresence>
                  </svg>
                </div>

                {nodes.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-6 rounded-2xl border-2 border-dashed border-[#D8CCA3] bg-[#F1E8C7] p-8 text-center"
                  >
                    <p className="text-sm text-[#556B2F]">Create nodes to start building your graph</p>
                  </motion.div>
                )}
              </div>

              <div className="rounded-3xl border border-[#D8CCA3] bg-[#F7F1DD]/90 p-6 shadow-[0_10px_30px_rgba(75,83,32,0.08)]">
                <h2 className="mb-4 text-lg font-semibold text-[#4B5320]">Distance Table</h2>
                <div className="overflow-x-auto rounded-2xl bg-[#F1E8C7] p-4">
                  <table className="min-w-full text-sm text-[#4B5320] font-mono">
                    <thead>
                      <tr className="border-b border-[#D8CCA3]">
                        <th className="px-4 py-2 text-left font-semibold text-[#556B2F]">Node</th>
                        <th className="px-4 py-2 text-left font-semibold text-[#556B2F]">Distance</th>
                        <th className="px-4 py-2 text-left font-semibold text-[#556B2F]">Previous</th>
                        <th className="px-4 py-2 text-left font-semibold text-[#556B2F]">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {nodes.map((node) => {
                        const distance = dijkstraState.distances[node.id];
                        const prev = dijkstraState.previous[node.id];
                        const isVisited = dijkstraState.visited.has(node.id);
                        const isOnPath = shortestPath?.path.includes(node.id);

                        let rowBg = "#F7F1DD";
                        if (node.id === dijkstraState.currentNode) rowBg = "#AAB76A";
                        else if (isOnPath && algorithmState === "completed") rowBg = "#4B5320";
                        else if (isVisited) rowBg = "#F1E8C7";

                        return (
                          <motion.tr
                            key={node.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            style={{ backgroundColor: rowBg }}
                            className="border-b border-[#D8CCA3] transition-colors"
                          >
                            <td className={`px-4 py-2 font-bold ${isOnPath && algorithmState === "completed" ? "text-[#F7F1DD]" : "text-[#7D8F3B]"}`}>
                              {node.id}
                            </td>
                            <td className={isOnPath && algorithmState === "completed" ? "px-4 py-2 text-[#F7F1DD]" : "px-4 py-2"}>
                              {distance === undefined ? "—" : distance === Infinity ? "∞" : distance}
                            </td>
                            <td className={isOnPath && algorithmState === "completed" ? "px-4 py-2 text-[#F7F1DD]" : "px-4 py-2"}>
                              {prev === null || prev === undefined ? "—" : prev}
                            </td>
                            <td className={`px-4 py-2 text-xs font-semibold ${isOnPath && algorithmState === "completed" ? "text-[#F7F1DD]" : ""}`}>
                              {node.id === dijkstraState.currentNode ? (
                                <span>Processing</span>
                              ) : isVisited ? (
                                <span>Visited</span>
                              ) : dijkstraState.unvisited.has(node.id) ? (
                                <span>Unvisited</span>
                              ) : (
                                <span>—</span>
                              )}
                            </td>
                          </motion.tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Route Summary Panel */}
              {algorithmState === "completed" && shortestPath && destinationNode !== null && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-3xl border-2 border-[#7D8F3B] bg-gradient-to-br from-[#F7F1DD] to-[#F1E8C7] p-6 shadow-[0_10px_30px_rgba(75,83,32,0.15)]"
                >
                  <h2 className="mb-4 text-lg font-semibold text-[#4B5320] flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" /> Route Summary
                  </h2>

                  <div className="space-y-4">
                    {/* Path visualization */}
                    <div className="rounded-2xl bg-white p-4 border border-[#D8CCA3]">
                      <p className="text-xs font-semibold text-[#556B2F] mb-2">SHORTEST PATH</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        {shortestPath.path.map((nodeId, idx) => (
                          <motion.div
                            key={`path-${nodeId}`}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: idx * 0.1 }}
                            className="flex items-center gap-2"
                          >
                            <div className="rounded-full bg-[#4B5320] text-white px-3 py-1 text-sm font-bold">
                              {nodeId}
                            </div>
                            {idx < shortestPath.path.length - 1 && <span className="text-[#7D8F3B] font-bold">→</span>}
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    {/* Cost breakdown */}
                    <div className="rounded-2xl bg-white p-4 border border-[#D8CCA3]">
                      <p className="text-xs font-semibold text-[#556B2F] mb-2">EDGE COSTS</p>
                      <div className="space-y-1 text-sm font-mono">
                        {shortestPath.path.map((node, idx) => {
                          if (idx >= shortestPath.path.length - 1) return null;
                          const nextNode = shortestPath.path[idx + 1];
                          const edge = edges.find(
                            (e) => (e.from === node && e.to === nextNode) || (e.from === nextNode && e.to === node)
                          );
                          return (
                            <div key={`edge-cost-${idx}`} className="flex justify-between text-[#4B5320]">
                              <span>
                                {node} → {nextNode}
                              </span>
                              <span className="font-bold text-[#7D8F3B]">{edge?.weight || 0}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Total cost */}
                    <div className="rounded-2xl bg-[#AAB76A] p-4 text-white">
                      <p className="text-xs font-semibold opacity-80">TOTAL PATH COST</p>
                      <p className="text-3xl font-bold mt-2">{totalPathCost}</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Priority Queue */}
              <div className="rounded-3xl border border-[#D8CCA3] bg-[#F7F1DD]/90 p-6 shadow-[0_10px_30px_rgba(75,83,32,0.08)]">
                <h2 className="mb-4 text-lg font-semibold text-[#4B5320]">Priority Queue</h2>
                <div className="flex flex-wrap gap-2 rounded-2xl bg-[#F1E8C7] p-4">
                  {dijkstraState.priorityQueue.length === 0 ? (
                    <p className="text-sm text-[#556B2F]">Queue empty</p>
                  ) : (
                    dijkstraState.priorityQueue
                      .sort((a, b) => a.distance - b.distance)
                      .map((item, idx) => (
                        <motion.div
                          key={`pq-${item.node}-${idx}`}
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className={`rounded-lg border px-2 py-1 text-xs font-mono ${
                            idx === 0
                              ? "border-[#7D8F3B] bg-white text-[#4B5320] ring-2 ring-[#AAB76A]"
                              : "border-[#D8CCA3] bg-[#F7F1DD] text-[#556B2F]"
                          }`}
                        >
                          ({item.node}, {item.distance})
                        </motion.div>
                      ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="flex flex-col gap-6">
            {/* Graph Builder */}
            <div className="rounded-3xl border border-[#D8CCA3] bg-[#F7F1DD]/90 p-6 shadow-[0_10px_30px_rgba(75,83,32,0.08)]">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-[#4B5320]">
                <Settings className="h-4 w-4" /> Graph Builder
              </h3>

              <div className="space-y-3">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAddNode}
                  disabled={algorithmState === "running"}
                  className="w-full rounded-xl bg-[#7D8F3B] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#556B2F] disabled:opacity-50"
                >
                  <Plus className="mb-1 inline h-4 w-4" /> Add Node
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowGenerateOptions(!showGenerateOptions)}
                  disabled={algorithmState === "running"}
                  className="w-full rounded-xl border-2 border-[#7D8F3B] bg-white px-4 py-2.5 text-sm font-medium text-[#7D8F3B] transition hover:bg-[#F1E8C7] disabled:opacity-50"
                >
                  <Download className="mb-1 inline h-4 w-4" /> Generate Graph
                </motion.button>

                {showGenerateOptions && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="rounded-xl bg-[#F1E8C7] p-3 space-y-3 text-sm"
                  >
                    <div>
                      <label className="text-xs font-semibold text-[#556B2F]">Nodes: {nodeCountInput}</label>
                      <input
                        type="range"
                        min="5"
                        max="20"
                        value={nodeCountInput}
                        onChange={(e) => setNodeCountInput(parseInt(e.target.value))}
                        className="w-full mt-1 accent-[#7D8F3B]"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-[#556B2F]">Density</label>
                      <div className="flex gap-2 mt-1">
                        {(["sparse", "medium", "dense"] as const).map((d) => (
                          <button
                            key={d}
                            onClick={() => setGraphDensity(d)}
                            className={`flex-1 rounded px-2 py-1 text-xs font-medium transition ${
                              graphDensity === d
                                ? "bg-[#7D8F3B] text-white"
                                : "bg-white border border-[#D8CCA3] text-[#556B2F]"
                            }`}
                          >
                            {d.charAt(0).toUpperCase() + d.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-[#556B2F]">Max Weight: {maxWeightInput}</label>
                      <input
                        type="range"
                        min="1"
                        max="20"
                        value={maxWeightInput}
                        onChange={(e) => setMaxWeightInput(parseInt(e.target.value))}
                        className="w-full mt-1 accent-[#7D8F3B]"
                      />
                    </div>

                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={() =>
                        handleGenerateGraphWithConfig({
                          nodes: nodeCountInput,
                          density: graphDensity,
                          maxWeight: maxWeightInput,
                        })
                      }
                      className="w-full rounded-lg bg-[#7D8F3B] px-3 py-2 text-xs font-semibold text-white hover:bg-[#556B2F]"
                    >
                      Generate
                    </motion.button>
                  </motion.div>
                )}

                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSourceOrDestMode("source")}
                  disabled={algorithmState === "running" || nodes.length === 0}
                  className={`w-full rounded-xl px-4 py-2.5 text-sm font-medium text-white transition ${
                    sourceOrDestMode === "source"
                      ? "bg-[#FED66A] text-[#4B5320]"
                      : "bg-[#9CA763] hover:bg-[#7D8F3B]"
                  } disabled:opacity-50`}
                >
                  Set Source Node
                </motion.button>

                {sourceNode !== null && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-lg border border-[#AAB76A] bg-[#F1E8C7] p-2 text-center text-xs font-medium text-[#556B2F]"
                  >
                    Source: Node {sourceNode}
                  </motion.div>
                )}

                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSourceOrDestMode("dest")}
                  disabled={algorithmState === "running" || nodes.length === 0}
                  className={`w-full rounded-xl px-4 py-2.5 text-sm font-medium text-white transition ${
                    sourceOrDestMode === "dest"
                      ? "bg-[#FED66A] text-[#4B5320]"
                      : "bg-[#AAB76A] hover:bg-[#7D8F3B]"
                  } disabled:opacity-50`}
                >
                  Set Destination Node
                </motion.button>

                {destinationNode !== null && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-lg border border-[#AAB76A] bg-[#F1E8C7] p-2 text-center text-xs font-medium text-[#556B2F]"
                  >
                    Destination: Node {destinationNode}
                  </motion.div>
                )}

                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handleClearGraph}
                  disabled={algorithmState === "running" || nodes.length === 0}
                  className="w-full rounded-xl border-2 border-red-300 bg-white px-4 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                >
                  <Trash2 className="mb-1 inline h-4 w-4" /> Clear Graph
                </motion.button>
              </div>
            </div>

            {/* Algorithm Controls */}
            <div className="rounded-3xl border border-[#D8CCA3] bg-[#F7F1DD]/90 p-6 shadow-[0_10px_30px_rgba(75,83,32,0.08)]">
              <h3 className="mb-4 text-lg font-semibold text-[#4B5320]">Algorithm Controls</h3>

              <div className="space-y-4">
                <div className="rounded-2xl border border-[#D8CCA3] bg-[#F1E8C7] p-4">
                  <label className="text-xs font-semibold uppercase tracking-wide text-[#556B2F]">
                    Execution: {executionMode === "auto" ? "Autoplay" : "Manual"}
                  </label>
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => setExecutionMode("auto")}
                      className={`flex-1 rounded px-2 py-1 text-xs font-medium transition ${
                        executionMode === "auto"
                          ? "bg-[#7D8F3B] text-white"
                          : "bg-white border border-[#D8CCA3]"
                      }`}
                    >
                      Auto
                    </button>
                    <button
                      onClick={() => setExecutionMode("manual")}
                      className={`flex-1 rounded px-2 py-1 text-xs font-medium transition ${
                        executionMode === "manual"
                          ? "bg-[#7D8F3B] text-white"
                          : "bg-white border border-[#D8CCA3]"
                      }`}
                    >
                      Manual
                    </button>
                  </div>
                </div>

                <div className="rounded-2xl border border-[#D8CCA3] bg-[#F1E8C7] p-4">
                  <label className="text-xs font-semibold uppercase tracking-wide text-[#556B2F]">
                    Speed: {speed.charAt(0).toUpperCase() + speed.slice(1)}
                  </label>
                  <div className="mt-3 flex items-center gap-3">
                    <span className="text-xs font-medium text-[#556B2F]">Slow</span>
                    <input
                      type="range"
                      min="0"
                      max="2"
                      value={speed === "slow" ? 0 : speed === "medium" ? 1 : 2}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setSpeed(val === 0 ? "slow" : val === 1 ? "medium" : "fast");
                      }}
                      disabled={algorithmState === "running"}
                      className="flex-1 cursor-pointer accent-[#7D8F3B] disabled:opacity-50"
                    />
                    <span className="text-xs font-medium text-[#556B2F]">Fast</span>
                  </div>
                </div>

                <div className="space-y-2">
                  {algorithmState === "idle" && (
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={handleStartAlgorithm}
                      disabled={sourceNode === null || nodes.length === 0}
                      className="w-full rounded-xl bg-[#7D8F3B] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#556B2F] disabled:opacity-50"
                    >
                      <Play className="mb-1 inline h-4 w-4" /> Start Algorithm
                    </motion.button>
                  )}

                  {algorithmState === "running" && (
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={handlePause}
                      className="w-full rounded-xl bg-[#9CA763] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#7D8F3B]"
                    >
                      <Pause className="mb-1 inline h-4 w-4" /> Pause
                    </motion.button>
                  )}

                  {algorithmState === "paused" && (
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={handleResume}
                      className="w-full rounded-xl bg-[#9CA763] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#7D8F3B]"
                    >
                      <Play className="mb-1 inline h-4 w-4" /> Resume
                    </motion.button>
                  )}

                  {(algorithmState === "paused" || algorithmState === "completed") && executionMode === "manual" && (
                    <>
                      <button
                        onClick={handlePreviousStep}
                        disabled={currentStep === 0}
                        className="w-full rounded-xl border-2 border-[#7D8F3B] bg-white px-4 py-2 text-sm font-medium text-[#7D8F3B] transition hover:bg-[#F1E8C7] disabled:opacity-30"
                      >
                        ← Previous Step
                      </button>
                      <button
                        onClick={handleNextStep}
                        disabled={currentStep >= snapshots.length - 1}
                        className="w-full rounded-xl border-2 border-[#7D8F3B] bg-white px-4 py-2 text-sm font-medium text-[#7D8F3B] transition hover:bg-[#F1E8C7] disabled:opacity-30"
                      >
                        Next Step →
                      </button>
                    </>
                  )}

                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={handleReset}
                    disabled={algorithmState === "idle"}
                    className="w-full rounded-xl border-2 border-[#7D8F3B] bg-white px-4 py-2.5 text-sm font-medium text-[#7D8F3B] transition hover:bg-[#F1E8C7] disabled:opacity-50"
                  >
                    <RotateCcw className="mb-1 inline h-4 w-4" /> Reset
                  </motion.button>
                </div>
              </div>
            </div>

            {/* Progress Tracking */}
            {algorithmState !== "idle" && (
              <div className="rounded-3xl border border-[#D8CCA3] bg-[#F7F1DD]/90 p-6 shadow-[0_10px_30px_rgba(75,83,32,0.08)]">
                <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-[#4B5320]">
                  <TrendingUp className="h-4 w-4" /> Progress
                </h3>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-xs font-semibold text-[#556B2F]">Completion</span>
                      <span className="text-xs font-bold text-[#7D8F3B]">{progressPercentage}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[#F1E8C7] overflow-hidden">
                      <motion.div
                        className="h-full bg-[#7D8F3B]"
                        animate={{ width: `${progressPercentage}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-lg bg-[#F1E8C7] p-2">
                      <p className="font-semibold text-[#556B2F]">Processed</p>
                      <p className="font-mono text-[#4B5320] text-lg">{nodesProcessed}/{nodes.length}</p>
                    </div>
                    <div className="rounded-lg bg-[#F1E8C7] p-2">
                      <p className="font-semibold text-[#556B2F]">Updated</p>
                      <p className="font-mono text-[#4B5320] text-lg">{distancesUpdated}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Statistics */}
            <div className="rounded-3xl border border-[#D8CCA3] bg-[#F7F1DD]/90 p-6 shadow-[0_10px_30px_rgba(75,83,32,0.08)]">
              <h3 className="mb-4 flex items-center justify-between text-lg font-semibold text-[#4B5320]">
                <span>Statistics</span>
                {algorithmState === "running" && (
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ repeat: Number.POSITIVE_INFINITY, duration: 2 }}
                    className="h-3 w-3 rounded-full bg-[#7D8F3B]"
                  />
                )}
              </h3>

              <div className="space-y-3 text-sm">
                <div className="rounded-lg border border-[#AAB76A] bg-[#F1E8C7] p-2">
                  <p className="text-xs font-semibold text-[#556B2F]">Total Nodes</p>
                  <p className="mt-1 font-mono text-[#4B5320]">{nodes.length}</p>
                </div>

                <div className="rounded-lg border border-[#AAB76A] bg-[#F1E8C7] p-2">
                  <p className="text-xs font-semibold text-[#556B2F]">Total Edges</p>
                  <p className="mt-1 font-mono text-[#4B5320]">{edges.length}</p>
                </div>

                {algorithmState !== "idle" && (
                  <>
                    <div className="rounded-lg border border-[#AAB76A] bg-[#F1E8C7] p-2">
                      <p className="text-xs font-semibold text-[#556B2F]">Time Complexity</p>
                      <p className="mt-1 font-mono text-[#7D8F3B]">O((V + E) log V)</p>
                    </div>

                    <div className="rounded-lg border border-[#AAB76A] bg-[#F1E8C7] p-2">
                      <p className="text-xs font-semibold text-[#556B2F]">Space Complexity</p>
                      <p className="mt-1 font-mono text-[#7D8F3B]">O(V)</p>
                    </div>
                  </>
                )}

                {shortestPath && (
                  <div className="rounded-lg border-2 border-[#7D8F3B] bg-[#F1E8C7] p-3">
                    <p className="text-xs font-semibold text-[#556B2F]">Shortest Path</p>
                    <p className="mt-2 font-mono text-sm text-[#4B5320]">
                      {shortestPath.path.join(" → ")}
                    </p>
                    <p className="mt-1 text-xs font-bold text-[#7D8F3B]">
                      Distance: {shortestPath.distance}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Graph Legend */}
            <div className="rounded-3xl border border-[#D8CCA3] bg-[#F7F1DD]/90 p-6 shadow-[0_10px_30px_rgba(75,83,32,0.08)]">
              <button
                onClick={() => setShowLegend(!showLegend)}
                className="w-full flex items-center justify-between text-lg font-semibold text-[#4B5320] hover:text-[#556B2F]"
              >
                <span className="flex items-center gap-2">
                  <Layers className="h-4 w-4" /> Graph Legend
                </span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${showLegend ? "rotate-180" : ""}`}
                />
              </button>

              {showLegend && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-4 space-y-2 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#FED66A] border-2 border-[#AAB76A]"></div>
                    <span className="text-[#556B2F]">Source/Destination Node</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#AAB76A]"></div>
                    <span className="text-[#556B2F]">Currently Processing</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#F1E8C7] border-2"></div>
                    <span className="text-[#556B2F]">Visited Node</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#4B5320]"></div>
                    <span className="text-[#556B2F]">On Shortest Path</span>
                  </div>
                  <div className="mt-3 pt-3 border-t border-[#D8CCA3]">
                    <p className="font-semibold text-[#4B5320] mb-2">Edge Styles</p>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-0.5 bg-[#FF8C42]"></div>
                        <span>Being relaxed (orange glow)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-0.5 bg-[#4B5320] border-b border-dashed"></div>
                        <span>Shortest path (blue dashes)</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Algorithm Steps */}
            <div className="rounded-3xl border border-[#D8CCA3] bg-[#F7F1DD]/90 p-6 shadow-[0_10px_30px_rgba(75,83,32,0.08)]">
              <h3 className="mb-4 text-lg font-semibold text-[#4B5320]">Algorithm Steps</h3>

              <div className="space-y-2 text-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#556B2F]">Recent Steps</p>
                <div className="max-h-80 space-y-2 overflow-y-auto rounded-lg bg-[#F1E8C7] p-3">
                  {steps.length === 0 ? (
                    <p className="text-xs text-[#556B2F]">No steps yet</p>
                  ) : (
                    steps.slice(-12).map((step, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`flex items-start gap-2 rounded px-2 py-1 text-xs ${
                          step.type === "complete"
                            ? "bg-[#AAB76A] text-white"
                            : step.type === "relax"
                              ? "bg-[#FED66A] text-[#4B5320]"
                              : step.type === "skip"
                                ? "bg-[#F1E8C7] text-[#556B2F]"
                                : "text-[#4B5320]"
                        }`}
                      >
                        <span className="mt-1 h-1 w-1 flex-shrink-0 rounded-full bg-current" />
                        <span className="flex-1">{step.explanation}</span>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Educational Info Cards */}
            <div className="space-y-3">
              {infoCards.map((card, idx) => (
                <motion.div
                  key={idx}
                  className="rounded-3xl border border-[#D8CCA3] bg-[#F7F1DD]/90 p-6 shadow-[0_10px_30px_rgba(75,83,32,0.08)]"
                >
                  <button
                    onClick={() => setExpandedInfoCard(expandedInfoCard === idx ? null : idx)}
                    className="w-full flex items-center justify-between text-lg font-semibold text-[#4B5320] hover:text-[#556B2F]"
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-xl">{card.icon}</span>
                      {card.title}
                    </span>
                    <ChevronRight
                      className={`h-4 w-4 transition-transform ${expandedInfoCard === idx ? "rotate-90" : ""}`}
                    />
                  </button>

                  {expandedInfoCard === idx && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="mt-3 text-sm text-[#556B2F] leading-relaxed"
                    >
                      {card.content}
                    </motion.p>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
