"use client";

import Sidebar from "./SidebarTemp";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen">

            <Sidebar />

            <div className="flex-1 flex flex-col">

                <div className="backdrop-blur-lg bg-white/10 border-b border-white/10 px-8 py-5">

                    <h1 className="text-white text-2xl font-bold">
                        New Little Flower EM School
                    </h1>

                    <p className="text-slate-300">
                        School Management Platform · Wyra
                    </p>

                </div>

                <main className="p-8">
                    {children}
                </main>

            </div>

        </div>
    );
}
