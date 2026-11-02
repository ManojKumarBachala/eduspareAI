"use client";

import {
    GraduationCap,
    Users,
    Bus,
    BookOpen,
} from "lucide-react";

import StatCard from "./StatCard";

interface Props {
    stats: {
        total_students: number;
        total_teachers: number;
        total_books: number;
        total_vehicles: number;
    };
}

export default function StatsGrid({
    stats,
}: Props) {
    return (
        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6">

            <StatCard
                title="Students"
                value={stats.total_students}
                icon={<GraduationCap className="text-white" />}
                color="bg-blue-600"
            />

            <StatCard
                title="Teachers"
                value={stats.total_teachers}
                icon={<Users className="text-white" />}
                color="bg-green-600"
            />

            <StatCard
                title="Books"
                value={stats.total_books}
                icon={<BookOpen className="text-white" />}
                color="bg-purple-600"
            />

            <StatCard
                title="Vehicles"
                value={stats.total_vehicles}
                icon={<Bus className="text-white" />}
                color="bg-orange-600"
            />

        </div>
    );
}