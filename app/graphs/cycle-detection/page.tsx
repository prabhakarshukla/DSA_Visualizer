"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  Pause,
  Play,
  Plus,
  RotateCcw,
  Shuffle,
  Trash2,
  Zap,
  Download,
  Upload,
  ChevronRight,
  ChevronLeft,
  BookOpen,
  Info,
  CheckCircle,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";

type GraphNode = {
  id: number;
  x: number;
  y: number;
};

type Edge = {
  from: number;
  to: number;
};

type ExecutionStep = {
  stepNumber: number;
  action: string;
  visitedNodes: number[];
  recursionStack: number[];
  currentNode: number | null;
  activeEdge: Edge | null;
  cycleNodes: number[];
  cycleFound: boolean | null;
  timestamp: number;
};

type GraphMode = "directed" | "undirected";
type AlgorithmState = "idle" | "running" | "paused" | "completed" | "stepping";
type SpeedLevel = "slow" | "medium" | "fast";

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

export default function CycleDetectionPage() {
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [nextNodeId, setNextNodeId] = useState(1);

  const [graphMode, setGraphMode] = useState<GraphMode>("directed");
  const [algorithmState, setAlgorithmState] = useState<AlgorithmState>("idle");
  const [speed, setSpeed] = useState<SpeedLevel>("medium");

  const [edgeFrom, setEdgeFrom] = useState<number | null>(null);
  const [edgeTo, setEdgeTo] = useState<number | null>(null);

  const [draggingNode, setDraggingNode] = useState<number | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const [visitedNodes, setVisitedNodes] = useState<number[]>([]);
  const [currentNode, setCurrentNode] = useState<number | null>(null);
  const [activeEdge, setActiveEdge] = useState<Edge | null>(null);
  const [recursionStack, setRecursionStack] = useState<number[]>([]);
  const [cycleFound, setCycleFound] = useState<boolean | null>(null);
  const [cycleLength, setCycleLength] = useState<number | null>(null);
  const [cycleNodes, setCycleNodes] = useState<number[]>([]);
  const [steps, setSteps] = useState<string[]>(["Build your graph and start detection."]);

  // Step-by-step execution
  const [executionSteps, setExecutionSteps] = useState<ExecutionStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isAutoplay, setIsAutoplay] = useState(false);
  const [exploredEdges, setExploredEdges] = useState<Edge[]>([]);

  // UI state
  const [showEducation, setShowEducation] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    progress: true,
    history: true,
    summary: true,
  });

  const pauseRef = useRef(false);
  const cancelRef = useRef(false);
  const autoplayRef = useRef<NodeJS.Timeout | null>(null);

  const adjacencyList = useMemo(() => {
    const list: Record<number, number[]> = {};
    nodes.forEach((n) => {
      list[n.id] = [];
    });

    edges.forEach((e) => {
      if (!list[e.from]) list[e.from] = [];
      if (!list[e.to]) list[e.to] = [];
      list[e.from].push(e.to);
      if (graphMode === "undirected") {
        list[e.to].push(e.from);
      }
    });

    Object.keys(list).forEach((key) => {
      list[parseInt(key)] = Array.from(new Set(list[parseInt(key)])).sort((a, b) => a - b);
    });

    return list;
  }, [nodes, edges, graphMode]);

  const cycleEdges = useMemo(() => {
    if (cycleNodes.length < 2) return [];
    const edgesForCycle: Edge[] = [];
    for (let i = 0; i < cycleNodes.length; i += 1) {
      edgesForCycle.push({
        from: cycleNodes[i],
        to: cycleNodes[(i + 1) % cycleNodes.length],
      });
    }
    return edgesForCycle;
  }, [cycleNodes]);

  const progressPercentage = useMemo(() => {
    if (nodes.length === 0) return 0;
    return Math.round((visitedNodes.length / nodes.length) * 100);
  }, [visitedNodes, nodes]);

  const speedSleep = (ms: number) => sleep(ms * getSpeedMultiplier(speed));

  const recordStep = (action: string) => {
    const step: ExecutionStep = {
      stepNumber: executionSteps.length,
      action,
      visitedNodes: [...visitedNodes],
      recursionStack: [...recursionStack],
      currentNode,
      activeEdge: activeEdge ? { ...activeEdge } : null,
      cycleNodes: [...cycleNodes],
      cycleFound,
      timestamp: Date.now(),
    };
    setExecutionSteps((prev) => [...prev, step]);
  };

  const applyExecutionStep = (step: ExecutionStep) => {
    setVisitedNodes(step.visitedNodes);
    setRecursionStack(step.recursionStack);
    setCurrentNode(step.currentNode);
    setActiveEdge(step.activeEdge);
    setCycleNodes(step.cycleNodes);
    if (step.cycleFound !== null) setCycleFound(step.cycleFound);
    setSteps((prev) => [...prev, step.action]);
  };

  const handleNextStep = () => {
    if (currentStepIndex < executionSteps.length - 1) {
      const nextIndex = currentStepIndex + 1;
      setCurrentStepIndex(nextIndex);
      applyExecutionStep(executionSteps[nextIndex]);
    }
  };

  const handlePreviousStep = () => {
    if (currentStepIndex > 0) {
      const prevIndex = currentStepIndex - 1;
      setCurrentStepIndex(prevIndex);
      applyExecutionStep(executionSteps[prevIndex]);
    }
  };

  const toggleAutoplay = () => {
    if (isAutoplay) {
      if (autoplayRef.current) clearInterval(autoplayRef.current);
      setIsAutoplay(false);
    } else {
      setIsAutoplay(true);
      const interval = setInterval(() => {
        setCurrentStepIndex((prev) => {
          if (prev < executionSteps.length - 1) {
            const nextIndex = prev + 1;
            applyExecutionStep(executionSteps[nextIndex]);
            return nextIndex;
          } else {
            setIsAutoplay(false);
            return prev;
          }
        });
      }, speed === "slow" ? 2000 : speed === "medium" ? 1200 : 600);
      autoplayRef.current = interval;
    }
  };

  const resetAlgorithmState = () => {
    if (autoplayRef.current) clearInterval(autoplayRef.current);
    cancelRef.current = true;
    pauseRef.current = false;
    setIsAutoplay(false);
    setAlgorithmState("idle");
    setVisitedNodes([]);
    setCurrentNode(null);
    setActiveEdge(null);
    setRecursionStack([]);
    setCycleFound(null);
    setCycleLength(null);
    setCycleNodes([]);
    setExecutionSteps([]);
    setCurrentStepIndex(0);
    setExploredEdges([]);
    setSteps(["Build your graph and start detection."]);
  };

  const handleAddNode = () => {
    const newId = nextNodeId;
    const position = generateNodePosition(nodes.length + 1, nodes.length);
    setNodes([...nodes, { id: newId, x: position.x, y: position.y }]);
    setNextNodeId(newId + 1);
  };

  const handleDeleteSelectedNode = () => {
    if (edgeFrom === null || edgeTo !== null) return;
    const nodeId = edgeFrom;
    setNodes(nodes.filter((n) => n.id !== nodeId));
    setEdges(edges.filter((e) => e.from !== nodeId && e.to !== nodeId));
    setEdgeFrom(null);
  };

  const handleConnectNodes = () => {
    if (edgeFrom === null || edgeTo === null || edgeFrom === edgeTo) return;
    const edgeExists = edges.some((e) => {
      if (graphMode === "directed") {
        return e.from === edgeFrom && e.to === edgeTo;
      }
      return (e.from === edgeFrom && e.to === edgeTo) || (e.from === edgeTo && e.to === edgeFrom);
    });

    if (!edgeExists) {
      setEdges([...edges, { from: edgeFrom, to: edgeTo }]);
    }

    setEdgeFrom(null);
    setEdgeTo(null);
  };

  const handleRemoveEdge = () => {
    if (edgeFrom === null || edgeTo === null) return;
    setEdges(
      edges.filter((e) => {
        if (graphMode === "directed") {
          return !(e.from === edgeFrom && e.to === edgeTo);
        }
        return !((e.from === edgeFrom && e.to === edgeTo) || (e.from === edgeTo && e.to === edgeFrom));
      })
    );
    setEdgeFrom(null);
    setEdgeTo(null);
  };

  const handleClearGraph = () => {
    setNodes([]);
    setEdges([]);
    setNextNodeId(1);
    setEdgeFrom(null);
    setEdgeTo(null);
    resetAlgorithmState();
  };

  const generateCyclicGraph = () => {
    const nodeCount = 6;
    const newNodes: GraphNode[] = [];
    for (let i = 0; i < nodeCount; i += 1) {
      const position = generateNodePosition(nodeCount, i);
      newNodes.push({ id: i + 1, x: position.x, y: position.y });
    }

    const newEdges: Edge[] = [];
    for (let i = 0; i < nodeCount; i += 1) {
      newEdges.push({ from: i + 1, to: ((i + 1) % nodeCount) + 1 });
    }
    newEdges.push({ from: 3, to: 1 });

    setNodes(newNodes);
    setEdges(newEdges);
    setNextNodeId(nodeCount + 1);
    resetAlgorithmState();
  };

  const generateAcyclicGraph = () => {
    const newNodes: GraphNode[] = [];
    const nodeCount = 6;
    for (let i = 0; i < nodeCount; i += 1) {
      const position = generateNodePosition(nodeCount, i);
      newNodes.push({ id: i + 1, x: position.x, y: position.y });
    }

    const newEdges: Edge[] = [
      { from: 1, to: 2 },
      { from: 1, to: 3 },
      { from: 2, to: 4 },
      { from: 3, to: 4 },
      { from: 3, to: 5 },
      { from: 4, to: 6 },
      { from: 5, to: 6 },
    ];

    setNodes(newNodes);
    setEdges(newEdges);
    setNextNodeId(nodeCount + 1);
    resetAlgorithmState();
  };

  const generateDAG = () => {
    const newNodes: GraphNode[] = [];
    const nodeCount = 7;
    for (let i = 0; i < nodeCount; i += 1) {
      const position = generateNodePosition(nodeCount, i);
      newNodes.push({ id: i + 1, x: position.x, y: position.y });
    }

    const newEdges: Edge[] = [
      { from: 1, to: 2 },
      { from: 1, to: 3 },
      { from: 2, to: 4 },
      { from: 3, to: 4 },
      { from: 3, to: 5 },
      { from: 4, to: 6 },
      { from: 5, to: 6 },
      { from: 6, to: 7 },
    ];

    setNodes(newNodes);
    setEdges(newEdges);
    setNextNodeId(nodeCount + 1);
    resetAlgorithmState();
  };

  const generateDenseGraph = () => {
    const nodeCount = 5;
    const newNodes: GraphNode[] = [];
    for (let i = 0; i < nodeCount; i += 1) {
      const position = generateNodePosition(nodeCount, i);
      newNodes.push({ id: i + 1, x: position.x, y: position.y });
    }

    const newEdges: Edge[] = [];
    for (let i = 1; i <= nodeCount; i += 1) {
      for (let j = i + 1; j <= nodeCount; j += 1) {
        newEdges.push({ from: i, to: j });
        if (Math.random() > 0.3) {
          newEdges.push({ from: j, to: i });
        }
      }
    }

    setNodes(newNodes);
    setEdges(newEdges);
    setNextNodeId(nodeCount + 1);
    resetAlgorithmState();
  };

  const handleGenerateRandomGraph = () => {
    const nodeCount = Math.floor(Math.random() * 4) + 6;
    const newNodes: GraphNode[] = [];
    for (let i = 0; i < nodeCount; i += 1) {
      const position = generateNodePosition(nodeCount, i);
      newNodes.push({ id: i + 1, x: position.x, y: position.y });
    }

    const newEdges: Edge[] = [];
    const targetEdges = nodeCount + Math.floor(nodeCount / 2);

    while (newEdges.length < targetEdges) {
      const from = newNodes[Math.floor(Math.random() * newNodes.length)].id;
      const to = newNodes[Math.floor(Math.random() * newNodes.length)].id;
      if (from === to) continue;

      const edgeExists = newEdges.some((edge) => {
        if (graphMode === "directed") {
          return edge.from === from && edge.to === to;
        }
        return (edge.from === from && edge.to === to) || (edge.from === to && edge.to === from);
      });

      if (!edgeExists) {
        newEdges.push({ from, to });
      }
    }

    setNodes(newNodes);
    setEdges(newEdges);
    setNextNodeId(nodeCount + 1);
    resetAlgorithmState();
  };

  const exportGraph = () => {
    const graphData = { nodes, edges, graphMode };
    const json = JSON.stringify(graphData, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cycle-graph-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importGraph = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const graphData = JSON.parse(event.target?.result as string);
          setNodes(graphData.nodes);
          setEdges(graphData.edges);
          setGraphMode(graphData.graphMode);
          setNextNodeId(Math.max(...graphData.nodes.map((n: GraphNode) => n.id)) + 1);
          resetAlgorithmState();
        } catch (err) {
          alert("Failed to import graph");
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handlePause = () => {
    if (algorithmState !== "running") return;
    pauseRef.current = true;
    setAlgorithmState("paused");
    setSteps((prev) => [...prev, "Paused: waiting for resume."]);
  };

  const handleResume = () => {
    if (algorithmState !== "paused") return;
    pauseRef.current = false;
    setAlgorithmState("running");
    setSteps((prev) => [...prev, "Resumed cycle detection."]);
  };

  const handleGraphModeChange = (mode: GraphMode) => {
    if (algorithmState === "running" || algorithmState === "paused") return;
    setGraphMode(mode);
    if (mode === "undirected") {
      setEdges((prev) => {
        const unique = new Map<string, Edge>();
        prev.forEach((edge) => {
          const a = Math.min(edge.from, edge.to);
          const b = Math.max(edge.from, edge.to);
          const key = `${a}-${b}`;
          if (!unique.has(key)) {
            unique.set(key, { from: a, to: b });
          }
        });
        return Array.from(unique.values());
      });
    }
  };

  const handleSvgMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (algorithmState === "running" || algorithmState === "paused") return;
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
        n.id === draggingNode ? { ...n, x: Math.max(5, Math.min(95, x)), y: Math.max(5, Math.min(95, y)) } : n
      )
    );
  };

  const handleSvgMouseUp = () => {
    if (draggingNode !== null) {
      setDraggingNode(null);
    }
  };

  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (draggingNode !== null || algorithmState === "running" || algorithmState === "paused") return;
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    for (const node of nodes) {
      const distance = Math.sqrt((x - node.x) ** 2 + (y - node.y) ** 2);
      if (distance < 5) {
        if (edgeFrom === node.id) {
          setEdgeFrom(null);
        } else if (edgeFrom === null) {
          setEdgeFrom(node.id);
        } else if (edgeTo === node.id) {
          setEdgeTo(null);
        } else if (edgeTo === null) {
          setEdgeTo(node.id);
        } else {
          setEdgeFrom(node.id);
          setEdgeTo(null);
        }
        return;
      }
    }
  };

  const runCycleDetection = async () => {
    if (nodes.length === 0 || algorithmState === "running" || algorithmState === "paused") return;
    cancelRef.current = false;
    pauseRef.current = false;
    setAlgorithmState("running");
    setVisitedNodes([]);
    setCurrentNode(null);
    setActiveEdge(null);
    setRecursionStack([]);
    setCycleFound(null);
    setCycleLength(null);
    setCycleNodes([]);
    setExecutionSteps([]);
    setCurrentStepIndex(0);
    setExploredEdges([]);

    const initialSteps = [
      "Starting DFS cycle detection...",
      `Using ${graphMode === "directed" ? "directed" : "undirected"} graph mode`,
      "Building adjacency list...",
      "Time Complexity: O(V + E)",
    ];
    setSteps(initialSteps);

    const visited = new Set<number>();
    const inStack = new Set<number>();
    const stack: number[] = [];
    let foundCycle = false;
    const allExploredEdges: Edge[] = [];

    const waitGate = async (ms: number) => {
      await speedSleep(ms);
      while (pauseRef.current) {
        await sleep(200);
      }
      return !cancelRef.current;
    };

    const dfs = async (nodeId: number, parent: number | null): Promise<void> => {
      if (cancelRef.current || foundCycle) return;

      visited.add(nodeId);
      inStack.add(nodeId);
      stack.push(nodeId);

      setVisitedNodes([...visited]);
      setRecursionStack([...stack]);
      setCurrentNode(nodeId);

      const visitAction = `Visiting node ${nodeId}`;
      setSteps((prev) => [...prev, visitAction]);
      recordStep(visitAction);

      if (!(await waitGate(400))) return;

      const neighbors = adjacencyList[nodeId] || [];
      for (let i = 0; i < neighbors.length; i += 1) {
        const neighbor = neighbors[i];
        if (cancelRef.current || foundCycle) return;

        const edge: Edge = { from: nodeId, to: neighbor };
        setActiveEdge(edge);
        allExploredEdges.push(edge);

        const exploreAction = `Exploring neighbor ${neighbor} from node ${nodeId}`;
        setSteps((prev) => [...prev, exploreAction]);
        recordStep(exploreAction);

        if (!(await waitGate(300))) return;

        if (!visited.has(neighbor)) {
          const recurseAction = `Node ${neighbor} is unvisited, recursing...`;
          setSteps((prev) => [...prev, recurseAction]);
          recordStep(recurseAction);

          if (!(await waitGate(200))) return;
          await dfs(neighbor, nodeId);
          if (foundCycle) return;
        } else if (inStack.has(neighbor)) {
          if (graphMode === "directed" || neighbor !== parent) {
            const cycleStartIndex = stack.indexOf(neighbor);
            const cycle = cycleStartIndex >= 0 ? stack.slice(cycleStartIndex).concat([neighbor]) : [neighbor, nodeId];

            setCycleFound(true);
            setCycleNodes(cycle.slice(0, -1));
            setCycleLength(cycle.length - 1);

            const cycleStr = cycle.join(" → ");
            const backEdgeAction = `Back edge detected: ${nodeId} → ${neighbor}`;
            const cycleFoundAction = `Cycle found: ${cycleStr}`;
            const cyclelenAction = `Cycle length: ${cycle.length - 1}`;

            setSteps((prev) => [...prev, backEdgeAction, cycleFoundAction, cyclelenAction]);
            recordStep(backEdgeAction);
            recordStep(cycleFoundAction);
            recordStep(cyclelenAction);

            foundCycle = true;
            if (!(await waitGate(500))) return;
            return;
          }
        } else {
          const visitedAction = `Node ${neighbor} already visited (no back edge)`;
          setSteps((prev) => [...prev, visitedAction]);
          recordStep(visitedAction);

          if (!(await waitGate(150))) return;
        }
      }

      stack.pop();
      inStack.delete(nodeId);
      setRecursionStack([...stack]);
      setCurrentNode(null);

      const backtrackAction = `Backtracking from node ${nodeId}`;
      setSteps((prev) => [...prev, backtrackAction]);
      recordStep(backtrackAction);

      if (!(await waitGate(250))) return;
    };

    for (const node of nodes) {
      if (cancelRef.current || foundCycle) break;
      if (!visited.has(node.id)) {
        const startAction = `Starting DFS from node ${node.id}`;
        setSteps((prev) => [...prev, startAction]);
        recordStep(startAction);

        if (!(await waitGate(300))) return;
        await dfs(node.id, null);
      }
    }

    if (cancelRef.current) return;

    setExploredEdges(allExploredEdges);
    setActiveEdge(null);
    setCurrentNode(null);

    if (!foundCycle) {
      setCycleFound(false);
      setCycleLength(0);
      setSteps((prev) => [
        ...prev,
        "DFS traversal complete",
        "No cycles detected in the graph",
      ]);
    } else {
      setSteps((prev) => [
        ...prev,
        "Cycle detection complete",
        `Cycle successfully detected and highlighted`,
      ]);
    }

    if (!(await waitGate(300))) return;
    setAlgorithmState("completed");
  };

  const svgWidth = 640;
  const svgHeight = 420;
  const recursionDepth = recursionStack.length;
  const isRunning = algorithmState === "running";
  const isPaused = algorithmState === "paused";
  const isLocked = isRunning || isPaused;

  const statusMessage =
    algorithmState === "running"
      ? "Detecting..."
      : algorithmState === "paused"
        ? "Paused"
        : algorithmState === "completed"
          ? "Completed"
          : "Ready";

  return (
    <main className="min-h-screen bg-[#F1E8C7] px-4 py-10 text-[#4B5320] sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl space-y-6">
        <Link href="/graphs" className="inline-flex items-center text-sm font-medium text-[#556B2F] hover:text-[#4B5320]">
          &larr; Back to graphs
        </Link>

        <section className="rounded-3xl border border-[#D8CCA3] bg-[#F7F1DD]/90 p-6 shadow-[0_10px_30px_rgba(75,83,32,0.08)] sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-[#4B5320] sm:text-4xl">Cycle Detection Visualizer</h1>
              <p className="mt-3 max-w-3xl text-[#556B2F]">
                Visualize cycle detection in graphs using DFS and recursion stack tracking.
              </p>
            </div>
            <div className="rounded-2xl border border-[#D8CCA3] bg-[#F1E8C7] px-4 py-3 text-right shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#7D8F3B]">Status</p>
              <p className="text-sm font-semibold text-[#4B5320]">{statusMessage}</p>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          <div className="lg:col-span-3 space-y-6">
            <div className="rounded-3xl border border-[#D8CCA3] bg-[#F7F1DD]/90 p-6 shadow-[0_10px_30px_rgba(75,83,32,0.08)]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-[#4B5320]">Graph Visualization</h2>
                <div className="flex flex-wrap items-center gap-2 text-xs text-[#556B2F]">
                  <span className="rounded-full border border-[#AAB76A] bg-[#F1E8C7] px-3 py-1 font-semibold">
                    {graphMode === "directed" ? "Directed graph" : "Undirected graph"}
                  </span>
                  <span className="rounded-full border border-[#AAB76A] bg-[#F1E8C7] px-3 py-1 font-semibold">
                    {nodes.length} nodes / {edges.length} edges
                  </span>
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
                  <defs>
                    <marker
                      id="arrowhead"
                      markerWidth="50"
                      markerHeight="50"
                      refX="10"
                      refY="25"
                      orient="auto"
                      markerUnits="userSpaceOnUse"
                    >
                      <polygon points="0 0, 50 25, 0 50" fill="#7D8F3B" />
                    </marker>
                    <marker
                      id="arrowhead-active"
                      markerWidth="50"
                      markerHeight="50"
                      refX="10"
                      refY="25"
                      orient="auto"
                      markerUnits="userSpaceOnUse"
                    >
                      <polygon points="0 0, 50 25, 0 50" fill="#556B2F" />
                    </marker>
                    <marker
                      id="arrowhead-cycle"
                      markerWidth="50"
                      markerHeight="50"
                      refX="10"
                      refY="25"
                      orient="auto"
                      markerUnits="userSpaceOnUse"
                    >
                      <polygon points="0 0, 50 25, 0 50" fill="#4B5320" />
                    </marker>
                  </defs>

                  {edges.map((edge, idx) => {
                    const fromNode = nodes.find((n) => n.id === edge.from);
                    const toNode = nodes.find((n) => n.id === edge.to);
                    if (!fromNode || !toNode) return null;

                    const x1 = (fromNode.x / 100) * svgWidth;
                    const y1 = (fromNode.y / 100) * svgHeight;
                    const x2 = (toNode.x / 100) * svgWidth;
                    const y2 = (toNode.y / 100) * svgHeight;

                    const isActive =
                      activeEdge &&
                      ((activeEdge.from === edge.from && activeEdge.to === edge.to) ||
                        (graphMode === "undirected" && activeEdge.from === edge.to && activeEdge.to === edge.from));

                    const isCycleEdge = cycleEdges.some((cycleEdge) => {
                      if (graphMode === "directed") {
                        return cycleEdge.from === edge.from && cycleEdge.to === edge.to;
                      }
                      return (
                        (cycleEdge.from === edge.from && cycleEdge.to === edge.to) ||
                        (cycleEdge.from === edge.to && cycleEdge.to === edge.from)
                      );
                    });

                    const strokeColor = isCycleEdge ? "#4B5320" : isActive ? "#7D8F3B" : "#D8CCA3";
                    const strokeWidth = isCycleEdge ? "4" : isActive ? "3" : "2";

                    let markerUrl: string | undefined = undefined;
                    if (graphMode === "directed") {
                      if (isCycleEdge) {
                        markerUrl = "url(#arrowhead-cycle)";
                      } else if (isActive) {
                        markerUrl = "url(#arrowhead-active)";
                      } else {
                        markerUrl = "url(#arrowhead)";
                      }
                    }

                    return (
                      <motion.line
                        key={`edge-${idx}`}
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke={strokeColor}
                        strokeWidth={strokeWidth}
                        strokeDasharray={isCycleEdge ? "6,4" : "0"}
                        markerEnd={markerUrl}
                        animate={{ opacity: isActive ? [0.6, 1, 0.6] : 0.7 }}
                        transition={{ repeat: isActive ? Infinity : 0, duration: 1.4 }}
                      />
                    );
                  })}

                  <AnimatePresence>
                    {nodes.map((node) => {
                      const x = (node.x / 100) * svgWidth;
                      const y = (node.y / 100) * svgHeight;
                      const isVisited = visitedNodes.includes(node.id);
                      const isActive = currentNode === node.id;
                      const isSelected = edgeFrom === node.id || edgeTo === node.id;
                      const isCycleNode = cycleNodes.includes(node.id);

                      let fillColor = "#F7F1DD";
                      let strokeColor = "#D8CCA3";

                      if (isCycleNode) {
                        fillColor = "#7D8F3B";
                        strokeColor = "#4B5320";
                      } else if (isActive) {
                        fillColor = "#AAB76A";
                        strokeColor = "#556B2F";
                      } else if (isSelected) {
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
                          whileHover={{ scale: 1.12 }}
                          transition={{ type: "spring", stiffness: 260, damping: 20 }}
                        >
                          <motion.circle
                            cx={x}
                            cy={y}
                            r={24}
                            fill={fillColor}
                            stroke={strokeColor}
                            strokeWidth={isSelected || isActive ? "4" : "3"}
                            animate={{ r: isActive ? 28 : isSelected ? 26 : 24 }}
                            transition={{ duration: 0.3 }}
                          />
                          <text
                            x={x}
                            y={y}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            className="pointer-events-none text-sm font-bold"
                            fill={isCycleNode ? "#F7F1DD" : "#4B5320"}
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
                  <p className="text-sm text-[#556B2F]">Add nodes or generate a random graph to begin.</p>
                </motion.div>
              )}

              <div className="mt-4 rounded-2xl border border-[#D8CCA3] bg-[#F1E8C7] p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#556B2F]">Selected Nodes</p>
                <p className="mt-2 text-sm font-mono text-[#4B5320]">
                  {edgeFrom ?? "—"} {edgeTo !== null && `→ ${edgeTo}`}
                </p>
                {graphMode === "directed" && (edgeFrom !== null || edgeTo !== null) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 rounded-lg border-l-4 border-[#7D8F3B] bg-[#F1E8C7] p-3 text-xs text-[#556B2F]"
                  >
                    <p className="font-semibold text-[#4B5320] mb-1">Edge Direction Guide</p>
                    <p>
                      {edgeFrom !== null && edgeTo === null
                        ? `1️⃣ First node selected: ${edgeFrom}. Click another node to set as destination. Arrow will point FROM ${edgeFrom} TO the second node.`
                        : edgeFrom !== null && edgeTo !== null
                          ? `✓ Edge will go FROM node ${edgeFrom} TO node ${edgeTo}. Click "Add Edge" to create.`
                          : "Click a node to start creating a directed edge. First click = source, second click = destination."}
                    </p>
                  </motion.div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl border border-[#D8CCA3] bg-[#F7F1DD]/90 p-6 shadow-[0_10px_30px_rgba(75,83,32,0.08)]"
            >
              <h3 className="text-lg font-semibold text-[#4B5320]">Live Algorithm Panel</h3>
              <p className="mt-2 text-sm text-[#556B2F]">
                Toggle graph mode, edit edges, and control DFS cycle detection in real-time.
              </p>

              <div className="mt-4 space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#556B2F]">Graph Mode</p>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {(["directed", "undirected"] as GraphMode[]).map((mode) => (
                      <motion.button
                        key={mode}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleGraphModeChange(mode)}
                        disabled={isLocked}
                        className={`rounded-xl px-3 py-2 text-xs font-semibold uppercase tracking-wide transition ${
                          graphMode === mode
                            ? "bg-[#7D8F3B] text-white"
                            : "border border-[#D8CCA3] bg-white text-[#556B2F] hover:bg-[#F1E8C7]"
                        } disabled:opacity-60`}
                      >
                        {mode}
                      </motion.button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#556B2F]">Graph Editing</p>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={handleAddNode}
                      disabled={isLocked}
                      className="rounded-xl bg-[#9CA763] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#7D8F3B] disabled:opacity-60"
                    >
                      <Plus className="mr-1 inline h-4 w-4" /> Add Node
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={handleConnectNodes}
                      disabled={isLocked || edgeFrom === null || edgeTo === null}
                      className="rounded-xl bg-[#7D8F3B] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#556B2F] disabled:opacity-60"
                    >
                      <Zap className="mr-1 inline h-4 w-4" /> Add Edge
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={handleRemoveEdge}
                      disabled={isLocked || edgeFrom === null || edgeTo === null}
                      className="rounded-xl border border-[#D8CCA3] bg-white px-3 py-2 text-xs font-semibold text-[#556B2F] transition hover:bg-[#F1E8C7] disabled:opacity-60"
                    >
                      <Trash2 className="mr-1 inline h-4 w-4" /> Remove Edge
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={handleDeleteSelectedNode}
                      disabled={isLocked || edgeFrom === null || edgeTo !== null}
                      className="rounded-xl border border-[#D8CCA3] bg-white px-3 py-2 text-xs font-semibold text-[#556B2F] transition hover:bg-[#F1E8C7] disabled:opacity-60"
                    >
                      <Trash2 className="mr-1 inline h-4 w-4" /> Delete Node
                    </motion.button>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={handleClearGraph}
                    disabled={isLocked}
                    className="mt-2 w-full rounded-xl border border-[#D8CCA3] bg-[#F1E8C7] px-3 py-2 text-xs font-semibold text-[#7D8F3B] transition hover:bg-[#E9DDB6] disabled:opacity-60"
                  >
                    <RotateCcw className="mr-1 inline h-4 w-4" /> Clear Graph
                  </motion.button>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#556B2F]">Graph Presets</p>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={generateCyclicGraph}
                      disabled={isLocked}
                      className="rounded-xl bg-red-500/20 border border-red-300 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-500/30 disabled:opacity-60"
                    >
                      Cyclic
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={generateAcyclicGraph}
                      disabled={isLocked}
                      className="rounded-xl bg-green-500/20 border border-green-300 px-3 py-2 text-xs font-semibold text-green-700 transition hover:bg-green-500/30 disabled:opacity-60"
                    >
                      Acyclic
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={generateDAG}
                      disabled={isLocked}
                      className="rounded-xl bg-blue-500/20 border border-blue-300 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-500/30 disabled:opacity-60"
                    >
                      DAG
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={generateDenseGraph}
                      disabled={isLocked}
                      className="rounded-xl bg-purple-500/20 border border-purple-300 px-3 py-2 text-xs font-semibold text-purple-700 transition hover:bg-purple-500/30 disabled:opacity-60"
                    >
                      Dense
                    </motion.button>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={exportGraph}
                      className="rounded-xl bg-[#9CA763] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#7D8F3B]"
                    >
                      <Download className="mr-1 inline h-4 w-4" /> Export
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={importGraph}
                      className="rounded-xl bg-[#9CA763] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#7D8F3B]"
                    >
                      <Upload className="mr-1 inline h-4 w-4" /> Import
                    </motion.button>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#556B2F]">Step-by-Step Mode</p>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={handlePreviousStep}
                      disabled={algorithmState !== "completed" || currentStepIndex === 0}
                      className="rounded-xl border border-[#D8CCA3] bg-white px-3 py-2 text-xs font-semibold text-[#556B2F] transition hover:bg-[#F1E8C7] disabled:opacity-60"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={toggleAutoplay}
                      disabled={algorithmState !== "completed"}
                      className={`rounded-xl px-3 py-2 text-xs font-semibold text-white transition disabled:opacity-60 ${
                        isAutoplay ? "bg-[#FF6B6B]" : "bg-[#7D8F3B] hover:bg-[#556B2F]"
                      }`}
                    >
                      {isAutoplay ? "Stop" : "Play"}
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={handleNextStep}
                      disabled={algorithmState !== "completed" || currentStepIndex >= executionSteps.length - 1}
                      className="rounded-xl border border-[#D8CCA3] bg-white px-3 py-2 text-xs font-semibold text-[#556B2F] transition hover:bg-[#F1E8C7] disabled:opacity-60"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </motion.button>
                  </div>
                  {algorithmState === "completed" && (
                    <p className="mt-2 text-xs text-[#556B2F]">
                      Step {currentStepIndex + 1} of {executionSteps.length}
                    </p>
                  )}
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#556B2F]">Detection Controls</p>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={runCycleDetection}
                      disabled={isLocked || nodes.length === 0}
                      className="rounded-xl bg-[#7D8F3B] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#556B2F] disabled:opacity-60"
                    >
                      <Play className="mr-1 inline h-4 w-4" /> Start Detection
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={handlePause}
                      disabled={!isRunning}
                      className="rounded-xl border border-[#D8CCA3] bg-white px-3 py-2 text-xs font-semibold text-[#556B2F] transition hover:bg-[#F1E8C7] disabled:opacity-60"
                    >
                      <Pause className="mr-1 inline h-4 w-4" /> Pause
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={handleResume}
                      disabled={!isPaused}
                      className="rounded-xl border border-[#D8CCA3] bg-white px-3 py-2 text-xs font-semibold text-[#556B2F] transition hover:bg-[#F1E8C7] disabled:opacity-60"
                    >
                      <Play className="mr-1 inline h-4 w-4" /> Resume
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={resetAlgorithmState}
                      disabled={isLocked}
                      className="rounded-xl border border-[#7D8F3B] bg-white px-3 py-2 text-xs font-semibold text-[#7D8F3B] transition hover:bg-[#F1E8C7] disabled:opacity-60"
                    >
                      <RotateCcw className="mr-1 inline h-4 w-4" /> Reset
                    </motion.button>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={handleGenerateRandomGraph}
                    disabled={isLocked}
                    className="mt-2 w-full rounded-xl bg-[#9CA763] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#7D8F3B] disabled:opacity-60"
                  >
                    <Shuffle className="mr-1 inline h-4 w-4" /> Generate Random Graph
                  </motion.button>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#556B2F]">Traversal Speed</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs font-medium text-[#556B2F]">Slow</span>
                    <input
                      type="range"
                      min="0"
                      max="2"
                      step="1"
                      value={speed === "slow" ? 0 : speed === "medium" ? 1 : 2}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setSpeed(val === 0 ? "slow" : val === 1 ? "medium" : "fast");
                      }}
                      disabled={isLocked}
                      className="flex-1 cursor-pointer accent-[#7D8F3B] disabled:opacity-60"
                    />
                    <span className="text-xs font-medium text-[#556B2F]">Fast</span>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl border border-[#D8CCA3] bg-[#F7F1DD]/90 p-6 shadow-[0_10px_30px_rgba(75,83,32,0.08)]"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-[#4B5320]">Cycle Status</h3>
                {isRunning && (
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ repeat: Number.POSITIVE_INFINITY, duration: 2 }}
                    className="h-3 w-3 rounded-full bg-[#7D8F3B]"
                  />
                )}
              </div>

              <div className="mt-4 space-y-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#556B2F]">Cycle Found</p>
                  <p className="mt-1 text-sm font-semibold text-[#4B5320]">
                    {cycleFound === null ? "Not started" : cycleFound ? "Cycle detected" : "No cycle"}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#556B2F]">Cycle Length</p>
                    <p className="mt-1 rounded-lg border border-[#AAB76A] bg-[#F1E8C7] px-2 py-1 text-sm font-semibold text-[#7D8F3B]">
                      {cycleFound === null ? "—" : cycleFound ? cycleLength : "0"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#556B2F]">Recursion Depth</p>
                    <p className="mt-1 rounded-lg border border-[#AAB76A] bg-[#F1E8C7] px-2 py-1 text-sm font-semibold text-[#7D8F3B]">
                      {recursionDepth}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl border border-[#D8CCA3] bg-[#F7F1DD]/90 p-6 shadow-[0_10px_30px_rgba(75,83,32,0.08)]"
            >
              <h3 className="text-lg font-semibold text-[#4B5320]">DFS Recursion Stack</h3>
              <div className="mt-4 space-y-2">
                {recursionStack.length === 0 ? (
                  <p className="text-sm text-[#556B2F]">Stack is empty. Start detection to populate.</p>
                ) : (
                  recursionStack
                    .slice()
                    .reverse()
                    .map((nodeId, index) => (
                      <motion.div
                        key={`${nodeId}-${index}`}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`flex items-center justify-between rounded-xl border px-3 py-2 text-sm font-semibold ${
                          index === 0
                            ? "border-[#7D8F3B] bg-[#DCE6B0] text-[#4B5320]"
                            : "border-[#D8CCA3] bg-[#F1E8C7] text-[#556B2F]"
                        }`}
                      >
                        <span>Node {nodeId}</span>
                        <span className="text-xs uppercase tracking-wide text-[#7D8F3B]">Depth {recursionStack.length - index}</span>
                      </motion.div>
                    ))
                )}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl border border-[#D8CCA3] bg-[#F7F1DD]/90 p-6 shadow-[0_10px_30px_rgba(75,83,32,0.08)]"
            >
              <h3 className="text-lg font-semibold text-[#4B5320]">Live Steps</h3>
              <ul className="mt-3 space-y-2 text-sm text-[#4B5320]">
                {steps.slice(-6).map((step, idx) => (
                  <li key={`${step}-${idx}`} className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#7D8F3B]" />
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl border border-[#D8CCA3] bg-[#F7F1DD]/90 p-6 shadow-[0_10px_30px_rgba(75,83,32,0.08)]"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-[#4B5320]">Cycle Summary</h3>
                {cycleFound === true && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex items-center gap-2 rounded-full bg-green-100 px-3 py-1"
                  >
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-xs font-semibold text-green-700">Detected</span>
                  </motion.div>
                )}
                {cycleFound === false && (
                  <div className="flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1">
                    <CheckCircle className="h-4 w-4 text-blue-600" />
                    <span className="text-xs font-semibold text-blue-700">Complete</span>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                {cycleFound === true && cycleNodes.length > 0 ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="rounded-lg border-2 border-green-300 bg-green-50 p-4"
                  >
                    <p className="text-xs font-semibold uppercase tracking-wide text-green-700 mb-2">Detected Cycle</p>
                    <p className="font-mono font-semibold text-sm text-green-800">
                      {cycleNodes.map((n) => n).join(" → ")} → {cycleNodes[0]}
                    </p>
                  </motion.div>
                ) : cycleFound === false ? (
                  <div className="rounded-lg border-2 border-blue-300 bg-blue-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-blue-700 mb-2">Analysis Result</p>
                    <p className="text-sm text-blue-800">No cycles detected in the graph. It is acyclic.</p>
                  </div>
                ) : (
                  <p className="text-sm text-[#556B2F]">Run cycle detection to see results.</p>
                )}

                {cycleFound !== null && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border border-[#AAB76A] bg-[#F1E8C7] p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#556B2F]">Nodes Visited</p>
                      <p className="text-lg font-bold text-[#4B5320] mt-1">{visitedNodes.length} / {nodes.length}</p>
                    </div>
                    <div className="rounded-lg border border-[#AAB76A] bg-[#F1E8C7] p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#556B2F]">Edges Explored</p>
                      <p className="text-lg font-bold text-[#4B5320] mt-1">{exploredEdges.length}</p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl border border-[#D8CCA3] bg-[#F7F1DD]/90 p-6 shadow-[0_10px_30px_rgba(75,83,32,0.08)]"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-[#4B5320]">Educational Info</h3>
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowEducation(!showEducation)}
                  className="rounded-full p-2 hover:bg-[#F1E8C7] transition"
                >
                  <Info className="h-5 w-5 text-[#7D8F3B]" />
                </motion.button>
              </div>

              {showEducation && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4 text-sm text-[#556B2F]"
                >
                  <div className="rounded-lg border-l-4 border-[#7D8F3B] bg-[#F1E8C7] p-3">
                    <p className="font-semibold text-[#4B5320] mb-1">What is a Cycle?</p>
                    <p>A cycle in a graph is a path that starts and ends at the same node, with no other repeated nodes.</p>
                  </div>

                  <div className="rounded-lg border-l-4 border-[#9CA763] bg-[#F1E8C7] p-3">
                    <p className="font-semibold text-[#4B5320] mb-1">Directed vs Undirected</p>
                    <p>In directed graphs, cycles follow edge directions. In undirected graphs, any path back to a node forms a cycle (excluding the parent).</p>
                  </div>

                  <div className="rounded-lg border-l-4 border-[#AAB76A] bg-[#F1E8C7] p-3">
                    <p className="font-semibold text-[#4B5320] mb-1">Why Cycle Detection Matters?</p>
                    <p>Cycles are crucial for dependency checking, deadlock detection, and determining if topological sorting is possible.</p>
                  </div>

                  <div className="rounded-lg border-l-4 border-[#556B2F] bg-[#F1E8C7] p-3">
                    <p className="font-semibold text-[#4B5320] mb-1">DFS Approach</p>
                    <p>DFS uses a recursion stack to detect back edges. A back edge points to a node still in the current path, indicating a cycle.</p>
                  </div>
                </motion.div>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl border border-[#D8CCA3] bg-[#F7F1DD]/90 p-6 shadow-[0_10px_30px_rgba(75,83,32,0.08)]"
            >
              <h3 className="text-lg font-semibold text-[#4B5320]">Algorithm Progress</h3>
              <div className="mt-4 space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#556B2F]">Nodes Visited</p>
                    <p className="text-xs font-semibold text-[#7D8F3B]">{progressPercentage}%</p>
                  </div>
                  <motion.div className="w-full h-2 rounded-full bg-[#F1E8C7] overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercentage}%` }}
                      className="h-full bg-gradient-to-r from-[#7D8F3B] to-[#9CA763]"
                      transition={{ duration: 0.5 }}
                    />
                  </motion.div>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#556B2F] mb-2">Recursion Depth</p>
                  <p className="text-sm font-bold text-[#4B5320]">Current: {recursionStack.length}</p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#556B2F] mb-2">Graph Stats</p>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="rounded-lg border border-[#AAB76A] bg-[#F1E8C7] p-2 text-center">
                      <p className="text-[#7D8F3B] font-semibold">{nodes.length}</p>
                      <p className="text-[#556B2F]">Nodes</p>
                    </div>
                    <div className="rounded-lg border border-[#AAB76A] bg-[#F1E8C7] p-2 text-center">
                      <p className="text-[#7D8F3B] font-semibold">{edges.length}</p>
                      <p className="text-[#556B2F]">Edges</p>
                    </div>
                    <div className="rounded-lg border border-[#AAB76A] bg-[#F1E8C7] p-2 text-center">
                      <p className="text-[#7D8F3B] font-semibold">{cycleLength ?? "—"}</p>
                      <p className="text-[#556B2F]">Cycle Len</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl border border-[#D8CCA3] bg-[#F7F1DD]/90 p-6 shadow-[0_10px_30px_rgba(75,83,32,0.08)]"
            >
              <h3 className="text-lg font-semibold text-[#4B5320]">Time Complexity</h3>
              <div className="mt-4 space-y-3 text-sm text-[#556B2F]">
                <div className="rounded-lg border border-[#AAB76A] bg-[#F1E8C7] px-3 py-2">
                  <p className="font-semibold text-[#7D8F3B]">DFS Cycle Detection: O(V + E)</p>
                  <p className="text-xs mt-1">Where V = vertices and E = edges</p>
                </div>
                <div className="text-xs space-y-1">
                  <p><span className="font-semibold text-[#4B5320]">Space:</span> O(V) for recursion stack and visited set</p>
                  <p className="mt-1"><span className="font-semibold text-[#4B5320]">Best Case:</span> Cycle found early</p>
                  <p><span className="font-semibold text-[#4B5320]">Worst Case:</span> Entire graph traversed</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl border border-[#D8CCA3] bg-[#F7F1DD]/90 p-6 shadow-[0_10px_30px_rgba(75,83,32,0.08)]"
            >
              <h3 className="text-lg font-semibold text-[#4B5320]">Graph Legend</h3>
              <div className="mt-4 grid gap-3 text-sm text-[#556B2F]">
                <div className="flex items-center gap-3">
                  <span className="h-3 w-3 rounded-full bg-[#AAB76A] ring-2 ring-[#556B2F]" />
                  <span>Current DFS node being explored</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="h-3 w-3 rounded-full bg-[#F1E8C7] ring-2 ring-[#7D8F3B]" />
                  <span>Visited node (exploration complete)</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="h-3 w-3 rounded-full bg-[#7D8F3B] ring-2 ring-[#4B5320]" />
                  <span>Part of detected cycle</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="h-3 w-3 rounded-full bg-[#FED66A] ring-2 ring-[#AAB76A]" />
                  <span>Selected node for edge operations</span>
                </div>
                <div className="flex items-center gap-3 pt-2 border-t border-[#D8CCA3]">
                  <div className="h-0.5 w-4 bg-[#7D8F3B] border border-[#4B5320]" />
                  <span>Cycle edge (dashed line)</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-0.5 w-4 bg-[#7D8F3B]" />
                  <span>Active DFS edge being explored</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </main>
  );
}
