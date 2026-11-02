"use client";

const notifications = [
    "🔔 Parent meeting on Friday",
    "📢 Mid-term exams start next week",
    "💡 Library books due tomorrow",
];

export default function NotificationPanel() {
    return (
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/10 p-6">
            <h2 className="text-xl font-bold text-white mb-6">
                Notifications
            </h2>

            <ul className="space-y-3 text-slate-300">
                {notifications.map((item, index) => (
                    <li key={index}>{item}</li>
                ))}
            </ul>
        </div>
    );
}