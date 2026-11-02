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
    { month: "Jan", attendance: 92 },
    { month: "Feb", attendance: 94 },
    { month: "Mar", attendance: 96 },
    { month: "Apr", attendance: 95 },
    { month: "May", attendance: 98 },
];

export default function AttendanceChart() {
    return (
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6">
            <h2 className="text-white text-xl font-bold mb-4">
                Attendance Analytics
            </h2>

            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data}>
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line
                        type="monotone"
                        dataKey="attendance"
                        stroke="#3b82f6"
                        strokeWidth={3}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}