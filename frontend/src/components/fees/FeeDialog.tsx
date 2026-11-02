"use client";

import { FormEvent, useState } from "react";
import { X } from "lucide-react";

import { FeeCategory, FeePayload, FeeStudent } from "../../types/fee";

interface Props {
    students: FeeStudent[];
    saving: boolean;
    error: string;
    onClose: () => void;
    onSubmit: (payload: FeePayload) => void;
}

const categories: { value: FeeCategory; label: string }[] = [
    { value: "TUITION", label: "Tuition" },
    { value: "ADMISSION", label: "Admission" },
    { value: "TRANSPORT", label: "Transport" },
    { value: "EXAM", label: "Examination" },
    { value: "BOOKS", label: "Books and supplies" },
    { value: "OTHER", label: "Other" },
];
const inputClass = "w-full rounded border border-white/15 bg-[#18201f] px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-400";
const labelClass = "mb-1.5 block text-xs font-medium text-slate-300";

export default function FeeDialog({ students, saving, error, onClose, onSubmit }: Props) {
    const [student, setStudent] = useState(students[0]?.id ?? 0);
    const [title, setTitle] = useState("Tuition fee");
    const [category, setCategory] = useState<FeeCategory>("TUITION");
    const [academicYear, setAcademicYear] = useState("2026-2027");
    const [amount, setAmount] = useState("");
    const [dueDate, setDueDate] = useState("");

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        onSubmit({ student, title: title.trim(), category, academic_year: academicYear.trim(), amount, due_date: dueDate });
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <section aria-labelledby="fee-dialog-title" aria-modal="true" className="w-full max-w-xl rounded-lg border border-white/10 bg-[#111918] shadow-2xl" role="dialog">
                <header className="flex items-start justify-between border-b border-white/10 px-6 py-5">
                    <div><p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Fee setup</p><h2 id="fee-dialog-title" className="mt-1 text-xl font-semibold text-white">Create charge</h2></div>
                    <button type="button" onClick={onClose} aria-label="Close dialog" className="rounded p-2 text-slate-400 hover:bg-white/10 hover:text-white"><X size={18} /></button>
                </header>
                <form onSubmit={handleSubmit} className="space-y-5 px-6 py-5">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <label className="sm:col-span-2"><span className={labelClass}>Student</span>
                            <select required value={student || ""} onChange={(event) => setStudent(Number(event.target.value))} className={inputClass}>
                                {students.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.admission_no} · Grade {item.grade}-{item.section}</option>)}
                            </select>
                        </label>
                        <label><span className={labelClass}>Charge title</span><input required maxLength={120} value={title} onChange={(event) => setTitle(event.target.value)} className={inputClass} /></label>
                        <label><span className={labelClass}>Category</span><select value={category} onChange={(event) => setCategory(event.target.value as FeeCategory)} className={inputClass}>{categories.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
                        <label><span className={labelClass}>Academic year</span><input maxLength={9} placeholder="2026-2027" value={academicYear} onChange={(event) => setAcademicYear(event.target.value)} className={inputClass} /></label>
                        <label><span className={labelClass}>Amount</span><input required min="0.01" step="0.01" type="number" value={amount} onChange={(event) => setAmount(event.target.value)} className={inputClass} /></label>
                        <label className="sm:col-span-2"><span className={labelClass}>Due date</span><input required type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} className={inputClass} /></label>
                    </div>
                    {error && <p role="alert" className="rounded border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-sm text-rose-200">{error}</p>}
                    <footer className="flex justify-end gap-3 border-t border-white/10 pt-4">
                        <button type="button" onClick={onClose} className="rounded border border-white/15 px-4 py-2 text-sm text-slate-200 hover:bg-white/5">Cancel</button>
                        <button disabled={saving || students.length === 0} type="submit" className="rounded bg-emerald-400 px-4 py-2 text-sm font-semibold text-[#10201b] hover:bg-emerald-300 disabled:opacity-50">{saving ? "Saving..." : "Create charge"}</button>
                    </footer>
                </form>
            </section>
        </div>
    );
}
