"use client"

import { motion } from "motion/react"
import { Star } from "lucide-react"
import { Reveal } from "./reveal"

const reviews = [
  {
    quote:
      "I struggled with recursion for months. Watching the tree traversal animate just once made it finally click.",
    name: "Aarav Mehta",
    role: "CS Sophomore",
    initials: "AM",
  },
  {
    quote:
      "The sorting visualizer is gorgeous and genuinely helpful. I use it before every algorithms exam now.",
    name: "Sofia Rivera",
    role: "Bootcamp Student",
    initials: "SR",
  },
  {
    quote:
      "Finally a DSA tool that doesn't feel like a textbook. The step-by-step graph search is incredible.",
    name: "Daniel Okafor",
    role: "Self-taught Developer",
    initials: "DO",
  },
]

export function Testimonials() {
  return (
    <section className="px-4 py-20 lg:py-28">
      <div className="mx-auto max-w-6xl">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold text-primary">Testimonials</span>
          <h2 className="mt-3 text-balance font-heading text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Students learn faster when they can see it
          </h2>
        </Reveal>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {reviews.map((r, i) => (
            <motion.figure
              key={r.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="flex flex-col rounded-3xl border border-border bg-card p-6 shadow-[0_12px_36px_-24px_rgb(52_51_31_/_0.45)]"
            >
              <div className="flex gap-0.5 text-primary">
                {Array.from({ length: 5 }).map((_, s) => (
                  <Star key={s} className="size-4 fill-current" />
                ))}
              </div>
              <blockquote className="mt-4 flex-1 text-pretty leading-relaxed text-foreground">
                “{r.quote}”
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-full bg-primary/12 font-heading text-sm font-bold text-primary">
                  {r.initials}
                </span>
                <span>
                  <span className="block text-sm font-bold text-foreground">{r.name}</span>
                  <span className="block text-xs text-muted-foreground">{r.role}</span>
                </span>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  )
}
