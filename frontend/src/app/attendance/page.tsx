"use client";
/* The effects below synchronize async API requests with view state. */
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState } from "react";
import axios from "axios";
import { CalendarDays, Check, ClipboardCheck, Download, Search, Save } from "lucide-react";

import { getAttendanceReport, getAttendanceRoster, saveAttendance } from "../../services/attendanceService";
import { AttendanceEntry, AttendanceReport, AttendanceStatus } from "../../types/attendance";

function toLocalDateString(date: Date) {
    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
    return localDate.toISOString().slice(0, 10);
}

function getToday() {
    return toLocalDateString(new Date());
}

function getPeriodStart() {
    const start = new Date();
    start.setDate(start.getDate() - 29);
    return toLocalDateString(start);
}

function csvCell(value: string | number | null) {
    return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

const statusLabels: AttendanceStatus[] = ["Present", "Absent", "Late", "Excused", "Half Day"];

export default function AttendancePage() {
    const today = getToday();
    const [date, setDate] = useState(today);
    const [grade, setGrade] = useState("all");
    const [section, setSection] = useState("all");
    const [search, setSearch] = useState("");
    const [roster, setRoster] = useState<AttendanceEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [savedMessage, setSavedMessage] = useState("");
    const [refreshKey, setRefreshKey] = useState(0);
    const [reportStart, setReportStart] = useState(getPeriodStart);
    const [reportEnd, setReportEnd] = useState(today);
    const [riskThreshold, setRiskThreshold] = useState(75);
    const [report, setReport] = useState<AttendanceReport | null>(null);
    const [reportLoading, setReportLoading] = useState(true);
    const [reportError, setReportError] = useState("");

    useEffect(() => {
        let active = true;
        setLoading(true);
        setError("");
        setSavedMessage("");
        getAttendanceRoster(date, "all", "all")
            .then((records) => {
                if (active) setRoster(records);
            })
            .catch(() => {
                if (active) setError("Attendance roster could not be loaded. Check your connection and try again.");
            })
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => {
            active = false;
        };
    }, [date, refreshKey]);

    useEffect(() => {
        let active = true;
        if (reportStart > reportEnd) {
            setReport(null);
            setReportLoading(false);
            setReportError("The start date must be on or before the end date.");
            return () => {
                active = false;
            };
        }

        setReportLoading(true);
        setReportError("");
        getAttendanceReport(reportStart, reportEnd, grade, section, riskThreshold)
            .then((data) => {
                if (active) setReport(data);
            })
            .catch(() => {
                if (active) {
                    setReport(null);
                    setReportError("Attendance report could not be loaded. Check your connection and try again.");
                }
            })
            .finally(() => {
                if (active) setReportLoading(false);
            });
        return () => {
            active = false;
        };
    }, [reportStart, reportEnd, grade, section, riskThreshold]);

    const grades = Array.from(new Set(roster.map((entry) => entry.grade)))
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    const sections = Array.from(new Set(roster
        .filter((entry) => grade === "all" || entry.grade === grade)
        .map((entry) => entry.section))).sort((a, b) => a.localeCompare(b));
    const query = search.trim().toLocaleLowerCase();
    const visibleRoster = roster.filter((entry) => {
        const matchesSearch = !query || [entry.name, entry.admission_no, entry.grade, entry.section]
            .some((value) => value.toLocaleLowerCase().includes(query));
        return matchesSearch
            && (grade === "all" || entry.grade === grade)
            && (section === "all" || entry.section === section);
    });
    const presentCount = visibleRoster.filter((entry) => entry.status === "Present").length;
    const absentCount = visibleRoster.filter((entry) => entry.status === "Absent").length;
    const lateCount = visibleRoster.filter((entry) => entry.status === "Late").length;
    const excusedCount = visibleRoster.filter((entry) => entry.status === "Excused").length;
    const halfDayCount = visibleRoster.filter((entry) => entry.status === "Half Day").length;
    const unmarkedCount = visibleRoster.length - presentCount - absentCount - lateCount - excusedCount - halfDayCount;
    const prioritizedStudents = report?.students.slice().sort(
        (left, right) => (left.attendance_rate ?? 100) - (right.attendance_rate ?? 100),
    ) ?? [];
    const maxDailyCount = Math.max(
        1,
        ...(report?.daily_trend.map((day) => day.present + day.absent + day.late + day.excused + day.half_day) ?? []),
    );

    function markVisible(status: AttendanceStatus) {
        const visibleIds = new Set(visibleRoster.map((entry) => entry.student_id));
        setRoster((current) => current.map((entry) => visibleIds.has(entry.student_id) ? { ...entry, status } : entry));
        setSavedMessage("");
    }

    function setStatus(studentId: number, status: AttendanceStatus | null) {
        setRoster((current) => current.map((entry) => entry.student_id === studentId ? { ...entry, status, note: status ? entry.note : "" } : entry));
        setSavedMessage("");
    }

    function setNote(studentId: number, note: string) {
        setRoster((current) => current.map((entry) => entry.student_id === studentId ? { ...entry, note } : entry));
        setSavedMessage("");
    }

    async function handleSave() {
        const records = visibleRoster.map((entry) => ({
            student_id: entry.student_id,
            status: entry.status,
            note: entry.note,
        }));
        if (records.length === 0) return;

        setSaving(true);
        setError("");
        setSavedMessage("");
        try {
            await saveAttendance(date, records);
            const markedCount = records.filter((record) => record.status !== null).length;
            setSavedMessage(`Saved ${markedCount} marked student${markedCount === 1 ? "" : "s"}; cleared unmarked records.`);
        } catch (saveError) {
            const responseData = axios.isAxiosError(saveError) ? saveError.response?.data : null;
            const detail = responseData?.detail;
            setError(typeof detail === "string" ? detail : "Attendance could not be saved. Try again.");
        } finally {
            setSaving(false);
        }
    }

    function downloadReport() {
        if (!report) return;
        const headers = ["Admission number", "Student", "Grade", "Section", "Present", "Half day", "Late", "Absent", "Excused", "Absence streak", "Attendance rate", "At risk"];
        const rows = report.students.map((student) => [
            student.admission_no,
            student.name,
            student.grade,
            student.section,
            student.present,
            student.half_day,
            student.late,
            student.absent,
            student.excused,
            student.absence_streak,
            student.attendance_rate === null ? "" : `${student.attendance_rate}%`,
            student.at_risk ? "Yes" : "No",
        ]);
        const contents = [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
        const url = URL.createObjectURL(new Blob([contents], { type: "text/csv;charset=utf-8" }));
        const link = document.createElement("a");
        link.href = url;
        link.download = `attendance-${reportStart}-to-${reportEnd}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    }

    return (
        <main className="min-h-screen bg-transparent px-4 py-7 text-white sm:px-8">
            <div className="mx-auto max-w-7xl">
                <header className="mb-7 flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">Daily register</p>
                        <h1 className="text-3xl font-semibold">Attendance</h1>
                        <p className="mt-1 text-sm text-slate-400">Record and review student attendance</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <label className="flex items-center gap-2 rounded border border-white/15 bg-white/[0.03] px-3 text-slate-400">
                            <CalendarDays size={16} />
                            <span className="sr-only">Attendance date</span>
                            <input aria-label="Attendance date" type="date" value={date} onChange={(event) => { if (event.target.value) setDate(event.target.value); }} className="bg-transparent py-2 text-sm text-white outline-none" />
                        </label>
                        <label className="sr-only" htmlFor="attendance-grade">Filter by grade</label>
                        <select id="attendance-grade" value={grade} onChange={(event) => { setGrade(event.target.value); setSection("all"); }} className="rounded border border-white/15 bg-[#18201f] px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-400">
                            <option value="all">All grades</option>
                            {grades.map((item) => <option key={item} value={item}>Grade {item}</option>)}
                        </select>
                        <label className="sr-only" htmlFor="attendance-section">Filter by section</label>
                        <select id="attendance-section" value={section} onChange={(event) => setSection(event.target.value)} className="rounded border border-white/15 bg-[#18201f] px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-400">
                            <option value="all">All sections</option>
                            {sections.map((item) => <option key={item} value={item}>Section {item}</option>)}
                        </select>
                        <label className="flex min-w-0 items-center gap-2 rounded border border-white/15 bg-white/[0.03] px-3 text-slate-400 focus-within:border-emerald-400 sm:w-64">
                            <Search aria-hidden="true" size={16} />
                            <input aria-label="Search students" type="search" placeholder="Name or admission no." value={search} onChange={(event) => setSearch(event.target.value)} className="min-w-0 flex-1 bg-transparent py-2.5 text-sm text-white outline-none placeholder:text-slate-500" />
                        </label>
                    </div>
                </header>

                <section aria-label="Daily attendance summary" className="grid grid-cols-2 gap-3 border-y border-white/10 py-4 sm:grid-cols-4 xl:grid-cols-7">
                    <SummaryValue label="Students" value={visibleRoster.length} />
                    <SummaryValue label="Present" value={presentCount} color="text-emerald-300" />
                    <SummaryValue label="Absent" value={absentCount} color="text-rose-300" />
                    <SummaryValue label="Late" value={lateCount} color="text-amber-200" />
                    <SummaryValue label="Excused" value={excusedCount} color="text-sky-200" />
                    <SummaryValue label="Half day" value={halfDayCount} color="text-lime-200" />
                    <SummaryValue label="Not marked" value={unmarkedCount} color="text-slate-300" />
                </section>

                <section className="mt-6 overflow-hidden rounded-lg border border-white/10 bg-white/[0.02]" aria-label="Daily attendance register">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 p-4">
                        <div>
                            <h2 className="font-medium">Class register</h2>
                            <p className="mt-0.5 text-xs text-slate-500">{new Date(`${date}T12:00:00`).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <button type="button" onClick={() => markVisible("Present")} disabled={visibleRoster.length === 0 || loading} className="rounded border border-emerald-300/30 px-3 py-2 text-xs font-medium text-emerald-200 hover:bg-emerald-300/10 disabled:opacity-40">Mark all present</button>
                            <button type="button" onClick={() => markVisible("Absent")} disabled={visibleRoster.length === 0 || loading} className="rounded border border-rose-300/30 px-3 py-2 text-xs font-medium text-rose-200 hover:bg-rose-300/10 disabled:opacity-40">Mark all absent</button>
                            <button type="button" onClick={() => void handleSave()} disabled={saving || loading || visibleRoster.every((entry) => entry.status === null)} className="inline-flex items-center gap-2 rounded bg-emerald-400 px-3 py-2 text-sm font-semibold text-[#10201b] hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50">
                                {savedMessage ? <Check size={16} /> : <Save size={16} />}
                                {saving ? "Saving..." : "Save attendance"}
                            </button>
                        </div>
                    </div>

                    {error && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 border-b border-rose-400/20 bg-rose-400/5 px-4 py-3 text-sm text-rose-200">
                        <span>{error}</span>
                        <button type="button" onClick={() => setRefreshKey((key) => key + 1)} className="font-medium underline underline-offset-2">Retry</button>
                    </div>}
                    {savedMessage && <p role="status" className="border-b border-emerald-300/20 bg-emerald-300/5 px-4 py-3 text-sm text-emerald-200">{savedMessage}</p>}

                    {loading ? <p className="px-4 py-12 text-center text-sm text-slate-400">Loading class roster...</p> : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-left text-sm text-slate-200">
                                <thead className="border-y border-white/10 text-xs uppercase tracking-wider text-slate-500">
                                    <tr>
                                        <th className="px-4 py-3 font-medium">Admission no.</th>
                                        <th className="px-4 py-3 font-medium">Student</th>
                                        <th className="px-4 py-3 font-medium">Class</th>
                                        <th className="px-4 py-3 font-medium">Status and note</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {visibleRoster.length === 0 ? (
                                        <tr><td colSpan={4} className="px-4 py-12 text-center text-slate-500"><ClipboardCheck className="mx-auto mb-2 text-slate-600" size={22} />No students in this class.</td></tr>
                                    ) : visibleRoster.map((entry) => (
                                        <tr key={entry.student_id} className="border-b border-white/[0.07] hover:bg-white/[0.03]">
                                            <td className="whitespace-nowrap px-4 py-3.5 font-mono text-xs text-emerald-300">{entry.admission_no}</td>
                                            <td className="whitespace-nowrap px-4 py-3.5 font-medium text-white">{entry.name}</td>
                                            <td className="whitespace-nowrap px-4 py-3.5 text-slate-400">{entry.grade} · {entry.section}</td>
                                            <td className="min-w-64 px-4 py-3.5">
                                                <div className="flex flex-col gap-2 sm:flex-row">
                                                    <select aria-label={`Attendance status for ${entry.name}`} value={entry.status ?? ""} onChange={(event) => setStatus(entry.student_id, event.target.value ? event.target.value as AttendanceStatus : null)} className="rounded border border-white/15 bg-[#18201f] px-3 py-2 text-xs text-white outline-none focus:border-emerald-400">
                                                        <option value="">Not marked</option>
                                                        {statusLabels.map((status) => <option key={status} value={status}>{status}</option>)}
                                                    </select>
                                                    <input aria-label={`Attendance note for ${entry.name}`} disabled={!entry.status} maxLength={300} value={entry.note} onChange={(event) => setNote(entry.student_id, event.target.value)} placeholder="Reason or note" className="min-w-0 flex-1 rounded border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white outline-none placeholder:text-slate-600 focus:border-emerald-400 disabled:opacity-35" />
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>

                <section className="mt-8" aria-label="Attendance analytics">
                    <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
                        <div>
                            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-emerald-400">Period overview</p>
                            <h2 className="text-xl font-semibold">Attendance analytics</h2>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <label className="text-xs text-slate-500">From <input aria-label="Report start date" type="date" value={reportStart} onChange={(event) => { if (event.target.value) setReportStart(event.target.value); }} className="ml-1 rounded border border-white/15 bg-[#18201f] px-2 py-2 text-sm text-white" /></label>
                            <label className="text-xs text-slate-500">To <input aria-label="Report end date" type="date" value={reportEnd} onChange={(event) => { if (event.target.value) setReportEnd(event.target.value); }} className="ml-1 rounded border border-white/15 bg-[#18201f] px-2 py-2 text-sm text-white" /></label>
                            <label className="text-xs text-slate-500">Risk threshold % <input aria-label="At-risk attendance threshold" type="number" min={0} max={100} step={5} value={riskThreshold} onChange={(event) => setRiskThreshold(Math.min(100, Math.max(0, Number(event.target.value))))} className="ml-1 w-20 rounded border border-white/15 bg-[#18201f] px-2 py-2 text-sm text-white" /></label>
                            <button type="button" onClick={downloadReport} disabled={!report || reportLoading} className="inline-flex items-center gap-2 rounded border border-white/15 px-3 py-2 text-sm text-slate-200 hover:bg-white/5 disabled:opacity-40">
                                <Download size={15} /> Export CSV
                            </button>
                        </div>
                    </div>

                    {reportError && <p role="alert" className="mb-4 rounded border border-rose-400/20 bg-rose-400/5 px-4 py-3 text-sm text-rose-200">{reportError}</p>}
                    {reportLoading ? <p className="py-8 text-center text-sm text-slate-400">Loading attendance report...</p> : report && (
                        <>
                            <div className="grid grid-cols-2 gap-3 border-y border-white/10 py-4 sm:grid-cols-4 xl:grid-cols-8">
                                <SummaryValue label="Students" value={report.summary.total_students} />
                                <SummaryValue label="Attendance rate" value={report.summary.attendance_rate === null ? "--" : `${report.summary.attendance_rate}%`} color="text-emerald-300" />
                                <SummaryValue label={`At risk (<${report.risk_threshold}%)`} value={report.summary.at_risk_students} color="text-rose-300" />
                                <SummaryValue label="Present" value={report.summary.present} color="text-emerald-300" />
                                <SummaryValue label="Late" value={report.summary.late} color="text-amber-200" />
                                <SummaryValue label="Absent" value={report.summary.absent} color="text-rose-300" />
                                <SummaryValue label="Excused" value={report.summary.excused} color="text-sky-200" />
                                <SummaryValue label="Half day" value={report.summary.half_day} color="text-lime-200" />
                            </div>

                            <div className="mt-5 rounded-lg border border-white/10 bg-white/[0.02] p-4 sm:p-5">
                                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                                    <div>
                                        <h3 className="font-medium">Daily trend</h3>
                                        <p className="mt-0.5 text-xs text-slate-500">Recorded attendance by day</p>
                                    </div>
                                    <div className="flex flex-wrap gap-3 text-xs text-slate-400">
                                        <Legend color="bg-emerald-400" label="Present" />
                                        <Legend color="bg-amber-300" label="Late" />
                                        <Legend color="bg-rose-400" label="Absent" />
                                        <Legend color="bg-sky-300" label="Excused" />
                                        <Legend color="bg-lime-300" label="Half day" />
                                    </div>
                                </div>
                                {report.daily_trend.length === 0 ? <p className="py-6 text-center text-sm text-slate-500">No attendance records in this period.</p> : (
                                    <div className="space-y-2">
                                        {report.daily_trend.map((day) => {
                                            const total = day.present + day.absent + day.late + day.excused + day.half_day;
                                            return (
                                                <div key={day.date} className="grid grid-cols-[5rem_1fr_2.5rem] items-center gap-3 text-xs">
                                                    <span className="text-slate-400">{new Date(`${day.date}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                                                    <div className="flex h-3 overflow-hidden rounded-sm bg-white/[0.04]" title={`${total} records`}>
                                                        <span className="bg-emerald-400" style={{ width: `${day.present / maxDailyCount * 100}%` }} />
                                                        <span className="bg-amber-300" style={{ width: `${day.late / maxDailyCount * 100}%` }} />
                                                        <span className="bg-rose-400" style={{ width: `${day.absent / maxDailyCount * 100}%` }} />
                                                        <span className="bg-sky-300" style={{ width: `${day.excused / maxDailyCount * 100}%` }} />
                                                        <span className="bg-lime-300" style={{ width: `${day.half_day / maxDailyCount * 100}%` }} />
                                                    </div>
                                                    <span className="text-right tabular-nums text-slate-500">{total}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            <div className="mt-5 overflow-hidden rounded-lg border border-white/10 bg-white/[0.02]">
                                <div className="border-b border-white/10 px-4 py-3">
                                    <h3 className="font-medium">Student attendance summary</h3>
                                    <p className="mt-0.5 text-xs text-slate-500">Sorted by rate; Half Day counts as 0.5, excused days are excluded.</p>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full text-left text-sm text-slate-200">
                                        <thead className="border-b border-white/10 text-xs uppercase tracking-wider text-slate-500">
                                            <tr>
                                                <th className="px-4 py-3 font-medium">Student</th>
                                                <th className="px-4 py-3 font-medium">Class</th>
                                                <th className="px-4 py-3 font-medium">Present</th>
                                                <th className="px-4 py-3 font-medium">Half day</th>
                                                <th className="px-4 py-3 font-medium">Late</th>
                                                <th className="px-4 py-3 font-medium">Absent</th>
                                                <th className="px-4 py-3 font-medium">Excused</th>
                                                <th className="px-4 py-3 font-medium">Absence streak</th>
                                                <th className="px-4 py-3 font-medium">Rate</th>
                                                <th className="px-4 py-3 font-medium">Risk</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {prioritizedStudents.length === 0 ? <tr><td colSpan={10} className="px-4 py-10 text-center text-slate-500">No students found for this report.</td></tr> : prioritizedStudents.map((student) => (
                                                <tr key={student.student_id} className="border-b border-white/[0.07]">
                                                    <td className="whitespace-nowrap px-4 py-3">
                                                        <p className="font-medium text-white">{student.name}</p>
                                                        <p className="mt-0.5 font-mono text-xs text-slate-500">{student.admission_no}</p>
                                                    </td>
                                                    <td className="whitespace-nowrap px-4 py-3 text-slate-400">{student.grade} · {student.section}</td>
                                                    <td className="px-4 py-3 text-emerald-200">{student.present}</td>
                                                    <td className="px-4 py-3 text-lime-200">{student.half_day}</td>
                                                    <td className="px-4 py-3 text-amber-200">{student.late}</td>
                                                    <td className="px-4 py-3 text-rose-200">{student.absent}</td>
                                                    <td className="px-4 py-3 text-sky-200">{student.excused}</td>
                                                    <td className="px-4 py-3 text-rose-200">{student.absence_streak}</td>
                                                    <td className="whitespace-nowrap px-4 py-3 font-semibold">{student.attendance_rate === null ? "--" : `${student.attendance_rate}%`}</td>
                                                    <td className="px-4 py-3">
                                                        {student.at_risk ? <span className="rounded bg-rose-400/10 px-2 py-1 text-xs font-medium text-rose-200">At risk</span> : student.attendance_rate === null ? <span className="text-xs text-slate-500">No data</span> : <span className="text-xs text-emerald-200">On track</span>}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}
                </section>
            </div>
        </main>
    );
}

function SummaryValue({ label, value, color = "text-white" }: { label: string; value: number | string; color?: string }) {
    return (
        <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</p>
            <p className={`mt-1 text-2xl font-semibold tabular-nums ${color}`}>{value}</p>
        </div>
    );
}

function Legend({ color, label }: { color: string; label: string }) {
    return (
        <span className="inline-flex items-center gap-1.5">
            <span aria-hidden="true" className={`size-2 rounded-full ${color}`} />
            {label}
        </span>
    );
}
