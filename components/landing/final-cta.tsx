"use client"

import { motion } from "motion/react"
import { Play, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Reveal } from "./reveal"

export function FinalCta() {
  return (
    <section className="px-4 py-16 lg:py-24">
      <Reveal className="mx-auto max-w-5xl">
        <div className="relative overflow-hidden rounded-[2rem] border border-border bg-card px-6 py-16 text-center shadow-[0_30px_80px_-40px_rgb(52_51_31_/_0.6)] sm:px-12">
          <motion.div
            aria-hidden
            animate={{ y: [0, -18, 0] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
            className="pointer-events-none absolute -left-10 -top-10 size-48 rounded-full bg-primary/20 blur-3xl"
          />
          <motion.div
            aria-hidden
            animate={{ y: [0, 18, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="pointer-events-none absolute -bottom-12 -right-8 size-56 rounded-full bg-[color:var(--chart-2)]/25 blur-3xl"
          />

          <div className="relative">
            <h2 className="text-balance font-heading text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl">
              Ready to Master DSA?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-pretty leading-relaxed text-muted-foreground">
              Jump into the visualizer and start turning confusing algorithms into
              clear, memorable animations today.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button size="lg" className="gap-2 rounded-xl px-7 text-base font-semibold shadow-sm">
                <Play className="size-4" />
                Launch Visualizer
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="gap-2 rounded-xl border-border bg-background px-7 text-base font-semibold"
              >
                <Star className="size-4" />
                Star on GitHub
              </Button>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  )
}
