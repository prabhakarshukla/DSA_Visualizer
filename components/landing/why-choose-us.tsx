"use client"

import { motion } from "motion/react"
import { Check } from "lucide-react"
import { Reveal } from "./reveal"

const points = [
  "Interactive Learning",
  "Step-by-step execution",
  "Real-time animations",
  "Easy for beginners",
  "Clean interface",
  "Open Source",
]

export function WhyChooseUs() {
  return (
    <section id="why" className="px-4 py-20 lg:py-28">
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
        <Reveal>
          <div className="relative">
            <div className="rounded-3xl border border-border bg-card p-6 shadow-[0_24px_60px_-30px_rgb(52_51_31_/_0.5)]">
              <div className="mb-4 flex items-center justify-between">
                <span className="font-mono text-xs text-muted-foreground">merge_sort.run()</span>
                <span className="rounded-full bg-primary/12 px-2.5 py-1 text-[11px] font-semibold text-primary">
                  step 4 / 9
                </span>
              </div>
              {/* animated execution rows */}
              <div className="space-y-2.5">
                {[68, 92, 45, 78].map((w, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="w-6 font-mono text-xs text-muted-foreground">{i + 1}</span>
                    <div className="h-8 flex-1 overflow-hidden rounded-lg bg-secondary">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${w}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, delay: 0.2 + i * 0.18, ease: "easeOut" }}
                        className="h-full rounded-lg bg-primary/70"
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-5 grid grid-cols-3 gap-2">
                {["compare", "swap", "merge"].map((s, i) => (
                  <motion.div
                    key={s}
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }}
                    className="rounded-lg bg-accent py-2 text-center text-[11px] font-semibold text-accent-foreground"
                  >
                    {s}
                  </motion.div>
                ))}
              </div>
            </div>
            <motion.div
              aria-hidden
              animate={{ y: [0, -14, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="pointer-events-none absolute -bottom-6 -right-6 -z-10 size-40 rounded-full bg-primary/15 blur-2xl"
            />
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <span className="text-sm font-semibold text-primary">Why choose us</span>
          <h2 className="mt-3 text-balance font-heading text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Built so the hard concepts finally make sense
          </h2>
          <p className="mt-4 text-pretty leading-relaxed text-muted-foreground">
            No walls of text. Just clear, calm animations that show exactly what
            happens at every step, designed for learners at any level.
          </p>
          <ul className="mt-8 grid gap-3 sm:grid-cols-2">
            {points.map((p, i) => (
              <motion.li
                key={p}
                initial={{ opacity: 0, x: -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.07 }}
                className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 text-sm font-medium text-foreground"
              >
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Check className="size-3.5" />
                </span>
                {p}
              </motion.li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  )
}
