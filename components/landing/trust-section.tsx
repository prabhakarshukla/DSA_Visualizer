"use client"

import { motion } from "motion/react"
import { MousePointerClick, GitFork, Zap, Smartphone, Triangle } from "lucide-react"

const badges = [
  { label: "Interactive", icon: MousePointerClick },
  { label: "Open Source", icon: GitFork },
  { label: "Fast", icon: Zap },
  { label: "Responsive", icon: Smartphone },
  { label: "Built with Next.js", icon: Triangle },
]

export function TrustSection() {
  return (
    <section className="px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <p className="mb-6 text-center text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Loved by students learning to code
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {badges.map((b, i) => (
            <motion.div
              key={b.label}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-sm"
            >
              <b.icon className="size-4 text-primary" />
              {b.label}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
