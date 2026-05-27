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

type KruskalState = {
  sortedEdges: WeightedEdge[];
  mstEdges: WeightedEdge[];
  rejectedEdges: WeightedEdge[];
  totalWeight: number;
  currentEdge: WeightedEdge | null;
  parent: Record<number, number>;
  components: number;
};

type AlgorithmSnapshot = {
  step: number;
  state: KruskalState;
  explanation: string;
  processedEdges: WeightedEdge[];
};

type SpeedLevel = "slow" | "medium" | "fast";

type VisualizationStep = {
  explanation: string;
  type: "init" | "sort" | "process" | "accept" | "reject" | "complete";
  timestamp: number;
};

export default function KruskalVisualizer() {
  // Graph state
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<WeightedEdge[]>([]);
  const [nextNodeId, setNextNodeId] = useState(1);

  // Algorithm state
  const [algorithmState, setAlgorithmState] = useState<AlgorithmState>("idle");
  const [kruskalState, setKruskalState] = useState<KruskalState>({
    sortedEdges: [],
    mstEdges: [],
    rejectedEdges: [],
    totalWeight: 0,
    currentEdge: null,
    parent: {},
    components: 0,
  });

  // Step-by-step execution
  const [snapshots, setSnapshots] = useState<AlgorithmSnapshot[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isAutoplay, setIsAutoplay] = useState(false);

  const [speed, setSpeed] = useState<SpeedLevel>("medium");
  const [steps, setSteps] = useState<VisualizationStep[]>([]);

  // UI state
  const [draggingNode, setDraggingNode] = useState<number | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [edgeMode, setEdgeMode] = useState(false);
  const [edgeFrom, setEdgeFrom] = useState<number | null>(null);
  const [weightInput, setWeightInput] = useState("");
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [importText, setImportText] = useState("");
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generateNodeCount, setGenerateNodeCount] = useState(8);
  const [selectedNodeForDeletion, setSelectedNodeForDeletion] = useState<number | null>(null);

  // Panel state
  const [expandedSections, setExpandedSections] = useState({
    edges: true,
    mstSummary: true,
    stats: true,
    unionFind: true,
    steps: true,
    info: false,
  });

  const speedSleep = (ms: number) => sleep(ms * getSpeedMultiplier(speed));

  const progressPercentage = useMemo(() => {
    if (edges.length === 0) return 0;
    return Math.round(((kruskalState.mstEdges.length + kruskalState.rejectedEdges.length) / edges.length) * 100);
  }, [kruskalState, edges.length]);

  const currentSnapshot = useMemo(() => {
    return snapshots[currentStep] || null;
  }, [snapshots, currentStep]);

  const displayState = currentSnapshot?.state || kruskalState;

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
  };

  const handleGenerateGraph = (nodeCount?: number) => {
    const count = nodeCount || 8;
    const newNodes: GraphNode[] = [];

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

    for (let i = 1; i < count; i++) {
      const from = Math.floor(Math.random() * i) + 1;
      const to = i + 1;
      const weight = Math.floor(Math.random() * 14) + 1;
      newEdges.push({ from, to, weight });
    }

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
  };

  const handleGenerateDenseGraph = (nodeCount?: number) => {
    const count = nodeCount || 8;
    const newNodes: GraphNode[] = [];

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

    // Spanning tree
    for (let i = 1; i < count; i++) {
      const from = Math.floor(Math.random() * i) + 1;
      const to = i + 1;
      const weight = Math.floor(Math.random() * 14) + 1;
      newEdges.push({ from, to, weight });
    }

    // Add more edges for density
    const maxAdditionalEdges = Math.max(3, Math.floor(count * 0.5));
    let edgesAdded = 0;

    for (let i = 0; i < maxAdditionalEdges * 3 && edgesAdded < maxAdditionalEdges; i++) {
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
  };

  const handleClearGraph = () => {
    setNodes([]);
    setEdges([]);
    setNextNodeId(1);
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
      if (distance < 10) {
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
    setKruskalState({
      sortedEdges: [],
      mstEdges: [],
      rejectedEdges: [],
      totalWeight: 0,
      currentEdge: null,
      parent: {},
      components: 0,
    });
    setSteps([]);
    setSnapshots([]);
    setCurrentStep(0);
    setIsAutoplay(false);
  };

  const handleNextStep = () => {
    if (currentStep < snapshots.length - 1) {
      const nextSnap = snapshots[currentStep + 1];
      setKruskalState(nextSnap.state);
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 0) {
      const prevSnap = snapshots[currentStep - 1];
      setKruskalState(prevSnap.state);
      setCurrentStep(currentStep - 1);
    }
  };

  const handleExportGraph = () => {
    const data = { nodes, edges };
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "kruskal-graph.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportGraph = () => {
    try {
      const data = JSON.parse(importText);
      setNodes(data.nodes);
      setEdges(data.edges);
      setNextNodeId(Math.max(...data.nodes.map((n: GraphNode) => n.id)) + 1);
      setShowExportModal(false);
      setImportText("");
    } catch (e) {
      alert("Invalid JSON format");
    }
  };

  const handleStartAlgorithm = async () => {
    if (nodes.length === 0 || edges.length === 0) return;

    setAlgorithmState("step-by-step");

    const parent: Record<number, number> = {};
    const rank: Record<number, number> = {};

    nodes.forEach((n) => {
      parent[n.id] = n.id;
      rank[n.id] = 0;
    });

    const find = (x: number): number => {
      if (parent[x] !== x) {
        parent[x] = find(parent[x]);
      }
      return parent[x];
    };

    const union = (x: number, y: number): boolean => {
      const rootX = find(x);
      const rootY = find(y);

      if (rootX === rootY) return false;

      if (rank[rootX] < rank[rootY]) {
        parent[rootX] = rootY;
      } else if (rank[rootX] > rank[rootY]) {
        parent[rootY] = rootX;
      } else {
        parent[rootY] = rootX;
        rank[rootX]++;
      }
      return true;
    };

    let components = nodes.length;
    let mstEdges: WeightedEdge[] = [];
    let rejectedEdges: WeightedEdge[] = [];
    let totalWeight = 0;
    const allSnapshots: AlgorithmSnapshot[] = [];

    const sortedEdges = [...edges].sort((a, b) => a.weight - b.weight);

    // Initial snapshot
    allSnapshots.push({
      step: 0,
      state: {
        sortedEdges,
        mstEdges: [],
        rejectedEdges: [],
        totalWeight: 0,
        currentEdge: null,
        parent: { ...parent },
        components,
      },
      explanation: `📊 Sorting ${edges.length} edges by weight: ${sortedEdges.map((e) => `(${e.from}→${e.to}:${e.weight})`).join(", ")}`,
      processedEdges: [],
    });

    let stepNum = 1;

    for (const edge of sortedEdges) {
      const rootFrom = find(edge.from);
      const rootTo = find(edge.to);

      // Step: Checking edge
      allSnapshots.push({
        step: stepNum,
        state: {
          sortedEdges,
          mstEdges: [...mstEdges],
          rejectedEdges: [...rejectedEdges],
          totalWeight,
          currentEdge: edge,
          parent: { ...parent },
          components,
        },
        explanation: `🔍 Checking edge (${edge.from}→${edge.to}) weight ${edge.weight}. Root(${edge.from})=${rootFrom}, Root(${edge.to})=${rootTo}`,
        processedEdges: [...mstEdges, ...rejectedEdges],
      });

      stepNum++;

      if (rootFrom !== rootTo) {
        // Accept edge
        const canUnion = union(edge.from, edge.to);

        if (canUnion) {
          mstEdges.push(edge);
          totalWeight += edge.weight;
          components--;

          allSnapshots.push({
            step: stepNum,
            state: {
              sortedEdges,
              mstEdges: [...mstEdges],
              rejectedEdges: [...rejectedEdges],
              totalWeight,
              currentEdge: edge,
              parent: { ...parent },
              components,
            },
            explanation: `✅ Edge does NOT form cycle! Adding to MST. Total Weight: ${totalWeight}. Components: ${components}`,
            processedEdges: [...mstEdges, ...rejectedEdges],
          });
        }
      } else {
        // Reject edge (creates cycle)
        rejectedEdges.push(edge);

        allSnapshots.push({
          step: stepNum,
          state: {
            sortedEdges,
            mstEdges: [...mstEdges],
            rejectedEdges: [...rejectedEdges],
            totalWeight,
            currentEdge: null,
            parent: { ...parent },
            components,
          },
          explanation: `❌ Edge forms CYCLE! Both nodes in same component. Skipping.`,
          processedEdges: [...mstEdges, ...rejectedEdges],
        });
      }

      stepNum++;

      if (mstEdges.length === nodes.length - 1) {
        break;
      }
    }

    // Final completion snapshot
    allSnapshots.push({
      step: stepNum,
      state: {
        sortedEdges,
        mstEdges: [...mstEdges],
        rejectedEdges: [...rejectedEdges],
        totalWeight,
        currentEdge: null,
        parent: { ...parent },
        components: 1,
      },
      explanation: `🎉 COMPLETE! MST: ${mstEdges.length} edges | Weight: ${totalWeight} | Rejected: ${rejectedEdges.length}`,
      processedEdges: [...mstEdges, ...rejectedEdges],
    });

    setSnapshots(allSnapshots);
    setCurrentStep(0);
    setKruskalState(allSnapshots[0].state);
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
      setKruskalState(snapshots[i].state);
      await speedSleep(800);
    }
    if (isAutoplay) {
      setAlgorithmState("completed");
      setIsAutoplay(false);
    }
  };

  const toggleSection = (section: "edges" | "mstSummary" | "stats" | "unionFind" | "steps" | "info") => {
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
  const nodeDeleteRadius = 5;

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#F7F1DD] via-[#F1E8C7] to-[#F7F1DD]">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <Link href="/graphs" className="text-sm text-[#7D8F3B] hover:text-[#556B2F] flex items-center gap-1 mb-2">
              ← Back to graphs
            </Link>
            <h1 className="text-4xl font-bold text-[#4B5320] mb-2">Kruskal Algorithm Visualizer</h1>
            <p className="text-[#556B2F]">Visualize Minimum Spanning Tree construction using edge sorting and Union-Find.</p>
          </div>
          <div className="text-right">
            <div className="text-sm font-semibold text-[#7D8F3B]">
              {algorithmState === "idle" && "Ready"}
              {algorithmState === "step-by-step" && `Step ${currentStep + 1}/${snapshots.length}`}
              {algorithmState === "completed" && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-green-600 font-bold"
                >
                  ✓ Completed!
                </motion.div>
              )}
            </div>
            {edges.length > 0 && (
              <motion.div
                className="text-xs text-[#556B2F] font-semibold"
                animate={algorithmState !== "idle" ? { opacity: [0.5, 1, 0.5] } : {}}
                transition={{ repeat: algorithmState !== "idle" ? Infinity : 0, duration: 1.5 }}
              >
                {displayState.mstEdges.length} / {nodes.length - 1} edges
              </motion.div>
            )}
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
                    <filter id="mstGlow">
                      <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                      <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                    <filter id="currentEdgeGlow">
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

                      const x1 = isNaN(fromNode.x) ? 50 : fromNode.x;
                      const y1 = isNaN(fromNode.y) ? 50 : fromNode.y;
                      const x2 = isNaN(toNode.x) ? 50 : toNode.x;
                      const y2 = isNaN(toNode.y) ? 50 : toNode.y;

                      const midX = (x1 + x2) / 2;
                      const midY = (y1 + y2) / 2;

                      const isInMST = displayState.mstEdges.some(
                        (e) =>
                          (e.from === edge.from && e.to === edge.to) ||
                          (e.from === edge.to && e.to === edge.from)
                      );

                      const isRejected = displayState.rejectedEdges.some(
                        (e) =>
                          (e.from === edge.from && e.to === edge.to) ||
                          (e.from === edge.to && e.to === edge.from)
                      );

                      const isCurrent = displayState.currentEdge &&
                        ((displayState.currentEdge.from === edge.from && displayState.currentEdge.to === edge.to) ||
                          (displayState.currentEdge.from === edge.to && displayState.currentEdge.to === edge.from));

                      let strokeColor = "#D8CCA3";
                      let strokeWidthVal = 2;
                      let filterUrl = "none";
                      let opacity = 0.6;

                      if (isInMST) {
                        strokeColor = "#4B5320";
                        strokeWidthVal = 4;
                        opacity = 0.9;
                        filterUrl = "url(#mstGlow)";
                      } else if (isRejected) {
                        strokeColor = "#FF6B6B";
                        strokeWidthVal = 2;
                        opacity = 0.4;
                      } else if (isCurrent) {
                        strokeColor = "#FED66A";
                        strokeWidthVal = 3;
                        opacity = 1;
                        filterUrl = "url(#currentEdgeGlow)";
                      }

                      return (
                        <g key={`edge-${idx}`}>
                          <motion.line
                            x1={x1}
                            y1={y1}
                            x2={x2}
                            y2={y2}
                            stroke={strokeColor}
                            strokeWidth={strokeWidthVal}
                            filter={filterUrl}
                            strokeDasharray={isInMST ? "5,5" : isRejected ? "2,2" : "0"}
                            animate={{
                              strokeDashoffset: isInMST ? [0, -10] : 0,
                              opacity: isCurrent ? [0.5, 1, 0.5] : opacity,
                            }}
                            transition={{ repeat: isInMST || isCurrent ? Infinity : 0, duration: 1.5 }}
                          />
                          <text
                            x={midX}
                            y={midY - 5}
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
                      const x = isNaN(node.x) ? 50 : node.x;
                      const y = isNaN(node.y) ? 50 : node.y;

                      const isSelectedForDeletion = selectedNodeForDeletion === node.id;

                      let fillColor = "#F7F1DD";
                      let strokeColor = "#D8CCA3";

                      if (isSelectedForDeletion) {
                        fillColor = "#FF6B6B";
                        strokeColor = "#FF3333";
                      }

                      const strokeWidthVal = isSelectedForDeletion ? "3" : "1.5";

                      return (
                        <motion.g
                          key={`node-${node.id}`}
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          whileHover={{ scale: 1.15 }}
                          transition={{ type: "spring", stiffness: 260, damping: 20 }}
                          onClick={(e) => handleNodeClick(node.id, e as unknown as React.MouseEvent)}
                          style={{ cursor: "pointer" }}
                        >
                          <motion.circle
                            cx={x}
                            cy={y}
                            r={nodeRadius}
                            fill={fillColor}
                            stroke={strokeColor}
                            strokeWidth={strokeWidthVal}
                            animate={{
                              r: isSelectedForDeletion ? nodeSelectedRadius : nodeRadius,
                            }}
                            transition={{ duration: 0.3 }}
                          />
                          <text
                            x={x}
                            y={y}
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
                          setKruskalState(snap.state);
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
                    <Trash2 className="mb-1 inline h-3 w-3" /> Delete {selectedNodeForDeletion && `(${selectedNodeForDeletion})`}
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
                    >
                      ⚡ Generate
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleExportGraph}
                      disabled={nodes.length === 0}
                      className="flex-1 rounded-lg border border-[#7D8F3B] bg-white px-2 py-2 text-xs font-medium text-[#7D8F3B] hover:bg-[#F1E8C7] disabled:opacity-50"
                    >
                      <Download className="inline h-3 w-3 mr-1" /> Export
                    </button>
                    <button
                      onClick={() => setShowExportModal(!showExportModal)}
                      disabled={algorithmState !== "idle"}
                      className="flex-1 rounded-lg border border-[#7D8F3B] bg-white px-2 py-2 text-xs font-medium text-[#7D8F3B] hover:bg-[#F1E8C7] disabled:opacity-50"
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
                    disabled={nodes.length === 0 || edges.length === 0 || algorithmState !== "idle"}
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
                        <p className="font-semibold">MST Edges</p>
                        <p className="font-mono text-lg">{displayState.mstEdges.length}</p>
                      </div>
                      <div className="rounded-lg bg-gradient-to-br from-[#FED66A] to-[#AAB76A] text-white p-2">
                        <p className="font-semibold">Total Weight</p>
                        <p className="font-mono text-lg">{displayState.totalWeight}</p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Collapsible Sections */}

              {/* Sorted Edges */}
              <CollapsibleSection
                title="Edges"
                expanded={expandedSections.edges}
                onToggle={() => toggleSection("edges")}
              >
                {displayState.sortedEdges.length === 0 ? (
                  <p className="text-xs text-[#556B2F]">No edges</p>
                ) : (
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {displayState.sortedEdges.map((edge, idx) => {
                      const isInMST = displayState.mstEdges.some(
                        (e) =>
                          (e.from === edge.from && e.to === edge.to) ||
                          (e.from === edge.to && e.to === edge.from)
                      );
                      const isRejected = displayState.rejectedEdges.some(
                        (e) =>
                          (e.from === edge.from && e.to === edge.to) ||
                          (e.from === edge.to && e.to === edge.from)
                      );
                      const isCurrent = displayState.currentEdge &&
                        ((displayState.currentEdge.from === edge.from && displayState.currentEdge.to === edge.to) ||
                          (displayState.currentEdge.from === edge.to && displayState.currentEdge.to === edge.from));

                      return (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className={`text-xs font-mono p-2 rounded transition ${
                            isInMST
                              ? "bg-gradient-to-r from-[#AAB76A] to-[#7D8F3B] text-white font-bold ring-2 ring-offset-1 ring-yellow-300"
                              : isRejected
                              ? "bg-[#FFE5E5] text-[#556B2F] line-through opacity-60"
                              : isCurrent
                              ? "bg-yellow-100 text-yellow-900 ring-2 ring-yellow-400"
                              : "bg-[#F1E8C7] text-[#556B2F]"
                          }`}
                        >
                          {isInMST && "✓ "}
                          {isRejected && "✗ "}
                          {isCurrent && "▶ "}
                          {edge.from}→{edge.to} <span className="font-bold">({edge.weight})</span>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </CollapsibleSection>

              {/* MST Summary */}
              <CollapsibleSection
                title="MST Summary"
                expanded={expandedSections.mstSummary}
                onToggle={() => toggleSection("mstSummary")}
              >
                {displayState.mstEdges.length === 0 ? (
                  <p className="text-xs text-[#556B2F]">MST not started yet</p>
                ) : (
                  <div className="space-y-2">
                    <div className="bg-gradient-to-r from-[#AAB76A] to-[#7D8F3B] text-white p-3 rounded-lg text-sm font-bold">
                      Total MST Weight: {displayState.totalWeight}
                    </div>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {displayState.mstEdges.map((edge, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="text-xs font-mono bg-green-50 border border-green-200 text-green-900 p-2 rounded flex justify-between items-center"
                        >
                          <span>
                            <span className="font-bold">{idx + 1}.</span> {edge.from} → {edge.to}
                          </span>
                          <span className="bg-green-200 text-green-900 px-2 py-0.5 rounded font-bold">{edge.weight}</span>
                        </motion.div>
                      ))}
                    </div>
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
                  <div className="flex justify-between p-2 rounded bg-white border border-[#D8CCA3] text-[#4B5320]">
                    <span className="font-semibold">Components:</span>
                    <span className="font-mono font-bold">{displayState.components}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-gradient-to-r from-[#7D8F3B] to-[#556B2F] text-white font-semibold">
                    <span>MST Weight:</span>
                    <span className="font-mono text-lg">{displayState.totalWeight}</span>
                  </div>
                  <div className="p-2 rounded bg-gradient-to-r from-[#7D8F3B] to-[#556B2F] text-white font-semibold">
                    <span>Complexity</span>
                    <p className="font-mono text-xs mt-1">Time: O(E log E)</p>
                  </div>
                </div>
              </CollapsibleSection>

              {/* Union-Find State */}
              <CollapsibleSection
                title="Union-Find"
                expanded={expandedSections.unionFind}
                onToggle={() => toggleSection("unionFind")}
              >
                <div className="space-y-2 text-xs">
                  <div className="bg-gradient-to-r from-[#AAB76A] to-[#7D8F3B] text-white p-2 rounded font-semibold">
                    <p className="mb-1">Connected Components: {displayState.components}</p>
                    <p className="text-xs font-normal">Need {nodes.length - 1} edges for complete MST</p>
                  </div>
                  {displayState.mstEdges.length > 0 && (
                    <div className="bg-green-50 border border-green-200 p-2 rounded">
                      <p className="font-semibold text-green-900 mb-1">✓ Union Operations: {displayState.mstEdges.length}</p>
                      <p className="text-green-800 text-xs">Components merged: {nodes.length - displayState.components}</p>
                    </div>
                  )}
                  {displayState.rejectedEdges.length > 0 && (
                    <div className="bg-red-50 border border-red-200 p-2 rounded">
                      <p className="font-semibold text-red-900 mb-1">✗ Cycle Detections: {displayState.rejectedEdges.length}</p>
                      <p className="text-red-800 text-xs">Edges skipped (same component)</p>
                    </div>
                  )}
                  {Object.keys(displayState.parent).length > 0 && (
                    <div className="bg-white border border-[#D8CCA3] p-2 rounded max-h-32 overflow-y-auto">
                      <p className="font-semibold text-[#556B2F] mb-2">Parent Pointers (Union-Find):</p>
                      <div className="font-mono text-xs text-[#7D8F3B] space-y-1">
                        {Object.entries(displayState.parent)
                          .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
                          .map(([node, parent]) => {
                            const isRoot = node === parent.toString();
                            return (
                              <div key={node} className={isRoot ? "font-bold text-[#4B5320] bg-yellow-50 px-1" : ""}>
                                {node} → {parent} {isRoot && "🔴 ROOT"}
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}
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

              {/* Info */}
              <CollapsibleSection
                title="Learn"
                expanded={expandedSections.info}
                onToggle={() => toggleSection("info")}
              >
                <div className="space-y-3 text-xs">
                  <div className="p-2 rounded bg-blue-50 border border-blue-200">
                    <p className="font-semibold text-blue-900 mb-1">What is Kruskal's?</p>
                    <p className="text-blue-800 text-xs">Greedy algorithm that sorts all edges by weight and adds them to MST if they don't create a cycle.</p>
                  </div>
                  <div className="p-2 rounded bg-green-50 border border-green-200">
                    <p className="font-semibold text-green-900 mb-1">Union-Find</p>
                    <p className="text-green-800 text-xs">Data structure that efficiently detects cycles and manages connected components.</p>
                  </div>
                  <div className="p-2 rounded bg-purple-50 border border-purple-200">
                    <p className="font-semibold text-purple-900 mb-1">vs Prim's</p>
                    <p className="text-purple-800 text-xs">Kruskal sorts edges globally. Prim grows from a node. Both find MST with O(E log E).</p>
                  </div>
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

                <div className="space-y-2">
                  <p className="text-xs font-semibold text-[#556B2F] mb-2">Graph Type:</p>
                  <button
                    onClick={() => {
                      handleGenerateGraph(generateNodeCount);
                      setShowGenerateModal(false);
                    }}
                    className="w-full bg-[#AAB76A] text-white px-4 py-2 rounded-lg hover:bg-[#7D8F3B] font-medium text-xs mb-2"
                  >
                    📊 Sparse (15% edges)
                  </button>
                  <button
                    onClick={() => {
                      handleGenerateDenseGraph(generateNodeCount);
                      setShowGenerateModal(false);
                    }}
                    className="w-full bg-[#7D8F3B] text-white px-4 py-2 rounded-lg hover:bg-[#556B2F] font-medium text-xs"
                  >
                    🔗 Dense (50% edges)
                  </button>
                </div>
              </div>

              <div className="flex gap-2 mt-6">
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
  const cols = Math.ceil(Math.sqrt(totalNodes));
  const col = index % cols;
  const row = Math.floor(index / cols);
  const spacing = 60 / cols;

  return {
    x: 20 + col * spacing + (Math.random() - 0.5) * 5,
    y: 20 + row * spacing + (Math.random() - 0.5) * 5,
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
