import { Binary, Code, MessageCircle, AtSign, Heart } from "lucide-react"

const groups = [
  {
    title: "Product",
    links: ["Sorting", "Graphs", "Trees", "Stack & Queue", "Arrays"],
  },
  {
    title: "Resources",
    links: ["Documentation", "Tutorials", "Complexity Guide", "Roadmap"],
  },
  {
    title: "Company",
    links: ["About", "GitHub", "Contributing", "Contact"],
  },
]

export function Footer() {
  return (
    <footer className="border-t border-border px-4 py-14">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <a href="#home" className="flex items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Binary className="size-5" />
              </span>
              <span className="font-heading text-[15px] font-extrabold tracking-tight text-foreground">
                DSA Visualizer <span className="text-primary">Lite</span>
              </span>
            </a>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              Learn data structures and algorithms through beautiful, interactive
              animations. Free and open source.
            </p>
            <div className="mt-5 flex gap-2">
              {[Code, MessageCircle, AtSign].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  aria-label="social link"
                  className="flex size-9 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
                >
                  <Icon className="size-4" />
                </a>
              ))}
            </div>
          </div>

          {groups.map((g) => (
            <div key={g.title}>
              <h3 className="font-heading text-sm font-bold text-foreground">{g.title}</h3>
              <ul className="mt-4 space-y-2.5">
                {g.links.map((l) => (
                  <li key={l}>
                    <a
                      href="#"
                      className="text-sm text-muted-foreground transition-colors hover:text-primary"
                    >
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} DSA Visualizer Lite
          </p>
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            Made with <Heart className="size-4 fill-primary text-primary" /> for students
          </p>
        </div>
      </div>
    </footer>
  )
}
