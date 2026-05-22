import { HeroSection } from "@/components/hero-section";
import { Navbar } from "@/components/navbar";
import { ModuleStatus, VisualizerCard } from "@/components/visualizer-card";
import {
  ArrowRight,
  BarChart3,
  Boxes,
  ChartColumnIncreasing,
  GitBranch,
  List,
  Network,
  Unplug,
} from "lucide-react";
import type { ReactNode } from "react";

type ModuleItem = {
  title: string;
  subtitle: string;
  href: string;
  status: ModuleStatus;
  icon: ReactNode;
  featured?: boolean;
};

const modules: ModuleItem[] = [
  {
    title: "Arrays",
    subtitle: "Index-based operations and traversal",
    href: "/arrays",
    status: "Active",
    icon: <Boxes className="h-4 w-4" />,
    featured: true,
  },
  {
    title: "Linked List",
    subtitle: "Pointer updates and dynamic nodes",
    href: "/linked-list",
    status: "Ready",
    icon: <List className="h-4 w-4" />,
    featured: true,
  },
  {
    title: "Stacks",
    subtitle: "LIFO push and pop flow",
    href: "/stack",
    status: "Next",
    icon: <Unplug className="h-4 w-4" />,
  },
  {
    title: "Queues",
    subtitle: "FIFO movement and ordering",
    href: "/queue",
    status: "Next",
    icon: <ArrowRight className="h-4 w-4" />,
  },
  {
    title: "Trees",
    subtitle: "Hierarchy and traversals",
    href: "/tree",
    status: "Planned",
    icon: <GitBranch className="h-4 w-4" />,
  },
  {
    title: "Graphs",
    subtitle: "Nodes, edges, and pathing",
    href: "/graphs",
    status: "Planned",
    icon: <Network className="h-4 w-4" />,
  },
  {
    title: "Searching & Sorting",
    subtitle: "Compare, scan, and optimize",
    href: "/searching-sorting",
    status: "Planned",
    icon: <ChartColumnIncreasing className="h-4 w-4" />,
  },
];

const whyItems = [
  {
    title: "Step-by-step learning",
    copy: "See each operation as it happens, not as static text.",
  },
  {
    title: "Exam revision",
    copy: "Quickly refresh high-value topics with visual memory.",
  },
  {
    title: "Interview practice",
    copy: "Explain behavior confidently with clear mental models.",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-[#f4f7fb] text-slate-900">
      <Navbar />

      <main className="pb-16">
        <HeroSection />

        <section className="px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-6xl rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)] sm:p-7">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Algorithm Path</h2>
                <p className="mt-1 text-sm text-slate-600 sm:text-base">
                  Move through connected learning steps from arrays to advanced patterns.
                </p>
              </div>
              <BarChart3 className="hidden h-5 w-5 text-cyan-600 sm:block" />
            </div>

            <div className="mb-4 hidden items-center gap-2 px-2 md:flex">
              {modules.slice(0, -1).map((module) => (
                <div key={`${module.title}-connector`} className="group flex flex-1 items-center">
                  <span className="mr-2 text-xs font-medium text-slate-500">{module.title}</span>
                  <span className="h-px flex-1 bg-gradient-to-r from-cyan-300 via-blue-300 to-transparent transition group-hover:from-cyan-400 group-hover:via-blue-400" />
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-7">
              {modules.map((module) => (
                <VisualizerCard
                  key={module.title}
                  title={module.title}
                  subtitle={module.subtitle}
                  href={module.href}
                  status={module.status}
                  icon={module.icon}
                  featured={module.featured}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 pt-4 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-6xl rounded-3xl border border-slate-200 bg-gradient-to-r from-slate-900 to-slate-800 p-6 text-slate-100 shadow-[0_10px_30px_rgba(15,23,42,0.2)]">
            <h3 className="text-xl font-semibold tracking-tight">Why visualize?</h3>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
              {whyItems.map((item) => (
                <div key={item.title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm font-semibold text-cyan-200">{item.title}</p>
                  <p className="mt-1 text-sm text-slate-200/90">{item.copy}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
