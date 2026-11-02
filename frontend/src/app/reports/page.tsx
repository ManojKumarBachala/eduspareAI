"use client";
/* The effects below synchronize async API requests with view state. */
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState } from "react";
import { Download } from "lucide-react";

import { getExamReport, getExams } from "../../services/examService";
import { Exam, ExamReport } from "../../types/exams";

function csvCell(value: string | number) {
    return `"${String(value).replaceAll('"', '""')}"`;
}

function examDate(value: string) {
    return new Date(`${value}T12:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function ReportsPage() {
    const [exams, setExams] = useState<Exam[]>([]);
    const [examId, setExamId] = useState("");
    const [grade, setGrade] = useState("all");
    const [report, setReport] = useState<ExamReport | null>(null);
    const [loadingExams, setLoadingExams] = useState(true);
    const [loadingReport, setLoadingReport] = useState(false);
    const [error, setError] = useState("");
    const [reload, setReload] = useState(0);

    useEffect(() => {
        let active = true;
        getExams()
            .then((items) => {
                if (!active) return;
                setExams(items);
                const requested = new URLSearchParams(window.location.search).get("exam");
                const initial = requested && items.some((item) => String(item.id) === requested) ? requested : items[0] ? String(items[0].id) : "";
                setExamId(initial);
            })
            .catch(() => { if (active) setError("Exams could not be loaded."); })
            .finally(() => { if (active) setLoadingExams(false); });
        return () => { active = false; };
    }, []);

    useEffect(() => {
        if (!examId) {
            setReport(null);
            setLoadingReport(false);
            return;
        }
        let active = true;
        setLoadingReport(true);
        setError("");
        getExamReport(Number(examId), grade === "all" ? undefined : grade)
            .then((data) => { if (active) setReport(data); })
            .catch(() => { if (active) { setReport(null); setError("Report data could not be loaded. Try again."); } })
            .finally(() => { if (active) setLoadingReport(false); });
        return () => { active = false; };
    }, [examId, grade, reload]);

    const grades = Array.from(new Set(report?.students.map((student) => student.grade) ?? []))
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    const maxSubjectAverage = Math.max(1, ...(report?.subjects.map((subject) => subject.average) ?? []));

    function downloadCsv() {
        if (!report) return;
        const rows = [
            ["Rank", "Student", "Admission no.", "Grade", "Section", "Total", "Maximum", "Percentage", "Overall grade", "Subjects passed"],
            ...report.students.map((student) => [
                student.rank,
                student.student_name,
                student.admission_no,
                student.grade,
                student.section,
                student.total_marks,
                student.maximum_marks,
                `${student.percentage}%`,
                student.overall_grade,
                `${student.passed_subjects}/${student.subjects}`,
            ]),
        ];
        const content = rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
        const url = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8" }));
        const link = document.createElement("a");
        link.href = url;
        link.download = `exam-report-${report.exam.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    }

    return (
        <main className="min-h-screen bg-transparent px-4 py-7 text-white sm:px-8">
            <div className="mx-auto max-w-7xl">
                <header className="mb-7 flex flex-wrap items-end justify-between gap-4"><div><p className="mb-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">Assessment insights</p><h1 className="text-3xl font-semibold">Reports</h1><p className="mt-1 text-sm text-slate-400">Class and subject performance, ranked for review</p></div><button type="button" onClick={downloadCsv} disabled={!report} className="inline-flex items-center gap-2 rounded border border-white/15 px-3 py-2.5 text-sm text-slate-200 hover:bg-white/5 disabled:opacity-40"><Download size={16} /> Export report</button></header>

                <section className="flex flex-wrap items-end gap-3 border-y border-white/10 py-4">
                    <label><span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-500">Exam</span><select value={examId} onChange={(event) => { setExamId(event.target.value); setGrade("all"); }} disabled={loadingExams} className="min-w-72 rounded border border-white/15 bg-[#18201f] px-3 py-2.5 text-sm text-white"><option value="">Select exam</option>{exams.map((exam) => <option key={exam.id} value={exam.id}>{exam.name} · Grade {exam.grade || "Unassigned"}-{exam.section || "—"} · {examDate(exam.exam_date)}</option>)}</select></label>
                    <label><span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-500">Grade</span><select value={grade} onChange={(event) => setGrade(event.target.value)} className="rounded border border-white/15 bg-[#18201f] px-3 py-2.5 text-sm text-white"><option value="all">All grades</option>{grades.map((item) => <option key={item} value={item}>Grade {item}</option>)}</select></label>
                    {report && <p className="pb-2 text-xs text-slate-500">Passing threshold: {report.summary.pass_mark} marks · {report.exam.total_marks} max</p>}
                </section>

                {error && <div role="alert" className="mt-4 flex justify-between gap-3 rounded border border-rose-400/20 bg-rose-400/5 px-4 py-3 text-sm text-rose-200"><span>{error}</span><button type="button" onClick={() => setReload((value) => value + 1)} className="underline">Retry</button></div>}
                {loadingReport ? <p className="py-16 text-center text-sm text-slate-400">Building report...</p> : report && <>
                    <section aria-label="Exam report summary" className="grid grid-cols-2 gap-4 border-b border-white/10 py-5 sm:grid-cols-4"><Metric label="Students assessed" value={report.summary.students_assessed} /><Metric label="Marks entered" value={report.summary.results_entered} /><Metric label="Average marks" value={`${report.summary.average_marks} / ${report.exam.total_marks}`} /><Metric label="Pass rate" value={`${report.summary.pass_rate}%`} color={report.summary.pass_rate >= 70 ? "text-emerald-200" : "text-amber-200"} /></section>

                    <div className="mt-6 grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
                        <section className="overflow-hidden rounded-lg border border-white/10 bg-white/[0.03]"><header className="border-b border-white/10 px-4 py-3"><h2 className="font-medium">Subject performance</h2><p className="mt-0.5 text-xs text-slate-500">Class average compared with exam maximum</p></header>{report.subjects.length === 0 ? <p className="px-4 py-10 text-center text-sm text-slate-500">No marks entered for this exam.</p> : <div className="space-y-4 p-4">{report.subjects.map((subject) => <div key={subject.subject}><div className="mb-1.5 flex justify-between gap-3 text-sm"><span className="text-slate-200">{subject.subject}</span><span className="tabular-nums text-slate-400">{subject.average.toFixed(1)} avg · {subject.passed}/{subject.entries} pass</span></div><div className="h-2 overflow-hidden rounded bg-white/10"><div className={`h-full rounded ${subject.average >= report.exam.passing_marks ? "bg-emerald-400" : "bg-rose-400"}`} style={{ width: `${Math.min(subject.average / report.exam.total_marks * 100, 100)}%` }} /></div><p className="mt-1 text-right text-[11px] text-slate-500">Highest {subject.highest} · {Math.round(subject.average / maxSubjectAverage * 100)}% of top subject average</p></div>)}</div>}</section>

                        <section className="overflow-hidden rounded-lg border border-white/10 bg-white/[0.03]"><header className="border-b border-white/10 px-4 py-3"><h2 className="font-medium">Student ranking</h2><p className="mt-0.5 text-xs text-slate-500">Ranked by normalized overall percentage</p></header><div className="overflow-x-auto"><table className="min-w-[700px] w-full text-left text-sm text-slate-200"><thead className="border-b border-white/10 text-xs uppercase tracking-wider text-slate-500"><tr><th className="px-4 py-3">Rank</th><th className="px-4 py-3">Student</th><th className="px-4 py-3">Class</th><th className="px-4 py-3">Total</th><th className="px-4 py-3">Percent</th><th className="px-4 py-3">Grade</th><th className="px-4 py-3">Passed</th></tr></thead><tbody>{report.students.length === 0 ? <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-500">No student marks entered yet.</td></tr> : report.students.map((student) => <tr key={student.student} className="border-b border-white/[0.07]"><td className="px-4 py-3 font-mono text-xs text-emerald-300">{String(student.rank).padStart(2, "0")}</td><td className="px-4 py-3"><p className="font-medium text-white">{student.student_name}</p><p className="mt-0.5 text-xs text-slate-500">{student.admission_no}</p></td><td className="px-4 py-3 text-slate-400">{student.grade} · {student.section}</td><td className="px-4 py-3 tabular-nums">{student.total_marks} / {student.maximum_marks}</td><td className="px-4 py-3 tabular-nums">{student.percentage.toFixed(1)}%</td><td className="px-4 py-3"><span className={`rounded px-2 py-1 text-xs ${student.overall_grade === "F" ? "bg-rose-300/10 text-rose-200" : "bg-emerald-300/10 text-emerald-200"}`}>{student.overall_grade}</span></td><td className="px-4 py-3 tabular-nums">{student.passed_subjects}/{student.subjects}</td></tr>)}</tbody></table></div></section>
                    </div>
                </>}
                {!loadingReport && !report && !error && <div className="py-16 text-center text-sm text-slate-500">Create an exam and enter marks to generate a report.</div>}
            </div>
        </main>
    );
}

function Metric({ label, value, color = "text-white" }: { label: string; value: string | number; color?: string }) { return <div><p className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</p><p className={`mt-1 text-2xl font-semibold tabular-nums ${color}`}>{value}</p></div>; }
