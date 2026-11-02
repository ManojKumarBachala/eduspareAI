"use client";

const activities = [
    "👨‍🎓 New student admitted",
    "💰 Fee payment received",
    "📚 Book issued",
    "📝 Exam scheduled",
    "🚌 Vehicle assigned",
];

export default function RecentActivity() {
    return (
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/10 p-6">
            <h2 className="text-xl font-bold text-white mb-6">
                Recent Activity
            </h2>

            <div className="space-y-4">
                {activities.map((item, index) => (
                    <div
                        key={index}
                        className="border-b border-white/10 pb-3 text-slate-300"
                    >
                        {item}
                    </div>
                ))}
            </div>
        </div>
    );
}