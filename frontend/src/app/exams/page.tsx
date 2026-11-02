"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { ArrowUpRight, Plus, Search } from "lucide-react";

import ExamDialog from "../../components/exams/ExamDialog";
import { getExamClasses, getExamSummary, getExams, publishExam, saveExam } from "../../services/examService";
import { Exam, ExamClass, ExamPayload, ExamStatus, ExamSummary } from "../../types/exams";

const emptySummary: ExamSummary = { exam_count: 0, draft_count: 0, scheduled_count: 0, published_count: 0, result_count: 0 };
const statusLabel: Record<ExamStatus, string> = { DRAFT: "Draft", SCHEDULED: "Scheduled", PUBLISHED: "Published" };

function examDate(value: string) {
    return new Date(`${value}T12:00:00`).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

function errorMessage(error: unknown, fallback: string) {
    if (axios.isAxiosError(error) && error.response?.data && typeof error.response.data === "object") {
        const first = Object.values(error.response.data).flat().find((item) => typeof item === "string");
        if (typeof first === "string") return first;
    }
    return fallback;
}

export default function ExamsPage() {
    const [exams, setExams] = useState<Exam[]>([]);
    const [classes, setClasses] = useState<ExamClass[]>([]);
    const [summary, setSummary] = useState<ExamSummary>(emptySummary);
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState<ExamStatus | "all">("all");
    const [grade, setGrade] = useState("all");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [dialogError, setDialogError] = useState("");
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingExam, setEditingExam] = useState<Exam | null>(null);
    const [reload, setReload] = useState(0);

    useEffect(() => {
        let active = true;
        Promise.all([
            getExams({ q: search.trim(), status: status === "all" ? undefined : status, grade: grade === "all" ? undefined : grade }),
            getExamSummary(),
            getExamClasses(),
        ])
            .then(([examRows, totals, options]) => {
                if (!active) return;
                setExams(examRows);
                setSummary(totals);
                setClasses(options.classes);
                setError("");
            })
            .catch(() => { if (active) setError("Exams could not be loaded. Check your connection and try again."); })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [search, status, grade, reload]);

    async function handleSave(payload: ExamPayload) {
        setSaving(true);
        setDialogError("");
        try {
            await saveExam(payload, editingExam?.id);
            setDialogOpen(false);
            setEditingExam(null);
            setReload((value) => value + 1);
        } catch (saveError) {
            setDialogError(errorMessage(saveError, "Exam could not be saved."));
        } finally { setSaving(false); }
    }

    async function handlePublish(exam: Exam) {
        if (!window.confirm(`Publish results for ${exam.name}? Published marks are locked.`)) return;
        try {
            await publishExam(exam.id);
            setReload((value) => value + 1);
        } catch (publishError) {
            setError(errorMessage(publishError, "Exam could not be published."));
        }
    }

    const gradeOptions = Array.from(new Set(classes.map((item) => item.grade))).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    return (
        <main className="min-h-screen bg-transparent px-4 py-7 text-white sm:px-8">
            <div className="mx-auto max-w-7xl">
                <header className="mb-7 flex flex-wrap items-end justify-between gap-4">
                    <div><p className="mb-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">Assessment planning</p><h1 className="text-3xl font-semibold">Exams</h1><p className="mt-1 text-sm text-slate-400">Schedule assessments, enter class marks, and publish results</p></div>
                    <button type="button" onClick={() => { setEditingExam(null); setDialogError(""); setDialogOpen(true); }} className="inline-flex items-center gap-2 rounded bg-emerald-400 px-4 py-2.5 text-sm font-semibold text-[#10201b] hover:bg-emerald-300"><Plus size={16} /> Create exam</button>
                </header>

                <section aria-label="Exam summary" className="grid grid-cols-2 gap-4 border-y border-white/10 py-5 sm:grid-cols-3 xl:grid-cols-5">
                    <Metric label="Exams" value={summary.exam_count} /><Metric label="Drafts" value={summary.draft_count} /><Metric label="Scheduled" value={summary.scheduled_count} /><Metric label="Published" value={summary.published_count} /><Metric label="Marks entered" value={summary.result_count} />
                </section>

                <section aria-label="Exam list" className="mt-6 overflow-hidden rounded-lg border border-white/10 bg-white/[0.03]">
                    <div className="flex flex-col gap-3 border-b border-white/10 p-4 md:flex-row md:items-center md:justify-between"><div><h2 className="font-medium">Exam schedule</h2><p className="mt-0.5 text-xs text-slate-500">{exams.length} matching exams</p></div><div className="flex flex-wrap gap-2"><label className="flex min-w-0 items-center gap-2 rounded border border-white/15 bg-white/[0.03] px-3 text-slate-400 focus-within:border-emerald-400 sm:w-64"><Search size={16} /><input aria-label="Search exams" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name or class" className="min-w-0 flex-1 bg-transparent py-2.5 text-sm text-white outline-none placeholder:text-slate-500" /></label><label className="sr-only" htmlFor="exam-grade-filter">Filter by grade</label><select id="exam-grade-filter" value={grade} onChange={(event) => setGrade(event.target.value)} className="rounded border border-white/15 bg-[#18201f] px-3 py-2.5 text-sm text-white"><option value="all">All grades</option>{gradeOptions.map((item) => <option key={item} value={item}>Grade {item}</option>)}</select></div></div>
                    <div className="flex gap-1 overflow-x-auto border-b border-white/10 px-4 pt-3">{(["all", "DRAFT", "SCHEDULED", "PUBLISHED"] as const).map((item) => <button key={item} type="button" onClick={() => setStatus(item)} className={`whitespace-nowrap border-b-2 px-3 pb-3 text-sm ${status === item ? "border-emerald-400 text-white" : "border-transparent text-slate-500 hover:text-slate-200"}`}>{item === "all" ? "All exams" : statusLabel[item]}</button>)}</div>
                    {error && <div role="alert" className="flex items-center justify-between gap-3 border-b border-rose-400/20 bg-rose-400/5 px-4 py-3 text-sm text-rose-200"><span>{error}</span><button type="button" onClick={() => setReload((value) => value + 1)} className="underline">Retry</button></div>}
                    {loading ? <p className="px-4 py-14 text-center text-sm text-slate-400">Loading exams...</p> : <div className="overflow-x-auto"><table className="min-w-[950px] w-full text-left text-sm text-slate-200"><thead className="border-b border-white/10 text-xs uppercase tracking-wider text-slate-500"><tr><th className="px-4 py-3">Exam</th><th className="px-4 py-3">Class</th><th className="px-4 py-3">Date</th><th className="px-4 py-3">Term / year</th><th className="px-4 py-3">Marks</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Entries</th><th className="px-4 py-3 text-right">Actions</th></tr></thead><tbody>
                        {exams.length === 0 ? <tr><td colSpan={8} className="px-4 py-14 text-center text-slate-500">No exams match these filters.</td></tr> : exams.map((exam) => <tr key={exam.id} className="border-b border-white/[0.07]"><td className="px-4 py-3.5"><p className="font-medium text-white">{exam.name}</p>{exam.notes && <p className="mt-0.5 text-xs text-slate-500">{exam.notes}</p>}</td><td className="px-4 py-3.5">{exam.grade ? `${exam.grade} · ${exam.section}` : "Class not assigned"}</td><td className="px-4 py-3.5">{examDate(exam.exam_date)}</td><td className="px-4 py-3.5 text-slate-400">{termLabel(exam.term)} · {exam.academic_year || "—"}</td><td className="px-4 py-3.5">{exam.total_marks} <span className="text-xs text-slate-500">/ pass {exam.passing_marks}</span></td><td className="px-4 py-3.5"><StatusBadge status={exam.status} /></td><td className="px-4 py-3.5 tabular-nums">{exam.result_count}</td><td className="px-4 py-3.5"><div className="flex justify-end gap-2">{exam.status !== "PUBLISHED" && <Link href={`/results?exam=${exam.id}`} className="rounded border border-white/10 px-3 py-2 text-xs text-slate-300 hover:bg-white/5">Enter marks</Link>}<Link href={`/reports?exam=${exam.id}`} className="inline-flex items-center gap-1 rounded border border-white/10 px-3 py-2 text-xs text-slate-300 hover:bg-white/5">Report <ArrowUpRight size={13} /></Link>{exam.status !== "PUBLISHED" && <button type="button" onClick={() => void handlePublish(exam)} disabled={!exam.result_count} className="rounded border border-emerald-300/20 px-3 py-2 text-xs text-emerald-200 hover:bg-emerald-300/10 disabled:opacity-40">Publish</button>}{exam.status !== "PUBLISHED" && <button type="button" onClick={() => { setEditingExam(exam); setDialogError(""); setDialogOpen(true); }} title="Edit exam" className="rounded border border-white/10 px-3 py-2 text-xs text-slate-300 hover:bg-white/5">Edit</button>}</div></td></tr>)}
                    </tbody></table></div>}
                </section>
            </div>
            {dialogOpen && <ExamDialog exam={editingExam} classes={classes} saving={saving} error={dialogError} onClose={() => setDialogOpen(false)} onSubmit={(payload) => void handleSave(payload)} />}
        </main>
    );
}

function Metric({ label, value }: { label: string; value: number }) { return <div><p className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</p><p className="mt-1 text-2xl font-semibold tabular-nums text-white">{value}</p></div>; }
function StatusBadge({ status }: { status: ExamStatus }) { const color = status === "PUBLISHED" ? "bg-emerald-300/10 text-emerald-200" : status === "SCHEDULED" ? "bg-sky-300/10 text-sky-200" : "bg-amber-300/10 text-amber-100"; return <span className={`rounded px-2 py-1 text-xs font-medium ${color}`}>{statusLabel[status]}</span>; }
function termLabel(term: Exam["term"]) { return ({ TERM_1: "Term 1", TERM_2: "Term 2", TERM_3: "Term 3", MIDTERM: "Midterm", FINAL: "Final", OTHER: "Other" })[term]; }
