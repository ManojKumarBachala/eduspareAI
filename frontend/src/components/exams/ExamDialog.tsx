"use client";

import { FormEvent, useState } from "react";
import { X } from "lucide-react";

import { Exam, ExamClass, ExamPayload, ExamTerm } from "../../types/exams";

interface Props {
    exam: Exam | null;
    classes: ExamClass[];
    saving: boolean;
    error: string;
    onClose: () => void;
    onSubmit: (payload: ExamPayload) => void;
}

const terms: { value: ExamTerm; label: string }[] = [
    { value: "TERM_1", label: "Term 1" },
    { value: "TERM_2", label: "Term 2" },
    { value: "TERM_3", label: "Term 3" },
    { value: "MIDTERM", label: "Midterm" },
    { value: "FINAL", label: "Final" },
    { value: "OTHER", label: "Other" },
];
const fieldClass = "w-full rounded border border-white/15 bg-[#18201f] px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-400";
const labelClass = "mb-1.5 block text-xs font-medium text-slate-300";

export default function ExamDialog({ exam, classes, saving, error, onClose, onSubmit }: Props) {
    const [name, setName] = useState(exam?.name ?? "");
    const [date, setDate] = useState(exam?.exam_date ?? "");
    const [selectedClass, setSelectedClass] = useState(
        exam ? `${exam.grade}::${exam.section}` : classes[0] ? `${classes[0].grade}::${classes[0].section}` : "",
    );
    const [academicYear, setAcademicYear] = useState(exam?.academic_year ?? "2026-2027");
    const [term, setTerm] = useState<ExamTerm>(exam?.term ?? "TERM_1");
    const [totalMarks, setTotalMarks] = useState(exam?.total_marks ?? 100);
    const [passingMarks, setPassingMarks] = useState(exam?.passing_marks ?? 35);
    const [status, setStatus] = useState(exam?.status ?? "DRAFT");
    const [notes, setNotes] = useState(exam?.notes ?? "");

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const [grade, section] = selectedClass.split("::");
        onSubmit({ name: name.trim(), exam_date: date, grade, section, academic_year: academicYear.trim(), term, total_marks: totalMarks, passing_marks: passingMarks, status, notes: notes.trim() });
    }

    return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
        <section aria-labelledby="exam-dialog-title" aria-modal="true" className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-white/10 bg-[#111918] shadow-2xl" role="dialog">
            <header className="flex items-start justify-between border-b border-white/10 px-6 py-5"><div><p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Assessment setup</p><h2 id="exam-dialog-title" className="mt-1 text-xl font-semibold text-white">{exam ? "Edit exam" : "Create exam"}</h2></div><button type="button" onClick={onClose} aria-label="Close dialog" className="rounded p-2 text-slate-400 hover:bg-white/10 hover:text-white"><X size={18} /></button></header>
            <form onSubmit={submit} className="space-y-5 px-6 py-5">
                <div className="grid gap-4 sm:grid-cols-2">
                    <label className="sm:col-span-2"><span className={labelClass}>Exam name</span><input required maxLength={100} value={name} onChange={(event) => setName(event.target.value)} className={fieldClass} placeholder="e.g. Term 1 Mathematics Examination" /></label>
                    <label><span className={labelClass}>Grade and section</span><select required value={selectedClass} onChange={(event) => setSelectedClass(event.target.value)} className={fieldClass}>{classes.map((item) => <option key={`${item.grade}-${item.section}`} value={`${item.grade}::${item.section}`}>Grade {item.grade} · Section {item.section}</option>)}{exam && !classes.some((item) => item.grade === exam.grade && item.section === exam.section) && <option value={`${exam.grade}::${exam.section}`}>Grade {exam.grade} · Section {exam.section}</option>}</select></label>
                    <label><span className={labelClass}>Exam date</span><input required type="date" value={date} onChange={(event) => setDate(event.target.value)} className={fieldClass} /></label>
                    <label><span className={labelClass}>Academic year</span><input maxLength={9} value={academicYear} onChange={(event) => setAcademicYear(event.target.value)} className={fieldClass} placeholder="2026-2027" /></label>
                    <label><span className={labelClass}>Term</span><select value={term} onChange={(event) => setTerm(event.target.value as ExamTerm)} className={fieldClass}>{terms.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
                    <label><span className={labelClass}>Maximum marks per subject</span><input required min={1} type="number" value={totalMarks} onChange={(event) => setTotalMarks(Number(event.target.value))} className={fieldClass} /></label>
                    <label><span className={labelClass}>Passing marks</span><input required min={0} max={totalMarks} type="number" value={passingMarks} onChange={(event) => setPassingMarks(Number(event.target.value))} className={fieldClass} /></label>
                    <label><span className={labelClass}>Status</span><select value={status} onChange={(event) => setStatus(event.target.value as Exam["status"])} className={fieldClass}><option value="DRAFT">Draft</option><option value="SCHEDULED">Scheduled</option></select></label>
                </div>
                <label className="block"><span className={labelClass}>Notes</span><textarea rows={2} maxLength={300} value={notes} onChange={(event) => setNotes(event.target.value)} className={fieldClass} /></label>
                {error && <p role="alert" className="rounded border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-sm text-rose-200">{error}</p>}
                <footer className="flex justify-end gap-3 border-t border-white/10 pt-4"><button type="button" onClick={onClose} className="rounded border border-white/15 px-4 py-2 text-sm text-slate-200 hover:bg-white/5">Cancel</button><button disabled={saving || classes.length === 0} type="submit" className="rounded bg-emerald-400 px-4 py-2 text-sm font-semibold text-[#10201b] hover:bg-emerald-300 disabled:opacity-50">{saving ? "Saving..." : exam ? "Save exam" : "Create exam"}</button></footer>
            </form>
        </section>
    </div>;
}
