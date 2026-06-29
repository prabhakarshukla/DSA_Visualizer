"use client"

import { useEffect, useState } from "react"
import { motion } from "motion/react"
import { Star, Menu, Play, X, Binary } from "lucide-react"
import { Button } from "@/components/ui/button"

const links = [
  { label: "Home", href: "#home" },
  { label: "Algorithms", href: "#features" },
  { label: "Visualizer", href: "#how-it-works" },
  { label: "About", href: "#why" },
  { label: "GitHub", href: "#" },
]

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-x-0 top-0 z-50 px-4 pt-4"
    >
      <nav
        className={`mx-auto flex max-w-6xl items-center justify-between rounded-2xl px-4 py-3 transition-all duration-300 sm:px-5 ${
          scrolled
            ? "border border-border/70 bg-background/70 shadow-[0_8px_30px_rgb(52_51_31_/_0.08)] backdrop-blur-xl"
            : "border border-transparent"
        }`}
      >
        <a href="#home" className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Binary className="size-5" />
          </span>
          <span className="font-heading text-[15px] font-extrabold tracking-tight text-foreground">
            DSA Visualizer <span className="text-primary">Lite</span>
          </span>
        </a>

        <ul className="hidden items-center gap-1 lg:flex">
          {links.map((l) => (
            <li key={l.label}>
              <a
                href={l.href}
                className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-2 lg:flex">
          <Button
            variant="outline"
            className="gap-2 rounded-xl border-border bg-transparent font-medium"
          >
            <Star className="size-4" />
            Star on GitHub
          </Button>
          <Button className="gap-2 rounded-xl font-semibold shadow-sm">
            <Play className="size-4" />
            Launch Visualizer
          </Button>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
          className="flex size-10 items-center justify-center rounded-xl border border-border bg-card text-foreground lg:hidden"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </nav>

      {open && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto mt-2 max-w-6xl rounded-2xl border border-border bg-card p-3 shadow-lg lg:hidden"
        >
          <ul className="grid gap-1">
            {links.map((l) => (
              <li key={l.label}>
                <a
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-accent"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-2 grid gap-2">
            <Button variant="outline" className="w-full gap-2 rounded-xl bg-transparent">
              <Star className="size-4" /> Star on GitHub
            </Button>
            <Button className="w-full gap-2 rounded-xl">
              <Play className="size-4" /> Launch Visualizer
            </Button>
          </div>
        </motion.div>
      )}
    </motion.header>
  )
}
