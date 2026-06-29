"use client"

import { motion } from "motion/react"
import { ArrowRight, Play, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { VisualizerMockup } from "./visualizer-mockup"

export function Hero() {
  return (
    <section id="home" className="relative overflow-hidden px-4 pb-16 pt-32 sm:pt-36 lg:pb-24">
      {/* floating abstract shapes */}
      <motion.div
        aria-hidden
        animate={{ y: [0, -20, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute -left-10 top-28 size-48 rounded-full bg-primary/20 blur-3xl"
      />
      <motion.div
        aria-hidden
        animate={{ y: [0, 24, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute right-0 top-48 size-64 rounded-full bg-[color:var(--chart-2)]/25 blur-3xl"
      />

      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.05fr_1fr]">
        <div>
          <motion.span
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-semibold text-foreground shadow-sm"
          >
            <Sparkles className="size-3.5 text-primary" />
            Interactive learning, beautifully animated
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.08 }}
            className="mt-5 text-balance font-heading text-4xl font-extrabold leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-6xl"
          >
            Learn Data Structures & Algorithms{" "}
            <span className="text-primary">Visually</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.16 }}
            className="mt-5 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg"
          >
            Master DSA concepts through beautiful interactive animations instead of
            static code. Watch every step unfold and finally understand how
            algorithms really work.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.24 }}
            className="mt-8 flex flex-col gap-3 sm:flex-row"
          >
            <Button size="lg" className="gap-2 rounded-xl px-6 text-base font-semibold shadow-sm">
              <Play className="size-4" />
              Start Visualizing
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="gap-2 rounded-xl border-border bg-card px-6 text-base font-semibold"
            >
              Explore Algorithms
              <ArrowRight className="size-4" />
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.36 }}
            className="mt-8 flex items-center gap-6 text-sm text-muted-foreground"
          >
            <span><strong className="text-foreground">10+</strong> algorithms</span>
            <span className="h-4 w-px bg-border" />
            <span><strong className="text-foreground">6+</strong> data structures</span>
            <span className="h-4 w-px bg-border" />
            <span><strong className="text-foreground">100%</strong> interactive</span>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          <VisualizerMockup />
        </motion.div>
      </div>
    </section>
  )
}
