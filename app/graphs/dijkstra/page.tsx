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
  Download,
  ChevronDown,
  ChevronUp,
  Activity,
  Layers,
  BookOpen,
  AlertTriangle,
  TrendingUp,
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
  timestamp: number;
};

type GraphDensity = "sparse" | "medium" | "dense";

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
    case "slow": return 1.8;
    case "medium": return 1;
    case "fast": return 0.5;
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

  // UI state
  const [sourceNode, setSourceNode] = useState<number | null>(null);
  const [destinationNode, setDestinationNode] = useState<number | null>(null);
  const [speed, setSpeed] = useState<SpeedLevel>("medium");
  const [steps, setSteps] = useState<VisualizationStep[]>([]);
  const [activeEdge, setActiveEdge] = useState<{ from: number; to: number } | null>(null);
  const [relaxingEdge, setRelaxingEdge] = useState<{ from: number; to: number; weight: number } | null>(null);
  const [draggingNode, setDraggingNode] = useState<number | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [sourceOrDestMode, setSourceOrDestMode] = useState<"source" | "dest" | null>(null);
  const [nodesProcessed, setNodesProcessed] = useState(0);
  const [distancesUpdated, setDistancesUpdated] = useState(0);

  // Edge creation state
  const [edgeMode, setEdgeMode] = useState(false);
  const [edgeFrom, setEdgeFrom] = useState<number | null>(null);
  const [edgeTo, setEdgeTo] = useState<number | null>(null);
  const [weightInput, setWeightInput] = useState("");
  const [showWeightModal, setShowWeightModal] = useState(false);

  // Generate graph modal state
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generateNodeCount, setGenerateNodeCount] = useState(8);

  // Panel state
  const [expandedSections, setExpandedSections] = useState({
    queue: true,
    distances: true,
    steps: true,
    summary: true,
  });

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

  const hasNegativeWeights = useMemo(() => edges.some((e) => e.weight < 0), [edges]);

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

  const progressPercentage = useMemo(() => {
    if (nodes.length === 0) return 0;
    return Math.round((nodesProcessed / nodes.length) * 100);
  }, [nodesProcessed, nodes.length]);

  // Handlers
  const handleAddNode = () => {
    const newId = nextNodeId;
    const position = generateNodePosition(nodes.length + 1, nodes.length);
    setNodes([...nodes, { id: newId, x: position.x, y: position.y }]);
    setNextNodeId(newId + 1);
  };

  const handleDeleteNode = (id: number) => {
    setNodes(nodes.filter((n) => n.id !== id));
    setEdges(edges.filter((e) => e.from !== id && e.to !== id));
    if (sourceNode === id) setSourceNode(null);
    if (destinationNode === id) setDestinationNode(null);
  };

  const handleGenerateGraph = (config: { nodes: number; density: GraphDensity; maxWeight: number }) => {
    const nodeCount = config.nodes;
    const newNodes: GraphNode[] = [];
    for (let i = 0; i < nodeCount; i++) {
      const position = generateNodePosition(nodeCount, i);
      newNodes.push({ id: i + 1, x: position.x, y: position.y });
    }

    const newEdges: WeightedEdge[] = [];
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
  };

  const handleClearGraph = () => {
    setNodes([]);
    setEdges([]);
    setNextNodeId(1);
    setSourceNode(null);
    setDestinationNode(null);
    handleReset();
  };

  const handleNodeClick = (nodeId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (algorithmState === "running") return;

    if (sourceOrDestMode === "source") {
      setSourceNode(nodeId);
      setSourceOrDestMode(null);
    } else if (sourceOrDestMode === "dest") {
      setDestinationNode(nodeId);
      setSourceOrDestMode(null);
    } else if (edgeMode) {
      if (edgeFrom === null) {
        setEdgeFrom(nodeId);
      } else if (edgeFrom === nodeId) {
        setEdgeFrom(null);
      } else {
        setEdgeTo(nodeId);
        setWeightInput("");
        setShowWeightModal(true);
      }
    }
  };

  const handleAddEdge = () => {
    if (edgeFrom === null || edgeTo === null || !weightInput) return;
    const weight = parseInt(weightInput);
    if (isNaN(weight) || weight <= 0) return;

    const newEdge: WeightedEdge = { from: edgeFrom, to: edgeTo, weight };
    setEdges([...edges, newEdge]);
    setEdgeFrom(null);
    setEdgeTo(null);
    setWeightInput("");
    setShowWeightModal(false);
  };

  const handleSvgMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (algorithmState === "running") return;
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    for (const node of nodes) {
      const distance = Math.sqrt((x - node.x) ** 2 + (y - node.y) ** 2);
      if (distance < 5) {
        setDraggingNode(node.id);
        setDragStart({ x: x - node.x, y: y - node.y });
        return;
      }
    }
  };

  const handleSvgMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (draggingNode === null) return;
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
    setSteps([]);
    setActiveEdge(null);
    setRelaxingEdge(null);
    setNodesProcessed(0);
    setDistancesUpdated(0);
  };

  const handleStartAlgorithm = async () => {
    if (sourceNode === null || nodes.length === 0) return;
    if (hasNegativeWeights) {
      alert("⚠️ Dijkstra does not support negative edge weights.");
      return;
    }

    setAlgorithmState("running");
    setSteps([]);
    setActiveEdge(null);
    setRelaxingEdge(null);
    setNodesProcessed(0);
    setDistancesUpdated(0);

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
      {
        explanation: `📍 Step 1: Initialize distances. Set distance[${sourceNode}] = 0 (source), all others = ∞. Add ${sourceNode} to priority queue.`,
        type: "init",
        timestamp: Date.now()
      },
    ]);
    await speedSleep(800);

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

      if (minNode === null || minDistance === Infinity) break;

      setDijkstraState((prev) => ({
        ...prev,
        currentNode: minNode,
      }));

      processed++;
      setNodesProcessed(processed);

      const unvisitedCount = unvisited.size - 1;
      setSteps((prev) => [
        ...prev,
        {
          explanation: `🎯 Select node ${minNode} with distance ${minDistance}. It has the minimum distance among unvisited nodes (${unvisitedCount} remaining). Mark as visited.`,
          type: "select",
          timestamp: Date.now(),
        },
      ]);
      await speedSleep(600);

      const neighbors = weightedAdjacencyList[minNode] || [];
      for (const { nodeId: neighbor, weight } of neighbors) {
        if (!visited.has(neighbor)) {
          const newDistance = distances[minNode] + weight;
          const oldDistance = distances[neighbor];

          setRelaxingEdge({ from: minNode, to: neighbor, weight });
          await speedSleep(300);

          if (newDistance < oldDistance) {
            distances[neighbor] = newDistance;
            previous[neighbor] = minNode;
            updated++;
            setDistancesUpdated(updated);

            const oldDistDisplay = oldDistance === Infinity ? "∞" : oldDistance;
            const formula = `distance[${minNode}] + weight(${minNode}→${neighbor}) = ${distances[minNode]} + ${weight} = ${newDistance}`;
            setSteps((prev) => [
              ...prev,
              {
                explanation: `✅ Relax edge ${minNode}→${neighbor} (weight ${weight}). Found shorter path! ${formula}. Update distance[${neighbor}]: ${oldDistDisplay} → ${newDistance}`,
                type: "relax",
                timestamp: Date.now(),
              },
            ]);

            setDijkstraState((prev) => ({
              ...prev,
              distances: { ...distances },
              previous: { ...previous },
            }));
          } else {
            const oldDistDisplay = oldDistance === Infinity ? "∞" : oldDistance;
            const formula = `distance[${minNode}] + weight(${minNode}→${neighbor}) = ${distances[minNode]} + ${weight} = ${newDistance}`;
            setSteps((prev) => [
              ...prev,
              {
                explanation: `⏭️ Skip edge ${minNode}→${neighbor} (weight ${weight}). ${formula} ≥ ${oldDistDisplay}. No improvement, keep current best distance.`,
                type: "skip",
                timestamp: Date.now(),
              },
            ]);
          }
          await speedSleep(400);
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

      await speedSleep(400);
    }

    setAlgorithmState("completed");
    setDijkstraState((prev) => ({
      ...prev,
      currentNode: null,
    }));
    setRelaxingEdge(null);
    setSteps((prev) => [
      ...prev,
      {
        explanation: `🎉 Algorithm Complete! Processed all ${processed} nodes. Found ${updated} distance improvements. All shortest paths from source node ${sourceNode} determined. Shortest path algorithm (Dijkstra) guarantees these distances are optimal.`,
        type: "complete",
        timestamp: Date.now(),
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

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const svgHeight = 500;
  const svgWidth = 700;

  // Status message
  let statusMessage = "Ready";
  if (algorithmState === "running") statusMessage = "Running...";
  else if (algorithmState === "paused") statusMessage = "Paused";
  else if (algorithmState === "completed") statusMessage = "Completed ✓";

  return (
    <main className="min-h-screen bg-[#F1E8C7] text-[#4B5320]">
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

      {/* Header */}
      <div className="sticky top-0 z-40 border-b border-[#D8CCA3] bg-[#F7F1DD]/95 backdrop-blur p-4 shadow-sm">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <div>
            <Link href="/graphs" className="text-sm font-medium text-[#556B2F] hover:text-[#4B5320]">
              ← Back to graphs
            </Link>
            <h1 className="text-2xl font-bold text-[#4B5320] mt-1">Dijkstra Algorithm Visualizer</h1>
          </div>
          <div className="text-right">
            <div className="text-sm font-semibold text-[#7D8F3B]">{statusMessage}</div>
            <div className="text-xs text-[#556B2F]">
              {sourceNode && destinationNode
                ? `${sourceNode} → ${destinationNode}`
                : "Select nodes"}
            </div>
          </div>
        </div>
      </div>

      {/* Warnings */}
      {hasNegativeWeights && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mx-auto max-w-7xl px-4 pt-4"
        >
          <div className="rounded-xl border-2 border-red-400 bg-red-50 p-3 flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">Negative weights detected - results may be incorrect</p>
          </div>
        </motion.div>
      )}

      {/* Main Dashboard */}
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Graph Visualization (70%) */}
          <div className="lg:col-span-2">
            <div className="rounded-3xl border border-[#D8CCA3] bg-[#F7F1DD]/90 p-6 shadow-lg">
              <div className="flex justify-center rounded-2xl bg-[#F1E8C7] p-4">
                <svg
                  width={svgWidth}
                  height={svgHeight}
                  className="cursor-grab active:cursor-grabbing"
                  onMouseDown={handleSvgMouseDown}
                  onMouseMove={handleSvgMouseMove}
                  onMouseUp={handleSvgMouseUp}
                  onMouseLeave={handleSvgMouseUp}
                  onClick={handleSvgClick}
                >
                  {/* Edges */}
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
                      shortestPathEdges.some(
                        (pe) => (pe.from === edge.from && pe.to === edge.to) || (pe.from === edge.to && pe.to === edge.from)
                      ) && algorithmState === "completed";

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

                  {/* Nodes */}
                  <AnimatePresence>
                    {nodes.map((node) => {
                      const x = (node.x / 100) * svgWidth;
                      const y = (node.y / 100) * svgHeight;
                      const isVisited = dijkstraState.visited.has(node.id);
                      const isActive = dijkstraState.currentNode === node.id;
                      const isSource = sourceNode === node.id;
                      const isDest = destinationNode === node.id;
                      const isOnPath = shortestPath?.path.includes(node.id) && algorithmState === "completed";

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

                      const isSelectedForEdge = edgeFrom === node.id;
                      const strokeWidthVal = isSelectedForEdge ? "5" : isSource || isDest || isActive || isOnPath ? "4" : "3";

                      return (
                        <motion.g
                          key={`node-${node.id}`}
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          whileHover={{ scale: 1.15 }}
                          transition={{ type: "spring", stiffness: 260, damping: 20 }}
                          onClick={(e) => handleNodeClick(node.id, e as unknown as React.MouseEvent)}
                          style={{ cursor: edgeMode || sourceOrDestMode ? "pointer" : "grab" }}
                        >
                          <motion.circle
                            cx={x}
                            cy={y}
                            r={24}
                            fill={fillColor}
                            stroke={isSelectedForEdge ? "#FF6B6B" : strokeColor}
                            strokeWidth={strokeWidthVal}
                            animate={{
                              r: isActive || isSelectedForEdge ? 28 : isSource || isDest || isOnPath ? 26 : 24,
                            }}
                            transition={{ duration: 0.3 }}
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
                          {algorithmState === "idle" && (
                            <motion.circle
                              cx={x + 16}
                              cy={y - 16}
                              r={8}
                              fill="#FF6B6B"
                              stroke="#fff"
                              strokeWidth="1.5"
                              opacity={0}
                              whileHover={{ opacity: 1 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteNode(node.id);
                              }}
                              style={{ cursor: "pointer" }}
                            >
                              <title>Delete node</title>
                            </motion.circle>
                          )}
                        </motion.g>
                      );
                    })}
                  </AnimatePresence>
                </svg>
              </div>

              {nodes.length === 0 && (
                <div className="mt-4 text-center text-sm text-[#556B2F]">
                  Create nodes or generate a graph to start
                </div>
              )}
            </div>
          </div>

          {/* Right: Sticky Control Panel (30%) */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4 max-h-[calc(100vh-150px)] overflow-y-auto rounded-3xl border border-[#D8CCA3] bg-[#F7F1DD]/90 p-5 shadow-lg">
              {/* Graph Controls */}
              <div className="space-y-2">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-[#4B5320]">
                  <Settings className="h-4 w-4" /> Controls
                </h3>
                <div className="space-y-2">
                  <button
                    onClick={handleAddNode}
                    disabled={algorithmState === "running"}
                    className="w-full rounded-lg bg-[#7D8F3B] px-3 py-2 text-xs font-medium text-white hover:bg-[#556B2F] disabled:opacity-50"
                  >
                    <Plus className="mb-1 inline h-3 w-3" /> Add Node
                  </button>

                  <button
                    onClick={() => setEdgeMode(!edgeMode)}
                    disabled={nodes.length < 2 || algorithmState === "running"}
                    className={`w-full rounded-lg px-3 py-2 text-xs font-medium transition ${
                      edgeMode
                        ? "bg-[#FF6B6B] text-white"
                        : "border border-[#FF9999] bg-white text-[#FF6B6B] hover:bg-[#FFE5E5]"
                    } disabled:opacity-50`}
                  >
                    {edgeFrom ? `Connect to node (from ${edgeFrom})` : "➕ Add Edge"}
                  </button>

                  <button
                    onClick={() => setShowGenerateModal(true)}
                    disabled={algorithmState === "running"}
                    className="w-full rounded-lg border border-[#7D8F3B] bg-white px-3 py-2 text-xs font-medium text-[#7D8F3B] hover:bg-[#F1E8C7] disabled:opacity-50"
                  >
                    <Download className="mb-1 inline h-3 w-3" /> Generate
                  </button>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setSourceOrDestMode("source")}
                      disabled={nodes.length === 0 || algorithmState === "running"}
                      className={`flex-1 rounded-lg px-2 py-2 text-xs font-medium transition ${
                        sourceOrDestMode === "source"
                          ? "bg-[#FED66A] text-[#4B5320]"
                          : "bg-[#9CA763] text-white hover:bg-[#7D8F3B]"
                      } disabled:opacity-50`}
                    >
                      From: {sourceNode || "—"}
                    </button>
                    <button
                      onClick={() => setSourceOrDestMode("dest")}
                      disabled={nodes.length === 0 || algorithmState === "running"}
                      className={`flex-1 rounded-lg px-2 py-2 text-xs font-medium transition ${
                        sourceOrDestMode === "dest"
                          ? "bg-[#FED66A] text-[#4B5320]"
                          : "bg-[#AAB76A] text-white hover:bg-[#7D8F3B]"
                      } disabled:opacity-50`}
                    >
                      To: {destinationNode || "—"}
                    </button>
                  </div>

                  <button
                    onClick={handleClearGraph}
                    disabled={nodes.length === 0 || algorithmState === "running"}
                    className="w-full rounded-lg border border-red-300 bg-white px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    <Trash2 className="mb-1 inline h-3 w-3" /> Clear
                  </button>
                </div>
              </div>

              <div className="border-t border-[#D8CCA3]"></div>

              {/* Algorithm Controls */}
              <div className="space-y-2">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-[#4B5320]">
                  <Play className="h-4 w-4" /> Algorithm
                </h3>

                <div className="space-y-2">
                  <div className="flex gap-2">
                    <label className="flex-1">
                      <div className="text-xs font-semibold text-[#556B2F] mb-1">Speed</div>
                      <select
                        value={speed}
                        onChange={(e) => setSpeed(e.target.value as SpeedLevel)}
                        disabled={algorithmState === "running"}
                        className="w-full rounded px-2 py-1 text-xs border border-[#D8CCA3] bg-white text-[#4B5320]"
                      >
                        <option value="slow">Slow</option>
                        <option value="medium">Medium</option>
                        <option value="fast">Fast</option>
                      </select>
                    </label>
                  </div>

                  <div className="flex gap-2">
                    {algorithmState === "idle" && (
                      <button
                        onClick={handleStartAlgorithm}
                        disabled={sourceNode === null || nodes.length === 0}
                        className="flex-1 rounded-lg bg-[#7D8F3B] px-3 py-2 text-xs font-semibold text-white hover:bg-[#556B2F] disabled:opacity-50"
                      >
                        <Play className="mb-1 inline h-3 w-3" /> Start
                      </button>
                    )}

                    {algorithmState === "running" && (
                      <button
                        onClick={handlePause}
                        className="flex-1 rounded-lg bg-[#9CA763] px-3 py-2 text-xs font-semibold text-white hover:bg-[#7D8F3B]"
                      >
                        <Pause className="mb-1 inline h-3 w-3" /> Pause
                      </button>
                    )}

                    {algorithmState === "paused" && (
                      <button
                        onClick={handleResume}
                        className="flex-1 rounded-lg bg-[#9CA763] px-3 py-2 text-xs font-semibold text-white hover:bg-[#7D8F3B]"
                      >
                        <Play className="mb-1 inline h-3 w-3" /> Resume
                      </button>
                    )}

                    {algorithmState !== "idle" && (
                      <button
                        onClick={handleReset}
                        className="flex-1 rounded-lg border border-[#7D8F3B] bg-white px-3 py-2 text-xs font-semibold text-[#7D8F3B] hover:bg-[#F1E8C7]"
                      >
                        <RotateCcw className="mb-1 inline h-3 w-3" /> Reset
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Progress */}
              {algorithmState !== "idle" && (
                <>
                  <div className="border-t border-[#D8CCA3]"></div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-semibold text-[#556B2F]">
                      <span>Progress</span>
                      <span>{progressPercentage}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-[#F1E8C7] overflow-hidden">
                      <motion.div
                        className="h-full bg-[#7D8F3B]"
                        animate={{ width: `${progressPercentage}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded bg-[#F1E8C7] p-2">
                        <p className="font-semibold text-[#556B2F]">Processed</p>
                        <p className="font-mono text-lg text-[#4B5320]">{nodesProcessed}/{nodes.length}</p>
                      </div>
                      <div className="rounded bg-[#F1E8C7] p-2">
                        <p className="font-semibold text-[#556B2F]">Updated</p>
                        <p className="font-mono text-lg text-[#4B5320]">{distancesUpdated}</p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Collapsible Sections */}
              <div className="border-t border-[#D8CCA3]"></div>

              {/* Queue Section */}
              <CollapsibleSection
                title="Priority Queue"
                expanded={expandedSections.queue}
                onToggle={() => toggleSection("queue")}
              >
                <div className="flex flex-wrap gap-1">
                  {dijkstraState.priorityQueue.length === 0 ? (
                    <p className="text-xs text-[#556B2F]">Empty</p>
                  ) : (
                    dijkstraState.priorityQueue
                      .sort((a, b) => a.distance - b.distance)
                      .slice(0, 5)
                      .map((item, idx) => (
                        <div
                          key={idx}
                          className={`rounded px-2 py-1 text-xs font-mono ${
                            idx === 0
                              ? "bg-[#7D8F3B] text-white"
                              : "bg-[#F1E8C7] text-[#556B2F]"
                          }`}
                        >
                          ({item.node}, {item.distance})
                        </div>
                      ))
                  )}
                </div>
              </CollapsibleSection>

              {/* Distance Table Section */}
              <CollapsibleSection
                title="Distances"
                expanded={expandedSections.distances}
                onToggle={() => toggleSection("distances")}
              >
                <div className="space-y-1 text-xs">
                  {nodes.slice(0, 6).map((node) => (
                    <div key={node.id} className="flex justify-between p-1 rounded bg-[#F1E8C7]">
                      <span className="font-semibold text-[#7D8F3B]">Node {node.id}:</span>
                      <span className="font-mono text-[#4B5320]">
                        {dijkstraState.distances[node.id] === Infinity
                          ? "∞"
                          : dijkstraState.distances[node.id]}
                      </span>
                    </div>
                  ))}
                  {nodes.length > 6 && (
                    <p className="text-[#556B2F] italic">+{nodes.length - 6} more</p>
                  )}
                </div>
              </CollapsibleSection>

              {/* Steps Section */}
              <CollapsibleSection
                title="Steps"
                expanded={expandedSections.steps}
                onToggle={() => toggleSection("steps")}
              >
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {steps.slice(-6).map((step, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`rounded px-2 py-1 text-xs leading-snug ${
                        step.type === "complete"
                          ? "bg-[#AAB76A] text-white"
                          : step.type === "relax"
                            ? "bg-[#FED66A] text-[#4B5320]"
                            : "bg-[#F1E8C7] text-[#556B2F]"
                      }`}
                    >
                      {step.explanation}
                    </motion.div>
                  ))}
                </div>
              </CollapsibleSection>

              {/* Summary Section */}
              {shortestPath && algorithmState === "completed" && (
                <CollapsibleSection
                  title="Route"
                  expanded={expandedSections.summary}
                  onToggle={() => toggleSection("summary")}
                >
                  <div className="space-y-2">
                    <div className="text-xs font-mono p-2 rounded bg-[#F1E8C7] text-[#4B5320]">
                      {shortestPath.path.join(" → ")}
                    </div>
                    <div className="text-xs font-semibold text-[#7D8F3B] text-center">
                      Distance: {shortestPath.distance}
                    </div>
                  </div>
                </CollapsibleSection>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Weight Input Modal */}
      {showWeightModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#F7F1DD] rounded-3xl p-6 border border-[#D8CCA3] shadow-lg max-w-sm"
          >
            <h3 className="text-lg font-bold text-[#4B5320] mb-3">
              Connect node {edgeFrom} to node {edgeTo}
            </h3>
            <p className="text-sm text-[#556B2F] mb-4">Enter edge weight:</p>
            <input
              type="number"
              value={weightInput}
              onChange={(e) => setWeightInput(e.target.value)}
              placeholder="Weight"
              min="1"
              className="w-full px-3 py-2 border border-[#D8CCA3] rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-[#7D8F3B]"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowWeightModal(false);
                  setEdgeFrom(null);
                  setEdgeTo(null);
                }}
                className="flex-1 rounded-lg border border-[#D8CCA3] px-3 py-2 text-sm font-medium text-[#556B2F] hover:bg-[#F1E8C7]"
              >
                Cancel
              </button>
              <button
                onClick={handleAddEdge}
                disabled={!weightInput}
                className="flex-1 rounded-lg bg-[#7D8F3B] px-3 py-2 text-sm font-medium text-white hover:bg-[#556B2F] disabled:opacity-50"
              >
                Add Edge
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Generate Graph Modal */}
      <AnimatePresence>
        {showGenerateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowGenerateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              className="bg-[#F7F1DD] rounded-2xl p-6 shadow-xl max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold text-[#4B5320] mb-4">Generate Random Graph</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-[#556B2F] mb-2">
                    Number of Nodes: <span className="text-[#7D8F3B]">{generateNodeCount}</span>
                  </label>
                  <input
                    type="range"
                    min="3"
                    max="15"
                    value={generateNodeCount}
                    onChange={(e) => setGenerateNodeCount(parseInt(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-[#556B2F] mt-1">
                    <span>3</span>
                    <span>15</span>
                  </div>
                </div>

                <div className="bg-[#F1E8C7] rounded-lg p-3 border border-[#D8CCA3]">
                  <p className="text-xs font-semibold text-[#556B2F]">Density: Medium (50% edges)</p>
                  <p className="text-xs text-[#7D8F3B] mt-1">Creates a connected graph with balanced connectivity</p>
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <button
                  onClick={() => {
                    handleGenerateGraph({ nodes: generateNodeCount, density: "medium", maxWeight: 15 });
                    setShowGenerateModal(false);
                  }}
                  className="flex-1 bg-[#7D8F3B] text-white px-4 py-2 rounded-lg hover:bg-[#556B2F] font-medium"
                >
                  Generate
                </button>
                <button
                  onClick={() => setShowGenerateModal(false)}
                  className="flex-1 border border-[#D8CCA3] px-4 py-2 rounded-lg hover:bg-[#F1E8C7]"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

// Collapsible Section Component
function CollapsibleSection({
  title,
  expanded,
  onToggle,
  children,
}: {
  title: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-[#D8CCA3] rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-2 hover:bg-[#F1E8C7] transition text-sm font-semibold text-[#4B5320]"
      >
        <span className="flex items-center gap-2">
          <Layers className="h-3 w-3" /> {title}
        </span>
        {expanded ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </button>

      {expanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="border-t border-[#D8CCA3] bg-[#F1E8C7] p-2"
        >
          {children}
        </motion.div>
      )}
    </div>
  );
}
