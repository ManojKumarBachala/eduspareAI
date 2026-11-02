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
    { day: "Mon", attendance: 90 },
    { day: "Tue", attendance: 92 },
    { day: "Wed", attendance: 95 },
    { day: "Thu", attendance: 88 },
    { day: "Fri", attendance: 96 },
];

export default function AttendanceTrend() {
    return (
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6">
            <h2 className="text-white text-xl font-bold mb-4">
                Attendance Trend
            </h2>

            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data}>
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Line
                        type="monotone"
                        dataKey="attendance"
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}