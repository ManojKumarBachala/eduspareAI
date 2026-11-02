import Link from "next/link";
import { ArrowUpRight, Clock3, Mail, MapPin, Phone } from "lucide-react";
import { FaFacebookF, FaInstagram, FaLinkedinIn, FaYoutube } from "react-icons/fa6";

const quickLinks = [
    ["Dashboard", "/"], ["Students", "/students"], ["Teachers", "/teachers"],
    ["Attendance", "/attendance"], ["Exams & results", "/exams"],
    ["Gallery", "/gallery"], ["Careers", "/careers"], ["Contact school", "#school-contact"],
] as const;

const socialLinks = [
    { name: "Facebook", icon: FaFacebookF }, { name: "Instagram", icon: FaInstagram },
    { name: "YouTube", icon: FaYoutube }, { name: "LinkedIn", icon: FaLinkedinIn },
];

export default function SiteFooter() {
    return (
        <footer className="border-t border-white/10 bg-[#081218]/95 text-slate-300">
            <div className="mx-auto grid max-w-7xl items-start gap-x-10 gap-y-10 px-5 py-12 sm:px-8 md:grid-cols-2 lg:grid-cols-[1.25fr_1fr_1fr_0.9fr]">
                <div>
                    <div className="mb-4 flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400 text-sm font-bold text-[#082019]">NLF</span><div><p className="font-semibold text-white">New Little Flower EM School</p><p className="text-xs text-slate-500">Wyra · Khammam · Telangana</p></div></div>
                    <p className="max-w-sm text-sm leading-6 text-slate-400">We nurture independent thinkers through activity-based learning, discipline, strong values, and an education rooted in care.</p>
                    <div className="mt-5 flex items-center gap-2">{socialLinks.map(({ name, icon: Icon }) => <a key={name} aria-label={name} href="https://www.newlittleflowersschools.com/" target="_blank" rel="noreferrer" className="rounded-lg border border-white/10 p-2.5 text-slate-400 transition hover:border-white/25 hover:text-white"><Icon size={15} /></a>)}</div>
                </div>

                <div id="school-contact">
                    <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">School leadership</p>
                    <div className="space-y-4"><div><p className="text-sm font-semibold text-white">Principal</p><p className="mt-1 text-sm text-slate-400">Mr. Pothineni Bhumeswara Rao</p><a href="tel:+918297099952" className="mt-1 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-emerald-200"><Phone size={14} /> +91 82970 99952</a></div><div><p className="text-sm font-semibold text-white">School office</p><a href="mailto:newlittleflower1@gmail.com" className="mt-1 inline-flex max-w-full items-center gap-2 break-all text-sm text-slate-400 hover:text-emerald-200"><Mail size={14} /> newlittleflower1@gmail.com</a></div></div>
                </div>

                <div>
                    <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">Reach us</p>
                    <div className="space-y-3 text-sm text-slate-400"><p className="flex gap-2"><MapPin className="mt-0.5 shrink-0 text-slate-500" size={15} /> 7-427/C, Lions Vidya Nagar, Wyra, Khammam, Telangana – 507165</p><p className="flex gap-2"><Clock3 className="mt-0.5 shrink-0 text-slate-500" size={15} /> School office · Monday–Saturday</p><a href="mailto:newlittleflower1@gmail.com" className="flex items-center gap-2 hover:text-emerald-200"><Mail size={15} /> newlittleflower1@gmail.com</a></div>
                </div>

                <div>
                    <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">Quick links</p>
                    <nav aria-label="Footer links" className="grid gap-2.5 text-sm">{quickLinks.map(([label, href]) => href.startsWith("/") ? <Link key={label} href={href} className="group flex items-center justify-between text-slate-400 hover:text-white"><span>{label}</span><ArrowUpRight size={14} className="opacity-0 transition group-hover:opacity-100" /></Link> : <a key={label} href={href} className="group flex items-center justify-between text-slate-400 hover:text-white"><span>{label}</span><ArrowUpRight size={14} className="opacity-0 transition group-hover:opacity-100" /></a>)}</nav>
                </div>
            </div>

            <div className="border-t border-white/10"><div className="mx-auto grid max-w-7xl gap-6 px-5 py-8 sm:px-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-center"><div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">Find our campus</p><h2 className="mt-2 text-lg font-semibold text-white">Visit New Little Flower EM School</h2><p className="mt-1 max-w-md text-sm leading-6 text-slate-400">7-427/C, Lions Vidya Nagar, Wyra, Khammam, Telangana – 507165.</p><a href="https://www.google.com/maps/search/?api=1&query=New+Little+Flower+EM+School+Wyra+Telangana+507165" target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-400 px-4 py-2.5 text-sm font-semibold text-[#082019] transition hover:bg-emerald-300"><MapPin size={15} /> Open in Google Maps</a></div><div className="h-56 min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-lg"><iframe title="New Little Flower EM School location map" src="https://www.google.com/maps?q=New%20Little%20Flower%20EM%20School%2C%20Wyra%2C%20Telangana%20507165&output=embed" loading="lazy" className="h-full w-full border-0" /></div></div></div>
            <div className="border-t border-white/10"><div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-8"><p>© {new Date().getFullYear()} New Little Flower EM School. All rights reserved.</p><p>Empowering Education Since 1990 · Privacy · Terms</p></div></div>
        </footer>
    );
}
