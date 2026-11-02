"use client";

import { useState } from "react";
import api from "../../services/api";
import Image from "next/image";

export default function LoginPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    const handleLogin = async () => {
        try {
            const res = await api.post("token/", {
                username,
                password,
            });

            localStorage.setItem("access_token", res.data.access);
            window.location.href = "/";
        } catch (error) {
            setErrorMessage("Invalid username or password");
            console.error(error);
        }
    };

    return (
        <div
            className="min-h-screen flex items-center justify-center"
        >
            <div className="relative z-10 w-full max-w-md">
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl p-8">

                    <div className="text-center mb-6">
                        <Image
                            src="/images/logo.png"
                            alt="School Logo"
                            width={100}
                            height={100}
                            className="mx-auto rounded-full"
                        />

                        <h1 className="text-3xl font-bold text-white mt-4">
                            New Little Flower EM School
                        </h1>

                        <p className="text-slate-300">
                            School management portal · Wyra
                        </p>
                    </div>

                    {errorMessage && (
                        <div className="mb-4 rounded-xl bg-red-500/80 p-3 text-white">
                            {errorMessage}
                        </div>
                    )}

                    <div className="space-y-4">
                        <input
                            type="text"
                            placeholder="Username"
                            className="w-full p-3 rounded-xl bg-white/20 text-white placeholder-gray-300 outline-none"
                            value={username}
                            onChange={(e) =>
                                setUsername(e.target.value)
                            }
                        />

                        <input
                            type="password"
                            placeholder="Password"
                            className="w-full p-3 rounded-xl bg-white/20 text-white placeholder-gray-300 outline-none"
                            value={password}
                            onChange={(e) =>
                                setPassword(e.target.value)
                            }
                        />

                        <button
                            onClick={handleLogin}
                            className="
                w-full
                bg-blue-600
                hover:bg-blue-700
                transition
                p-3
                rounded-xl
                text-white
                font-semibold
              "
                        >
                            Login
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}
