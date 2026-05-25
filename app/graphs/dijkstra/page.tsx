"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Plus, Trash2, Settings, RotateCcw, Play, Pause, Zap, Info } from "lucide-react";
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
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<WeightedEdge[]>([]);
  const [nextNodeId, setNextNodeId] = useState(1);

  const [algorithmState, setAlgorithmState] = useState<AlgorithmState>("idle");
  const [dijkstraState, setDijkstraState] = useState<DijkstraState>({
    unvisited: new Set(),
    distances: {},
    previous: {},
    visited: new Set(),
    currentNode: null,
    priorityQueue: [],
  });

  const [sourceNode, setSourceNode] = useState<number | null>(null);
  const [destinationNode, setDestinationNode] = useState<number | null>(null);
  const [speed, setSpeed] = useState<SpeedLevel>("medium");
  const [steps, setSteps] = useState<VisualizationStep[]>([
    { explanation: "Select a source node to start Dijkstra's algorithm." },
  ]);
  const [activeEdge, setActiveEdge] = useState<{ from: number; to: number } | null>(null);
  const [relaxingEdge, setRelaxingEdge] = useState<{ from: number; to: number; weight: number } | null>(null);
  const [relaxationImproved, setRelaxationImproved] = useState(false);
  const [draggingNode, setDraggingNode] = useState<number | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [sourceOrDestMode, setSourceOrDestMode] = useState<"source" | "dest" | null>(null);
  const [nodesProcessed, setNodesProcessed] = useState(0);
  const [distancesUpdated, setDistancesUpdated] = useState(0);

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

  const handleAddEdge = (from: number, to: number, weight: number) => {
    if (from === to) return;

    const edgeExists = edges.some(
      (e) => (e.from === from && e.to === to) || (e.from === to && e.to === from)
    );

    if (!edgeExists) {
      setEdges([...edges, { from, to, weight }]);
    }

    setSourceOrDestMode(null);
  };

  const handleDeleteEdge = (from: number, to: number) => {
    setEdges(edges.filter((e) => !((e.from === from && e.to === to) || (e.from === to && e.to === from))));
  };

  const handleGenerateGraph = () => {
    const nodeCount = Math.floor(Math.random() * 3) + 6;
    const newNodes: GraphNode[] = [];
    for (let i = 0; i < nodeCount; i++) {
      const position = generateNodePosition(nodeCount, i);
      newNodes.push({ id: i + 1, x: position.x, y: position.y });
    }

    const newEdges: WeightedEdge[] = [];
    const edgeCount = Math.floor(Math.random() * 5) + 8;
    for (let i = 0; i < edgeCount; i++) {
      const from = newNodes[Math.floor(Math.random() * newNodes.length)].id;
      const to = newNodes[Math.floor(Math.random() * newNodes.length)].id;
      const weight = Math.floor(Math.random() * 9) + 1;
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
    setSteps([{ explanation: "Select a source node to start Dijkstra's algorithm." }]);
    setActiveEdge(null);
    setRelaxingEdge(null);
    setNodesProcessed(0);
    setDistancesUpdated(0);
  };

  const handleStartAlgorithm = async () => {
    if (sourceNode === null || nodes.length === 0) return;

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
      { explanation: `🟢 Starting Dijkstra from source node ${sourceNode}`, type: "init" },
      { explanation: `Set distance[${sourceNode}] = 0, all others = ∞`, type: "init" },
      { explanation: `Added node ${sourceNode} to priority queue`, type: "init" },
    ]);
    await speedSleep(1200);

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

            setRelaxationImproved(true);
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
            setRelaxationImproved(false);
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

      setActiveEdge(null);
      await speedSleep(500);
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

  const svgHeight = 400;
  const svgWidth = 600;

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

        <section className="rounded-3xl border border-[#D8CCA3] bg-[#F7F1DD]/90 p-6 shadow-[0_10px_30px_rgba(75,83,32,0.08)] sm:p-8">
          <h1 className="text-3xl font-bold tracking-tight text-[#4B5320] sm:text-4xl">Dijkstra Algorithm Visualizer</h1>
          <p className="mt-3 max-w-3xl text-[#556B2F]">
            Visualize shortest path calculation step-by-step using weighted graphs.
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
                            className={`text-xs font-bold ${isOnPath ? "fill-[#4B5320]" : "fill-[#556B2F]"}`}
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

          <div className="flex flex-col gap-6">
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
                  onClick={handleGenerateGraph}
                  disabled={algorithmState === "running"}
                  className="w-full rounded-xl border-2 border-[#7D8F3B] bg-white px-4 py-2.5 text-sm font-medium text-[#7D8F3B] transition hover:bg-[#F1E8C7] disabled:opacity-50"
                >
                  <Zap className="mb-1 inline h-4 w-4" /> Generate Graph
                </motion.button>

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

            <div className="rounded-3xl border border-[#D8CCA3] bg-[#F7F1DD]/90 p-6 shadow-[0_10px_30px_rgba(75,83,32,0.08)]">
              <h3 className="mb-4 text-lg font-semibold text-[#4B5320]">Algorithm Controls</h3>

              <div className="space-y-4">
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
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={handleStartAlgorithm}
                    disabled={algorithmState === "running" || sourceNode === null || nodes.length === 0}
                    className="w-full rounded-xl bg-[#7D8F3B] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#556B2F] disabled:opacity-50"
                  >
                    <Play className="mb-1 inline h-4 w-4" /> Start Algorithm
                  </motion.button>

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

                <div className="rounded-lg border border-[#AAB76A] bg-[#F1E8C7] p-2">
                  <p className="text-xs font-semibold text-[#556B2F]">Nodes Processed</p>
                  <p className="mt-1 font-mono text-[#4B5320]">{nodesProcessed}</p>
                </div>

                <div className="rounded-lg border border-[#AAB76A] bg-[#F1E8C7] p-2">
                  <p className="text-xs font-semibold text-[#556B2F]">Distances Updated</p>
                  <p className="mt-1 font-mono text-[#4B5320]">{distancesUpdated}</p>
                </div>

                {algorithmState !== "idle" && (
                  <div className="rounded-lg border border-[#AAB76A] bg-[#F1E8C7] p-2">
                    <p className="text-xs font-semibold text-[#556B2F]">Time Complexity</p>
                    <p className="mt-1 font-mono text-[#7D8F3B]">O((V + E) log V)</p>
                  </div>
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

            {algorithmState === "completed" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-3xl border-2 border-[#7D8F3B] bg-[#F7F1DD]/90 p-6 shadow-[0_10px_30px_rgba(75,83,32,0.08)]"
              >
                <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-[#4B5320]">
                  <Info className="h-4 w-4" /> How Dijkstra Works
                </h3>

                <div className="space-y-3 text-sm text-[#556B2F]">
                  <div>
                    <p className="font-semibold text-[#4B5320]">🎯 Greedy Strategy</p>
                    <p className="mt-1 text-xs">Always process the unvisited node with the smallest distance. Once visited, its shortest path is permanent.</p>
                  </div>

                  <div>
                    <p className="font-semibold text-[#4B5320]">✏️ Edge Relaxation</p>
                    <p className="mt-1 text-xs">For each neighbor of the current node, check if going through it provides a shorter path. Update if found.</p>
                  </div>

                  <div>
                    <p className="font-semibold text-[#4B5320]">⚡ Time Complexity</p>
                    <p className="mt-1 text-xs font-mono">O((V + E) log V) with a binary heap priority queue</p>
                  </div>

                  <div className="rounded-lg border border-[#AAB76A] bg-[#F1E8C7] p-2 text-xs">
                    <p className="font-semibold">Key Insight:</p>
                    <p className="mt-1">The algorithm terminates with optimal shortest paths because it processes nodes in order of their distance, ensuring no shorter path can be found later.</p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
