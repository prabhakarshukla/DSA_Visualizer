"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, CheckCircle, ChevronLeft, ChevronRight, Download, Info, Layers, Pause, Play, Plus, RotateCcw, Shuffle, Sparkles, Trash2, Zap } from "lucide-react";
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

type GraphPreset = "simple-dag" | "course-scheduling" | "task-dependency" | "build-dependency";

type TimelineStep = {
  stepNumber: number;
  explanation: string;
  processedNodes: number[];
  queue: number[];
  currentNode: number | null;
  activeEdge: Edge | null;
  liveIndegrees: Record<number, number>;
  removingNode: number | null;
  updatedNode: number | null;
  currentIndegreeUpdates: string[];
  topologicalOrder: number[];
  completionMessage: string;
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

const NODE_RADIUS = 24;
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

const generateNodePosition = (nodeCount: number, index: number) => {
  const columns = Math.min(4, Math.max(1, Math.ceil(Math.sqrt(nodeCount))));
  const rows = Math.ceil(nodeCount / columns);
  const column = index % columns;
  const row = Math.floor(index / columns);
  const x = columns === 1 ? 50 : 16 + (column * 68) / (columns - 1);
  const y = rows === 1 ? 50 : 18 + (row * 64) / (rows - 1);
  return { x, y };
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

const hasDirectedCycle = (nodes: GraphNode[], edges: Edge[]) => {
  const adjacency: Record<number, number[]> = {};
  nodes.forEach((node) => {
    adjacency[node.id] = [];
  });
  edges.forEach((edge) => {
    if (!adjacency[edge.from]) adjacency[edge.from] = [];
    adjacency[edge.from].push(edge.to);
  });

  const visited = new Set<number>();
  const recursionStack = new Set<number>();

  const visit = (nodeId: number): boolean => {
    if (recursionStack.has(nodeId)) return true;
    if (visited.has(nodeId)) return false;

    visited.add(nodeId);
    recursionStack.add(nodeId);

    for (const neighbor of adjacency[nodeId] ?? []) {
      if (visit(neighbor)) return true;
    }

    recursionStack.delete(nodeId);
    return false;
  };

  return nodes.some((node) => visit(node.id));
};

const buildPresetGraph = (nodeCount: number, edges: Edge[]) => {
  const nodes = Array.from({ length: nodeCount }, (_, index) => {
    const position = generateNodePosition(nodeCount, index);
    return {
      id: index + 1,
      x: position.x,
      y: position.y,
    };
  });

  return { nodes, edges };
};

export default function TopologicalSortPage() {
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [nextNodeId, setNextNodeId] = useState(1);
  const [edgeFrom, setEdgeFrom] = useState<number | null>(null);
  const [edgeTo, setEdgeTo] = useState<number | null>(null);
  const [draggingNode, setDraggingNode] = useState<number | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const [algorithmState, setAlgorithmState] = useState<AlgorithmState>("idle");
  const [speed, setSpeed] = useState<SpeedLevel>("medium");
  const [processedNodes, setProcessedNodes] = useState<number[]>([]);
  const [queue, setQueue] = useState<number[]>([]);
  const [currentNode, setCurrentNode] = useState<number | null>(null);
  const [activeEdge, setActiveEdge] = useState<Edge | null>(null);
  const [liveIndegrees, setLiveIndegrees] = useState<Record<number, number>>({});
  const [removingNode, setRemovingNode] = useState<number | null>(null);
  const [updatedNode, setUpdatedNode] = useState<number | null>(null);
  const [currentIndegreeUpdates, setCurrentIndegreeUpdates] = useState<string[]>([]);
  const [topologicalOrder, setTopologicalOrder] = useState<number[]>([]);
  const [hasCycle, setHasCycle] = useState(false);
  const [completionMessage, setCompletionMessage] = useState("");
  const [steps, setSteps] = useState<string[]>(["Build a DAG and start topological sorting."]);
  const [timelineSteps, setTimelineSteps] = useState<TimelineStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isAutoplay, setIsAutoplay] = useState(false);

  const pauseRef = useRef(false);
  const cancelRef = useRef(false);
  const autoplayRef = useRef<NodeJS.Timeout | null>(null);

  const svgWidth = 700;
  const svgHeight = 460;

  const adjacencyList = useMemo(() => {
    const list: Record<number, number[]> = {};
    nodes.forEach((node) => {
      list[node.id] = [];
    });
    edges.forEach((edge) => {
      if (!list[edge.from]) list[edge.from] = [];
      list[edge.from].push(edge.to);
    });
    Object.keys(list).forEach((key) => {
      list[parseInt(key)] = Array.from(new Set(list[parseInt(key)])).sort((a, b) => a - b);
    });
    return list;
  }, [nodes, edges]);

  const indegreeMap = useMemo(() => {
    const map: Record<number, number> = {};
    nodes.forEach((node) => {
      map[node.id] = 0;
    });
    edges.forEach((edge) => {
      map[edge.to] = (map[edge.to] ?? 0) + 1;
    });
    return map;
  }, [nodes, edges]);

  const zeroIndegreeNodes = useMemo(
    () => nodes.map((node) => node.id).filter((id) => ((liveIndegrees[id] ?? indegreeMap[id]) ?? 0) === 0 && !processedNodes.includes(id)),
    [nodes, indegreeMap, liveIndegrees, processedNodes]
  );

  const displayedIndegrees = Object.keys(liveIndegrees).length > 0 ? liveIndegrees : indegreeMap;
  const isRunning = algorithmState === "running";
  const isPaused = algorithmState === "paused";
  const isLocked = isRunning || isPaused || isAutoplay;
  const progressPercentage = nodes.length === 0 ? 0 : Math.round((processedNodes.length / nodes.length) * 100);
  const statusMessage = isRunning ? "Sorting..." : isPaused ? "Paused" : algorithmState === "completed" ? "Completed" : "Ready";
  const sortedNodeIds = useMemo(() => nodes.map((node) => node.id).sort((a, b) => a - b), [nodes]);
  const currentTimelineStep = timelineSteps[currentStepIndex] ?? null;
  const currentPhase = isRunning
    ? "Running Kahn's algorithm"
    : isPaused
      ? "Paused"
      : algorithmState === "completed"
        ? "Completed"
        : "Waiting to start";

  const speedSleep = (ms: number) => sleep(ms * getSpeedMultiplier(speed));

  const resetAlgorithmVisuals = () => {
    cancelRef.current = true;
    pauseRef.current = false;
    if (autoplayRef.current) {
      clearInterval(autoplayRef.current);
      autoplayRef.current = null;
    }
    setAlgorithmState("idle");
    setProcessedNodes([]);
    setQueue([]);
    setCurrentNode(null);
    setActiveEdge(null);
    setLiveIndegrees({});
    setRemovingNode(null);
    setUpdatedNode(null);
    setCurrentIndegreeUpdates([]);
    setTopologicalOrder([]);
    setHasCycle(false);
    setCompletionMessage("");
    setTimelineSteps([]);
    setCurrentStepIndex(0);
    setIsAutoplay(false);
    setSteps(["Build a DAG and start topological sorting."]);
  };

  const handleAddNode = () => {
    if (isLocked) return;
    const newNode = { id: nextNodeId, ...generateNodePosition(nodes.length + 1, nodes.length) };
    setNodes((prev) => [...prev, newNode]);
    setNextNodeId((prev) => prev + 1);
    resetAlgorithmVisuals();
  };

  const handleConnectNodes = () => {
    if (isLocked || edgeFrom === null || edgeTo === null || edgeFrom === edgeTo) return;
    const edgeExists = edges.some((edge) => edge.from === edgeFrom && edge.to === edgeTo);
    if (!edgeExists) {
      setEdges((prev) => [...prev, { from: edgeFrom, to: edgeTo }]);
      resetAlgorithmVisuals();
    }
    setEdgeFrom(null);
    setEdgeTo(null);
  };

  const handleDeleteSelectedNode = () => {
    if (isLocked || edgeFrom === null || edgeTo !== null) return;
    const nodeId = edgeFrom;
    setNodes((prev) => prev.filter((node) => node.id !== nodeId));
    setEdges((prev) => prev.filter((edge) => edge.from !== nodeId && edge.to !== nodeId));
    setEdgeFrom(null);
    resetAlgorithmVisuals();
  };

  const handleRemoveEdge = () => {
    if (isLocked || edgeFrom === null || edgeTo === null) return;
    setEdges((prev) => prev.filter((edge) => !(edge.from === edgeFrom && edge.to === edgeTo)));
    setEdgeFrom(null);
    setEdgeTo(null);
    resetAlgorithmVisuals();
  };

  const handleClearGraph = () => {
    if (isLocked) return;
    setNodes([]);
    setEdges([]);
    setNextNodeId(1);
    setEdgeFrom(null);
    setEdgeTo(null);
    resetAlgorithmVisuals();
  };

  const handleGenerateRandomDag = () => {
    if (isLocked) return;
    const nodeCount = 7;
    const newNodes = Array.from({ length: nodeCount }, (_, index) => ({
      id: index + 1,
      x: 12 + index * 12,
      y: 22 + ((index * 29) % 58),
    }));
    const newEdges: Edge[] = [];

    for (let from = 1; from <= nodeCount; from += 1) {
      for (let to = from + 1; to <= nodeCount; to += 1) {
        if (Math.random() < 0.34) {
          newEdges.push({ from, to });
        }
      }
    }

    if (newEdges.length < nodeCount - 1) {
      for (let id = 1; id < nodeCount; id += 1) {
        if (!newEdges.some((edge) => edge.from === id && edge.to === id + 1)) {
          newEdges.push({ from: id, to: id + 1 });
        }
      }
    }

    setNodes(newNodes);
    setEdges(newEdges);
    setNextNodeId(nodeCount + 1);
    setEdgeFrom(null);
    setEdgeTo(null);
    resetAlgorithmVisuals();
    setSteps(["Generated a random DAG. Start the algorithm to compute a topological order."]);
  };

  const handleApplyPreset = (preset: GraphPreset) => {
    if (isLocked) return;

    let graph = buildPresetGraph(5, [
      { from: 1, to: 2 },
      { from: 1, to: 3 },
      { from: 2, to: 4 },
      { from: 3, to: 4 },
      { from: 4, to: 5 },
    ]);

    switch (preset) {
      case "simple-dag":
        graph = buildPresetGraph(5, [
          { from: 1, to: 2 },
          { from: 1, to: 3 },
          { from: 2, to: 4 },
          { from: 3, to: 4 },
          { from: 4, to: 5 },
        ]);
        break;
      case "course-scheduling":
        graph = buildPresetGraph(6, [
          { from: 1, to: 3 },
          { from: 1, to: 4 },
          { from: 2, to: 4 },
          { from: 2, to: 5 },
          { from: 3, to: 6 },
          { from: 4, to: 6 },
          { from: 5, to: 6 },
        ]);
        break;
      case "task-dependency":
        graph = buildPresetGraph(7, [
          { from: 1, to: 4 },
          { from: 1, to: 5 },
          { from: 2, to: 5 },
          { from: 2, to: 6 },
          { from: 3, to: 6 },
          { from: 4, to: 7 },
          { from: 5, to: 7 },
          { from: 6, to: 7 },
        ]);
        break;
      case "build-dependency":
        graph = buildPresetGraph(8, [
          { from: 1, to: 3 },
          { from: 1, to: 4 },
          { from: 2, to: 4 },
          { from: 2, to: 5 },
          { from: 3, to: 6 },
          { from: 4, to: 6 },
          { from: 4, to: 7 },
          { from: 5, to: 7 },
          { from: 6, to: 8 },
          { from: 7, to: 8 },
        ]);
        break;
    }

    setNodes(graph.nodes);
    setEdges(graph.edges);
    setNextNodeId(graph.nodes.length + 1);
    setEdgeFrom(null);
    setEdgeTo(null);
    resetAlgorithmVisuals();
    setSteps([`Loaded ${preset.replace(/-/g, " ")} preset.`, "Start Kahn's algorithm to generate a topological order."]);
  };

  const applyTimelineStep = (step: TimelineStep) => {
    setProcessedNodes(step.processedNodes);
    setQueue(step.queue);
    setCurrentNode(step.currentNode);
    setActiveEdge(step.activeEdge);
    setLiveIndegrees(step.liveIndegrees);
    setRemovingNode(step.removingNode);
    setUpdatedNode(step.updatedNode);
    setCurrentIndegreeUpdates(step.currentIndegreeUpdates);
    setTopologicalOrder(step.topologicalOrder);
    setHasCycle(false);
    setCompletionMessage(step.completionMessage);
    setSteps(timelineSteps.slice(0, step.stepNumber + 1).map((timelineStep) => timelineStep.explanation));
  };

  const handlePreviousStep = () => {
    if (currentStepIndex <= 0 || timelineSteps.length === 0) return;
    const nextIndex = currentStepIndex - 1;
    setCurrentStepIndex(nextIndex);
    applyTimelineStep(timelineSteps[nextIndex]);
  };

  const handleNextStep = () => {
    if (currentStepIndex >= timelineSteps.length - 1 || timelineSteps.length === 0) return;
    const nextIndex = currentStepIndex + 1;
    setCurrentStepIndex(nextIndex);
    applyTimelineStep(timelineSteps[nextIndex]);
  };

  const toggleAutoplay = () => {
    if (timelineSteps.length === 0) return;

    if (isAutoplay) {
      if (autoplayRef.current) clearInterval(autoplayRef.current);
      autoplayRef.current = null;
      setIsAutoplay(false);
      return;
    }

    if (currentStepIndex >= timelineSteps.length - 1) {
      setCurrentStepIndex(0);
      applyTimelineStep(timelineSteps[0]);
    }

    setIsAutoplay(true);
    autoplayRef.current = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev < timelineSteps.length - 1) {
          const nextIndex = prev + 1;
          applyTimelineStep(timelineSteps[nextIndex]);
          return nextIndex;
        }

        if (autoplayRef.current) clearInterval(autoplayRef.current);
        autoplayRef.current = null;
        setIsAutoplay(false);
        return prev;
      });
    }, speed === "slow" ? 2000 : speed === "medium" ? 1200 : 700);
  };

  const handleExportTopologicalOrder = () => {
    if (topologicalOrder.length === 0) return;

    const payload = {
      algorithm: "Kahn's Algorithm",
      order: topologicalOrder,
      generatedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "topological-order.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleSvgMouseDown = (event: React.MouseEvent<SVGSVGElement>) => {
    if (isLocked) return;
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
    if (draggingNode !== null || isLocked) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    for (const node of nodes) {
      const distance = Math.hypot(x - node.x, y - node.y);
      if (distance < 5) {
        if (edgeFrom === node.id) {
          setEdgeFrom(null);
        } else if (edgeFrom === null) {
          setEdgeFrom(node.id);
          setEdgeTo(null);
        } else if (edgeTo === node.id) {
          setEdgeTo(null);
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

  const runTopologicalSort = async () => {
    if (nodes.length === 0 || isLocked) return;

    if (hasDirectedCycle(nodes, edges)) {
      resetAlgorithmVisuals();
      setHasCycle(true);
      setCompletionMessage("Topological Sorting is only possible on Directed Acyclic Graphs (DAGs).");
      setSteps(["Topological Sorting is only possible on Directed Acyclic Graphs (DAGs)."]);
      return;
    }

    cancelRef.current = false;
    pauseRef.current = false;
    if (autoplayRef.current) {
      clearInterval(autoplayRef.current);
      autoplayRef.current = null;
    }
    setIsAutoplay(false);
    setAlgorithmState("running");
    setProcessedNodes([]);
    setQueue([]);
    setCurrentNode(null);
    setActiveEdge(null);
    setLiveIndegrees({});
    setRemovingNode(null);
    setUpdatedNode(null);
    setCurrentIndegreeUpdates([]);
    setTopologicalOrder([]);
    setHasCycle(false);
    setCompletionMessage("");
    setSteps(["Starting Kahn's algorithm.", "Computing indegrees for every node."]);

    const timeline: TimelineStep[] = [];
    const indegrees: Record<number, number> = {};
    let currentNodeLocal: number | null = null;
    let activeEdgeLocal: Edge | null = null;
    let removingNodeLocal: number | null = null;
    let updatedNodeLocal: number | null = null;
    let currentIndegreeUpdatesLocal: string[] = [];

    const recordSnapshot = (explanation: string, completionMessage = "") => {
      timeline.push({
        stepNumber: timeline.length,
        explanation,
        processedNodes: [...order],
        queue: [...readyQueue],
        currentNode: currentNodeLocal,
        activeEdge: activeEdgeLocal ? { ...activeEdgeLocal } : null,
        liveIndegrees: { ...indegrees },
        removingNode: removingNodeLocal,
        updatedNode: updatedNodeLocal,
        currentIndegreeUpdates: [...currentIndegreeUpdatesLocal],
        topologicalOrder: [...order],
        completionMessage,
      });
    };

    nodes.forEach((node) => {
      indegrees[node.id] = 0;
    });
    edges.forEach((edge) => {
      indegrees[edge.to] = (indegrees[edge.to] ?? 0) + 1;
    });
    setLiveIndegrees({ ...indegrees });

    const readyQueue = nodes
      .map((node) => node.id)
      .filter((id) => indegrees[id] === 0)
      .sort((a, b) => a - b);
    const order: number[] = [];
    setQueue([...readyQueue]);
    currentIndegreeUpdatesLocal = readyQueue.map((id) => `Node ${id} has indegree 0.`);
    setCurrentIndegreeUpdates(currentIndegreeUpdatesLocal);
    readyQueue.forEach((id) => {
      setSteps((prev) => [...prev, `Node ${id} has indegree 0.`]);
    });
    setSteps((prev) => [...prev, `Initial zero-indegree queue: ${readyQueue.length ? readyQueue.join(", ") : "empty"}.`]);
    currentNodeLocal = null;
    activeEdgeLocal = null;
    removingNodeLocal = null;
    updatedNodeLocal = null;
    recordSnapshot(readyQueue.length ? `Initial queue contains ${readyQueue.join(", ")}.` : "Initial queue is empty.");

    if (!(await waitGate(500))) return;

    while (readyQueue.length > 0) {
      const nodeId = readyQueue.shift();
      if (nodeId === undefined) break;
      setQueue([...readyQueue]);
      currentNodeLocal = nodeId;
      removingNodeLocal = nodeId;
      updatedNodeLocal = null;
      activeEdgeLocal = null;
      setCurrentNode(nodeId);
      setRemovingNode(nodeId);
      setUpdatedNode(null);
      setActiveEdge(null);
      setSteps((prev) => [...prev, `Removing node ${nodeId}.`]);
      recordSnapshot(`Removing node ${nodeId}.`);

      if (!(await waitGate(450))) return;

      order.push(nodeId);
      setTopologicalOrder([...order]);
      setProcessedNodes([...order]);
      setSteps((prev) => [...prev, `Node ${nodeId} added to topological order.`]);
      removingNodeLocal = null;
      setRemovingNode(null);
      recordSnapshot(`Node ${nodeId} added to topological order.`);

      if (!(await waitGate(550))) return;

      const neighbors = adjacencyList[nodeId] ?? [];
      for (const neighbor of neighbors) {
        const edge = { from: nodeId, to: neighbor };
        activeEdgeLocal = edge;
        updatedNodeLocal = neighbor;
        setActiveEdge(edge);
        setUpdatedNode(neighbor);
        setSteps((prev) => [...prev, `Updating indegree of node ${neighbor}.`]);
        recordSnapshot(`Updating indegree of node ${neighbor}.`);

        indegrees[neighbor] -= 1;
        setLiveIndegrees({ ...indegrees });
        const update = `Indegree of node ${neighbor} is now ${indegrees[neighbor]}.`;
        currentIndegreeUpdatesLocal = [update, ...currentIndegreeUpdatesLocal].slice(0, 5);
        setCurrentIndegreeUpdates(currentIndegreeUpdatesLocal);
        setSteps((prev) => [...prev, update]);
        recordSnapshot(update);

        if (!(await waitGate(450))) return;

        if (indegrees[neighbor] === 0) {
          readyQueue.push(neighbor);
          readyQueue.sort((a, b) => a - b);
          setQueue([...readyQueue]);
          currentIndegreeUpdatesLocal = [`Node ${neighbor} added to queue.`, ...currentIndegreeUpdatesLocal].slice(0, 5);
          setCurrentIndegreeUpdates(currentIndegreeUpdatesLocal);
          setSteps((prev) => [...prev, `Node ${neighbor} added to queue.`]);
          recordSnapshot(`Node ${neighbor} added to queue.`);
          if (!(await waitGate(300))) return;
        }
      }
    }

    setActiveEdge(null);
    setCurrentNode(null);
    setUpdatedNode(null);
    setRemovingNode(null);
    activeEdgeLocal = null;
    currentNodeLocal = null;
    updatedNodeLocal = null;
    removingNodeLocal = null;

    if (order.length !== nodes.length) {
      setHasCycle(true);
      setCompletionMessage("Topological Sorting is only possible on Directed Acyclic Graphs (DAGs).");
      setSteps((prev) => [...prev, "Queue emptied before every node was processed.", "Cycle detected: topological order is not possible."]);
      recordSnapshot("Cycle detected: topological order is not possible.", "Topological Sorting is only possible on Directed Acyclic Graphs (DAGs).");
    } else {
      setCompletionMessage(`Completed. Topological order: ${order.join(" -> ")}.`);
      setSteps((prev) => [...prev, `Topological order complete: ${order.join(" -> ")}.`]);
      recordSnapshot(`Topological order complete: ${order.join(" -> ")}.`, `Completed. Topological order: ${order.join(" -> ")}.`);
    }

    setTimelineSteps(timeline);
    setCurrentStepIndex(Math.max(0, timeline.length - 1));

    if (!(await waitGate(250))) return;
    setAlgorithmState("completed");
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

  return (
    <main className="min-h-screen bg-[#F1E8C7] px-4 py-10 text-[#4B5320] sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl space-y-6">
        <Link href="/graphs" className="inline-flex items-center text-sm font-medium text-[#556B2F] hover:text-[#4B5320]">
          &larr; Back to graphs
        </Link>

        <section className="rounded-3xl border border-[#D8CCA3] bg-[#F7F1DD]/90 p-6 shadow-[0_10px_30px_rgba(75,83,32,0.08)] sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-[#4B5320] sm:text-4xl">Topological Sort Visualizer</h1>
              <p className="mt-3 max-w-3xl text-[#556B2F]">Visualize topological ordering of Directed Acyclic Graphs (DAGs).</p>
            </div>
            <div className="rounded-2xl border border-[#D8CCA3] bg-[#F1E8C7] px-4 py-3 text-right shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#7D8F3B]">Status</p>
              <p className="text-sm font-semibold text-[#4B5320]">{statusMessage}</p>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="space-y-6">
            <div className="rounded-3xl border border-[#D8CCA3] bg-[#F7F1DD]/90 p-6 shadow-[0_10px_30px_rgba(75,83,32,0.08)]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-[#4B5320]">Graph Visualization</h2>
                <div className="flex flex-wrap items-center gap-2 text-xs text-[#556B2F]">
                  <span className="rounded-full border border-[#AAB76A] bg-[#F1E8C7] px-3 py-1 font-semibold">Directed graph</span>
                  <span className="rounded-full border border-[#AAB76A] bg-[#F1E8C7] px-3 py-1 font-semibold">
                    {nodes.length} nodes / {edges.length} edges
                  </span>
                </div>
              </div>

              <div className="mt-4 grid gap-3 rounded-2xl border border-[#D8CCA3] bg-[#F1E8C7] p-4 xl:grid-cols-4">
                <div className="space-y-2 xl:col-span-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#556B2F]">Edit Graph</p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <motion.button whileTap={{ scale: 0.98 }} onClick={handleAddNode} disabled={isLocked} className="rounded-xl bg-[#9CA763] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#7D8F3B] disabled:opacity-60">
                      <Plus className="mr-1 inline h-4 w-4" /> Add Node
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.98 }} onClick={handleConnectNodes} disabled={isLocked || edgeFrom === null || edgeTo === null} className="rounded-xl bg-[#7D8F3B] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#556B2F] disabled:opacity-60">
                      <Zap className="mr-1 inline h-4 w-4" /> Add Edge
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.98 }} onClick={handleRemoveEdge} disabled={isLocked || edgeFrom === null || edgeTo === null} className="rounded-xl border border-[#D8CCA3] bg-white px-3 py-2 text-xs font-semibold text-[#556B2F] transition hover:bg-[#F1E8C7] disabled:opacity-60">
                      <Trash2 className="mr-1 inline h-4 w-4" /> Remove
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.98 }} onClick={handleDeleteSelectedNode} disabled={isLocked || edgeFrom === null || edgeTo !== null} className="rounded-xl border border-[#D8CCA3] bg-white px-3 py-2 text-xs font-semibold text-[#556B2F] transition hover:bg-[#F1E8C7] disabled:opacity-60">
                      <Trash2 className="mr-1 inline h-4 w-4" /> Delete
                    </motion.button>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#556B2F]">Algorithm</p>
                  <div className="grid grid-cols-2 gap-2">
                    <motion.button whileTap={{ scale: 0.98 }} onClick={runTopologicalSort} disabled={isLocked || nodes.length === 0} className="rounded-xl bg-[#7D8F3B] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#556B2F] disabled:opacity-60">
                      <Play className="mr-1 inline h-4 w-4" /> Start
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.98 }} onClick={handlePause} disabled={!isRunning} className="rounded-xl border border-[#D8CCA3] bg-white px-3 py-2 text-xs font-semibold text-[#556B2F] transition hover:bg-[#F1E8C7] disabled:opacity-60">
                      <Pause className="mr-1 inline h-4 w-4" /> Pause
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.98 }} onClick={handleResume} disabled={!isPaused} className="rounded-xl border border-[#D8CCA3] bg-white px-3 py-2 text-xs font-semibold text-[#556B2F] transition hover:bg-[#F1E8C7] disabled:opacity-60">
                      <Play className="mr-1 inline h-4 w-4" /> Resume
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.98 }} onClick={resetAlgorithmVisuals} disabled={isLocked} className="rounded-xl border border-[#7D8F3B] bg-white px-3 py-2 text-xs font-semibold text-[#7D8F3B] transition hover:bg-[#F1E8C7] disabled:opacity-60">
                      <RotateCcw className="mr-1 inline h-4 w-4" /> Reset
                    </motion.button>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#556B2F]">Graph Tools</p>
                  <div className="grid grid-cols-2 gap-2">
                    <motion.button whileTap={{ scale: 0.98 }} onClick={handleGenerateRandomDag} disabled={isLocked} className="rounded-xl bg-[#9CA763] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#7D8F3B] disabled:opacity-60">
                      <Shuffle className="mr-1 inline h-4 w-4" /> DAG
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.98 }} onClick={handleClearGraph} disabled={isLocked} className="rounded-xl border border-[#D8CCA3] bg-white px-3 py-2 text-xs font-semibold text-[#7D8F3B] transition hover:bg-[#F1E8C7] disabled:opacity-60">
                      <RotateCcw className="mr-1 inline h-4 w-4" /> Clear
                    </motion.button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <motion.button whileTap={{ scale: 0.98 }} onClick={() => handleApplyPreset("simple-dag")} disabled={isLocked} className="rounded-xl border border-[#AAB76A] bg-white px-3 py-2 text-xs font-semibold text-[#556B2F] transition hover:bg-[#F1E8C7] disabled:opacity-60">
                      Simple DAG
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.98 }} onClick={() => handleApplyPreset("course-scheduling")} disabled={isLocked} className="rounded-xl border border-[#AAB76A] bg-white px-3 py-2 text-xs font-semibold text-[#556B2F] transition hover:bg-[#F1E8C7] disabled:opacity-60">
                      Course Scheduling
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.98 }} onClick={() => handleApplyPreset("task-dependency")} disabled={isLocked} className="rounded-xl border border-[#AAB76A] bg-white px-3 py-2 text-xs font-semibold text-[#556B2F] transition hover:bg-[#F1E8C7] disabled:opacity-60">
                      Task Dependency
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.98 }} onClick={() => handleApplyPreset("build-dependency")} disabled={isLocked} className="rounded-xl border border-[#AAB76A] bg-white px-3 py-2 text-xs font-semibold text-[#556B2F] transition hover:bg-[#F1E8C7] disabled:opacity-60">
                      Build Dependency
                    </motion.button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <motion.button whileTap={{ scale: 0.98 }} onClick={handleExportTopologicalOrder} disabled={topologicalOrder.length === 0} className="rounded-xl bg-[#9CA763] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#7D8F3B] disabled:opacity-60">
                      <Download className="mr-1 inline h-4 w-4" /> Export
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.98 }} onClick={toggleAutoplay} disabled={timelineSteps.length === 0 || !timelineSteps.length} className={`rounded-xl px-3 py-2 text-xs font-semibold text-white transition disabled:opacity-60 ${isAutoplay ? "bg-[#FF6B6B]" : "bg-[#7D8F3B] hover:bg-[#556B2F]"}`}>
                      <Play className="mr-1 inline h-4 w-4" /> {isAutoplay ? "Stop" : "Auto Play"}
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
                          const value = parseInt(event.target.value);
                          setSpeed(value === 0 ? "slow" : value === 1 ? "medium" : "fast");
                        }}
                        disabled={isLocked}
                        className="min-w-0 flex-1 cursor-pointer accent-[#7D8F3B] disabled:opacity-60"
                      />
                      <span className="text-xs font-medium text-[#556B2F]">Fast</span>
                    </div>
                  </div>
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
                    const isProcessedEdge = processedNodes.includes(edge.from) && processedNodes.includes(edge.to);
                    const strokeColor = isActiveEdge ? "#556B2F" : isProcessedEdge ? "#7D8F3B" : "#D8CCA3";

                    return (
                      <g key={`edge-${index}`}>
                        <motion.path
                          d={geometry.path}
                          fill="none"
                          stroke={strokeColor}
                          strokeWidth={isActiveEdge ? "4" : isProcessedEdge ? "3" : "2"}
                          strokeLinecap="round"
                          animate={{ opacity: isActiveEdge ? [0.55, 1, 0.55] : 0.78 }}
                          transition={{ repeat: isActiveEdge ? Infinity : 0, duration: 1.2 }}
                        />
                        <motion.polygon
                          points={geometry.arrowPoints}
                          fill={isActiveEdge ? "#556B2F" : "#7D8F3B"}
                          stroke={isActiveEdge ? "#556B2F" : "#7D8F3B"}
                          strokeLinejoin="round"
                          animate={{ opacity: isActiveEdge ? [0.75, 1, 0.75] : 0.9 }}
                          transition={{ repeat: isActiveEdge ? Infinity : 0, duration: 1.2 }}
                        />
                      </g>
                    );
                  })}

                  <AnimatePresence>
                    {nodes.map((node) => {
                      const x = (node.x / 100) * svgWidth;
                      const y = (node.y / 100) * svgHeight;
                      const isProcessed = processedNodes.includes(node.id);
                      const isCurrent = currentNode === node.id;
                      const isQueued = queue.includes(node.id);
                      const isSelected = edgeFrom === node.id || edgeTo === node.id;
                      const isUpdating = updatedNode === node.id;
                      const isRemoving = removingNode === node.id;
                      const indegree = displayedIndegrees[node.id] ?? 0;

                      let fillColor = "#F7F1DD";
                      let strokeColor = "#D8CCA3";
                      if (isCurrent || isRemoving) {
                        fillColor = "#AAB76A";
                        strokeColor = "#556B2F";
                      } else if (isUpdating) {
                        fillColor = "#FED66A";
                        strokeColor = "#AAB76A";
                      } else if (isProcessed) {
                        fillColor = "#7D8F3B";
                        strokeColor = "#4B5320";
                      } else if (isQueued || zeroIndegreeNodes.includes(node.id)) {
                        fillColor = "#DCE6B0";
                        strokeColor = "#7D8F3B";
                      } else if (isSelected) {
                        fillColor = "#FED66A";
                        strokeColor = "#AAB76A";
                      }

                      return (
                        <motion.g
                          key={`node-${node.id}`}
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: isRemoving ? [1, 1.18, 0.92, 1] : 1, opacity: 1 }}
                          whileHover={{ scale: 1.1 }}
                          transition={{ type: "spring", stiffness: 260, damping: 20 }}
                        >
                          <motion.circle
                            cx={x}
                            cy={y}
                            r={24}
                            fill={fillColor}
                            stroke={strokeColor}
                            strokeWidth={isSelected || isCurrent || isUpdating ? "4" : "3"}
                            animate={{ r: isCurrent || isUpdating ? 28 : isSelected || isProcessed ? 26 : 24 }}
                            transition={{ duration: 0.3 }}
                          />
                          <text x={x} y={y - 2} textAnchor="middle" dominantBaseline="middle" className="pointer-events-none text-sm font-bold" fill={isProcessed ? "#F7F1DD" : "#4B5320"}>
                            {node.id}
                          </text>
                          <text x={x} y={y + 15} textAnchor="middle" className="pointer-events-none text-[10px] font-semibold" fill={isProcessed ? "#F7F1DD" : "#556B2F"}>
                            in:{indegree}
                          </text>
                        </motion.g>
                      );
                    })}
                  </AnimatePresence>
                </svg>
              </div>

              {nodes.length === 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 rounded-2xl border-2 border-dashed border-[#D8CCA3] bg-[#F1E8C7] p-8 text-center">
                  <p className="text-sm text-[#556B2F]">Add nodes or generate a random DAG to begin.</p>
                </motion.div>
              )}

              <div className="mt-4 rounded-2xl border border-[#D8CCA3] bg-[#F1E8C7] p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#556B2F]">Selected Nodes</p>
                <p className="mt-2 text-sm font-mono text-[#4B5320]">
                  {edgeFrom ?? "-"} {edgeTo !== null && `-> ${edgeTo}`}
                </p>
                <p className="mt-2 text-xs text-[#556B2F]">First click selects the source. Second click selects the destination for a directed dependency edge.</p>
              </div>
            </div>
          </div>

          <div className={`space-y-4 ${isLocked ? "lg:sticky lg:top-4" : ""}`}>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-[#D8CCA3] bg-[#F7F1DD]/90 p-6 shadow-[0_10px_30px_rgba(75,83,32,0.08)]">
              <h3 className="text-lg font-semibold text-[#4B5320]">Live Algorithm Panel</h3>
              <div className="mt-4 space-y-4">
                <div className="rounded-2xl border border-[#D8CCA3] bg-[#F1E8C7] p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#556B2F]">Current Phase</p>
                  <p className="mt-1 text-sm font-semibold text-[#4B5320]">{currentPhase}</p>
                  <p className="mt-2 text-xs text-[#556B2F]">Processed {processedNodes.length} of {nodes.length} nodes.</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#556B2F]">Current Node</p>
                  <p className="mt-1 text-sm font-semibold text-[#4B5320]">{currentNode ?? "None"}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#556B2F]">Queue Visualization</p>
                  <div className="mt-2 flex flex-wrap gap-2 rounded-2xl border border-[#AAB76A] bg-[#F1E8C7] p-3">
                    {queue.length ? (
                      queue.map((nodeId, index) => (
                        <motion.div
                          key={`queue-${nodeId}`}
                          initial={{ opacity: 0, scale: 0.92, y: 6 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          transition={{ delay: index * 0.03 }}
                          className="rounded-full border border-[#7D8F3B] bg-white px-3 py-1 text-sm font-semibold text-[#556B2F]"
                        >
                          {nodeId}
                        </motion.div>
                      ))
                    ) : (
                      <p className="text-sm text-[#556B2F]">Empty</p>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#556B2F]">Topological Order</p>
                  <p className="mt-1 text-sm font-mono text-[#4B5320]">{topologicalOrder.length ? topologicalOrder.join(" -> ") : "Pending"}</p>
                </div>
                {completionMessage && (
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={completionMessage}
                      initial={{ opacity: 0, scale: 0.96, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      transition={{ duration: 0.35 }}
                      className={`relative overflow-hidden rounded-2xl border p-3 text-sm font-semibold ${hasCycle ? "border-red-300 bg-red-50 text-red-700" : "border-[#AAB76A] bg-[#F1E8C7] text-[#4B5320]"}`}
                    >
                      {!hasCycle && (
                        <motion.div
                          aria-hidden="true"
                          className="pointer-events-none absolute -right-2 -top-2 text-[#7D8F3B]"
                          animate={{ rotate: [0, 10, 0], scale: [1, 1.08, 1] }}
                          transition={{ repeat: Infinity, duration: 2.4, ease: "easeInOut" }}
                        >
                          <Sparkles className="h-6 w-6" />
                        </motion.div>
                      )}
                      {completionMessage}
                    </motion.div>
                  </AnimatePresence>
                )}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-[#D8CCA3] bg-[#F7F1DD]/90 p-6 shadow-[0_10px_30px_rgba(75,83,32,0.08)]">
              <h3 className="text-lg font-semibold text-[#4B5320]">Indegree Table</h3>
              <div className="mt-4 overflow-hidden rounded-2xl border border-[#D8CCA3] bg-[#F1E8C7]">
                <div className="grid grid-cols-[minmax(0,1fr)_7rem_7rem] border-b border-[#D8CCA3] bg-[#E8DDAC] px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-[#556B2F]">
                  <span>Node</span>
                  <span className="text-center">Indegree</span>
                  <span className="text-right">State</span>
                </div>
                <div className="max-h-56 overflow-y-auto">
                  {sortedNodeIds.length === 0 ? (
                    <p className="px-3 py-4 text-sm text-[#556B2F]">Add nodes to see the indegree table.</p>
                  ) : (
                    sortedNodeIds.map((nodeId) => {
                      const indegree = displayedIndegrees[nodeId] ?? 0;
                      const isQueued = queue.includes(nodeId);
                      const isProcessed = processedNodes.includes(nodeId);
                      const isCurrent = currentNode === nodeId;
                      const stateLabel = isCurrent ? "Current" : isProcessed ? "Processed" : isQueued ? "Queued" : indegree === 0 ? "Ready" : "Waiting";

                      return (
                        <motion.div
                          key={`indegree-${nodeId}`}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`grid grid-cols-[minmax(0,1fr)_7rem_7rem] items-center px-3 py-2 text-sm ${isCurrent ? "bg-[#DCE6B0]" : isProcessed ? "bg-[#E8DDAC]" : "bg-transparent"}`}
                        >
                          <span className="font-semibold text-[#4B5320]">Node {nodeId}</span>
                          <span className="text-center font-mono font-semibold text-[#556B2F]">{indegree}</span>
                          <span className="text-right text-xs font-semibold uppercase tracking-wide text-[#7D8F3B]">{stateLabel}</span>
                        </motion.div>
                      );
                    })
                  )}
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#556B2F]">Recent Indegree Updates</p>
                {currentIndegreeUpdates.length === 0 ? (
                  <p className="text-sm text-[#556B2F]">Indegree changes appear as edges are processed.</p>
                ) : (
                  currentIndegreeUpdates.map((update, index) => (
                    <motion.div key={`${update}-${index}`} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} className="rounded-xl border border-[#D8CCA3] bg-[#F1E8C7] px-3 py-2 text-sm font-semibold text-[#556B2F]">
                      {update}
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-[#D8CCA3] bg-[#F7F1DD]/90 p-6 shadow-[0_10px_30px_rgba(75,83,32,0.08)]">
              <h3 className="text-lg font-semibold text-[#4B5320]">Live Algorithm Steps</h3>
              <ul className="mt-3 space-y-2 text-sm text-[#4B5320]">
                {steps.slice(-6).map((step, index) => (
                  <li key={`${step}-${index}`} className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#7D8F3B]" />
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-[#D8CCA3] bg-[#F7F1DD]/90 p-6 shadow-[0_10px_30px_rgba(75,83,32,0.08)]">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold text-[#4B5320]">Execution Timeline</h3>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#7D8F3B]">
                    {timelineSteps.length ? `${currentStepIndex + 1} / ${timelineSteps.length}` : "Waiting"}
                  </p>
                </div>
                <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
                  {timelineSteps.length === 0 ? (
                    <p className="text-sm text-[#556B2F]">Run the algorithm to capture a replayable timeline.</p>
                  ) : (
                    timelineSteps.map((timelineStep, index) => (
                      <motion.button
                        key={timelineStep.stepNumber}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setCurrentStepIndex(index);
                          applyTimelineStep(timelineStep);
                        }}
                        className={`whitespace-nowrap rounded-full border px-3 py-1 text-xs font-semibold transition ${index === currentStepIndex ? "border-[#7D8F3B] bg-[#7D8F3B] text-white" : "border-[#D8CCA3] bg-white text-[#556B2F] hover:bg-[#F1E8C7]"}`}
                      >
                        Step {index + 1}
                      </motion.button>
                    ))
                  )}
                </div>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <motion.button whileTap={{ scale: 0.98 }} onClick={handlePreviousStep} disabled={timelineSteps.length === 0 || currentStepIndex === 0 || isAutoplay} className="rounded-xl border border-[#D8CCA3] bg-white px-3 py-2 text-xs font-semibold text-[#556B2F] transition hover:bg-[#F1E8C7] disabled:opacity-60">
                      <ChevronLeft className="inline h-4 w-4" /> Previous
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.98 }} onClick={toggleAutoplay} disabled={timelineSteps.length === 0 || isRunning || isPaused} className={`rounded-xl px-3 py-2 text-xs font-semibold text-white transition disabled:opacity-60 ${isAutoplay ? "bg-[#FF6B6B]" : "bg-[#7D8F3B] hover:bg-[#556B2F]"}`}>
                      {isAutoplay ? "Stop" : "Auto Play"}
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.98 }} onClick={handleNextStep} disabled={timelineSteps.length === 0 || currentStepIndex >= timelineSteps.length - 1 || isAutoplay} className="rounded-xl border border-[#D8CCA3] bg-white px-3 py-2 text-xs font-semibold text-[#556B2F] transition hover:bg-[#F1E8C7] disabled:opacity-60">
                      Next <ChevronRight className="inline h-4 w-4" />
                    </motion.button>
                  </div>
                  <p className="text-xs text-[#556B2F]">
                    {currentTimelineStep ? currentTimelineStep.explanation : "Timeline controls appear after a successful run."}
                  </p>
                </div>
              </motion.div>
          </div>
        </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-[#D8CCA3] bg-[#F7F1DD]/90 p-6 shadow-[0_10px_30px_rgba(75,83,32,0.08)]">
              <div className="mb-4 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-[#7D8F3B]" />
                <h3 className="text-lg font-semibold text-[#4B5320]">What is Topological Sorting?</h3>
              </div>
              <p className="text-sm text-[#556B2F]">A topological ordering is a linear sequence for a directed graph where every dependency appears before the node that depends on it.</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-[#D8CCA3] bg-[#F7F1DD]/90 p-6 shadow-[0_10px_30px_rgba(75,83,32,0.08)]">
              <div className="mb-4 flex items-center gap-2">
                <Layers className="h-5 w-5 text-[#7D8F3B]" />
                <h3 className="text-lg font-semibold text-[#4B5320]">Kahn's Algorithm</h3>
              </div>
              <p className="text-sm text-[#556B2F]">Compute indegrees, place all zero-indegree nodes into a queue, remove one node at a time, and decrement outgoing indegrees until every node is processed.</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-[#D8CCA3] bg-[#F7F1DD]/90 p-6 shadow-[0_10px_30px_rgba(75,83,32,0.08)]">
              <div className="mb-4 flex items-center gap-2">
                <Info className="h-5 w-5 text-[#7D8F3B]" />
                <h3 className="text-lg font-semibold text-[#4B5320]">Real-world Applications</h3>
              </div>
              <p className="text-sm text-[#556B2F]">Use topological sorting for course planning, build pipelines, package installation, task scheduling, and any dependency graph that must be resolved in order.</p>
            </motion.div>
          </div>

        <div className="grid grid-cols-1 items-stretch gap-6 md:grid-cols-2 xl:grid-cols-3">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex h-full flex-col rounded-3xl border border-[#D8CCA3] bg-[#F7F1DD]/90 p-6 shadow-[0_10px_30px_rgba(75,83,32,0.08)]">
            <h3 className="text-lg font-semibold text-[#4B5320]">Algorithm Progress</h3>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#556B2F]">Processed Nodes</p>
                <p className="text-xs font-semibold text-[#7D8F3B]">{progressPercentage}%</p>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[#F1E8C7]">
                <motion.div animate={{ width: `${progressPercentage}%` }} className="h-full bg-gradient-to-r from-[#7D8F3B] to-[#9CA763]" transition={{ duration: 0.4 }} />
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="rounded-lg border border-[#AAB76A] bg-[#F1E8C7] p-2 text-center">
                  <p className="font-semibold text-[#7D8F3B]">{nodes.length}</p>
                  <p className="text-[#556B2F]">Total Nodes</p>
                </div>
                <div className="rounded-lg border border-[#AAB76A] bg-[#F1E8C7] p-2 text-center">
                  <p className="font-semibold text-[#7D8F3B]">{edges.length}</p>
                  <p className="text-[#556B2F]">Total Edges</p>
                </div>
                <div className="rounded-lg border border-[#AAB76A] bg-[#F1E8C7] p-2 text-center">
                  <p className="font-semibold text-[#7D8F3B]">{processedNodes.length}</p>
                  <p className="text-[#556B2F]">Processed</p>
                </div>
              </div>
              {completionMessage && (
                <div className={`rounded-2xl border p-3 text-sm font-semibold ${hasCycle ? "border-red-300 bg-red-50 text-red-700" : "border-[#AAB76A] bg-[#F1E8C7] text-[#4B5320]"}`}>
                  {completionMessage}
                </div>
              )}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex h-full flex-col rounded-3xl border border-[#D8CCA3] bg-[#F7F1DD]/90 p-6 shadow-[0_10px_30px_rgba(75,83,32,0.08)]">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[#4B5320]">Sort Summary</h3>
              {algorithmState === "completed" && !hasCycle && <CheckCircle className="h-5 w-5 text-[#7D8F3B]" />}
            </div>
            <div className="space-y-3 text-sm text-[#556B2F]">
              <p className="rounded-lg border border-[#AAB76A] bg-[#F1E8C7] p-3 font-mono text-[#4B5320]">
                {topologicalOrder.length ? topologicalOrder.join(" -> ") : "Topological order appears here."}
              </p>
              {hasCycle ? (
                <p className="rounded-lg border border-red-300 bg-red-50 p-3 text-red-700">A cycle exists, so this graph is not a DAG and cannot be topologically sorted.</p>
              ) : (
                <p>Nodes are emitted only after all incoming dependencies have been removed.</p>
              )}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex h-full flex-col rounded-3xl border border-[#D8CCA3] bg-[#F7F1DD]/90 p-6 shadow-[0_10px_30px_rgba(75,83,32,0.08)]">
            <h3 className="text-lg font-semibold text-[#4B5320]">Time Complexity</h3>
            <div className="mt-4 space-y-3 text-sm text-[#556B2F]">
              <div className="rounded-lg border border-[#AAB76A] bg-[#F1E8C7] px-3 py-2">
                <p className="font-semibold text-[#7D8F3B]">Kahn's Algorithm: O(V + E)</p>
                <p className="mt-1 text-xs">Each node and directed edge is processed once.</p>
              </div>
              <p className="text-xs"><span className="font-semibold text-[#4B5320]">Space:</span> O(V + E) for adjacency data and the zero-indegree queue.</p>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex h-full flex-col rounded-3xl border border-[#D8CCA3] bg-[#F7F1DD]/90 p-6 shadow-[0_10px_30px_rgba(75,83,32,0.08)]">
            <div className="mb-4 flex items-center gap-2">
              <Info className="h-5 w-5 text-[#7D8F3B]" />
              <h3 className="text-lg font-semibold text-[#4B5320]">Educational Information</h3>
            </div>
            <div className="space-y-3 text-sm text-[#556B2F]">
              <p>A topological ordering places every source before its dependent destination.</p>
              <p>Kahn's algorithm repeatedly processes nodes with indegree 0, then decreases indegrees of their outgoing neighbors.</p>
              <p>If no zero-indegree node remains before all nodes are processed, the graph contains a cycle.</p>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex h-full flex-col rounded-3xl border border-[#D8CCA3] bg-[#F7F1DD]/90 p-6 shadow-[0_10px_30px_rgba(75,83,32,0.08)]">
            <h3 className="text-lg font-semibold text-[#4B5320]">Graph Legend</h3>
            <div className="mt-4 grid gap-3 text-sm text-[#556B2F]">
              <div className="flex items-center gap-3">
                <span className="h-3 w-3 rounded-full bg-[#DCE6B0] ring-2 ring-[#7D8F3B]" />
                <span>Zero-indegree node ready for processing</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="h-3 w-3 rounded-full bg-[#AAB76A] ring-2 ring-[#556B2F]" />
                <span>Current node being processed</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="h-3 w-3 rounded-full bg-[#7D8F3B] ring-2 ring-[#4B5320]" />
                <span>Processed node in topological order</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="h-3 w-3 rounded-full bg-[#FED66A] ring-2 ring-[#AAB76A]" />
                <span>Selected node for edge creation</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </main>
  );
}
