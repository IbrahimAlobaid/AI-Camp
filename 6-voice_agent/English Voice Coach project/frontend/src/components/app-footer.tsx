import { AudioLines, Code2, GraduationCap } from "lucide-react";

export function AppFooter() {
  return (
    <footer className="border-t border-white/7 py-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between lg:px-8">
        <div className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-xl bg-white/6 text-cyan-200">
            <AudioLines size={18} />
          </span>
          <span>
            English Voice Coach
            <span className="block text-xs text-slate-600">
              Educational Pipecat full-stack project
            </span>
          </span>
        </div>
        <div className="flex flex-wrap gap-4">
          <a
            href="https://docs.pipecat.ai/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 transition hover:text-white"
          >
            <GraduationCap size={15} />
            Pipecat docs
          </a>
          <a
            href="https://github.com/pipecat-ai/pipecat"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 transition hover:text-white"
          >
            <Code2 size={15} />
            Pipecat source
          </a>
        </div>
      </div>
    </footer>
  );
}
