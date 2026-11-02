"use client";
/* The effects below synchronize async API requests with view state. */
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState } from "react";
import axios from "axios";
import { BookOpen, Clock3, Download, MapPin, Pencil, Plus, Printer, Trash2, UsersRound } from "lucide-react";

import TimetableSlotDialog from "../../components/timetable/TimetableSlotDialog";
import {
    createTimetableEntry,
    deleteTimetableEntry,
    getTimetable,
    getTimetableOptions,
    updateTimetableEntry,
} from "../../services/timetableService";
import { TimetableClass, TimetableEntry, TimetableOptions, TimetablePayload } from "../../types/timetable";

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function classKey(item: TimetableClass) {
    return `${item.grade}::${item.section}`;
}

function csvCell(value: string | number) {
    return `"${String(value).replaceAll('"', '""')}"`;
}

function timeLabel(value: string | null) {
    return value ? value.slice(0, 5) : "Time not set";
}

export default function TimetablePage() {
    const [options, setOptions] = useState<TimetableOptions | null>(null);
    const [selectedClassKey, setSelectedClassKey] = useState("");
    const [entries, setEntries] = useState<TimetableEntry[]>([]);
    const [subjectFilter, setSubjectFilter] = useState("all");
    const [teacherFilter, setTeacherFilter] = useState("all");
    const [loadingOptions, setLoadingOptions] = useState(true);
    const [loadingSchedule, setLoadingSchedule] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [dialogError, setDialogError] = useState("");
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingEntry, setEditingEntry] = useState<TimetableEntry | null>(null);
    const [slotDay, setSlotDay] = useState("Monday");
    const [slotPeriod, setSlotPeriod] = useState(1);
    const [refreshKey, setRefreshKey] = useState(0);
    const [optionsReload, setOptionsReload] = useState(0);

    useEffect(() => {
        let active = true;
        setLoadingOptions(true);
        getTimetableOptions()
            .then((result) => {
                if (!active) return;
                setOptions(result);
                if (result.classes.length) setSelectedClassKey(classKey(result.classes[0]));
            })
            .catch(() => {
                if (active) setError("Timetable setup could not be loaded. Check your connection and try again.");
            })
            .finally(() => {
                if (active) setLoadingOptions(false);
            });
        return () => {
            active = false;
        };
    }, [optionsReload]);

    const selectedClass = options?.classes.find((item) => classKey(item) === selectedClassKey) ?? null;
    const selectedGrade = selectedClass?.grade;
    const selectedSection = selectedClass?.section;

    useEffect(() => {
        if (!selectedGrade || !selectedSection) {
            setEntries([]);
            return;
        }
        let active = true;
        setLoadingSchedule(true);
        setError("");
        getTimetable(selectedGrade, selectedSection)
            .then((result) => {
                if (active) setEntries(result);
            })
            .catch(() => {
                if (active) setError("This class timetable could not be loaded. Try again.");
            })
            .finally(() => {
                if (active) setLoadingSchedule(false);
            });
        return () => {
            active = false;
        };
    }, [selectedGrade, selectedSection, refreshKey]);

    const subjects = Array.from(new Set(entries.map((entry) => entry.subject))).sort((a, b) => a.localeCompare(b));
    const teachers = Array.from(new Map(entries.map((entry) => [entry.teacher, entry.teacher_name])).entries())
        .sort((a, b) => a[1].localeCompare(b[1]));
    const visibleEntries = entries.filter((entry) =>
        (subjectFilter === "all" || entry.subject === subjectFilter)
        && (teacherFilter === "all" || String(entry.teacher) === teacherFilter),
    );
    const periods = Array.from({ length: Math.max(8, ...entries.map((entry) => entry.period)) }, (_, index) => index + 1);
    const teachingDays = new Set(entries.map((entry) => entry.day)).size;

    function openDialog(day: string, period: number, entry: TimetableEntry | null = null) {
        setSlotDay(day);
        setSlotPeriod(period);
        setEditingEntry(entry);
        setDialogError("");
        setDialogOpen(true);
    }

    async function handleSave(payload: TimetablePayload) {
        setSaving(true);
        setDialogError("");
        try {
            if (editingEntry) await updateTimetableEntry(editingEntry.id, payload);
            else await createTimetableEntry(payload);
            setDialogOpen(false);
            setEditingEntry(null);
            setRefreshKey((key) => key + 1);
        } catch (saveError) {
            const responseData = axios.isAxiosError(saveError) ? saveError.response?.data : null;
            const detail = responseData?.detail;
            const fieldMessage = responseData && typeof responseData === "object"
                ? Object.values(responseData).flat().find((value) => typeof value === "string")
                : null;
            setDialogError(typeof detail === "string" ? detail : typeof fieldMessage === "string" ? fieldMessage : "The period could not be saved. Check for a schedule conflict.");
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(entry: TimetableEntry) {
        if (!window.confirm(`Remove Period ${entry.period}: ${entry.subject} on ${entry.day}?`)) return;
        try {
            await deleteTimetableEntry(entry.id);
            setRefreshKey((key) => key + 1);
        } catch {
            setError("This period could not be removed. Try again.");
        }
    }

    function downloadCsv() {
        const rows = [
            ["Day", "Period", "Start", "End", "Grade", "Section", "Subject", "Teacher", "Room", "Notes"],
            ...visibleEntries.map((entry) => [
                entry.day,
                entry.period,
                entry.start_time ?? "",
                entry.end_time ?? "",
                entry.grade,
                entry.section,
                entry.subject,
                entry.teacher_name,
                entry.room,
                entry.notes,
            ]),
        ];
        const content = rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
        const url = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8" }));
        const link = document.createElement("a");
        link.href = url;
        link.download = `timetable-grade-${selectedClass?.grade ?? "class"}-${selectedClass?.section ?? "section"}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    }

    return (
        <main className="min-h-screen bg-transparent px-4 py-7 text-white sm:px-8 print:bg-white print:p-0 print:text-black">
            <div className="mx-auto max-w-[1500px]">
                <header className="mb-7 flex flex-wrap items-end justify-between gap-4 print:mb-4">
                    <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-emerald-400 print:text-emerald-700">Weekly planner</p>
                        <h1 className="text-3xl font-semibold">Class timetable</h1>
                        <p className="mt-1 text-sm text-slate-400 print:text-slate-600">A clear view of lessons, teachers, times, and rooms</p>
                    </div>
                    {selectedClass && <div className="flex flex-wrap items-center gap-2 print:hidden">
                        <button type="button" onClick={downloadCsv} disabled={!entries.length} className="inline-flex items-center gap-2 rounded border border-white/15 px-3 py-2 text-sm text-slate-200 hover:bg-white/5 disabled:opacity-40">
                            <Download size={16} /> Export CSV
                        </button>
                        <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 rounded border border-white/15 px-3 py-2 text-sm text-slate-200 hover:bg-white/5">
                            <Printer size={16} /> Print
                        </button>
                        {options?.can_manage && <button type="button" onClick={() => openDialog("Monday", 1)} className="inline-flex items-center gap-2 rounded bg-emerald-400 px-4 py-2.5 text-sm font-semibold text-[#10201b] hover:bg-emerald-300">
                            <Plus size={17} /> Add period
                        </button>}
                    </div>}
                </header>

                {error && <div role="alert" className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded border border-rose-400/20 bg-rose-400/5 px-4 py-3 text-sm text-rose-200 print:hidden">
                    <span>{error}</span>
                    <button type="button" onClick={() => { setError(""); setOptionsReload((key) => key + 1); setRefreshKey((key) => key + 1); }} className="font-medium underline underline-offset-2">Retry</button>
                </div>}

                {loadingOptions ? <p className="py-16 text-center text-sm text-slate-400">Loading timetable setup...</p> : !options ? (
                    <section className="rounded-lg border border-white/10 bg-white/[0.02] px-6 py-14 text-center">
                        <h2 className="text-lg font-medium">Timetable setup unavailable</h2>
                        <p className="mt-2 text-sm text-slate-400">Connect to the school workspace to load classes and teachers.</p>
                        <button type="button" onClick={() => { setError(""); setOptionsReload((key) => key + 1); }} className="mt-4 rounded border border-white/15 px-4 py-2 text-sm text-slate-200 hover:bg-white/5">Retry</button>
                    </section>
                ) : !options.classes.length ? (
                    <section className="rounded-lg border border-white/10 bg-white/[0.02] px-6 py-14 text-center">
                        <UsersRound className="mx-auto mb-3 text-slate-500" size={26} />
                        <h2 className="text-lg font-medium">No classes available yet</h2>
                        <p className="mt-2 text-sm text-slate-400">Add students with a grade and section to start building class timetables.</p>
                    </section>
                ) : selectedClass && (
                    <>
                        <section className="mb-5 flex flex-wrap items-end justify-between gap-4 border-y border-white/10 py-4 print:border-black/20">
                            <div>
                                <label htmlFor="class-select" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-500">Class and section</label>
                                <select id="class-select" value={selectedClassKey} onChange={(event) => { setSelectedClassKey(event.target.value); setSubjectFilter("all"); setTeacherFilter("all"); }} className="min-w-64 rounded border border-white/15 bg-[#18201f] px-3 py-2.5 text-sm font-medium text-white outline-none focus:border-emerald-400 print:border-black print:bg-white print:text-black">
                                    {options.classes.map((item) => <option key={classKey(item)} value={classKey(item)}>Grade {item.grade} · Section {item.section}</option>)}
                                </select>
                                <p className="mt-2 text-xs text-slate-500">{entries.length} scheduled period{entries.length === 1 ? "" : "s"} · {new Set(entries.map((entry) => entry.subject)).size} subjects · {teachingDays} teaching days</p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 print:hidden">
                                <label className="sr-only" htmlFor="subject-filter">Filter by subject</label>
                                <select id="subject-filter" value={subjectFilter} onChange={(event) => setSubjectFilter(event.target.value)} className="rounded border border-white/15 bg-[#18201f] px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-400">
                                    <option value="all">All subjects</option>
                                    {subjects.map((subject) => <option key={subject} value={subject}>{subject}</option>)}
                                </select>
                                <label className="sr-only" htmlFor="teacher-filter">Filter by teacher</label>
                                <select id="teacher-filter" value={teacherFilter} onChange={(event) => setTeacherFilter(event.target.value)} className="rounded border border-white/15 bg-[#18201f] px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-400">
                                    <option value="all">All teachers</option>
                                    {teachers.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
                                </select>
                            </div>
                        </section>

                        <section aria-label={`Grade ${selectedClass.grade} section ${selectedClass.section} weekly timetable`} className="overflow-x-auto rounded-lg border border-white/10 bg-white/[0.02] print:overflow-visible print:border-black/20 print:bg-white">
                            {loadingSchedule ? <p className="px-4 py-16 text-center text-sm text-slate-400">Loading class schedule...</p> : (
                                <table className="w-full min-w-[1400px] table-fixed border-collapse print:min-w-0">
                                    <thead>
                                        <tr>
                                            <th className="sticky left-0 z-10 w-28 border-b border-r border-white/10 bg-[#141c1a] px-3 py-3 text-left text-xs uppercase tracking-wider text-slate-500 print:static print:border-black/20 print:bg-slate-100 print:text-slate-700">Day</th>
                                            {periods.map((period) => {
                                                const timing = entries.find((entry) => entry.period === period && entry.start_time && entry.end_time);
                                                return <th key={period} className="w-44 border-b border-r border-white/10 bg-[#141c1a] px-3 py-3 text-left print:border-black/20 print:bg-slate-100">
                                                    <p className="text-xs uppercase tracking-wider text-slate-500 print:text-slate-700">Period {period}</p>
                                                    {timing && <p className="mt-1 text-xs font-normal text-slate-400 print:text-slate-600">{timeLabel(timing.start_time)}–{timeLabel(timing.end_time)}</p>}
                                                </th>;
                                            })}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {days.map((day) => <tr key={day}>
                                            <th scope="row" className="sticky left-0 z-10 border-b border-r border-white/10 bg-[#141c1a] px-3 py-3 text-left text-sm font-medium text-slate-300 print:static print:border-black/20 print:bg-slate-50 print:text-slate-800">{day}</th>
                                            {periods.map((period) => {
                                                const entry = visibleEntries.find((item) => item.day === day && item.period === period);
                                                return <td key={`${day}-${period}`} className="h-40 border-b border-r border-white/[0.07] p-2 align-top print:h-32 print:border-black/20">
                                                    {entry ? <article className="h-full rounded border border-emerald-300/20 bg-emerald-300/[0.06] p-3 print:border-emerald-800/30 print:bg-emerald-50">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <h3 className="flex items-center gap-1.5 text-sm font-semibold text-white print:text-slate-900"><BookOpen size={14} className="shrink-0 text-emerald-300 print:text-emerald-700" />{entry.subject}</h3>
                                                            {options.can_manage && <div className="flex shrink-0 gap-0.5 print:hidden">
                                                                <button type="button" title="Edit period" aria-label={`Edit ${entry.subject} period ${period} on ${day}`} onClick={() => openDialog(day, period, entry)} className="rounded p-1 text-slate-400 hover:bg-white/10 hover:text-white"><Pencil size={14} /></button>
                                                                <button type="button" title="Delete period" aria-label={`Delete ${entry.subject} period ${period} on ${day}`} onClick={() => void handleDelete(entry)} className="rounded p-1 text-slate-400 hover:bg-rose-400/10 hover:text-rose-300"><Trash2 size={14} /></button>
                                                            </div>}
                                                        </div>
                                                        <p className="mt-2 text-xs font-medium text-emerald-100 print:text-emerald-900">{entry.teacher_name}</p>
                                                        <p className="mt-0.5 text-[11px] text-slate-400 print:text-slate-600">{entry.teacher_subject}</p>
                                                        <div className="mt-3 space-y-1 text-[11px] text-slate-400 print:text-slate-700">
                                                            {entry.start_time && entry.end_time && <p className="flex items-center gap-1.5"><Clock3 size={12} />{timeLabel(entry.start_time)}–{timeLabel(entry.end_time)}</p>}
                                                            {entry.room && <p className="flex items-center gap-1.5"><MapPin size={12} />{entry.room}</p>}
                                                            {entry.notes && <p className="mt-2 line-clamp-2 leading-relaxed">{entry.notes}</p>}
                                                        </div>
                                                    </article> : options.can_manage ? <button type="button" onClick={() => openDialog(day, period)} aria-label={`Add period ${period} on ${day}`} className="group flex h-full min-h-32 w-full items-center justify-center gap-1.5 rounded border border-dashed border-white/10 text-xs text-slate-600 hover:border-emerald-300/40 hover:bg-emerald-300/[0.03] hover:text-emerald-200 print:hidden"><Plus size={14} /> Add period</button> : <span className="block h-full min-h-32 rounded bg-white/[0.01] print:bg-white" />}
                                                </td>;
                                            })}
                                        </tr>)}
                                    </tbody>
                                </table>
                            )}
                        </section>
                        <p className="mt-3 text-xs text-slate-500 print:hidden">Period conflicts are checked across the class, assigned teacher, and room before saving.</p>
                    </>
                )}
            </div>
            {dialogOpen && selectedClass && options && <TimetableSlotDialog
                entry={editingEntry}
                selectedClass={selectedClass}
                initialDay={slotDay}
                initialPeriod={slotPeriod}
                teachers={options.teachers}
                saving={saving}
                error={dialogError}
                onClose={() => setDialogOpen(false)}
                onSubmit={(payload) => void handleSave(payload)}
            />}
        </main>
    );
}
