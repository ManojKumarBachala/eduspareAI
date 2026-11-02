"use client";

import { FormEvent, useState } from "react";
import { X } from "lucide-react";

import { Student, StudentPayload } from "../../types/student";

interface Props {
    student: Student | null;
    saving: boolean;
    error: string;
    onClose: () => void;
    onSubmit: (payload: StudentPayload) => void;
}

const fieldClass = "w-full rounded border border-white/15 bg-[#18201f] px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-400";
const labelClass = "mb-1.5 block text-xs font-medium text-slate-300";

export default function StudentDialog({ student, saving, error, onClose, onSubmit }: Props) {
    const [values, setValues] = useState<StudentPayload>({
        admission_no: student?.admission_no ?? "",
        username: student?.username ?? "",
        first_name: student?.first_name ?? "",
        last_name: student?.last_name ?? "",
        email: student?.email ?? "",
        phone: student?.phone ?? "",
        password: "",
        grade: student?.grade ?? "",
        section: student?.section ?? "",
        date_of_birth: student?.date_of_birth ?? "",
    });

    function updateField(field: keyof StudentPayload, value: string) {
        setValues((current) => ({ ...current, [field]: value }));
    }

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const { password, ...details } = values;
        onSubmit(password ? { ...details, password } : details);
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="presentation">
            <section
                aria-labelledby="student-dialog-title"
                aria-modal="true"
                className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-white/10 bg-[#111918] shadow-2xl"
                role="dialog"
            >
                <header className="flex items-start justify-between border-b border-white/10 px-6 py-5">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Student records</p>
                        <h2 id="student-dialog-title" className="mt-1 text-xl font-semibold text-white">
                            {student ? "Edit student" : "Add student"}
                        </h2>
                    </div>
                    <button type="button" onClick={onClose} aria-label="Close dialog" className="rounded p-2 text-slate-400 hover:bg-white/10 hover:text-white">
                        <X size={18} />
                    </button>
                </header>

                <form onSubmit={handleSubmit} className="space-y-5 px-6 py-5">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <label>
                            <span className={labelClass}>First name</span>
                            <input required autoFocus className={fieldClass} value={values.first_name} onChange={(event) => updateField("first_name", event.target.value)} />
                        </label>
                        <label>
                            <span className={labelClass}>Last name</span>
                            <input required className={fieldClass} value={values.last_name} onChange={(event) => updateField("last_name", event.target.value)} />
                        </label>
                        <label>
                            <span className={labelClass}>Admission number</span>
                            <input required className={fieldClass} value={values.admission_no} onChange={(event) => updateField("admission_no", event.target.value)} />
                        </label>
                        <label>
                            <span className={labelClass}>Date of birth</span>
                            <input required type="date" className={fieldClass} value={values.date_of_birth} onChange={(event) => updateField("date_of_birth", event.target.value)} />
                        </label>
                        <label>
                            <span className={labelClass}>Grade</span>
                            <input required className={fieldClass} value={values.grade} onChange={(event) => updateField("grade", event.target.value)} />
                        </label>
                        <label>
                            <span className={labelClass}>Section</span>
                            <input required className={fieldClass} value={values.section} onChange={(event) => updateField("section", event.target.value)} />
                        </label>
                        <label>
                            <span className={labelClass}>Username</span>
                            <input required autoComplete="username" className={fieldClass} value={values.username} onChange={(event) => updateField("username", event.target.value)} />
                        </label>
                        <label>
                            <span className={labelClass}>Email</span>
                            <input type="email" autoComplete="email" className={fieldClass} value={values.email} onChange={(event) => updateField("email", event.target.value)} />
                        </label>
                        <label>
                            <span className={labelClass}>Phone</span>
                            <input type="tel" className={fieldClass} value={values.phone} onChange={(event) => updateField("phone", event.target.value)} />
                        </label>
                        <label>
                            <span className={labelClass}>{student ? "New password (optional)" : "Initial password"}</span>
                            <input required={!student} minLength={8} type="password" autoComplete="new-password" className={fieldClass} value={values.password} onChange={(event) => updateField("password", event.target.value)} />
                        </label>
                    </div>

                    {error && <p role="alert" className="rounded border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-sm text-rose-200">{error}</p>}

                    <footer className="flex justify-end gap-3 border-t border-white/10 pt-4">
                        <button type="button" onClick={onClose} className="rounded border border-white/15 px-4 py-2 text-sm text-slate-200 hover:bg-white/5">Cancel</button>
                        <button disabled={saving} type="submit" className="rounded bg-emerald-400 px-4 py-2 text-sm font-semibold text-[#10201b] hover:bg-emerald-300 disabled:cursor-wait disabled:opacity-60">
                            {saving ? "Saving..." : student ? "Save changes" : "Create student"}
                        </button>
                    </footer>
                </form>
            </section>
        </div>
    );
}
