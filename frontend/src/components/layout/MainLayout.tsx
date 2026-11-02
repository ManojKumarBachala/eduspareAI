"use client";

import { ReactNode, useEffect, useState } from "react";
import { Menu } from "lucide-react";
import Sidebar from "./Sidebar";

interface Props {
    children: ReactNode;
}

export default function MainLayout({ children }: Props) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        const desktopQuery = window.matchMedia("(min-width: 1024px)");
        const updateSidebar = () => setIsSidebarOpen(desktopQuery.matches);

        updateSidebar();
        desktopQuery.addEventListener("change", updateSidebar);
        return () => desktopQuery.removeEventListener("change", updateSidebar);
    }, []);

    return (
        <div className="flex min-h-screen bg-transparent">
            <Sidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
            />

            {isSidebarOpen && (
                <button
                    type="button"
                    aria-label="Close navigation"
                    className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            <main className={`min-w-0 flex-1 p-4 pt-20 transition-[margin] duration-300 sm:p-8 lg:pt-8 ${isSidebarOpen ? "lg:ml-72" : "lg:ml-0"}`}>
                <button
                    type="button"
                    aria-label={isSidebarOpen ? "Close navigation" : "Open navigation"}
                    aria-expanded={isSidebarOpen}
                    onClick={() => setIsSidebarOpen((isOpen) => !isOpen)}
                    className="fixed left-4 top-4 z-[60] rounded-xl border border-slate-700 bg-slate-900 p-3 text-white shadow-lg transition hover:bg-slate-800"
                >
                    <Menu size={22} />
                </button>
                {children}
            </main>
        </div>
    );
}
