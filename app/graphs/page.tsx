"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { RotateCcw, Zap } from "lucide-react";
import { useState } from "react";

type GraphNode = {
  id: number;
  x: number;
  y: number;
};

type Edge = {
  from: number;
  to: number;
};

type TraversalType = "bfs" | "dfs" | "idle";

type QueueState = {
  queue: number[];
  dequeued: number[];
};

type RecursionStack = {
  stack: number[];
  returned: number[];
};

const defaultNodes: GraphNode[] = [
  { id: 1, x: 50, y: 15 },
  { id: 2, x: 25, y: 45 },
  { id: 3, x: 75, y: 45 },
  { id: 4, x: 10, y: 75 },
  { id: 5, x: 40, y: 75 },
  { id: 6, x: 90, y: 75 },
];

const defaultEdges: Edge[] = [
  { from: 1, to: 2 },
  { from: 1, to: 3 },
  { from: 2, to: 4 },
  { from: 2, to: 5 },
  { from: 3, to: 6 },
];

const adjacencyList: Record<number, number[]> = {
  1: [2, 3],
  2: [1, 4, 5],
  3: [1, 6],
  4: [2],
  5: [2],
  6: [3],
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type SpeedLevel = "slow" | "medium" | "fast";

export default function GraphPage() {
  const [visitedNodes, setVisitedNodes] = useState<number[]>([]);
  const [traversalOrder, setTraversalOrder] = useState<number[]>([]);
  const [activeNode, setActiveNode] = useState<number | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [activeTraversal, setActiveTraversal] = useState<TraversalType>("idle");
  const [traversalSteps, setTraversalSteps] = useState<string[]>([
    "Select a traversal method to begin exploring the graph.",
  ]);
  const [queueState, setQueueState] = useState<QueueState>({ queue: [], dequeued: [] });
  const [activeEdges, setActiveEdges] = useState<Array<{ from: number; to: number }>>([]);
  const [recursionStack, setRecursionStack] = useState<RecursionStack>({ stack: [], returned: [] });
  const [speed, setSpeed] = useState<SpeedLevel>("medium");

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

  const speedSleep = (ms: number) => sleep(ms * getSpeedMultiplier(speed));

  const handleBFS = async () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setVisitedNodes([]);
    setTraversalOrder([]);
    setTraversalSteps([]);
    setActiveTraversal("bfs");
    setQueueState({ queue: [], dequeued: [] });
    setActiveEdges([]);

    const visited = new Set<number>();
    const queue: number[] = [1];
    const order: number[] = [];
    const steps: string[] = [];

    visited.add(1);
    setVisitedNodes([1]);
    setQueueState({ queue: [1], dequeued: [] });
    steps.push("Initialize BFS: Add node 1 to queue");
    setTraversalSteps(steps);
    await speedSleep(500);

    while (queue.length > 0) {
      const node = queue.shift()!;
      order.push(node);
      setTraversalOrder([...order]);
      setActiveNode(node);
      setQueueState((prev) => ({ queue: [...queue], dequeued: [...prev.dequeued, node] }));
      steps.push(`Dequeue node ${node} - Process it`);
      setTraversalSteps([...steps]);
      await speedSleep(600);

      const neighbors = adjacencyList[node];
      const unvisitedNeighbors: number[] = [];

      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          unvisitedNeighbors.push(neighbor);
        }
      }

      if (unvisitedNeighbors.length > 0) {
        steps.push(`Found unvisited neighbors of node ${node}: ${unvisitedNeighbors.join(", ")}`);
        setTraversalSteps([...steps]);
        await speedSleep(400);

        for (const neighbor of unvisitedNeighbors) {
          setActiveEdges([{ from: node, to: neighbor }]);
          steps.push(`Explore edge ${node} → ${neighbor}`);
          setTraversalSteps([...steps]);
          await speedSleep(300);

          visited.add(neighbor);
          queue.push(neighbor);
          setVisitedNodes([...Array.from(visited)]);
          setQueueState({ queue: [...queue], dequeued: [...order] });
          steps.push(`Add node ${neighbor} to queue (FIFO order)`);
          setTraversalSteps([...steps]);
          await speedSleep(400);
        }
      } else {
        steps.push(`Node ${node} has no unvisited neighbors`);
        setTraversalSteps([...steps]);
        await speedSleep(300);
      }
    }

    setActiveEdges([]);
    steps.push(`✓ BFS Traversal Complete`);
    steps.push(`Final order: ${order.join(" → ")}`);
    setTraversalSteps(steps);
    setActiveNode(null);
    setQueueState({ queue: [], dequeued: order });
    setIsAnimating(false);
  };

  const handleDFS = async () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setVisitedNodes([]);
    setTraversalOrder([]);
    setTraversalSteps([]);
    setActiveTraversal("dfs");
    setActiveEdges([]);
    setRecursionStack({ stack: [], returned: [] });

    const visited = new Set<number>();
    const order: number[] = [];
    const steps: string[] = [];

    steps.push("Initialize DFS: Call dfs(1)");
    setTraversalSteps(steps);
    setRecursionStack({ stack: [1], returned: [] });
    await speedSleep(500);

    const dfsHelper = async (node: number) => {
      visited.add(node);
      order.push(node);
      setVisitedNodes([...Array.from(visited)]);
      setTraversalOrder([...order]);
      setActiveNode(node);
      steps.push(`Visit node ${node} - Mark as visited`);
      setTraversalSteps([...steps]);
      await speedSleep(600);

      const neighbors = adjacencyList[node];
      const unvisitedNeighbors = neighbors.filter((n) => !visited.has(n));

      if (unvisitedNeighbors.length > 0) {
        steps.push(`Node ${node} has unvisited neighbors: ${unvisitedNeighbors.join(", ")}`);
        setTraversalSteps([...steps]);
        await speedSleep(400);

        for (const neighbor of unvisitedNeighbors) {
          setActiveEdges([{ from: node, to: neighbor }]);
          steps.push(`Explore edge ${node} → ${neighbor} (move deeper)`);
          setTraversalSteps([...steps]);
          await speedSleep(400);

          setRecursionStack((prev) => ({ stack: [...prev.stack, neighbor], returned: prev.returned }));
          steps.push(`Call dfs(${neighbor}) - Push to recursion stack`);
          setTraversalSteps([...steps]);
          await speedSleep(300);

          await dfsHelper(neighbor);

          setRecursionStack((prev) => ({
            stack: prev.stack.slice(0, -1),
            returned: [...prev.returned, neighbor],
          }));
          steps.push(`Return from dfs(${neighbor}) - Backtrack to node ${node}`);
          setTraversalSteps([...steps]);
          await speedSleep(400);
        }
      } else {
        steps.push(`Node ${node} has no unvisited neighbors - Backtrack`);
        setTraversalSteps([...steps]);
        await speedSleep(300);
      }
    };

    await dfsHelper(1);

    setActiveEdges([]);
    setActiveNode(null);
    setRecursionStack({ stack: [], returned: order });
    steps.push(`✓ DFS Traversal Complete`);
    steps.push(`Final order: ${order.join(" → ")}`);
    setTraversalSteps(steps);
    setIsAnimating(false);
  };

  const handleReset = () => {
    setVisitedNodes([]);
    setTraversalOrder([]);
    setActiveNode(null);
    setActiveTraversal("idle");
    setTraversalSteps(["Select a traversal method to begin exploring the graph."]);
    setQueueState({ queue: [], dequeued: [] });
    setActiveEdges([]);
    setRecursionStack({ stack: [], returned: [] });
  };

  const svgHeight = 400;
  const svgWidth = 600;

  return (
    <main className="min-h-screen bg-[#F1E8C7] px-4 py-10 text-[#4B5320] sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <Link href="/" className="inline-flex items-center text-sm font-medium text-[#556B2F] hover:text-[#4B5320]">
          &larr; Back to homepage
        </Link>

        <section className="rounded-3xl border border-[#D8CCA3] bg-[#F7F1DD]/90 p-6 shadow-[0_10px_30px_rgba(75,83,32,0.08)] sm:p-8">
          <h1 className="text-3xl font-bold tracking-tight text-[#4B5320] sm:text-4xl">Graph Visualizer</h1>
          <p className="mt-3 max-w-3xl text-[#556B2F]">
            Interactive BFS and DFS Traversal Visualization
          </p>
        </section>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="rounded-3xl border border-[#D8CCA3] bg-[#F7F1DD]/90 p-6 shadow-[0_10px_30px_rgba(75,83,32,0.08)]">
              <h2 className="mb-4 text-lg font-semibold text-[#4B5320]">Graph Structure</h2>

              <div className="flex justify-center overflow-x-auto rounded-2xl bg-[#F1E8C7] p-4">
                <svg width={svgWidth} height={svgHeight} className="flex-shrink-0">
                  {defaultEdges.map((edge, idx) => {
                    const fromNode = defaultNodes.find((n) => n.id === edge.from)!;
                    const toNode = defaultNodes.find((n) => n.id === edge.to)!;
                    const x1 = (fromNode.x / 100) * svgWidth;
                    const y1 = (fromNode.y / 100) * svgHeight;
                    const x2 = (toNode.x / 100) * svgWidth;
                    const y2 = (toNode.y / 100) * svgHeight;

                    const isActive = activeEdges.some(
                      (e) => (e.from === edge.from && e.to === edge.to) || (e.from === edge.to && e.to === edge.from)
                    );

                    return (
                      <motion.line
                        key={`edge-${idx}`}
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke={isActive ? "#7D8F3B" : "#D8CCA3"}
                        strokeWidth={isActive ? "3" : "2"}
                        animate={{
                          opacity: isActive ? 1 : 0.6,
                        }}
                        transition={{ duration: 0.3 }}
                        className="transition-all"
                      />
                    );
                  })}

                  <AnimatePresence>
                    {defaultNodes.map((node) => {
                      const x = (node.x / 100) * svgWidth;
                      const y = (node.y / 100) * svgHeight;
                      const isVisited = visitedNodes.includes(node.id);
                      const isActive = activeNode === node.id;
                      const nodeRadius = 24;

                      let fillColor = "#F7F1DD";
                      let strokeColor = "#D8CCA3";

                      if (isActive) {
                        fillColor = "#AAB76A";
                        strokeColor = "#556B2F";
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
                            strokeWidth={isActive ? "4" : "3"}
                            animate={{
                              r: isActive ? 28 : nodeRadius,
                            }}
                            transition={{ duration: 0.3 }}
                            className="transition-all duration-300"
                          />
                          <text
                            x={x}
                            y={y}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            className="pointer-events-none text-sm font-bold"
                            fill="#4B5320"
                          >
                            {node.id}
                          </text>
                        </motion.g>
                      );
                    })}
                  </AnimatePresence>
                </svg>
              </div>

              <div className="mt-4 rounded-2xl border border-[#D8CCA3] bg-[#F1E8C7] p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#556B2F]">Traversal Order</p>
                <p className="mt-2 text-sm font-mono text-[#4B5320]">
                  {traversalOrder.length > 0 ? traversalOrder.join(" → ") : "—"}
                </p>
              </div>

              {activeTraversal === "bfs" && (queueState.queue.length > 0 || queueState.dequeued.length > 0) && (
                <div className="mt-4 rounded-2xl border border-[#AAB76A] bg-[#F7F1DD] p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#556B2F]">Queue State (FIFO)</p>
                  <div className="mt-3 space-y-2">
                    {queueState.queue.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-[#556B2F]">Current Queue:</p>
                        <div className="mt-1 flex flex-wrap gap-2">
                          {queueState.queue.map((node, idx) => (
                            <motion.div
                              key={`queue-${node}-${idx}`}
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              className="rounded-lg border border-[#7D8F3B] bg-white px-2 py-1 text-xs font-mono text-[#4B5320]"
                            >
                              {node}
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}
                    {queueState.dequeued.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-[#556B2F]">Dequeued:</p>
                        <div className="mt-1 flex flex-wrap gap-2">
                          {queueState.dequeued.map((node, idx) => (
                            <motion.div
                              key={`dequeued-${node}-${idx}`}
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              className="rounded-lg border border-[#D8CCA3] bg-[#F1E8C7] px-2 py-1 text-xs font-mono text-[#556B2F] line-through"
                            >
                              {node}
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTraversal === "dfs" && (recursionStack.stack.length > 0 || recursionStack.returned.length > 0) && (
                <div className="mt-4 rounded-2xl border border-[#AAB76A] bg-[#F7F1DD] p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#556B2F]">Recursion Stack (LIFO)</p>
                  <div className="mt-3 space-y-2">
                    {recursionStack.stack.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-[#556B2F]">Call Stack:</p>
                        <div className="mt-1 flex flex-col gap-1">
                          {recursionStack.stack.map((node, idx) => (
                            <motion.div
                              key={`stack-${node}-${idx}`}
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              className="rounded-lg border border-[#7D8F3B] bg-white px-2 py-1 text-xs font-mono text-[#4B5320]"
                              style={{ marginLeft: `${idx * 12}px` }}
                            >
                              dfs({node})
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}
                    {recursionStack.returned.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-[#556B2F]">Returned:</p>
                        <div className="mt-1 flex flex-wrap gap-2">
                          {recursionStack.returned.map((node, idx) => (
                            <motion.div
                              key={`returned-${node}-${idx}`}
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              className="rounded-lg border border-[#D8CCA3] bg-[#F1E8C7] px-2 py-1 text-xs font-mono text-[#556B2F] line-through"
                            >
                              {node}
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="rounded-3xl border border-[#D8CCA3] bg-[#F7F1DD]/90 p-6 shadow-[0_10px_30px_rgba(75,83,32,0.08)]">
              <h3 className="mb-4 text-lg font-semibold text-[#4B5320]">Traversal Controls</h3>

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
                      disabled={isAnimating}
                      className="flex-1 cursor-pointer accent-[#7D8F3B] disabled:opacity-50"
                    />
                    <span className="text-xs font-medium text-[#556B2F]">Fast</span>
                  </div>
                  <div className="mt-2 text-xs text-[#556B2F]">
                    {speed === "slow" ? "More time to understand each step" : speed === "fast" ? "Quick overview of the traversal" : "Balanced pace for learning"}
                  </div>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={handleBFS}
                    disabled={isAnimating}
                    className={`w-full rounded-xl px-4 py-2.5 text-sm font-medium text-white transition ${
                      isAnimating && activeTraversal === "bfs"
                        ? "bg-[#7D8F3B] ring-2 ring-[#556B2F]"
                        : "bg-[#7D8F3B] hover:bg-[#556B2F]"
                    } disabled:opacity-50`}
                  >
                    <Zap className="mb-1 inline h-4 w-4" /> Run BFS
                  </button>
                  <button
                    onClick={handleDFS}
                    disabled={isAnimating}
                    className={`w-full rounded-xl px-4 py-2.5 text-sm font-medium text-white transition ${
                      isAnimating && activeTraversal === "dfs"
                        ? "bg-[#9CA763] ring-2 ring-[#556B2F]"
                        : "bg-[#9CA763] hover:bg-[#7D8F3B]"
                    } disabled:opacity-50`}
                  >
                    <Zap className="mb-1 inline h-4 w-4" /> Run DFS
                  </button>
                  <button
                    onClick={handleReset}
                    disabled={isAnimating}
                    className="w-full rounded-xl border-2 border-[#7D8F3B] bg-white px-4 py-2.5 text-sm font-medium text-[#7D8F3B] transition hover:bg-[#F1E8C7] disabled:opacity-50"
                  >
                    <RotateCcw className="mb-1 inline h-4 w-4" /> Reset Graph
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-[#D8CCA3] bg-[#F7F1DD]/90 p-6 shadow-[0_10px_30px_rgba(75,83,32,0.08)]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-[#4B5320]">
                  {activeTraversal === "bfs" ? "BFS Traversal" : activeTraversal === "dfs" ? "DFS Traversal" : "About Graph Traversal"}
                </h3>
                {activeTraversal !== "idle" && (
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ repeat: Number.POSITIVE_INFINITY, duration: 2 }}
                    className="h-3 w-3 rounded-full bg-[#7D8F3B]"
                  />
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#556B2F]">Steps</p>
                  <ul className="mt-2 space-y-1 text-sm text-[#4B5320]">
                    {traversalSteps.slice(0, 6).map((step, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#7D8F3B]" />
                        <span>{step}</span>
                      </li>
                    ))}
                    {traversalSteps.length > 6 && (
                      <li className="text-xs italic text-[#556B2F]">
                        ... and {traversalSteps.length - 6} more steps
                      </li>
                    )}
                  </ul>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#556B2F]">Time Complexity</p>
                  <p className="mt-1 rounded-lg border border-[#AAB76A] bg-[#F1E8C7] px-2 py-1 text-sm font-semibold text-[#7D8F3B]">
                    {activeTraversal === "bfs" || activeTraversal === "dfs" ? "O(V + E)" : "—"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#556B2F]">Status</p>
                  <motion.p
                    animate={{ opacity: isAnimating ? [0.7, 1, 0.7] : 1 }}
                    transition={{ repeat: isAnimating ? Number.POSITIVE_INFINITY : 0, duration: 1.5 }}
                    className="mt-1 text-sm font-medium text-[#4B5320]"
                  >
                    {isAnimating
                      ? `${activeTraversal === "bfs" ? "BFS" : "DFS"} in progress...`
                      : visitedNodes.length > 0
                        ? `Complete (${visitedNodes.length} nodes visited)`
                        : "Ready to start"}
                  </motion.p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
