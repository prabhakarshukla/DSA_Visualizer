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
  Download,
  ChevronDown,
  ChevronUp,
  Layers,
  BookOpen,
  AlertTriangle,
  TrendingUp,
  SkipBack,
  SkipForward,
  Save,
  Upload,
  Zap,
} from "lucide-react";
import { useState, useMemo } from "react";
import { GRAPH_COLORS, NODE_RADIUS, EDGE_STROKE_WIDTH, EDGE_STROKE_WIDTH_ACTIVE, EDGE_STROKE_WIDTH_SELECTED, EDGE_STROKE_WIDTH_MST } from "@/components/graph-engine";

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

type AlgorithmState = "idle" | "running" | "paused" | "completed" | "step-by-step";

type PrimsState = {
  visited: Set<number>;
  unvisited: Set<number>;
  mstEdges: WeightedEdge[];
  totalWeight: number;
  currentEdge: WeightedEdge | null;
  candidateEdges: WeightedEdge[];
};

type AlgorithmSnapshot = {
  step: number;
  state: PrimsState;
  explanation: string;
  candidateEdges: WeightedEdge[];
};

type SpeedLevel = "slow" | "medium" | "fast";
type GraphDensity = "sparse" | "medium" | "dense";

type VisualizationStep = {
  explanation: string;
  type: "init" | "select" | "add" | "complete";
  timestamp: number;
};

export default function PrimsVisualizer() {
  // Graph state
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<WeightedEdge[]>([]);
  const [nextNodeId, setNextNodeId] = useState(1);

  // Algorithm state
  const [algorithmState, setAlgorithmState] = useState<AlgorithmState>("idle");
  const [primsState, setPrimsState] = useState<PrimsState>({
    visited: new Set(),
    unvisited: new Set(),
    mstEdges: [],
    totalWeight: 0,
    currentEdge: null,
    candidateEdges: [],
  });

  // Step-by-step execution
  const [snapshots, setSnapshots] = useState<AlgorithmSnapshot[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isAutoplay, setIsAutoplay] = useState(false);

  const [sourceNode, setSourceNode] = useState<number | null>(null);
  const [speed, setSpeed] = useState<SpeedLevel>("medium");
  const [steps, setSteps] = useState<VisualizationStep[]>([]);
  const [activeEdge, setActiveEdge] = useState<WeightedEdge | null>(null);
  const [relaxingEdge, setRelaxingEdge] = useState<WeightedEdge | null>(null);

  // UI state
  const [draggingNode, setDraggingNode] = useState<number | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [edgeMode, setEdgeMode] = useState(false);
  const [edgeFrom, setEdgeFrom] = useState<number | null>(null);
  const [weightInput, setWeightInput] = useState("");
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [nodesProcessed, setNodesProcessed] = useState(0);
  const [showExportModal, setShowExportModal] = useState(false);
  const [importText, setImportText] = useState("");
  const [selectedNodeForDeletion, setSelectedNodeForDeletion] = useState<number | null>(null);

  // Generate graph modal state
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generateNodeCount, setGenerateNodeCount] = useState(8);

  // Panel state
  const [expandedSections, setExpandedSections] = useState({
    candidates: true,
    edges: true,
    stats: true,
    steps: true,
    timeline: true,
    info: false,
  });

  const speedSleep = (ms: number) => sleep(ms * getSpeedMultiplier(speed));

  const undirectedAdjacencyList = useMemo(() => {
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

  const progressPercentage = useMemo(() => {
    if (nodes.length === 0) return 0;
    return Math.round((nodesProcessed / nodes.length) * 100);
  }, [nodesProcessed, nodes.length]);

  const currentSnapshot = useMemo(() => {
    return snapshots[currentStep] || null;
  }, [snapshots, currentStep]);

  // Handlers
  const handleAddNode = () => {
    if (algorithmState !== "idle") {
      alert("Stop the algorithm before adding nodes");
      return;
    }
    const newId = nextNodeId;
    const position = generateNodePosition(nodes.length + 1, nodes.length);
    setNodes([...nodes, { id: newId, x: position.x, y: position.y }]);
    setNextNodeId(newId + 1);
  };

  const handleDeleteNode = (id: number) => {
    setNodes(nodes.filter((n) => n.id !== id));
    setEdges(edges.filter((e) => e.from !== id && e.to !== id));
    if (sourceNode === id) setSourceNode(null);
  };

  const handleGenerateGraph = (nodeCount?: number) => {
    const count = nodeCount || 8;
    const newNodes: GraphNode[] = [];

    // Use force-directed positioning with grid layout
    const cols = Math.ceil(Math.sqrt(count));
    const spacing = 60 / cols;

    for (let i = 0; i < count; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = 20 + col * spacing + (Math.random() - 0.5) * 5;
      const y = 20 + row * spacing + (Math.random() - 0.5) * 5;
      newNodes.push({ id: i + 1, x: Math.max(5, Math.min(95, x)), y: Math.max(5, Math.min(95, y)) });
    }

    const newEdges: WeightedEdge[] = [];

    // First: Create a spanning tree to ensure connectivity
    for (let i = 1; i < count; i++) {
      const from = Math.floor(Math.random() * i) + 1;
      const to = i + 1;
      const weight = Math.floor(Math.random() * 14) + 1;
      newEdges.push({ from, to, weight });
    }

    // Then: Add very few random edges (sparse graph)
    const maxAdditionalEdges = Math.max(1, Math.floor(count * 0.15));
    let edgesAdded = 0;

    for (let i = 0; i < maxAdditionalEdges * 2 && edgesAdded < maxAdditionalEdges; i++) {
      const from = newNodes[Math.floor(Math.random() * newNodes.length)].id;
      const to = newNodes[Math.floor(Math.random() * newNodes.length)].id;
      const weight = Math.floor(Math.random() * 14) + 1;

      if (from !== to) {
        const exists = newEdges.some(
          (e) => (e.from === from && e.to === to) || (e.from === to && e.to === from)
        );
        if (!exists) {
          newEdges.push({ from, to, weight });
          edgesAdded++;
        }
      }
    }

    setNodes(newNodes);
    setEdges(newEdges);
    setNextNodeId(count + 1);
    handleReset();
    setSourceNode(1);
  };

  const handleClearGraph = () => {
    setNodes([]);
    setEdges([]);
    setNextNodeId(1);
    setSourceNode(null);
    handleReset();
  };

  const handleNodeClick = (nodeId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (algorithmState === "running" || algorithmState === "step-by-step") return;

    if (edgeMode) {
      if (edgeFrom === null) {
        setEdgeFrom(nodeId);
      } else if (edgeFrom === nodeId) {
        setEdgeFrom(null);
      } else {
        setWeightInput("");
        setShowWeightModal(true);
      }
    } else {
      setSelectedNodeForDeletion(selectedNodeForDeletion === nodeId ? null : nodeId);
    }
  };

  const handleAddEdge = () => {
    if (edgeFrom === null || !weightInput) return;
    const weight = parseInt(weightInput);
    if (isNaN(weight) || weight <= 0) return;

    const newEdge: WeightedEdge = { from: edgeFrom, to: nodes[0]?.id || edgeFrom, weight };
    setEdges([...edges, newEdge]);
    setEdgeFrom(null);
    setWeightInput("");
    setShowWeightModal(false);
  };

  const handleSvgMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (algorithmState === "running" || algorithmState === "step-by-step") return;
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    for (const node of nodes) {
      const distance = Math.sqrt((x - node.x) ** 2 + (y - node.y) ** 2);
      if (distance < nodeDragRadius) {
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

  const handleReset = () => {
    setAlgorithmState("idle");
    setPrimsState({
      visited: new Set(),
      unvisited: new Set(),
      mstEdges: [],
      totalWeight: 0,
      currentEdge: null,
      candidateEdges: [],
    });
    setSteps([]);
    setSnapshots([]);
    setCurrentStep(0);
    setIsAutoplay(false);
    setActiveEdge(null);
    setRelaxingEdge(null);
    setNodesProcessed(0);
  };

  const handleNextStep = () => {
    if (currentStep < snapshots.length - 1) {
      const nextSnap = snapshots[currentStep + 1];
      setPrimsState(nextSnap.state);
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 0) {
      const prevSnap = snapshots[currentStep - 1];
      setPrimsState(prevSnap.state);
      setCurrentStep(currentStep - 1);
    }
  };

  const handleExportGraph = () => {
    const data = {
      nodes,
      edges,
      sourceNode,
    };
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "prims-graph.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportGraph = () => {
    try {
      const data = JSON.parse(importText);
      setNodes(data.nodes);
      setEdges(data.edges);
      setSourceNode(data.sourceNode);
      setNextNodeId(Math.max(...data.nodes.map((n: GraphNode) => n.id)) + 1);
      setShowExportModal(false);
      setImportText("");
    } catch (e) {
      alert("Invalid JSON format");
    }
  };

  const handleStartAlgorithm = async () => {
    if (sourceNode === null || nodes.length === 0) return;

    setAlgorithmState("step-by-step");
    setSteps([]);
    setSnapshots([]);
    setCurrentStep(0);
    setActiveEdge(null);
    setRelaxingEdge(null);
    setNodesProcessed(0);

    const visited = new Set<number>();
    const unvisited = new Set<number>();
    const mstEdges: WeightedEdge[] = [];
    let totalWeight = 0;
    const allSnapshots: AlgorithmSnapshot[] = [];

    nodes.forEach((n) => {
      unvisited.add(n.id);
    });

    visited.add(sourceNode);
    unvisited.delete(sourceNode);

    // Initial snapshot
    allSnapshots.push({
      step: 0,
      state: {
        visited: new Set(visited),
        unvisited: new Set(unvisited),
        mstEdges: [],
        totalWeight: 0,
        currentEdge: null,
        candidateEdges: [],
      },
      explanation: `📍 Initialize: Start MST from node ${sourceNode}. Mark as visited. Unvisited: ${unvisited.size}`,
      candidateEdges: [],
    });

    setSteps([
      {
        explanation: `📍 Initialize: Start MST from node ${sourceNode}. Mark as visited. Unvisited: ${unvisited.size}`,
        type: "init",
        timestamp: Date.now(),
      },
    ]);

    setNodesProcessed(1);

    let stepNum = 1;

    while (unvisited.size > 0) {
      const candidateEdges: WeightedEdge[] = [];

      for (const visitedNode of visited) {
        const neighbors = undirectedAdjacencyList[visitedNode] || [];
        for (const { nodeId: neighbor, weight } of neighbors) {
          if (unvisited.has(neighbor)) {
            candidateEdges.push({ from: visitedNode, to: neighbor, weight });
          }
        }
      }

      if (candidateEdges.length === 0) break;

      candidateEdges.sort((a, b) => a.weight - b.weight);
      const minEdge = candidateEdges[0];

      // Snapshot: Show candidates
      allSnapshots.push({
        step: stepNum,
        state: {
          visited: new Set(visited),
          unvisited: new Set(unvisited),
          mstEdges: [...mstEdges],
          totalWeight,
          currentEdge: null,
          candidateEdges,
        },
        explanation: `🔍 Candidate edges: ${candidateEdges.length} options. Minimum: (${minEdge.from}→${minEdge.to}) weight ${minEdge.weight}`,
        candidateEdges,
      });

      stepNum++;

      // Snapshot: Select minimum
      allSnapshots.push({
        step: stepNum,
        state: {
          visited: new Set(visited),
          unvisited: new Set(unvisited),
          mstEdges: [...mstEdges],
          totalWeight,
          currentEdge: minEdge,
          candidateEdges,
        },
        explanation: `⭐ Select minimum edge (${minEdge.from}→${minEdge.to}) weight ${minEdge.weight}`,
        candidateEdges,
      });

      stepNum++;

      visited.add(minEdge.to);
      unvisited.delete(minEdge.to);
      mstEdges.push(minEdge);
      totalWeight += minEdge.weight;

      // Snapshot: Add to MST
      allSnapshots.push({
        step: stepNum,
        state: {
          visited: new Set(visited),
          unvisited: new Set(unvisited),
          mstEdges: [...mstEdges],
          totalWeight,
          currentEdge: minEdge,
          candidateEdges: [],
        },
        explanation: `✅ Add to MST: (${minEdge.from}→${minEdge.to}). Weight: ${totalWeight}. Visited: ${visited.size}/${nodes.length}`,
        candidateEdges: [],
      });

      stepNum++;
      setNodesProcessed(visited.size);
    }

    // Completion snapshot
    allSnapshots.push({
      step: stepNum,
      state: {
        visited: new Set(visited),
        unvisited: new Set(unvisited),
        mstEdges: [...mstEdges],
        totalWeight,
        currentEdge: null,
        candidateEdges: [],
      },
      explanation: `🎉 Complete! MST: ${mstEdges.length} edges, weight ${totalWeight}. Time: O(E log V)`,
      candidateEdges: [],
    });

    setSnapshots(allSnapshots);
    setCurrentStep(0);
    setPrimsState(allSnapshots[0].state);
  };

  const handleAutoplay = async () => {
    if (isAutoplay) {
      setIsAutoplay(false);
      return;
    }

    setIsAutoplay(true);
    for (let i = currentStep; i < snapshots.length; i++) {
      if (!isAutoplay) break;
      setCurrentStep(i);
      setPrimsState(snapshots[i].state);
      await speedSleep(800);
    }
    if (isAutoplay) {
      setAlgorithmState("completed");
      setIsAutoplay(false);
    }
  };

  const toggleSection = (section: "candidates" | "edges" | "stats" | "steps" | "timeline" | "info") => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const svgWidth = 700;
  const svgHeight = 500;
  const nodeRadius = 2.5;
  const nodeActiveRadius = 3.5;
  const nodeSelectedRadius = 4;
  const nodeDragRadius = 10;
  const nodeDeleteOffset = nodeRadius + 2;
  const nodeDeleteRadius = 5;
  const displayState = currentSnapshot?.state || primsState;

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#F7F1DD] via-[#F1E8C7] to-[#F7F1DD]">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <Link href="/graphs" className="text-sm text-[#7D8F3B] hover:text-[#556B2F] flex items-center gap-1 mb-2">
              ← Back to graphs
            </Link>
            <h1 className="text-4xl font-bold text-[#4B5320] mb-2">Prim's Algorithm Visualizer</h1>
            <p className="text-[#556B2F]">Premium MST simulation platform. Build minimum spanning trees step-by-step.</p>
          </div>
          <div className="text-right">
            <div className="text-sm font-semibold text-[#7D8F3B]">
              {algorithmState === "idle" && "Ready"}
              {algorithmState === "step-by-step" && `Step ${currentStep + 1}/${snapshots.length}`}
              {algorithmState === "completed" && "Completed ✓"}
            </div>
            {nodes.length > 0 && <div className="text-xs text-[#556B2F]">{nodesProcessed} → {nodes.length}</div>}
          </div>
        </div>

        {/* Main Layout */}
        <div className="grid lg:grid-cols-4 md:grid-cols-1 gap-6">
          {/* Left: Graph Canvas */}
          <div className="lg:col-span-3">
            <div className="rounded-3xl border-2 border-[#D8CCA3] bg-gradient-to-br from-[#F7F1DD] to-[#F1E8C7] p-8 shadow-lg">
              <div className="flex justify-center">
                <svg
                  width={svgWidth}
                  height={svgHeight}
                  viewBox={`0 0 100 100`}
                  className="border-2 border-[#D8CCA3] rounded-2xl bg-white cursor-grab active:cursor-grabbing"
                  onMouseDown={handleSvgMouseDown}
                  onMouseMove={handleSvgMouseMove}
                  onMouseUp={handleSvgMouseUp}
                  onMouseLeave={handleSvgMouseUp}
                >
                  <defs>
                    <filter id="relaxGlow">
                      <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                      <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                    <filter id="mstGlow">
                      <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                      <feComponentTransfer>
                        <feFuncA type="linear" slope="0.8" />
                      </feComponentTransfer>
                      <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>

                  {/* Edges */}
                  <AnimatePresence>
                    {edges.map((edge, idx) => {
                      const fromNode = nodes.find((n) => n.id === edge.from);
                      const toNode = nodes.find((n) => n.id === edge.to);
                      if (!fromNode || !toNode) return null;

                      // Validate coordinates
                      const x1 = isNaN(fromNode.x) || fromNode.x === undefined ? 50 : fromNode.x;
                      const y1 = isNaN(fromNode.y) || fromNode.y === undefined ? 50 : fromNode.y;
                      const x2 = isNaN(toNode.x) || toNode.x === undefined ? 50 : toNode.x;
                      const y2 = isNaN(toNode.y) || toNode.y === undefined ? 50 : toNode.y;

                      const midX = (x1 + x2) / 2;
                      const midY = (y1 + y2) / 2;

                      const isRelaxing =
                        relaxingEdge &&
                        ((relaxingEdge.from === edge.from && relaxingEdge.to === edge.to) ||
                          (relaxingEdge.from === edge.to && relaxingEdge.to === edge.from));

                      const isInMST = displayState.mstEdges.some(
                        (e) =>
                          (e.from === edge.from && e.to === edge.to) ||
                          (e.from === edge.to && e.to === edge.from)
                      );

                      const isCandidate = displayState.candidateEdges.some(
                        (e) =>
                          (e.from === edge.from && e.to === edge.to) ||
                          (e.from === edge.to && e.to === edge.from)
                      );

                      let strokeColor = GRAPH_COLORS.edge.normal;
                      let strokeWidthVal = EDGE_STROKE_WIDTH;
                      let filterUrl = "none";
                      let opacity = 0.6;

                      if (isInMST) {
                        strokeColor = GRAPH_COLORS.edge.mst;
                        strokeWidthVal = EDGE_STROKE_WIDTH_MST;
                        opacity = 0.9;
                        filterUrl = "url(#mstGlow)";
                      } else if (isRelaxing) {
                        strokeColor = GRAPH_COLORS.edge.cycle;
                        strokeWidthVal = EDGE_STROKE_WIDTH_ACTIVE;
                        filterUrl = "url(#relaxGlow)";
                        opacity = 1;
                      } else if (isCandidate) {
                        strokeColor = GRAPH_COLORS.edge.selected;
                        strokeWidthVal = EDGE_STROKE_WIDTH_SELECTED;
                        opacity = 0.8;
                      }

                      return (
                        <g key={`edge-${idx}`}>
                          <motion.line
                            x1={isNaN(x1) ? 50 : x1}
                            y1={isNaN(y1) ? 50 : y1}
                            x2={isNaN(x2) ? 50 : x2}
                            y2={isNaN(y2) ? 50 : y2}
                            stroke={strokeColor}
                            strokeWidth={strokeWidthVal}
                            filter={filterUrl}
                            strokeDasharray={isInMST ? "5,5" : isCandidate ? "3,3" : "0"}
                            animate={{
                              strokeDashoffset: isInMST ? [0, -10] : isCandidate ? [0, -6] : 0,
                              opacity: isRelaxing ? [0.5, 1, 0.5] : opacity,
                            }}
                            transition={{ repeat: isInMST || (isRelaxing && isCandidate) ? Infinity : 0, duration: 1.5 }}
                          />
                          <text
                            x={isNaN(midX) ? 50 : midX}
                            y={isNaN(midY) ? 50 : midY - 5}
                            textAnchor="middle"
                            className="text-xs font-bold fill-[#556B2F] pointer-events-none"
                            style={{ fontSize: "5px" }}
                          >
                            {edge.weight}
                          </text>
                        </g>
                      );
                    })}
                  </AnimatePresence>

                  {/* Nodes */}
                  <AnimatePresence>
                    {nodes.map((node) => {
                      // Validate node coordinates
                      const x = isNaN(node.x) || node.x === undefined ? 50 : node.x;
                      const y = isNaN(node.y) || node.y === undefined ? 50 : node.y;

                      const isVisited = displayState.visited.has(node.id);
                      const isSource = sourceNode === node.id;
                      const isSelectedForEdge = edgeFrom === node.id;
                      const isSelectedForDeletion = selectedNodeForDeletion === node.id;

                      let fillColor = GRAPH_COLORS.node.default.fill;
                      let strokeColor = GRAPH_COLORS.node.default.stroke;

                      if (isSelectedForDeletion) {
                        fillColor = GRAPH_COLORS.node.current.fill;
                        strokeColor = GRAPH_COLORS.node.current.stroke;
                      } else if (isSource) {
                        fillColor = GRAPH_COLORS.node.visited.fill;
                        strokeColor = GRAPH_COLORS.node.visited.stroke;
                      } else if (isVisited) {
                        fillColor = GRAPH_COLORS.node.completed.fill;
                        strokeColor = GRAPH_COLORS.node.completed.stroke;
                      }

                      const strokeWidthVal = isSelectedForDeletion ? EDGE_STROKE_WIDTH_ACTIVE : isSelectedForEdge ? EDGE_STROKE_WIDTH_SELECTED : isSource || isVisited ? EDGE_STROKE_WIDTH : EDGE_STROKE_WIDTH;

                      return (
                        <motion.g
                          key={`node-${node.id}`}
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          whileHover={{ scale: 1.15 }}
                          transition={{ type: "spring", stiffness: 260, damping: 20 }}
                          onClick={(e) => handleNodeClick(node.id, e as unknown as React.MouseEvent)}
                          style={{ cursor: edgeMode ? "pointer" : "pointer" }}
                        >
                          <motion.circle
                            cx={isNaN(x) ? 50 : x}
                            cy={isNaN(y) ? 50 : y}
                            r={NODE_RADIUS}
                            fill={fillColor}
                            stroke={isSelectedForDeletion ? GRAPH_COLORS.edge.cycle : isSelectedForEdge ? GRAPH_COLORS.edge.selected : strokeColor}
                            strokeWidth={strokeWidthVal}
                            animate={{
                              r: isSelectedForDeletion ? NODE_RADIUS + 4 : isSource || isVisited ? NODE_RADIUS + 2 : NODE_RADIUS,
                            }}
                            transition={{ duration: 0.3 }}
                          />
                          <text
                            x={isNaN(x) ? 50 : x}
                            y={isNaN(y) ? 50 : y}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            className="pointer-events-none text-xs font-bold fill-[#4B5320]"
                            style={{ fontSize: "6px" }}
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
                <div className="mt-4 text-center text-sm text-[#556B2F]">
                  Create nodes or generate a graph to start
                </div>
              )}

              {/* Timeline */}
              {snapshots.length > 0 && algorithmState !== "idle" && (
                <div className="mt-6 p-4 rounded-2xl bg-[#F1E8C7] border border-[#D8CCA3]">
                  <div className="flex justify-between items-center mb-3">
                    <p className="text-xs font-semibold text-[#556B2F]">Timeline</p>
                    <p className="text-xs text-[#7D8F3B]">{currentStep + 1} / {snapshots.length}</p>
                  </div>
                  <div className="flex gap-1 overflow-x-auto pb-2">
                    {snapshots.map((snap, idx) => (
                      <motion.button
                        key={idx}
                        onClick={() => {
                          setCurrentStep(idx);
                          setPrimsState(snap.state);
                        }}
                        className={`px-3 py-1 rounded text-xs font-mono whitespace-nowrap transition ${
                          idx === currentStep
                            ? "bg-[#7D8F3B] text-white"
                            : "bg-white text-[#556B2F] border border-[#D8CCA3] hover:bg-[#F7F1DD]"
                        }`}
                      >
                        {snap.step}
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Control Panel */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4 max-h-[calc(100vh-150px)] overflow-y-auto rounded-3xl border-2 border-[#D8CCA3] bg-gradient-to-b from-[#F7F1DD] to-[#F1E8C7] p-5 shadow-lg">
              {/* Graph Controls */}
              <div className="space-y-2">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-[#4B5320]">
                  <Settings className="h-4 w-4" /> Graph
                </h3>
                <div className="space-y-2">
                  <button
                    onClick={handleAddNode}
                    disabled={algorithmState !== "idle"}
                    className="w-full rounded-lg bg-[#7D8F3B] px-3 py-2 text-xs font-medium text-white hover:bg-[#556B2F] disabled:opacity-50"
                  >
                    <Plus className="mb-1 inline h-3 w-3" /> Add Node
                  </button>

                  <button
                    onClick={() => {
                      if (selectedNodeForDeletion !== null) {
                        handleDeleteNode(selectedNodeForDeletion);
                        setSelectedNodeForDeletion(null);
                      }
                    }}
                    disabled={selectedNodeForDeletion === null || algorithmState !== "idle"}
                    className="w-full rounded-lg border border-red-300 bg-white px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    <Trash2 className="mb-1 inline h-3 w-3" /> Delete Node {selectedNodeForDeletion && `(${selectedNodeForDeletion})`}
                  </button>

                  <button
                    onClick={() => setEdgeMode(!edgeMode)}
                    disabled={nodes.length < 2 || algorithmState !== "idle"}
                    className={`w-full rounded-lg px-3 py-2 text-xs font-medium transition ${
                      edgeMode
                        ? "bg-[#FF6B6B] text-white"
                        : "border border-[#FF9999] bg-white text-[#FF6B6B] hover:bg-[#FFE5E5]"
                    } disabled:opacity-50`}
                  >
                    {edgeFrom ? `Connect (${edgeFrom})` : "➕ Edge"}
                  </button>

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setShowGenerateModal(true)}
                      disabled={algorithmState !== "idle"}
                      className="rounded-lg bg-[#AAB76A] text-white px-2 py-2 text-xs font-medium hover:bg-[#7D8F3B] disabled:opacity-50 col-span-3"
                      title="Generate random graph with custom node count"
                    >
                      ⚡ Generate
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleExportGraph}
                      disabled={nodes.length === 0}
                      className="flex-1 rounded-lg border border-[#7D8F3B] bg-white px-2 py-2 text-xs font-medium text-[#7D8F3B] hover:bg-[#F1E8C7] disabled:opacity-50"
                      title="Export as JSON"
                    >
                      <Download className="inline h-3 w-3 mr-1" /> Export
                    </button>
                    <button
                      onClick={() => setShowExportModal(!showExportModal)}
                      disabled={algorithmState !== "idle"}
                      className="flex-1 rounded-lg border border-[#7D8F3B] bg-white px-2 py-2 text-xs font-medium text-[#7D8F3B] hover:bg-[#F1E8C7] disabled:opacity-50"
                      title="Import from JSON"
                    >
                      <Upload className="inline h-3 w-3 mr-1" /> Import
                    </button>
                  </div>

                  <button
                    onClick={handleClearGraph}
                    disabled={nodes.length === 0 || algorithmState !== "idle"}
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
                  <Play className="h-4 w-4" /> Execute
                </h3>

                <div className="space-y-2">
                  <button
                    onClick={() => setSourceNode(sourceNode === null ? 1 : sourceNode)}
                    disabled={nodes.length === 0 || algorithmState !== "idle"}
                    className="w-full rounded-lg bg-[#AAB76A] text-white px-3 py-2 text-xs font-medium hover:bg-[#7D8F3B] disabled:opacity-50"
                  >
                    Start: {sourceNode || "Select"}
                  </button>

                  <label>
                    <div className="text-xs font-semibold text-[#556B2F] mb-1">Speed</div>
                    <select
                      value={speed}
                      onChange={(e) => setSpeed(e.target.value as SpeedLevel)}
                      disabled={algorithmState !== "idle"}
                      className="w-full rounded-lg border border-[#D8CCA3] bg-white px-2 py-1 text-xs disabled:opacity-50"
                    >
                      <option value="slow">Slow</option>
                      <option value="medium">Medium</option>
                      <option value="fast">Fast</option>
                    </select>
                  </label>

                  <button
                    onClick={handleStartAlgorithm}
                    disabled={sourceNode === null || nodes.length === 0 || algorithmState !== "idle"}
                    className="w-full rounded-lg bg-[#7D8F3B] px-3 py-2 text-xs font-semibold text-white hover:bg-[#556B2F] disabled:opacity-50"
                  >
                    <Zap className="mb-1 inline h-3 w-3" /> Start
                  </button>

                  {algorithmState === "step-by-step" && (
                    <>
                      <div className="flex gap-2">
                        <button
                          onClick={handlePreviousStep}
                          disabled={currentStep === 0}
                          className="flex-1 rounded-lg border border-[#7D8F3B] bg-white px-2 py-2 text-xs font-medium text-[#7D8F3B] hover:bg-[#F1E8C7] disabled:opacity-30"
                        >
                          <SkipBack className="h-3 w-3" />
                        </button>
                        <button
                          onClick={handleAutoplay}
                          className={`flex-1 rounded-lg px-2 py-2 text-xs font-medium transition ${
                            isAutoplay
                              ? "bg-[#FF6B6B] text-white"
                              : "bg-[#AAB76A] text-white hover:bg-[#7D8F3B]"
                          }`}
                        >
                          {isAutoplay ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                        </button>
                        <button
                          onClick={handleNextStep}
                          disabled={currentStep === snapshots.length - 1}
                          className="flex-1 rounded-lg border border-[#7D8F3B] bg-white px-2 py-2 text-xs font-medium text-[#7D8F3B] hover:bg-[#F1E8C7] disabled:opacity-30"
                        >
                          <SkipForward className="h-3 w-3" />
                        </button>
                      </div>
                      <button
                        onClick={handleReset}
                        className="w-full rounded-lg border border-[#7D8F3B] bg-white px-3 py-2 text-xs font-semibold text-[#7D8F3B] hover:bg-[#F1E8C7]"
                      >
                        <RotateCcw className="mb-1 inline h-3 w-3" /> Reset
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Progress */}
              {algorithmState === "step-by-step" && (
                <>
                  <div className="border-t border-[#D8CCA3]"></div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-semibold text-[#556B2F]">
                      <span>Progress</span>
                      <span>{progressPercentage}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-[#F1E8C7] overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-[#AAB76A] to-[#7D8F3B]"
                        animate={{ width: `${progressPercentage}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-lg bg-gradient-to-br from-[#AAB76A] to-[#7D8F3B] text-white p-2">
                        <p className="font-semibold">Visited</p>
                        <p className="font-mono text-lg">{displayState.visited.size}</p>
                      </div>
                      <div className="rounded-lg bg-gradient-to-br from-[#FED66A] to-[#AAB76A] text-white p-2">
                        <p className="font-semibold">MST Weight</p>
                        <p className="font-mono text-lg">{displayState.totalWeight}</p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Collapsible Sections */}

              {/* Candidate Edges */}
              <CollapsibleSection
                title="Candidates"
                expanded={expandedSections.candidates}
                onToggle={() => toggleSection("candidates")}
              >
                {displayState.candidateEdges.length === 0 ? (
                  <p className="text-xs text-[#556B2F]">No candidates</p>
                ) : (
                  <div className="space-y-1">
                    {displayState.candidateEdges
                      .sort((a, b) => a.weight - b.weight)
                      .slice(0, 5)
                      .map((edge, idx) => (
                        <div
                          key={idx}
                          className={`text-xs font-mono p-2 rounded ${
                            idx === 0
                              ? "bg-[#FED66A] text-[#4B5320] font-bold ring-2 ring-[#AAB76A]"
                              : "bg-[#F1E8C7] text-[#556B2F]"
                          }`}
                        >
                          {idx === 0 && "⭐ "}
                          {edge.from}→{edge.to} <span className="font-bold">({edge.weight})</span>
                        </div>
                      ))}
                  </div>
                )}
              </CollapsibleSection>

              {/* MST Summary */}
              <CollapsibleSection
                title="MST Edges"
                expanded={expandedSections.edges}
                onToggle={() => toggleSection("edges")}
              >
                {displayState.mstEdges.length === 0 ? (
                  <p className="text-xs text-[#556B2F]">No edges yet</p>
                ) : (
                  <div className="space-y-1">
                    {displayState.mstEdges.map((edge, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-xs font-mono bg-gradient-to-r from-[#AAB76A] to-[#7D8F3B] text-white p-2 rounded"
                      >
                        {edge.from}→{edge.to} <span className="font-bold">({edge.weight})</span>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CollapsibleSection>

              {/* Statistics */}
              <CollapsibleSection
                title="Stats"
                expanded={expandedSections.stats}
                onToggle={() => toggleSection("stats")}
              >
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between p-2 rounded bg-white border border-[#D8CCA3] text-[#4B5320]">
                      <span className="font-semibold">Nodes:</span>
                      <span className="font-mono font-bold">{nodes.length}</span>
                    </div>
                    <div className="flex justify-between p-2 rounded bg-white border border-[#D8CCA3] text-[#4B5320]">
                      <span className="font-semibold">Edges:</span>
                      <span className="font-mono font-bold">{edges.length}</span>
                    </div>
                  <div className="flex justify-between p-2 rounded bg-gradient-to-r from-[#7D8F3B] to-[#556B2F] text-white font-semibold">
                    <span>MST Weight:</span>
                    <span className="font-mono text-lg">{displayState.totalWeight}</span>
                  </div>
                  <div className="p-2 rounded bg-gradient-to-r from-[#7D8F3B] to-[#556B2F] text-white font-semibold">
                    <span>Complexity</span>
                    <p className="font-mono text-xs mt-1">Time: O(E log V)</p>
                  </div>
                </div>
              </CollapsibleSection>

              {/* Info Cards */}
              <CollapsibleSection
                title="Learn"
                expanded={expandedSections.info}
                onToggle={() => toggleSection("info")}
              >
                <div className="space-y-3 text-xs">
                  <div className="p-2 rounded bg-blue-50 border border-blue-200">
                    <p className="font-semibold text-blue-900 mb-1">What is MST?</p>
                    <p className="text-blue-800 text-xs">A minimum spanning tree is a connected acyclic subgraph that connects all vertices with minimum total edge weight.</p>
                  </div>
                  <div className="p-2 rounded bg-green-50 border border-green-200">
                    <p className="font-semibold text-green-900 mb-1">Why Prim's Works?</p>
                    <p className="text-green-800 text-xs">Greedy choice: always add minimum weight edge connecting tree to unvisited node. Proven optimal by exchange argument.</p>
                  </div>
                  <div className="p-2 rounded bg-purple-50 border border-purple-200">
                    <p className="font-semibold text-purple-900 mb-1">Prim vs Kruskal</p>
                    <p className="text-purple-800 text-xs">Prim: grows tree from node. Kruskal: sorts edges globally. Both find MST with same complexity.</p>
                  </div>
                </div>
              </CollapsibleSection>

              {/* Steps */}
              <CollapsibleSection
                title="Steps"
                expanded={expandedSections.steps}
                onToggle={() => toggleSection("steps")}
              >
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {currentSnapshot ? (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xs p-2 rounded bg-yellow-100 text-yellow-900"
                    >
                      {currentSnapshot.explanation}
                    </motion.div>
                  ) : (
                    <p className="text-xs text-[#556B2F]">Steps appear here</p>
                  )}
                </div>
              </CollapsibleSection>
            </div>
          </div>
        </div>
      </div>

      {/* Import/Export Modal */}
      <AnimatePresence>
        {showExportModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowExportModal(false)}
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              className="bg-[#F7F1DD] rounded-2xl p-6 shadow-xl max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold text-[#4B5320] mb-4">Import Graph</h3>
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="Paste JSON here"
                className="w-full h-40 px-4 py-2 border border-[#D8CCA3] rounded-lg font-mono text-xs"
              />
              <div className="flex gap-2 mt-4">
                <button
                  onClick={handleImportGraph}
                  className="flex-1 bg-[#7D8F3B] text-white px-4 py-2 rounded-lg hover:bg-[#556B2F]"
                >
                  Import
                </button>
                <button
                  onClick={() => setShowExportModal(false)}
                  className="flex-1 border border-[#D8CCA3] px-4 py-2 rounded-lg hover:bg-[#F1E8C7]"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Weight Input Modal */}
      <AnimatePresence>
        {showWeightModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setShowWeightModal(false)}
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              className="bg-[#F7F1DD] rounded-2xl p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold text-[#4B5320] mb-4">
                Connect Node {edgeFrom} to Node {nodes[0]?.id}
              </h3>
              <input
                type="number"
                value={weightInput}
                onChange={(e) => setWeightInput(e.target.value)}
                placeholder="Edge weight"
                className="w-full px-4 py-2 border border-[#D8CCA3] rounded-lg mb-4"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={handleAddEdge}
                  className="flex-1 bg-[#7D8F3B] text-white px-4 py-2 rounded-lg hover:bg-[#556B2F]"
                >
                  Add
                </button>
                <button
                  onClick={() => setShowWeightModal(false)}
                  className="flex-1 border border-[#D8CCA3] px-4 py-2 rounded-lg hover:bg-[#F1E8C7]"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
                    handleGenerateGraph(generateNodeCount);
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

// Helper Functions
function getSpeedMultiplier(level: SpeedLevel): number {
  switch (level) {
    case "slow":
      return 1.8;
    case "medium":
      return 1;
    case "fast":
      return 0.5;
    default:
      return 1;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function generateNodePosition(totalNodes: number, index: number) {
  const angle = (index / totalNodes) * 2 * Math.PI - Math.PI / 2;
  const radius = 35;
  const centerX = 50;
  const centerY = 50;

  return {
    x: centerX + radius * Math.cos(angle),
    y: centerY + radius * Math.sin(angle),
  };
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
