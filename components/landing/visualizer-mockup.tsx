"use client"

import { useEffect, useState } from "react"
import { motion } from "motion/react"
import { Play, RotateCcw } from "lucide-react"

/* Animated sorting bars that continuously "sort" themselves */
function SortingBars() {
  const base = [40, 72, 28, 90, 55, 36, 80, 48, 64, 22]
  const [bars, setBars] = useState(base)
  const [active, setActive] = useState<number>(0)

  useEffect(() => {
    const id = setInterval(() => {
      setBars((prev) => {
        const next = [...prev]
        const i = Math.floor(Math.random() * (next.length - 1))
        if (next[i] > next[i + 1]) {
          ;[next[i], next[i + 1]] = [next[i + 1], next[i]]
        }
        setActive(i)
        return next
      })
    }, 700)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="flex h-28 items-end justify-between gap-1.5">
      {bars.map((h, i) => (
        <motion.div
          key={i}
          layout
          transition={{ type: "spring", stiffness: 320, damping: 26 }}
          className={`flex-1 rounded-t-md ${
            i === active || i === active + 1 ? "bg-primary" : "bg-primary/35"
          }`}
          style={{ height: `${h}%` }}
        />
      ))}
    </div>
  )
}

/* Mini graph with traversal pulse */
function MiniGraph() {
  const nodes = [
    { id: 0, x: 26, y: 22 },
    { id: 1, x: 78, y: 30 },
    { id: 2, x: 18, y: 70 },
    { id: 3, x: 60, y: 74 },
    { id: 4, x: 96, y: 66 },
  ]
  const edges = [
    [0, 1],
    [0, 2],
    [1, 3],
    [2, 3],
    [1, 4],
    [3, 4],
  ]
  const [visited, setVisited] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setVisited((v) => (v + 1) % (nodes.length + 1)), 800)
    return () => clearInterval(id)
  }, [])

  return (
    <svg viewBox="0 0 110 92" className="h-28 w-full">
      {edges.map(([a, b], i) => (
        <line
          key={i}
          x1={nodes[a].x}
          y1={nodes[a].y}
          x2={nodes[b].x}
          y2={nodes[b].y}
          stroke="var(--primary)"
          strokeOpacity={0.3}
          strokeWidth={1.5}
        />
      ))}
      {nodes.map((n) => {
        const on = n.id < visited
        return (
          <g key={n.id}>
            <motion.circle
              cx={n.x}
              cy={n.y}
              r={8}
              animate={{ scale: on ? 1.15 : 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 18 }}
              fill={on ? "var(--primary)" : "var(--card)"}
              stroke="var(--primary)"
              strokeWidth={1.6}
            />
            <text
              x={n.x}
              y={n.y + 2.6}
              textAnchor="middle"
              fontSize="7"
              fontWeight="700"
              fill={on ? "var(--primary-foreground)" : "var(--primary)"}
            >
              {n.id}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

function ArrayRow() {
  const items = [12, 7, 25, 9, 18, 3]
  const [hot, setHot] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setHot((h) => (h + 1) % items.length), 600)
    return () => clearInterval(id)
  }, [])
  return (
    <div className="flex items-center gap-1.5">
      {items.map((v, i) => (
        <motion.div
          key={i}
          animate={{ y: i === hot ? -6 : 0 }}
          className={`flex h-9 flex-1 items-center justify-center rounded-lg border text-xs font-bold ${
            i === hot
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-secondary text-foreground"
          }`}
        >
          {v}
        </motion.div>
      ))}
    </div>
  )
}

function StackCol() {
  const [items, setItems] = useState([14, 8, 23])
  useEffect(() => {
    const id = setInterval(() => {
      setItems((prev) =>
        prev.length >= 4
          ? prev.slice(0, 2)
          : [...prev, Math.floor(Math.random() * 90) + 10],
      )
    }, 1100)
    return () => clearInterval(id)
  }, [])
  return (
    <div className="flex h-28 flex-col-reverse gap-1.5">
      {items.map((v, i) => (
        <motion.div
          key={`${v}-${i}`}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          className="flex h-7 items-center justify-center rounded-md bg-primary/15 text-xs font-bold text-[color:var(--chart-5)]"
        >
          {v}
        </motion.div>
      ))}
    </div>
  )
}

function MiniTree() {
  const dots = [
    { x: 50, y: 12 },
    { x: 26, y: 44 },
    { x: 74, y: 44 },
    { x: 14, y: 78 },
    { x: 38, y: 78 },
    { x: 86, y: 78 },
  ]
  const lines = [
    [0, 1],
    [0, 2],
    [1, 3],
    [1, 4],
    [2, 5],
  ]
  return (
    <svg viewBox="0 0 100 92" className="h-28 w-full">
      {lines.map(([a, b], i) => (
        <line
          key={i}
          x1={dots[a].x}
          y1={dots[a].y}
          x2={dots[b].x}
          y2={dots[b].y}
          stroke="var(--primary)"
          strokeOpacity={0.3}
          strokeWidth={1.5}
        />
      ))}
      {dots.map((d, i) => (
        <motion.circle
          key={i}
          cx={d.x}
          cy={d.y}
          r={7}
          fill="var(--card)"
          stroke="var(--primary)"
          strokeWidth={1.6}
          animate={{ scale: [1, 1.18, 1] }}
          transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </svg>
  )
}

const tiles = [
  { title: "Sorting", tag: "Quick Sort", render: <SortingBars /> },
  { title: "Graph", tag: "BFS", render: <MiniGraph /> },
  { title: "Tree", tag: "BST", render: <MiniTree /> },
  { title: "Array", tag: "Search", render: <ArrayRow /> },
  { title: "Stack", tag: "Push / Pop", render: <StackCol /> },
]

export function VisualizerMockup() {
  return (
    <div className="rounded-3xl border border-border bg-card p-3 shadow-[0_24px_70px_-24px_rgb(52_51_31_/_0.35)]">
      {/* window chrome */}
      <div className="flex items-center justify-between rounded-2xl bg-secondary px-4 py-2.5">
        <div className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-[#d9c98a]" />
          <span className="size-2.5 rounded-full bg-primary/60" />
          <span className="size-2.5 rounded-full bg-[color:var(--chart-4)]/50" />
        </div>
        <span className="font-mono text-[11px] text-muted-foreground">dsa-visualizer / playground</span>
        <div className="flex items-center gap-1.5">
          <span className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Play className="size-3" />
          </span>
          <span className="flex size-6 items-center justify-center rounded-md bg-background text-muted-foreground">
            <RotateCcw className="size-3" />
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 p-3 sm:grid-cols-3">
        {tiles.map((t) => (
          <div
            key={t.title}
            className="rounded-2xl border border-border bg-background/60 p-3"
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-bold text-foreground">{t.title}</span>
              <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold text-accent-foreground">
                {t.tag}
              </span>
            </div>
            {t.render}
          </div>
        ))}
        {/* Queue tile filling the grid */}
        <div className="rounded-2xl border border-border bg-background/60 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-bold text-foreground">Queue</span>
            <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold text-accent-foreground">
              FIFO
            </span>
          </div>
          <div className="flex h-28 flex-col justify-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{ x: [0, 6, 0] }}
                transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.25 }}
                className="flex h-7 items-center rounded-md bg-primary/15 px-2 text-xs font-bold text-[color:var(--chart-5)]"
              >
                node {i + 1}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
