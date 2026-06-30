import { AudioLines, BookOpen, Cpu, Mic2 } from "lucide-react";

const NAV_ITEMS = [
  { href: "#practice", label: "Practice", icon: Mic2 },
  { href: "#learn", label: "Learn", icon: BookOpen },
  { href: "#architecture", label: "Architecture", icon: Cpu },
] as const;

export function AppHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/8 bg-[#07111f]/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
        <a href="#top" className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-cyan-300 text-slate-950 shadow-lg shadow-cyan-400/20">
            <AudioLines size={21} aria-hidden="true" />
          </span>
          <span>
            <span className="block text-sm font-semibold tracking-wide text-white">
              English Voice Coach
            </span>
            <span className="block text-xs text-slate-400">
              Pipecat learning lab
            </span>
          </span>
        </a>

        <nav aria-label="Primary navigation" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
              <li key={href}>
                <a
                  href={href}
                  className="flex items-center gap-2 rounded-full px-4 py-2 text-sm text-slate-300 transition hover:bg-white/6 hover:text-white"
                >
                  <Icon size={15} aria-hidden="true" />
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <a
          href="#practice"
          className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-sm font-medium text-cyan-100 transition hover:bg-cyan-300/18"
        >
          Start practice
        </a>
      </div>
    </header>
  );
}
