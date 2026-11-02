"use client";

import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    Tooltip,
} from "recharts";

const data = [
    { month: "Jan", fees: 12000 },
    { month: "Feb", fees: 18000 },
    { month: "Mar", fees: 15000 },
    { month: "Apr", fees: 22000 },
    { month: "May", fees: 26000 },
];

export default function FeeChart() {
    return (
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/10">
            <h2 className="text-xl font-bold text-white mb-4">
                Fee Collection
            </h2>

            <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data}>
                        <XAxis dataKey="month" stroke="#94a3b8" />
                        <Tooltip />
                        <Bar dataKey="fees" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}