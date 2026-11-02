"use client";

import Link from "next/link";
import Image from "next/image";

import { logout } from "../lib/auth";

export default function Sidebar() {
    return (
        <aside
            className="
      w-72
      min-h-screen
      bg-slate-950/90
      backdrop-blur-xl
      border-r
      border-slate-800
      text-white
      p-6
      flex
      flex-col
    "
        >
            <div>
                <div className="text-center">
                    <Image
                        src="/images/logo.png"
                        alt="School Logo"
                        width={100}
                        height={100}
                        className="mx-auto rounded-full"
                    />

                    <h2 className="mt-4 font-bold text-xl">
                        New Little Flower School
                    </h2>

                    <p className="text-slate-400 text-sm">
                        EduSphere AI
                    </p>
                </div>

                <nav className="mt-10 space-y-2">
                    <Link
                        href="/"
                        className="block p-3 rounded-xl hover:bg-blue-600 transition"
                    >
                        Dashboard
                    </Link>
                    <Link
                        href="/profile"
                        className="block p-3 rounded-xl hover:bg-blue-600"
                    >
                        Profile
                    </Link>

                    <Link
                        href="/students"
                        className="block p-3 rounded-xl hover:bg-blue-600 transition"
                    >
                        Students
                    </Link>

                    <Link
                        href="/teachers"
                        className="block p-3 rounded-xl hover:bg-blue-600 transition"
                    >
                        Teachers
                    </Link>

                    <Link
                        href="/attendance"
                        className="block p-3 rounded-xl hover:bg-blue-600 transition"
                    >
                        Attendance
                    </Link>

                    <Link
                        href="/exams"
                        className="block p-3 rounded-xl hover:bg-blue-600 transition"
                    >
                        Exams
                    </Link>
                    <Link
                        href="/fees"
                        className="block p-3 rounded-xl hover:bg-blue-600 transition"
                    >
                        Fees
                    </Link>
                    <Link
                        href="/library"
                        className="block p-3 rounded-xl hover:bg-blue-600"
                    >
                        Library
                    </Link>
                    <Link
                        href="/results"
                        className="block p-3 rounded-xl hover:bg-blue-600 transition"
                    >
                        Results
                    </Link>
                    <Link
                        href="/transport"
                        className="block hover:text-blue-400"
                    >
                        Transport
                    </Link>
                </nav>
            </div>

            <div className="mt-auto">
                <button
                    onClick={logout}
                    className="
            w-full
            bg-red-600
            hover:bg-red-700
            transition
            p-3
            rounded-xl
            font-semibold
          "
                >
                    Logout
                </button>
            </div>
        </aside>
    );
}