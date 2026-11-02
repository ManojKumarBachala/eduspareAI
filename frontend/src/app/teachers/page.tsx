"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { GraduationCap, Pencil, Search, Trash2, UserPlus, UsersRound } from "lucide-react";

import TeacherDialog from "../../components/teachers/TeacherDialog";
import { createTeacher, getTeachers, removeTeacher, updateTeacher } from "../../services/teacherService";
import { Teacher, TeacherPayload } from "../../types/teacher";

export default function TeachersPage() {
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [search, setSearch] = useState("");
    const [subject, setSubject] = useState("all");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [dialogError, setDialogError] = useState("");
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);

    async function loadTeachers() {
        setError("");
        try {
            setTeachers(await getTeachers());
        } catch {
            setError("Teacher records could not be loaded. Check your connection and try again.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        let mounted = true;
        getTeachers()
            .then((records) => {
                if (mounted) setTeachers(records);
            })
            .catch(() => {
                if (mounted) setError("Teacher records could not be loaded. Check your connection and try again.");
            })
            .finally(() => {
                if (mounted) setLoading(false);
            });
        return () => {
            mounted = false;
        };
    }, []);

    const subjects = Array.from(new Set(teachers.map((teacher) => teacher.subject)))
        .sort((a, b) => a.localeCompare(b));
    const linkedAccounts = teachers.filter((teacher) => teacher.has_account).length;
    const filteredTeachers = teachers.filter((teacher) => {
        const query = search.trim().toLocaleLowerCase();
        const matchesSearch = !query || [teacher.name, teacher.subject, teacher.email]
            .some((value) => value.toLocaleLowerCase().includes(query));
        return matchesSearch && (subject === "all" || teacher.subject === subject);
    });

    async function handleSave(payload: TeacherPayload) {
        setSaving(true);
        setDialogError("");
        try {
            if (editingTeacher) {
                await updateTeacher(editingTeacher.id, payload);
            } else {
                await createTeacher(payload);
            }
            setDialogOpen(false);
            setEditingTeacher(null);
            await loadTeachers();
        } catch (saveError) {
            const responseData = axios.isAxiosError(saveError) ? saveError.response?.data : null;
            const detail = responseData?.detail;
            const firstFieldError = responseData && typeof responseData === "object"
                ? Object.values(responseData).flat().find((value) => typeof value === "string")
                : null;
            setDialogError(
                typeof detail === "string"
                    ? detail
                    : typeof firstFieldError === "string"
                        ? firstFieldError
                        : "Teacher could not be saved. Check the details and try again.",
            );
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(id: number) {
        const teacher = teachers.find((item) => item.id === id);
        if (!teacher || !window.confirm(`Remove ${teacher.name} from the teacher directory?`)) return;
        try {
            await removeTeacher(id);
            await loadTeachers();
        } catch {
            setError("Teacher could not be removed. Try again.");
        }
    }

    function openDialog(teacher: Teacher | null = null) {
        setEditingTeacher(teacher);
        setDialogError("");
        setDialogOpen(true);
    }

    return (
        <main className="min-h-screen bg-transparent px-4 py-7 text-white sm:px-8">
            <div className="mx-auto max-w-7xl">
                <header className="mb-7 flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">People and instruction</p>
                        <h1 className="text-3xl font-semibold">Teachers</h1>
                        <p className="mt-1 text-sm text-slate-400">Staff directory and subject assignments</p>
                    </div>
                    <button type="button" onClick={() => openDialog()} className="inline-flex items-center gap-2 rounded bg-emerald-400 px-4 py-2.5 text-sm font-semibold text-[#10201b] hover:bg-emerald-300">
                        <UserPlus size={17} /> Add teacher
                    </button>
                </header>

                <section aria-label="Teacher summary" className="grid gap-3 border-y border-white/10 py-4 sm:grid-cols-3">
                    <div className="flex items-center gap-3">
                        <UsersRound className="text-emerald-400" size={19} />
                        <div>
                            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Teachers</p>
                            <p className="mt-1 text-2xl font-semibold tabular-nums">{teachers.length}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 border-white/10 sm:border-l sm:pl-5">
                        <GraduationCap className="text-sky-300" size={20} />
                        <div>
                            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Subjects</p>
                            <p className="mt-1 text-2xl font-semibold tabular-nums">{subjects.length}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 border-white/10 sm:border-l sm:pl-5">
                        <UsersRound className="text-amber-300" size={19} />
                        <div>
                            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Linked accounts</p>
                            <p className="mt-1 text-2xl font-semibold tabular-nums">{linkedAccounts}</p>
                        </div>
                    </div>
                </section>

                <section className="mt-6 overflow-hidden rounded-lg border border-white/10 bg-white/[0.02]" aria-label="Teacher directory">
                    <div className="flex flex-col gap-3 border-b border-white/10 p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="font-medium">Teacher directory</h2>
                            <p className="mt-0.5 text-xs text-slate-500">{filteredTeachers.length} of {teachers.length} records</p>
                        </div>
                        <div className="flex flex-col gap-2 sm:flex-row">
                            <label className="flex min-w-0 items-center gap-2 rounded border border-white/15 bg-white/[0.03] px-3 text-slate-400 focus-within:border-emerald-400 sm:w-80">
                                <Search aria-hidden="true" size={16} />
                                <input aria-label="Search teachers" type="search" placeholder="Search name, subject, email" value={search} onChange={(event) => setSearch(event.target.value)} className="min-w-0 flex-1 bg-transparent py-2.5 text-sm text-white outline-none placeholder:text-slate-500" />
                            </label>
                            <label className="sr-only" htmlFor="teacher-subject-filter">Filter by subject</label>
                            <select id="teacher-subject-filter" value={subject} onChange={(event) => setSubject(event.target.value)} className="rounded border border-white/15 bg-[#18201f] px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-400">
                                <option value="all">All subjects</option>
                                {subjects.map((item) => <option key={item} value={item}>{item}</option>)}
                            </select>
                        </div>
                    </div>

                    {error && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 border-b border-rose-400/20 bg-rose-400/5 px-4 py-3 text-sm text-rose-200">
                        <span>{error}</span>
                        <button type="button" onClick={() => void loadTeachers()} className="font-medium underline underline-offset-2">Retry</button>
                    </div>}

                    {loading ? <p className="px-4 py-12 text-center text-sm text-slate-400">Loading teachers...</p> : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-left text-sm text-slate-200">
                                <thead className="border-y border-white/10 text-xs uppercase tracking-wider text-slate-500">
                                    <tr>
                                        <th className="px-4 py-3 font-medium">Teacher</th>
                                        <th className="px-4 py-3 font-medium">Subject</th>
                                        <th className="px-4 py-3 font-medium">Email</th>
                                        <th className="px-4 py-3 font-medium">Account</th>
                                        <th className="px-4 py-3 text-right font-medium">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredTeachers.length === 0 ? (
                                        <tr><td colSpan={5} className="px-4 py-12 text-center text-slate-500">No teachers match these filters.</td></tr>
                                    ) : filteredTeachers.map((teacher) => (
                                        <tr key={teacher.id} className="border-b border-white/[0.07] hover:bg-white/[0.03]">
                                            <td className="whitespace-nowrap px-4 py-3.5 font-medium text-white">{teacher.name}</td>
                                            <td className="px-4 py-3.5">{teacher.subject}</td>
                                            <td className="px-4 py-3.5 text-slate-400">{teacher.email}</td>
                                            <td className="px-4 py-3.5">
                                                <span className={teacher.has_account ? "text-emerald-300" : "text-slate-500"}>
                                                    {teacher.has_account ? "Linked" : "Not linked"}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <div className="flex justify-end gap-1">
                                                    <button type="button" title="Edit teacher" aria-label={`Edit ${teacher.name}`} onClick={() => openDialog(teacher)} className="rounded p-2 text-slate-400 hover:bg-white/10 hover:text-white">
                                                        <Pencil size={16} />
                                                    </button>
                                                    <button type="button" title="Remove teacher" aria-label={`Remove ${teacher.name}`} onClick={() => void handleDelete(teacher.id)} className="rounded p-2 text-slate-400 hover:bg-rose-400/10 hover:text-rose-300">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </div>
            {dialogOpen && <TeacherDialog
                teacher={editingTeacher}
                saving={saving}
                error={dialogError}
                onClose={() => setDialogOpen(false)}
                onSubmit={(payload) => void handleSave(payload)}
            />}
        </main>
    );
}