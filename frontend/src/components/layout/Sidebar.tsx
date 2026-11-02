"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    GraduationCap,
    Users,
    CalendarCheck,
    CalendarRange,
    FileText,
    Trophy,
    DollarSign,
    BookOpen,
    Bus,
    BarChart3,
    Settings,
    LogOut,
    Images,
    BriefcaseBusiness,
    X,
} from "lucide-react";

const menuItems = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Students", href: "/students", icon: GraduationCap },
    { name: "Teachers", href: "/teachers", icon: Users },
    { name: "Attendance", href: "/attendance", icon: CalendarCheck },
    { name: "Timetable", href: "/timetable", icon: CalendarRange },
    { name: "Exams", href: "/exams", icon: FileText },
    { name: "Results", href: "/results", icon: Trophy },
    { name: "Fees", href: "/fees", icon: DollarSign },
    { name: "Library", href: "/library", icon: BookOpen },
    { name: "Transport", href: "/transport", icon: Bus },
    { name: "Reports", href: "/reports", icon: BarChart3 },
    { name: "Gallery", href: "/gallery", icon: Images },
    { name: "Careers", href: "/careers", icon: BriefcaseBusiness },
    { name: "Settings", href: "/settings", icon: Settings },
];

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
    const pathname = usePathname();

    return (
        <aside
            aria-label="Main navigation"
            className={`fixed left-0 top-0 z-50 flex h-screen w-72 flex-col overflow-y-auto border-r border-slate-800 bg-slate-900 text-white shadow-2xl transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
        >
            <button
                type="button"
                onClick={onClose}
                aria-label="Close navigation"
                className="absolute right-3 top-3 rounded-lg p-2 text-slate-300 transition hover:bg-slate-800 hover:text-white lg:hidden"
            >
                <X size={20} />
            </button>

            <div className="p-6 border-b border-slate-800">
                <h1 className="text-2xl font-bold text-blue-400">
                    New Little Flower
                </h1>

                <p className="text-slate-400 text-sm mt-1">
                    EM School · Wyra
                </p>
            </div>

            <nav className="mt-6 px-4 space-y-2">
                {menuItems.map((item) => {
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            onClick={onClose}
                            className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-all ${pathname === item.href
                                ? "bg-blue-600 text-white"
                                : "text-slate-300 hover:bg-slate-800 hover:text-white"
                                }`}
                        >
                            <Icon size={20} />
                            <span>{item.name}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="mt-auto p-4">
                <button className="w-full flex items-center justify-center gap-2 rounded-xl bg-red-600 py-3 hover:bg-red-700 transition">
                    <LogOut size={18} />
                    Logout
                </button>
            </div>

        </aside>
    );
}
