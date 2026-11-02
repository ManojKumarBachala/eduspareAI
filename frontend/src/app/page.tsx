"use client";

import { useEffect, useState } from "react";

import MainLayout from "../components/layout/MainLayout";
import DashboardHeader from "../components/dashboard/DashboardHeader";
import StatsGrid from "../components/dashboard/StatsGrid";
import StudentGrowthChart from "../components/dashboard/StudentGrowthChart";
import AttendanceChart from "../components/dashboard/AttendanceChart";
import QuickActions from "../components/dashboard/QuickActions";
import FeeChart from "../components/dashboard/FeeChart";
import UpdatesTicker from "../components/dashboard/UpdatesTicker";
import SocialPlatforms from "../components/dashboard/SocialPlatforms";
import { getDashboardStats } from "../services/dashboardService";

interface DashboardStats {
  total_students: number;
  total_teachers: number;
  total_books: number;
  total_vehicles: number;
}

export default function Home() {
  const [stats, setStats] = useState<DashboardStats>({
    total_students: 0,
    total_teachers: 0,
    total_books: 0,
    total_vehicles: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardStats()
      .then((data) => {
        setStats({
          total_students: data.total_students ?? 0,
          total_teachers: data.total_teachers ?? 0,
          total_books: data.total_books ?? 0,
          total_vehicles: data.total_vehicles ?? 0,
        });

        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    <MainLayout>
      <DashboardHeader />
      <UpdatesTicker />

      {loading ? (
        <div className="text-center text-white py-20 text-xl">
          Loading Dashboard...
        </div>
      ) : (
        <>
          <StatsGrid stats={stats} />

          <div className="grid lg:grid-cols-2 gap-6 mt-8">
            <StudentGrowthChart />
            <AttendanceChart />
          </div>

          <div className="mt-8">
            <FeeChart />
          </div>

          <div className="mt-8">
            <QuickActions />
          </div>

          <SocialPlatforms />
        </>
      )}
    </MainLayout>
  );
}
