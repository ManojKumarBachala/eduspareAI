"use client";

import { Moon, UserCircle } from "lucide-react";
import GlobalSearch from "./GlobalSearch";
import NotificationBell from "../NotificationBell";

export default function DashboardHeader() {
    return (
        <div className="mb-8 flex flex-col items-center justify-between gap-6 lg:flex-row">
            <div><p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">New Little Flower EM School</p><h1 className="text-4xl font-bold text-white">Welcome to our school</h1><p className="mt-2 text-slate-400">School management dashboard · Wyra, Khammam</p></div>
            <div className="flex w-full items-center gap-3 lg:w-auto"><GlobalSearch /><NotificationBell /><button aria-label="Toggle theme" className="bg-white/10 p-3 rounded-xl hover:bg-white/20"><Moon className="text-white" /></button><button aria-label="Profile" className="bg-white/10 p-3 rounded-xl hover:bg-white/20"><UserCircle className="text-white" /></button></div>
        </div>
    );
}
