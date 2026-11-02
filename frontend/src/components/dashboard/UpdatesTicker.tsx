"use client";

import { ArrowUpRight, Megaphone } from "lucide-react";

const updates = [
    { label: "Admissions", text: "New student applications are ready for review", tone: "from-blue-500/20 to-cyan-500/10" },
    { label: "Attendance", text: "Today’s attendance register is open", tone: "from-emerald-500/20 to-teal-500/10" },
    { label: "Exams", text: "Term 1 result entry closes this Friday", tone: "from-violet-500/20 to-fuchsia-500/10" },
    { label: "Transport", text: "Two vehicles have a service check due", tone: "from-amber-500/20 to-orange-500/10" },
];

export default function UpdatesTicker() {
    return (
        <section aria-label="Latest updates" className="mb-8 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/45 shadow-lg shadow-black/10 backdrop-blur-xl">
            <div className="flex items-center gap-3 border-b border-white/10 px-5 py-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-400/15 text-emerald-300"><Megaphone size={16} /></span>
                <div><p className="text-sm font-semibold text-white">School updates</p><p className="text-xs text-slate-500">What’s happening at New Little Flower EM School</p></div>
                <span className="ml-auto hidden rounded-full bg-emerald-400/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-300 sm:block">Live feed</span>
            </div>
            <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 py-4 [scrollbar-width:thin]">
                {updates.map((update) => (
                    <article key={update.label} className={`min-w-[260px] snap-start rounded-xl border border-white/10 bg-gradient-to-br ${update.tone} p-4 sm:min-w-[300px]`}>
                        <div className="mb-2 flex items-center justify-between gap-3"><span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-300">{update.label}</span><ArrowUpRight size={15} className="text-slate-500" /></div>
                        <p className="text-sm leading-6 text-slate-200">{update.text}</p>
                    </article>
                ))}
            </div>
        </section>
    );
}
