"use client";
/* This effect synchronizes debounced search input with async result state. */
/* eslint-disable react-hooks/set-state-in-effect */

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { LoaderCircle, Search } from "lucide-react";
import { getExams } from "../../services/examService";
import { getFees } from "../../services/feeService";
import { getStudents } from "../../services/studentService";
import { getTeachers } from "../../services/teacherService";

type SearchResult = { title: string; detail: string; href: string; category: string };

const pageIndex: SearchResult[] = [
    ["Students", "Enrollment, class placement, and student accounts", "/students", "Directory"],
    ["Teachers", "Staff directory and subject assignments", "/teachers", "Directory"],
    ["Attendance", "Daily registers and attendance reports", "/attendance", "Academics"],
    ["Timetable", "Class schedules and teacher assignments", "/timetable", "Academics"],
    ["Exams", "Assessment planning and marks", "/exams", "Academics"],
    ["Results", "Exam marks and student performance", "/results", "Academics"],
    ["Fees", "Charges, payments, and receipts", "/fees", "Finance"],
    ["Library", "Books and issue records", "/library", "Operations"],
    ["Transport", "Vehicles, routes, and assignments", "/transport", "Operations"],
    ["Reports", "Performance reports and exports", "/reports", "Insights"],
    ["Gallery", "Life and moments at New Little Flower EM School", "/gallery", "School"],
    ["Careers", "Join the New Little Flower community", "/careers", "School"],
].map(([title, detail, href, category]) => ({ title, detail, href, category }));

export default function GlobalSearch() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const records = useRef<Promise<SearchResult[]> | null>(null);

    const loadRecords = useCallback(() => {
        if (!records.current) {
            records.current = Promise.allSettled([
                getStudents(),
                getTeachers(),
                getExams(),
                getFees({ status: "all", grade: "all", category: "all", q: "" }),
            ]).then(([students, teachers, exams, fees]) => [
                ...(students.status === "fulfilled" ? students.value.map((item) => ({ title: item.name, detail: `${item.admission_no} · Grade ${item.grade}-${item.section}`, href: "/students", category: "Student" })) : []),
                ...(teachers.status === "fulfilled" ? teachers.value.map((item) => ({ title: item.name, detail: item.subject, href: "/teachers", category: "Teacher" })) : []),
                ...(exams.status === "fulfilled" ? exams.value.map((item) => ({ title: item.name, detail: `${item.grade ? `Grade ${item.grade}-${item.section}` : "School exam"} · ${item.status}`, href: "/exams", category: "Exam" })) : []),
                ...(fees.status === "fulfilled" ? fees.value.map((item) => ({ title: item.title, detail: `${item.student_name} · ${item.status}`, href: "/fees", category: "Fee" })) : []),
            ]);
        }
        return records.current;
    }, []);

    useEffect(() => {
        const normalized = query.trim().toLocaleLowerCase();
        if (!normalized) {
            setResults([]);
            setLoading(false);
            return;
        }
        const timer = window.setTimeout(() => {
            const matches = (item: SearchResult) => `${item.title} ${item.detail} ${item.category}`.toLocaleLowerCase().includes(normalized);
            setResults(pageIndex.filter(matches).slice(0, 6));
            setLoading(true);
            loadRecords().then((items) => setResults([...pageIndex.filter(matches), ...items.filter(matches)].slice(0, 8))).finally(() => setLoading(false));
        }, 220);
        return () => window.clearTimeout(timer);
    }, [loadRecords, query]);

    return <div className="relative w-full lg:w-96"><Search size={18} className="pointer-events-none absolute left-3 top-3 text-slate-400" /><input aria-label="Search all school information" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search all school information" className="w-full rounded-xl border border-white/10 bg-white/10 py-2 pl-10 pr-4 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />{query.trim() && <div className="absolute left-0 right-0 top-12 z-50 overflow-hidden rounded-2xl border border-white/10 bg-[#111d26] shadow-2xl shadow-black/40">{loading && <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3 text-xs text-slate-400"><LoaderCircle size={14} className="animate-spin" /> Searching records and pages…</div>}{results.length ? <div className="max-h-80 overflow-y-auto py-1">{results.map((result, index) => <Link key={`${result.href}-${result.title}-${index}`} href={result.href} onClick={() => setQuery("")} className="block px-4 py-3 transition hover:bg-white/10"><div className="flex items-center justify-between gap-3"><p className="text-sm font-medium text-white">{result.title}</p><span className="text-[10px] uppercase tracking-wider text-emerald-300">{result.category}</span></div><p className="mt-1 truncate text-xs text-slate-400">{result.detail}</p></Link>)}</div> : !loading && <p className="px-4 py-5 text-sm text-slate-400">No matching school information found.</p>}</div>}</div>;
}
