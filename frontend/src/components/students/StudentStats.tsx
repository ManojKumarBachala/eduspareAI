"use client";

interface Props {
    total: number;
    grades: number;
    sections: number;
}

export default function StudentStats({
    total,
    grades,
    sections,
}: Props) {
    return (
        <div className="grid gap-3 border-y border-white/10 py-4 sm:grid-cols-3">
            <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Enrolled students</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums text-white">{total}</p>
            </div>
            <div className="border-white/10 sm:border-l sm:pl-5">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Grades</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums text-white">{grades}</p>
            </div>
            <div className="border-white/10 sm:border-l sm:pl-5">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Class sections</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums text-white">{sections}</p>
            </div>
        </div>
    );
}