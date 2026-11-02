"use client";

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

const data = [
    { month: "Jan", students: 20 },
    { month: "Feb", students: 35 },
    { month: "Mar", students: 50 },
    { month: "Apr", students: 60 },
    { month: "May", students: 80 },
];

export default function StudentAnalytics() {
    return (
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6">
            <h2 className="text-white text-xl font-bold mb-4">
                Student Growth
            </h2>

            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data}>
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line
                        type="monotone"
                        dataKey="students"
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}