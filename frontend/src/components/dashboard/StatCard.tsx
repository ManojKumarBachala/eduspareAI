"use client";

import { ReactNode } from "react";

interface Props {
    title: string;
    value: number | string;
    icon: ReactNode;
    color: string;
}

export default function StatCard({
    title,
    value,
    icon,
    color,
}: Props) {
    return (
        <div
            className="
      bg-white/10
      backdrop-blur-xl
      border
      border-white/10
      rounded-3xl
      p-6
      shadow-xl
      hover:scale-105
      transition
      duration-300
    "
        >
            <div className="flex justify-between items-center">

                <div>

                    <p className="text-slate-400">
                        {title}
                    </p>

                    <h2 className="text-4xl font-bold text-white mt-2">
                        {value}
                    </h2>

                </div>

                <div
                    className={`${color} p-4 rounded-2xl`}
                >
                    {icon}
                </div>

            </div>
        </div>
    );
}