"use client";

import { Plus } from "lucide-react";
import { FaFacebookF, FaInstagram, FaLinkedinIn, FaWhatsapp, FaXTwitter, FaYoutube } from "react-icons/fa6";

const platforms = [
    { name: "Facebook", icon: FaFacebookF, color: "bg-[#1877f2]", href: "#" },
    { name: "Instagram", icon: FaInstagram, color: "bg-gradient-to-br from-[#f58529] via-[#dd2a7b] to-[#8134af]", href: "#" },
    { name: "YouTube", icon: FaYoutube, color: "bg-[#ff0000]", href: "#" },
    { name: "WhatsApp", icon: FaWhatsapp, color: "bg-[#25d366]", href: "#" },
    { name: "LinkedIn", icon: FaLinkedinIn, color: "bg-[#0a66c2]", href: "#" },
    { name: "X", icon: FaXTwitter, color: "bg-[#111111]", href: "#" },
];

export default function SocialPlatforms() {
    return (
        <section aria-label="Social media platforms" className="mt-8 rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur-xl">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div><h2 className="text-xl font-bold text-white">Social platforms</h2><p className="mt-1 text-sm text-slate-400">Add New Little Flower EM School’s official channels.</p></div>
                <button type="button" className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/15"><Plus size={16} /> Add platform</button>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:thin]">
                {platforms.map(({ name, icon: Icon, color, href }) => (
                    <a key={name} href={href} aria-label={name} className="group flex min-w-[108px] shrink-0 flex-col items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/25 p-3 transition hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/10">
                        <span className={`flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-lg ${color}`}><Icon size={18} /></span>
                        <span className="text-xs font-medium text-slate-300 group-hover:text-white">{name}</span>
                    </a>
                ))}
            </div>
        </section>
    );
}
