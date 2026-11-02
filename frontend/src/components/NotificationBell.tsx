"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Bell, BookOpen, CalendarDays, CheckCheck, CircleAlert, CircleDollarSign, GraduationCap, Mail, Trash2, Users, X } from "lucide-react";

type Kind = "academic" | "finance" | "library" | "attendance" | "admission" | "mail";
type Notice = { id: number; title: string; message: string; time: string; kind: Kind; priority: "high" | "normal"; read: boolean };

const initialNotifications: Notice[] = [
    { id: 0, title: "New message in school inbox", message: "A parent has contacted New Little Flower EM School by email.", time: "Just now", kind: "mail", priority: "high", read: false },
    { id: 1, title: "Parent meeting tomorrow", message: "Class 10 parent-teacher meeting begins at 10:00 AM.", time: "10 min ago", kind: "academic", priority: "high", read: false },
    { id: 2, title: "Fee payments due", message: "18 fee payments remain outstanding for October.", time: "45 min ago", kind: "finance", priority: "high", read: false },
    { id: 3, title: "Library return reminder", message: "Six books are due back tomorrow.", time: "2 hr ago", kind: "library", priority: "normal", read: false },
    { id: 4, title: "Attendance report ready", message: "Today’s school-wide attendance report has been generated.", time: "4 hr ago", kind: "attendance", priority: "normal", read: true },
    { id: 5, title: "New student registered", message: "A new Class 6 student profile is ready for review.", time: "Yesterday", kind: "admission", priority: "normal", read: true },
];

const notificationStyles = {
    academic: [GraduationCap, "bg-violet-400/15 text-violet-200"], finance: [CircleDollarSign, "bg-amber-400/15 text-amber-200"],
    library: [BookOpen, "bg-sky-400/15 text-sky-200"], attendance: [CalendarDays, "bg-emerald-400/15 text-emerald-200"], admission: [Users, "bg-pink-400/15 text-pink-200"],
    mail: [Mail, "bg-cyan-400/15 text-cyan-200"],
} as const;

export default function NotificationBell() {
    const [isOpen, setIsOpen] = useState(false);
    const [filter, setFilter] = useState<"all" | "unread">("all");
    const [notifications, setNotifications] = useState(initialNotifications);
    const panelRef = useRef<HTMLDivElement>(null);
    const unreadCount = notifications.filter((item) => !item.read).length;
    const visible = useMemo(() => notifications.filter((item) => filter === "all" || !item.read), [filter, notifications]);

    useEffect(() => {
        const closeOutside = (event: MouseEvent) => { if (panelRef.current && !panelRef.current.contains(event.target as Node)) setIsOpen(false); };
        const closeEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setIsOpen(false); };
        document.addEventListener("mousedown", closeOutside); document.addEventListener("keydown", closeEscape);
        return () => { document.removeEventListener("mousedown", closeOutside); document.removeEventListener("keydown", closeEscape); };
    }, []);

    const markRead = (id: number) => setNotifications((items) => items.map((item) => item.id === id ? { ...item, read: true } : item));
    const markAllRead = () => setNotifications((items) => items.map((item) => ({ ...item, read: true })));
    const dismiss = (id: number) => setNotifications((items) => items.filter((item) => item.id !== id));

    return <div ref={panelRef} className="relative">
        <button type="button" onClick={() => setIsOpen((open) => !open)} aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`} aria-expanded={isOpen} className="relative rounded-xl bg-white/10 p-3 text-white transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-emerald-300/70">
            <Bell size={20} />
            {unreadCount > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-[#101615] bg-rose-500 px-1 text-[10px] font-bold">{unreadCount}</span>}
        </button>
        {isOpen && <section aria-label="Notification center" className="absolute right-0 z-50 mt-3 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-white/10 bg-slate-950/95 text-white shadow-2xl backdrop-blur-xl">
            <header className="border-b border-white/10 px-4 pb-3 pt-4"><div className="flex items-start justify-between gap-3"><div><div className="flex items-center gap-2"><h2 className="font-semibold">Notifications</h2>{unreadCount > 0 && <span className="rounded-full bg-emerald-400/15 px-2 py-0.5 text-xs font-medium text-emerald-200">{unreadCount} new</span>}</div><p className="mt-1 text-xs text-slate-400">Stay on top of your school activity</p></div><button type="button" onClick={() => setIsOpen(false)} aria-label="Close notifications" className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white"><X size={18} /></button></div>
                <div className="mt-4 flex items-center justify-between gap-3"><div className="flex rounded-lg bg-white/5 p-1 text-xs">{(["all", "unread"] as const).map((option) => <button key={option} type="button" onClick={() => setFilter(option)} className={`rounded-md px-3 py-1.5 capitalize transition ${filter === option ? "bg-white/10 text-white shadow-sm" : "text-slate-400 hover:text-white"}`}>{option}{option === "unread" && unreadCount ? ` (${unreadCount})` : ""}</button>)}</div>{unreadCount > 0 && <button type="button" onClick={markAllRead} className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-200 hover:text-emerald-100"><CheckCheck size={15} /> Mark all read</button>}</div>
            </header>
            <div className="max-h-[26rem] overflow-y-auto p-2">{visible.length === 0 ? <div className="px-5 py-12 text-center"><CheckCheck className="mx-auto mb-3 text-emerald-300" size={30} /><p className="text-sm font-medium">You’re all caught up</p><p className="mt-1 text-xs text-slate-400">There are no {filter === "unread" ? "unread " : ""}notifications.</p></div> : visible.map((notification) => { const [Icon, iconStyle] = notificationStyles[notification.kind]; return <article key={notification.id} className={`group relative flex gap-3 rounded-xl p-3 transition hover:bg-white/[0.06] ${notification.read ? "opacity-75" : "bg-white/[0.035]"}`}><div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${iconStyle}`}><Icon size={18} /></div><button type="button" onClick={() => markRead(notification.id)} className="min-w-0 flex-1 text-left" aria-label={`Mark ${notification.title} as read`}><div className="flex items-start gap-2"><p className="line-clamp-1 text-sm font-medium text-white">{notification.title}</p>{notification.priority === "high" && <CircleAlert className="mt-0.5 shrink-0 text-rose-300" size={14} aria-label="High priority" />}</div><p className="mt-0.5 line-clamp-2 text-xs leading-5 text-slate-400">{notification.message}</p><p className="mt-1.5 text-[11px] text-slate-500">{notification.time}</p></button><button type="button" onClick={() => dismiss(notification.id)} aria-label={`Dismiss ${notification.title}`} className="absolute right-2 top-2 hidden rounded-md p-1.5 text-slate-500 hover:bg-white/10 hover:text-white group-hover:block focus:block"><Trash2 size={14} /></button>{!notification.read && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-emerald-300" aria-label="Unread" />}</article>; })}</div>
            <footer className="flex items-center justify-between gap-3 border-t border-white/10 px-4 py-3"><a href="mailto:newlittleflower1@gmail.com" className="inline-flex min-w-0 items-center gap-1.5 text-xs font-medium text-cyan-200 transition hover:text-cyan-100"><Mail size={14} /><span className="truncate">School inbox</span></a><button type="button" onClick={() => setNotifications([])} className="inline-flex shrink-0 items-center gap-1.5 text-xs text-slate-400 hover:text-white"><Trash2 size={14} /> Clear all</button></footer>
        </section>}
    </div>;
}
