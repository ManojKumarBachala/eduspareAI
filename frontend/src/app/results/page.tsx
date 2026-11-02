"use client";
/* The effects below synchronize async API requests with view state. */
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { ArrowUpRight, Download, Search } from "lucide-react";

import MarksEntryDialog from "../../components/exams/MarksEntryDialog";
import { getExamRoster, getExams, getResults, saveExamMarks } from "../../services/examService";
import { Exam, ExamResult, ExamRoster } from "../../types/exams";

function moneyDate(value: string) {
    return new Date(`${value}T12:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function apiError(error: unknown, fallback: string) {
    if (axios.isAxiosError(error) && error.response?.data && typeof error.response.data === "object") {
        const message = Object.values(error.response.data).flat().find((item) => typeof item === "string");
        if (typeof message === "string") return message;
    }
    return fallback;
}

function csvCell(value: string | number) {
    return `"${String(value).replaceAll('"', '""')}"`;
}

export default function ResultsPage() {
    const [exams, setExams] = useState<Exam[]>([]);
    const [results, setResults] = useState<ExamResult[]>([]);
    const [examId, setExamId] = useState("");
    const [grade, setGrade] = useState("all");
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [dialogError, setDialogError] = useState("");
    const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
    const [roster, setRoster] = useState<ExamRoster | null>(null);
    const [reload, setReload] = useState(0);

    useEffect(() => {
        let active = true;
        getExams()
            .then((rows) => {
                if (!active) return;
                setExams(rows);
                const requestedExam = new URLSearchParams(window.location.search).get("exam");
                const firstExam = requestedExam && rows.some((row) => String(row.id) === requestedExam)
                    ? requestedExam
                    : rows[0] ? String(rows[0].id) : "";
                setExamId(firstExam);
            })
            .catch(() => { if (active) setError("Exam list could not be loaded."); });
        return () => { active = false; };
    }, []);

    useEffect(() => {
        let active = true;
        setLoading(true);
        setError("");
        getResults({ exam: examId || undefined, grade: grade === "all" ? undefined : grade, q: query.trim() || undefined })
            .then((rows) => { if (active) setResults(rows); })
            .catch(() => { if (active) setError("Results could not be loaded. Check your connection and try again."); })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [examId, grade, query, reload]);

    const selectedExamRow = exams.find((exam) => String(exam.id) === examId) ?? null;
    const gradeOptions = Array.from(new Set(exams.filter((exam) => !examId || String(exam.id) === examId).map((exam) => exam.grade).filter(Boolean)))
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    const average = results.length ? results.reduce((sum, result) => sum + result.percentage, 0) / results.length : 0;
    const passRate = results.length ? results.filter((result) => result.grade !== "F").length * 100 / results.length : 0;

    async function openMarks(exam: Exam) {
        setSaving(true);
        setDialogError("");
        try {
            setRoster(await getExamRoster(exam.id));
            setSelectedExam(exam);
        } catch (requestError) {
            setError(apiError(requestError, "Exam roster could not be loaded."));
        } finally { setSaving(false); }
    }

    async function handleSaveMarks(records: { student: number; subject: string; marks: number; remarks: string }[]) {
        if (!selectedExam) return;
        setSaving(true);
        setDialogError("");
        try {
            await saveExamMarks(selectedExam.id, records);
            setSelectedExam(null);
            setRoster(null);
            setReload((value) => value + 1);
        } catch (saveError) {
            setDialogError(apiError(saveError, "Marks could not be saved. Verify all scores are within the exam maximum."));
        } finally { setSaving(false); }
    }

    function downloadCsv() {
        const rows = [
            ["Exam", "Student", "Admission no.", "Class", "Subject", "Marks", "Maximum", "Percentage", "Grade", "Remarks"],
            ...results.map((result) => [
                result.exam_name,
                result.student_name,
                result.student_admission_no,
                `${result.exam}`,
                result.subject,
                result.marks,
                result.total_marks,
                `${result.percentage}%`,
                result.grade,
                result.remarks,
            ]),
        ];
        const content = rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
        const url = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8" }));
        const link = document.createElement("a");
        link.href = url;
        link.download = "exam-results.csv";
        link.click();
        URL.revokeObjectURL(url);
    }

    return (
        <main className="min-h-screen bg-transparent px-4 py-7 text-white sm:px-8">
            <div className="mx-auto max-w-7xl">
                <header className="mb-7 flex flex-wrap items-end justify-between gap-4">
                    <div><p className="mb-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">Academic performance</p><h1 className="text-3xl font-semibold">Results</h1><p className="mt-1 text-sm text-slate-400">Review marks, grades, and class performance</p></div>
                    <div className="flex flex-wrap gap-2">
                        {selectedExamRow?.status !== "PUBLISHED" && selectedExamRow && <button type="button" disabled={saving} onClick={() => void openMarks(selectedExamRow)} className="rounded bg-emerald-400 px-4 py-2.5 text-sm font-semibold text-[#10201b] hover:bg-emerald-300 disabled:opacity-50">Enter marks</button>}
                        <button type="button" onClick={downloadCsv} disabled={!results.length} className="inline-flex items-center gap-2 rounded border border-white/15 px-3 py-2.5 text-sm text-slate-200 hover:bg-white/5 disabled:opacity-40"><Download size={16} /> Export CSV</button>
                    </div>
                </header>

                <section aria-label="Result filters" className="flex flex-wrap items-end gap-3 border-y border-white/10 py-4">
                    <label><span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-500">Exam</span><select value={examId} onChange={(event) => { setExamId(event.target.value); setGrade("all"); }} className="min-w-64 rounded border border-white/15 bg-[#18201f] px-3 py-2.5 text-sm text-white"><option value="">All exams</option>{exams.map((exam) => <option key={exam.id} value={exam.id}>{exam.name} · {exam.grade || "Unassigned"} · {moneyDate(exam.exam_date)}</option>)}</select></label>
                    <label><span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-500">Grade</span><select value={grade} onChange={(event) => setGrade(event.target.value)} className="rounded border border-white/15 bg-[#18201f] px-3 py-2.5 text-sm text-white"><option value="all">All grades</option>{gradeOptions.map((item) => <option key={item} value={item}>Grade {item}</option>)}</select></label>
                    <label className="flex min-w-0 items-center gap-2 rounded border border-white/15 bg-white/[0.03] px-3 text-slate-400 focus-within:border-emerald-400 sm:ml-auto sm:w-64"><Search size={16} /><input aria-label="Search results" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Student, subject, admission" className="min-w-0 flex-1 bg-transparent py-2.5 text-sm text-white outline-none placeholder:text-slate-500" /></label>
                </section>

                <section aria-label="Results summary" className="grid grid-cols-2 gap-4 border-b border-white/10 py-5 sm:grid-cols-4"><Metric label="Results entered" value={results.length} /><Metric label="Average score" value={`${average.toFixed(1)}%`} /><Metric label="Pass rate" value={`${passRate.toFixed(1)}%`} /><Metric label="Exam status" value={selectedExamRow?.status ?? "All exams"} /></section>

                {error && <div role="alert" className="mt-4 flex justify-between gap-3 rounded border border-rose-400/20 bg-rose-400/5 px-4 py-3 text-sm text-rose-200"><span>{error}</span><button type="button" onClick={() => setReload((value) => value + 1)} className="underline">Retry</button></div>}
                <section aria-label="Results ledger" className="mt-6 overflow-hidden rounded-lg border border-white/10 bg-white/[0.03]">
                    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3"><div><h2 className="font-medium">Marks ledger</h2><p className="mt-0.5 text-xs text-slate-500">Grades are calculated from exam pass and maximum marks.</p></div>{selectedExamRow && <Link href={`/reports?exam=${selectedExamRow.id}`} className="inline-flex items-center gap-1 text-xs text-emerald-200 hover:text-white">Open exam report <ArrowUpRight size={14} /></Link>}</header>
                    {loading ? <p className="px-4 py-12 text-center text-sm text-slate-400">Loading results...</p> : <div className="overflow-x-auto"><table className="min-w-[900px] w-full text-left text-sm text-slate-200"><thead className="border-b border-white/10 text-xs uppercase tracking-wider text-slate-500"><tr><th className="px-4 py-3">Student</th><th className="px-4 py-3">Exam</th><th className="px-4 py-3">Subject</th><th className="px-4 py-3">Score</th><th className="px-4 py-3">Percentage</th><th className="px-4 py-3">Grade</th><th className="px-4 py-3">Remarks</th></tr></thead><tbody>{results.length === 0 ? <tr><td colSpan={7} className="px-4 py-14 text-center text-slate-500">No marks match the selected filters.</td></tr> : results.map((result) => <tr key={result.id} className="border-b border-white/[0.07]"><td className="px-4 py-3.5"><p className="font-medium text-white">{result.student_name}</p><p className="mt-0.5 font-mono text-xs text-slate-500">{result.student_admission_no}</p></td><td className="px-4 py-3.5">{result.exam_name}</td><td className="px-4 py-3.5">{result.subject}</td><td className="px-4 py-3.5 tabular-nums">{result.marks} <span className="text-slate-500">/ {result.total_marks}</span></td><td className="px-4 py-3.5 tabular-nums">{result.percentage.toFixed(1)}%</td><td className="px-4 py-3.5"><span className={`rounded px-2 py-1 text-xs font-semibold ${result.grade === "F" ? "bg-rose-300/10 text-rose-200" : "bg-emerald-300/10 text-emerald-200"}`}>{result.grade}</span></td><td className="px-4 py-3.5 text-slate-400">{result.remarks || "—"}</td></tr>)}</tbody></table></div>}
                </section>
            </div>
            {selectedExam && roster && <MarksEntryDialog exam={selectedExam} roster={roster} saving={saving} error={dialogError} onClose={() => { setSelectedExam(null); setRoster(null); }} onSubmit={(records) => void handleSaveMarks(records)} />}
        </main>
    );
}

function Metric({ label, value }: { label: string; value: number | string }) { return <div><p className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</p><p className="mt-1 text-xl font-semibold tabular-nums text-white">{value}</p></div>; }
