"use client";
import NotificationBell from "./NotificationBell";
import Image from "next/image";
export default function Navbar() {
    return (
        <div className="
      h-20
      bg-white/10
      backdrop-blur-xl
      border-b border-white/10
      flex
      items-center
      justify-between
      px-8
    ">
            <div>
                <h1 className="text-white text-2xl font-bold">
                    EduSphere AI
                </h1>

                <p className="text-slate-300 text-sm">
                    Smart School ERP
                </p>
            </div>

            <div className="flex items-center gap-6">
                <NotificationBell />
                <button className="text-2xl">
                    📧
                </button>

                <div className="flex items-center gap-3">
                    <Image
                        src="/images/logo.png"
                        alt="Profile"
                        width={40}
                        height={40}
                        loading="eager"
                        className="w-10 h-10 rounded-full"
                    />

                    <div>
                        <p className="text-white font-semibold">
                            Admin
                        </p>

                        <p className="text-slate-400 text-sm">
                            Administrator
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
