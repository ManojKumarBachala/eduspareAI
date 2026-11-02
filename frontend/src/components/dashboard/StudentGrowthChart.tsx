"use client";

import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    Tooltip,
} from "recharts";

const data = [
    { month: "Jan", students: 80 },
    { month: "Feb", students: 110 },
    { month: "Mar", students: 140 },
    { month: "Apr", students: 170 },
    { month: "May", students: 210 },
    { month: "Jun", students: 250 },
];

export default function StudentGrowthChart() {
    return (
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/10">

            <h2 className="text-white text-xl font-bold mb-6">
                Student Growth
            </h2>

            <div className="h-80">

                <ResponsiveContainer width="100%" height="100%">

                    <AreaChart data={data}>

                        <XAxis dataKey="month" stroke="#94a3b8" />

                        <Tooltip />

                        <Area
                            type="monotone"
                            dataKey="students"
                            stroke="#3b82f6"
                            fill="#3b82f6"
                        />

                    </AreaChart>

                </ResponsiveContainer>

            </div>

        </div>
    );
}