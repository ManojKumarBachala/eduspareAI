"use client";

import {
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

const data = [
    { month: "Jan", collected: 82, pending: 18 },
    { month: "Feb", collected: 88, pending: 12 },
    { month: "Mar", collected: 91, pending: 9 },
    { month: "Apr", collected: 86, pending: 14 },
    { month: "May", collected: 94, pending: 6 },
];

export default function FeeChart() {
    return (
        <div className="rounded-3xl bg-white/10 p-6 backdrop-blur-xl">
            <h2 className="mb-4 text-xl font-bold text-white">
                Fee Collection
            </h2>

            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="month" stroke="#cbd5e1" />
                    <YAxis unit="%" stroke="#cbd5e1" />
                    <Tooltip />
                    <Bar dataKey="collected" stackId="fees" fill="#22c55e" />
                    <Bar dataKey="pending" stackId="fees" fill="#ef4444" />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
