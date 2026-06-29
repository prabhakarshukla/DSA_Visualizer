"use client"

import { useEffect, useRef, useState } from "react"
import { motion, useInView } from "motion/react"

type Stat = { value: number; suffix: string; label: string }

const stats: Stat[] = [
  { value: 10, suffix: "+", label: "Algorithms" },
  { value: 6, suffix: "+", label: "Data Structures" },
  { value: 100, suffix: "%", label: "Interactive" },
  { value: 0, suffix: "OSS", label: "Open Source" },
]

function Counter({ stat }: { stat: Stat }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: "-60px" })
  const [n, setN] = useState(0)

  useEffect(() => {
    if (!inView || stat.suffix === "OSS") return
    const duration = 1200
    const start = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setN(Math.round(eased * stat.value))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [inView, stat])

  return (
    <span ref={ref} className="font-heading text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
      {stat.suffix === "OSS" ? (
        <span className="text-primary">100%</span>
      ) : (
        <>
          {n}
          <span className="text-primary">{stat.suffix}</span>
        </>
      )}
    </span>
  )
}

export function Stats() {
  return (
    <section className="px-4 py-12">
      <div className="mx-auto max-w-6xl rounded-3xl border border-border bg-card p-8 shadow-[0_18px_50px_-30px_rgb(52_51_31_/_0.5)] sm:p-10">
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="text-center"
            >
              <Counter stat={s} />
              <p className="mt-2 text-sm font-medium text-muted-foreground">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
