"use client";

import Link from "next/link";

const actions = [
    {
        title: "➕ Add Student",
        href: "/students",
        color: "bg-blue-600",
    },
    {
        title: "👨‍🏫 Teachers",
        href: "/teachers",
        color: "bg-green-600",
    },
    {
        title: "📚 Library",
        href: "/library",
        color: "bg-purple-600",
    },
    {
        title: "🚌 Transport",
        href: "/transport",
        color: "bg-orange-600",
    },
    {
        title: "💰 Fees",
        href: "/fees",
        color: "bg-pink-600",
    },
    {
        title: "📅 Attendance",
        href: "/attendance",
        color: "bg-red-600",
    },
    {
        title: "Timetable",
        href: "/timetable",
        color: "bg-cyan-700",
    },
];

export default function QuickActions() {
    return (
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/10 p-6">
            <h2 className="text-white text-xl font-bold mb-6">
                Quick Actions
            </h2>

            <div className="grid grid-cols-2 gap-4">
                {actions.map((item) => (
                    <Link
                        href={item.href}
                        key={item.title}
                        className={`${item.color} rounded-xl text-white p-4 text-center font-semibold hover:scale-105 transition-all`}
                    >
                        {item.title}
                    </Link>
                ))}
            </div>
        </div>
    );
}