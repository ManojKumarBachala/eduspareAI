"use client";

import { Pencil, Trash2 } from "lucide-react";
import { Student } from "../../types/student";

interface Props {
    students: Student[];
    onEdit: (student: Student) => void;
    onDelete: (id: number) => void;
}

export default function StudentTable({
    students,
    onEdit,
    onDelete,
}: Props) {
    return (
        <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm text-slate-200">
                <thead className="border-y border-white/10 text-xs uppercase tracking-wider text-slate-500">
                    <tr>
                        <th className="px-4 py-3 font-medium">Admission no.</th>
                        <th className="px-4 py-3 font-medium">Student</th>
                        <th className="px-4 py-3 font-medium">Grade</th>
                        <th className="px-4 py-3 font-medium">Section</th>
                        <th className="px-4 py-3 font-medium">Date of birth</th>
                        <th className="px-4 py-3 text-right font-medium">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {students.length === 0 ? (
                        <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-500">No students match these filters.</td></tr>
                    ) : students.map((student) => (
                        <tr key={student.id} className="border-b border-white/[0.07] hover:bg-white/[0.03]">
                            <td className="whitespace-nowrap px-4 py-3.5 font-mono text-xs text-emerald-300">{student.admission_no}</td>
                            <td className="min-w-48 px-4 py-3.5">
                                <p className="font-medium text-white">{student.name}</p>
                                <p className="mt-0.5 text-xs text-slate-500">{student.email || student.username}</p>
                            </td>
                            <td className="px-4 py-3.5">{student.grade}</td>
                            <td className="px-4 py-3.5">{student.section}</td>
                            <td className="whitespace-nowrap px-4 py-3.5 text-slate-400">{student.date_of_birth}</td>
                            <td className="px-4 py-3.5">
                                <div className="flex justify-end gap-1">
                                    <button type="button" title="Edit student" aria-label={`Edit ${student.name}`} onClick={() => onEdit(student)} className="rounded p-2 text-slate-400 hover:bg-white/10 hover:text-white">
                                        <Pencil size={16} />
                                    </button>
                                    <button type="button" title="Delete student" aria-label={`Delete ${student.name}`} onClick={() => onDelete(student.id)} className="rounded p-2 text-slate-400 hover:bg-rose-400/10 hover:text-rose-300">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}