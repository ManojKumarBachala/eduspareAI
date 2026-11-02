"use client";

import { FormEvent, useState } from "react";
import { X } from "lucide-react";

import { Teacher, TeacherPayload } from "../../types/teacher";

interface Props {
    teacher: Teacher | null;
    saving: boolean;
    error: string;
    onClose: () => void;
    onSubmit: (payload: TeacherPayload) => void;
}

const fieldClass = "w-full rounded border border-white/15 bg-[#18201f] px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-400";
const labelClass = "mb-1.5 block text-xs font-medium text-slate-300";

export default function TeacherDialog({ teacher, saving, error, onClose, onSubmit }: Props) {
    const [name, setName] = useState(teacher?.name ?? "");
    const [subject, setSubject] = useState(teacher?.subject ?? "");
    const [email, setEmail] = useState(teacher?.email ?? "");

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        onSubmit({ name: name.trim(), subject: subject.trim(), email: email.trim() });
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <section
                aria-labelledby="teacher-dialog-title"
                aria-modal="true"
                className="w-full max-w-lg rounded-lg border border-white/10 bg-[#111918] shadow-2xl"
                role="dialog"
            >
                <header className="flex items-start justify-between border-b border-white/10 px-6 py-5">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Staff records</p>
                        <h2 id="teacher-dialog-title" className="mt-1 text-xl font-semibold text-white">
                            {teacher ? "Edit teacher" : "Add teacher"}
                        </h2>
                    </div>
                    <button type="button" onClick={onClose} aria-label="Close dialog" className="rounded p-2 text-slate-400 hover:bg-white/10 hover:text-white">
                        <X size={18} />
                    </button>
                </header>

                <form onSubmit={handleSubmit} className="space-y-5 px-6 py-5">
                    <label className="block">
                        <span className={labelClass}>Full name</span>
                        <input required autoFocus maxLength={100} className={fieldClass} value={name} onChange={(event) => setName(event.target.value)} />
                    </label>
                    <label className="block">
                        <span className={labelClass}>Subject</span>
                        <input required maxLength={100} className={fieldClass} value={subject} onChange={(event) => setSubject(event.target.value)} />
                    </label>
                    <label className="block">
                        <span className={labelClass}>Email</span>
                        <input required type="email" autoComplete="email" className={fieldClass} value={email} onChange={(event) => setEmail(event.target.value)} />
                    </label>

                    {error && <p role="alert" className="rounded border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-sm text-rose-200">{error}</p>}

                    <footer className="flex justify-end gap-3 border-t border-white/10 pt-4">
                        <button type="button" onClick={onClose} className="rounded border border-white/15 px-4 py-2 text-sm text-slate-200 hover:bg-white/5">Cancel</button>
                        <button disabled={saving} type="submit" className="rounded bg-emerald-400 px-4 py-2 text-sm font-semibold text-[#10201b] hover:bg-emerald-300 disabled:cursor-wait disabled:opacity-60">
                            {saving ? "Saving..." : teacher ? "Save changes" : "Add teacher"}
                        </button>
                    </footer>
                </form>
            </section>
        </div>
    );
}
