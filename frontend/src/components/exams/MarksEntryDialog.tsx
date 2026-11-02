"use client";

import { FormEvent, useState } from "react";
import { X } from "lucide-react";

import { Exam, ExamRoster, ExamRosterStudent } from "../../types/exams";

interface Props {
    exam: Exam;
    roster: ExamRoster;
    saving: boolean;
    error: string;
    onClose: () => void;
    onSubmit: (records: { student: number; subject: string; marks: number; remarks: string }[]) => void;
}

export default function MarksEntryDialog({ exam, roster, saving, error, onClose, onSubmit }: Props) {
    const [subject, setSubject] = useState("");
    const [marks, setMarks] = useState<Record<string, string>>({});
    const [remarks, setRemarks] = useState<Record<string, string>>({});

    function existingResult(student: ExamRosterStudent) {
        return student.results.find((result) => result.subject.toLocaleLowerCase() === subject.trim().toLocaleLowerCase());
    }

    function markValue(student: ExamRosterStudent) {
        const key = String(student.student);
        return marks[key] ?? existingResult(student)?.marks.toString() ?? "";
    }

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const records = roster.students.flatMap((student) => {
            const value = markValue(student);
            if (!value) return [];
            return [{
                student: student.student,
                subject: subject.trim(),
                marks: Number(value),
                remarks: remarks[String(student.student)] ?? existingResult(student)?.remarks ?? "",
            }];
        });
        onSubmit(records);
    }

    return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
        <section aria-labelledby="marks-dialog-title" aria-modal="true" className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-lg border border-white/10 bg-[#111918] shadow-2xl" role="dialog">
            <header className="flex items-start justify-between border-b border-white/10 px-6 py-5"><div><p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Grade {exam.grade} · Section {exam.section}</p><h2 id="marks-dialog-title" className="mt-1 text-xl font-semibold text-white">Enter subject marks</h2><p className="mt-1 text-xs text-slate-500">Maximum {exam.total_marks} · Pass mark {exam.passing_marks}</p></div><button type="button" onClick={onClose} aria-label="Close dialog" className="rounded p-2 text-slate-400 hover:bg-white/10 hover:text-white"><X size={18} /></button></header>
            <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
                <label className="block max-w-sm"><span className="mb-1.5 block text-xs font-medium text-slate-300">Subject</span><input required maxLength={100} value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="e.g. Mathematics" className="w-full rounded border border-white/15 bg-[#18201f] px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-400" /></label>
                <div className="overflow-x-auto rounded border border-white/10"><table className="w-full min-w-[620px] text-left text-sm text-slate-200"><thead className="border-b border-white/10 text-xs uppercase tracking-wider text-slate-500"><tr><th className="px-3 py-3">Student</th><th className="px-3 py-3">Admission</th><th className="px-3 py-3">Marks</th><th className="px-3 py-3">Remarks</th></tr></thead><tbody>{roster.students.map((student) => <tr key={student.student} className="border-b border-white/[0.06]"><td className="px-3 py-3 font-medium text-white">{student.student_name}</td><td className="px-3 py-3 font-mono text-xs text-slate-500">{student.admission_no}</td><td className="px-3 py-2"><input aria-label={`Marks for ${student.student_name}`} type="number" min={0} max={exam.total_marks} value={markValue(student)} onChange={(event) => setMarks((current) => ({ ...current, [student.student]: event.target.value }))} className="w-28 rounded border border-white/15 bg-[#18201f] px-2.5 py-2 text-sm text-white outline-none focus:border-emerald-400" /></td><td className="px-3 py-2"><input aria-label={`Remarks for ${student.student_name}`} maxLength={200} value={remarks[String(student.student)] ?? existingResult(student)?.remarks ?? ""} onChange={(event) => setRemarks((current) => ({ ...current, [student.student]: event.target.value }))} className="w-full rounded border border-white/10 bg-white/[0.03] px-2.5 py-2 text-sm text-white outline-none focus:border-emerald-400" /></td></tr>)}</tbody></table></div>
                {error && <p role="alert" className="rounded border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-sm text-rose-200">{error}</p>}
                <footer className="flex justify-end gap-3 border-t border-white/10 pt-4"><button type="button" onClick={onClose} className="rounded border border-white/15 px-4 py-2 text-sm text-slate-200 hover:bg-white/5">Cancel</button><button disabled={saving || !subject.trim() || !roster.students.length} type="submit" className="rounded bg-emerald-400 px-4 py-2 text-sm font-semibold text-[#10201b] hover:bg-emerald-300 disabled:opacity-50">{saving ? "Saving..." : "Save marks"}</button></footer>
            </form>
        </section>
    </div>;
}
