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
    subtitle: "Singly, doubly, circular, and doubly circular flows",
    href: "/linked-list",
    status: "Active",
    icon: <List className="h-4 w-4" />,
    featured: true,
  },
  {
    title: "Stack",
    subtitle: "LIFO push, pop, peek, and overflow/underflow",
    href: "/stack",
    status: "Active",
    icon: <Unplug className="h-4 w-4" />,
  },
  {
    title: "Queues",
    subtitle: "Linear, circular, double ended, and priority queue",
    href: "/queue",
    status: "Active",
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
    <div className="min-h-screen bg-[#F1E8C7] text-[#4B5320]">
      <Navbar />

      <main className="pb-16">
        <HeroSection />

        <section className="px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-6xl rounded-3xl border border-[#D8CCA3] bg-[#F7F1DD]/80 p-5 shadow-[0_10px_30px_rgba(75,83,32,0.06)] sm:p-7">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-[#4B5320] sm:text-3xl">Algorithm Path</h2>
                <p className="mt-1 text-sm text-[#9CA763] sm:text-base">
                  Move through connected learning steps from arrays to advanced patterns.
                </p>
                <p className="mt-2 inline-flex items-center rounded-full border border-[#AAB76A] bg-[#F7F1DD] px-3 py-1 text-xs font-semibold text-[#7D8F3B]">
                  4 Visualizers Complete · Fully Interactive
                </p>
              </div>
              <BarChart3 className="hidden h-5 w-5 text-[#7D8F3B] sm:block" />
            </div>

            <div className="mb-4 hidden items-center gap-2 px-2 md:flex">
              {modules.slice(0, -1).map((module) => (
                <div key={`${module.title}-connector`} className="group flex flex-1 items-center">
                  <span className="mr-2 text-xs font-medium text-[#9CA763]">{module.title}</span>
                  <span className="h-px flex-1 bg-gradient-to-r from-[#AAB76A] via-[#7D8F3B] to-transparent transition group-hover:from-[#7D8F3B] group-hover:via-[#4B5320]" />
                </div>
              ))}
            </div>

            <div className="grid auto-rows-fr grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-7">
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
          <div className="mx-auto w-full max-w-6xl rounded-3xl border border-[#D8CCA3] bg-gradient-to-r from-[#4B5320] to-[#7D8F3B] p-6 text-[#F7F1DD] shadow-[0_10px_30px_rgba(75,83,32,0.2)]">
            <h3 className="text-xl font-semibold tracking-tight">Why visualize?</h3>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
              {whyItems.map((item) => (
                <div key={item.title} className="rounded-2xl border border-[#AAB76A]/30 bg-[#AAB76A]/10 p-4">
                  <p className="text-sm font-semibold text-[#AAB76A]">{item.title}</p>
                  <p className="mt-1 text-sm text-[#F7F1DD]/90">{item.copy}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
