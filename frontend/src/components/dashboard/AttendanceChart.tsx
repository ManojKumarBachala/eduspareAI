"use client";

import {
    LineChart,
    Line,
    ResponsiveContainer,
    XAxis,
    Tooltip,
} from "recharts";

const data = [
    { day: "Mon", attendance: 90 },
    { day: "Tue", attendance: 94 },
    { day: "Wed", attendance: 91 },
    { day: "Thu", attendance: 96 },
    { day: "Fri", attendance: 93 },
];

export default function AttendanceChart() {
    return (
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/10">

            <h2 className="text-white text-xl font-bold mb-6">
                Attendance
            </h2>

            <div className="h-80">

                <ResponsiveContainer width="100%" height="100%">

                    <LineChart data={data}>

                        <XAxis dataKey="day" stroke="#94a3b8" />

                        <Tooltip />

                        <Line
                            type="monotone"
                            dataKey="attendance"
                            stroke="#22c55e"
                            strokeWidth={3}
                        />

                    </LineChart>

                </ResponsiveContainer>

            </div>

        </div>
    );
}