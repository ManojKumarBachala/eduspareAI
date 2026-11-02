"use client";

export default function ProfilePage() {
    return (
        <div className="p-8">
            <h1 className="text-4xl font-bold text-white mb-8">
                My Profile
            </h1>

            <div className="
        bg-white/10
        backdrop-blur-xl
        rounded-3xl
        p-6
        text-white
      ">
                <p>Name: Admin</p>
                <p>Role: Administrator</p>
                <p>Email: admin@example.com</p>
            </div>
        </div>
    );
}