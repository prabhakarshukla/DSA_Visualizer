"use client"

import { motion } from "motion/react"
import { ArrowUpDown, Share2, GitBranch, Layers, Grid3x3, Smartphone } from "lucide-react"
import { Reveal } from "./reveal"

const features = [
  {
    icon: ArrowUpDown,
    title: "Sorting Visualizer",
    desc: "Watch Bubble, Merge, Quick and Heap Sort animate comparison by comparison.",
    tags: ["Bubble", "Merge", "Quick", "Heap"],
  },
  {
    icon: Share2,
    title: "Graph Algorithms",
    desc: "Traverse and explore graphs with clear, step-by-step pathfinding.",
    tags: ["BFS", "DFS", "Dijkstra", "Shortest Path"],
  },
  {
    icon: GitBranch,
    title: "Tree Visualizer",
    desc: "See binary search trees grow, balance and rearrange in real time.",
    tags: ["BST", "Traversal", "Insertion", "Deletion"],
  },
  {
    icon: Layers,
    title: "Stack & Queue",
    desc: "Understand LIFO and FIFO behavior with animated push and pop actions.",
    tags: ["Push", "Pop", "Enqueue", "Dequeue"],
  },
  {
    icon: Grid3x3,
    title: "Array Operations",
    desc: "Visualize how elements shift as you insert, delete, search and traverse.",
    tags: ["Insert", "Delete", "Search", "Traverse"],
  },
  {
    icon: Smartphone,
    title: "Responsive UI",
    desc: "A clean, fluid interface that works beautifully on desktop and mobile.",
    tags: ["Desktop", "Tablet", "Mobile"],
  },
]

export function Features() {
  return (
    <section id="features" className="px-4 py-20 lg:py-28">
      <div className="mx-auto max-w-6xl">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold text-primary">Features</span>
          <h2 className="mt-3 text-balance font-heading text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Everything you need to truly understand DSA
          </h2>
          <p className="mt-4 text-pretty leading-relaxed text-muted-foreground">
            Each module turns abstract theory into something you can watch, pause and
            replay until it clicks.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: (i % 3) * 0.08 }}
              whileHover={{ y: -6 }}
              className="group rounded-3xl border border-border bg-card p-6 shadow-[0_10px_30px_-18px_rgb(52_51_31_/_0.4)] transition-shadow hover:shadow-[0_24px_50px_-24px_rgb(52_51_31_/_0.45)]"
            >
              <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/12 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <f.icon className="size-6" />
              </div>
              <h3 className="mt-5 font-heading text-lg font-bold text-foreground">
                {f.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {f.desc}
              </p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {f.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-semibold text-secondary-foreground"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
