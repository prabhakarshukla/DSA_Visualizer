"use client"

import { useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { Plus } from "lucide-react"
import { Reveal } from "./reveal"

const faqs = [
  {
    q: "Is DSA Visualizer Lite free to use?",
    a: "Yes. It is completely free and open source. You can use every visualizer without an account and even contribute on GitHub.",
  },
  {
    q: "Do I need to know how to code first?",
    a: "Not at all. The animations are designed for absolute beginners, while still being useful for students preparing for technical interviews.",
  },
  {
    q: "Which algorithms and structures are supported?",
    a: "Sorting (Bubble, Merge, Quick, Heap), graph algorithms (BFS, DFS, Dijkstra), binary search trees, stacks, queues and core array operations.",
  },
  {
    q: "Can I control the animation speed?",
    a: "Yes. You can play, pause, step forward and adjust the speed so you can follow each operation at your own pace.",
  },
  {
    q: "Does it work on mobile devices?",
    a: "Absolutely. The interface is fully responsive and the visualizations adapt smoothly to phones and tablets.",
  },
]

function Item({ q, a, index }: { q: string; a: string; index: number }) {
  const [open, setOpen] = useState(false)
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.06 }}
      className="overflow-hidden rounded-2xl border border-border bg-card"
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
        aria-expanded={open}
      >
        <span className="font-heading text-base font-bold text-foreground">{q}</span>
        <motion.span
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ duration: 0.25 }}
          className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/12 text-primary"
        >
          <Plus className="size-4" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <p className="px-5 pb-5 text-sm leading-relaxed text-muted-foreground">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export function Faq() {
  return (
    <section className="px-4 py-20 lg:py-28">
      <div className="mx-auto max-w-3xl">
        <Reveal className="text-center">
          <span className="text-sm font-semibold text-primary">FAQ</span>
          <h2 className="mt-3 text-balance font-heading text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Questions, answered
          </h2>
        </Reveal>

        <div className="mt-10 grid gap-3">
          {faqs.map((f, i) => (
            <Item key={f.q} q={f.q} a={f.a} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
