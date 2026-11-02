"use client";

import { Search } from "lucide-react";

interface Props {
    value: string;
    onChange: (value: string) => void;
}

export default function StudentSearch({
    value,
    onChange,
}: Props) {
    return (
        <label className="flex min-w-0 items-center gap-2 rounded border border-white/15 bg-white/[0.03] px-3 text-slate-400 focus-within:border-emerald-400 sm:w-80">
            <Search aria-hidden="true" size={16} />
            <input
                aria-label="Search students"
                type="search"
                placeholder="Search name or admission no."
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="min-w-0 flex-1 bg-transparent py-2.5 text-sm text-white outline-none placeholder:text-slate-500"
            />
        </label>
    );
}