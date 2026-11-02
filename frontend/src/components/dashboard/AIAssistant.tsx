"use client";

export default function AIAssistant() {
    return (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-6 text-white">
            <h2 className="text-2xl font-bold mb-3">
                🤖 EduSphere AI
            </h2>

            <p className="text-blue-100 mb-4">
                Ask questions about attendance, fees, students, or generate reports.
            </p>

            <input
                type="text"
                placeholder="Ask EduSphere AI..."
                className="w-full rounded-xl p-3 text-black outline-none"
            />

            <button className="mt-4 bg-white text-blue-700 px-6 py-3 rounded-xl font-semibold hover:bg-blue-100 transition">
                Ask AI
            </button>
        </div>
    );
}