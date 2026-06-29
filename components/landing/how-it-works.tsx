"use client"

import { motion } from "motion/react"
import { ListChecks, PlayCircle, GraduationCap, ArrowRight } from "lucide-react"
import { Reveal } from "./reveal"

const steps = [
  {
    icon: ListChecks,
    title: "Choose Algorithm",
    desc: "Pick from sorting, graphs, trees, stacks, queues and arrays.",
  },
  {
    icon: PlayCircle,
    title: "Visualize Step-by-Step",
    desc: "Play, pause and scrub through every operation at your own pace.",
  },
  {
    icon: GraduationCap,
    title: "Learn Efficiently",
    desc: "Build real intuition for time and space complexity that lasts.",
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="px-4 py-20 lg:py-28">
      <div className="mx-auto max-w-6xl">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold text-primary">How it works</span>
          <h2 className="mt-3 text-balance font-heading text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            From confused to confident in three steps
          </h2>
        </Reveal>

        <div className="mt-14 grid items-stretch gap-6 lg:grid-cols-[1fr_auto_1fr_auto_1fr]">
          {steps.map((s, i) => (
            <div key={s.title} className="contents">
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.12 }}
                className="relative rounded-3xl border border-border bg-card p-7 text-center shadow-[0_12px_36px_-22px_rgb(52_51_31_/_0.45)]"
              >
                <span className="absolute right-5 top-5 font-heading text-4xl font-extrabold text-primary/15">
                  0{i + 1}
                </span>
                <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
                  <s.icon className="size-7" />
                </div>
                <h3 className="mt-5 font-heading text-lg font-bold text-foreground">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
              </motion.div>

              {i < steps.length - 1 && (
                <div className="flex items-center justify-center" aria-hidden>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.6 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.2 + i * 0.12 }}
                    className="flex size-9 rotate-90 items-center justify-center rounded-full border border-border bg-card text-primary lg:rotate-0"
                  >
                    <ArrowRight className="size-4" />
                  </motion.div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
