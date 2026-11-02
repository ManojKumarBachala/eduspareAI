"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { UserPlus } from "lucide-react";

import StudentDialog from "../../components/students/StudentDialog";
import StudentSearch from "../../components/students/StudentSearch";
import StudentStats from "../../components/students/StudentStats";
import StudentTable from "../../components/students/StudentTable";
import { createStudent, getStudents, removeStudent, updateStudent } from "../../services/studentService";
import { Student, StudentPayload } from "../../types/student";

export default function StudentsPage() {
    const [students, setStudents] = useState<Student[]>([]);
    const [search, setSearch] = useState("");
    const [grade, setGrade] = useState("all");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [dialogError, setDialogError] = useState("");
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingStudent, setEditingStudent] = useState<Student | null>(null);

    async function loadStudents() {
        setError("");
        try {
            setStudents(await getStudents());
        } catch {
            setError("Student records could not be loaded. Check your connection and try again.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        let mounted = true;
        getStudents()
            .then((records) => {
                if (mounted) setStudents(records);
            })
            .catch(() => {
                if (mounted) setError("Student records could not be loaded. Check your connection and try again.");
            })
            .finally(() => {
                if (mounted) setLoading(false);
            });
        return () => {
            mounted = false;
        };
    }, []);

    const grades = Array.from(new Set(students.map((student) => student.grade)))
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    const sections = new Set(students.map((student) => `${student.grade}-${student.section}`)).size;
    const filteredStudents = students.filter((student) => {
        const query = search.trim().toLocaleLowerCase();
        const matchesSearch = !query || [
            student.name,
            student.username,
            student.email,
            student.admission_no,
            student.grade,
            student.section,
        ].some((value) => value.toLocaleLowerCase().includes(query));
        return matchesSearch && (grade === "all" || student.grade === grade);
    });

    async function handleSave(payload: StudentPayload) {
        setSaving(true);
        setDialogError("");
        try {
            if (editingStudent) {
                await updateStudent(editingStudent.id, payload);
            } else {
                await createStudent(payload);
            }
            setDialogOpen(false);
            setEditingStudent(null);
            await loadStudents();
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
                        : "Student could not be saved. Check the details and try again.",
            );
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(id: number) {
        const student = students.find((item) => item.id === id);
        if (!student || !window.confirm(`Delete ${student.name} and their student login?`)) return;
        try {
            await removeStudent(id);
            await loadStudents();
        } catch {
            setError("Student could not be deleted. Try again.");
        }
    }

    function openDialog(student: Student | null = null) {
        setEditingStudent(student);
        setDialogError("");
        setDialogOpen(true);
    }

    return (
        <main className="min-h-screen bg-transparent px-4 py-7 text-white sm:px-8">
            <div className="mx-auto max-w-7xl">
                <header className="mb-7 flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">Academic records</p>
                        <h1 className="text-3xl font-semibold">Students</h1>
                        <p className="mt-1 text-sm text-slate-400">Enrollment, class placement, and student accounts</p>
                    </div>
                    <button type="button" onClick={() => openDialog()} className="inline-flex items-center gap-2 rounded bg-emerald-400 px-4 py-2.5 text-sm font-semibold text-[#10201b] hover:bg-emerald-300">
                        <UserPlus size={17} /> Add student
                    </button>
                </header>

                <StudentStats total={students.length} grades={grades.length} sections={sections} />

                <section className="mt-6 overflow-hidden rounded-lg border border-white/10 bg-white/[0.02]" aria-label="Student directory">
                    <div className="flex flex-col gap-3 border-b border-white/10 p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="font-medium">Student directory</h2>
                            <p className="mt-0.5 text-xs text-slate-500">{filteredStudents.length} of {students.length} records</p>
                        </div>
                        <div className="flex flex-col gap-2 sm:flex-row">
                            <StudentSearch value={search} onChange={setSearch} />
                            <label className="sr-only" htmlFor="student-grade-filter">Filter by grade</label>
                            <select id="student-grade-filter" value={grade} onChange={(event) => setGrade(event.target.value)} className="rounded border border-white/15 bg-[#18201f] px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-400">
                                <option value="all">All grades</option>
                                {grades.map((item) => <option key={item} value={item}>Grade {item}</option>)}
                            </select>
                        </div>
                    </div>

                    {error && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 border-b border-rose-400/20 bg-rose-400/5 px-4 py-3 text-sm text-rose-200">
                        <span>{error}</span>
                        <button type="button" onClick={() => void loadStudents()} className="font-medium underline underline-offset-2">Retry</button>
                    </div>}

                    {loading ? <p className="px-4 py-12 text-center text-sm text-slate-400">Loading students...</p> : (
                        <StudentTable
                            students={filteredStudents}
                            onDelete={(id) => void handleDelete(id)}
                            onEdit={(student) => openDialog(student)}
                        />
                    )}
                </section>
            </div>
            {dialogOpen && <StudentDialog
                student={editingStudent}
                saving={saving}
                error={dialogError}
                onClose={() => setDialogOpen(false)}
                onSubmit={(payload) => void handleSave(payload)}
            />}
        </main>
    );
}
