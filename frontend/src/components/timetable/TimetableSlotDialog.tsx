"use client";

import { FormEvent, useState } from "react";
import { X } from "lucide-react";

import { TimetableClass, TimetableEntry, TimetablePayload, TimetableTeacher } from "../../types/timetable";

interface Props {
    entry: TimetableEntry | null;
    selectedClass: TimetableClass;
    initialDay: string;
    initialPeriod: number;
    teachers: TimetableTeacher[];
    saving: boolean;
    error: string;
    onClose: () => void;
    onSubmit: (payload: TimetablePayload) => void;
}

const fieldClass = "w-full rounded border border-white/15 bg-[#18201f] px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-400";
const labelClass = "mb-1.5 block text-xs font-medium text-slate-300";
const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function TimetableSlotDialog({ entry, selectedClass, initialDay, initialPeriod, teachers, saving, error, onClose, onSubmit }: Props) {
    const [day, setDay] = useState(entry?.day ?? initialDay);
    const [period, setPeriod] = useState(entry?.period ?? initialPeriod);
    const [subject, setSubject] = useState(entry?.subject ?? "");
    const [teacher, setTeacher] = useState(entry?.teacher ?? teachers[0]?.id ?? 0);
    const [startTime, setStartTime] = useState(entry?.start_time?.slice(0, 5) ?? "");
    const [endTime, setEndTime] = useState(entry?.end_time?.slice(0, 5) ?? "");
    const [room, setRoom] = useState(entry?.room ?? "");
    const [notes, setNotes] = useState(entry?.notes ?? "");

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        onSubmit({
            day,
            period,
            subject: subject.trim(),
            teacher,
            grade: selectedClass.grade,
            section: selectedClass.section,
            start_time: startTime || null,
            end_time: endTime || null,
            room: room.trim(),
            notes: notes.trim(),
        });
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <section aria-labelledby="timetable-dialog-title" aria-modal="true" className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-white/10 bg-[#111918] shadow-2xl" role="dialog">
                <header className="flex items-start justify-between border-b border-white/10 px-6 py-5">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Grade {selectedClass.grade} · Section {selectedClass.section}</p>
                        <h2 id="timetable-dialog-title" className="mt-1 text-xl font-semibold text-white">{entry ? "Edit period" : "Add period"}</h2>
                    </div>
                    <button type="button" onClick={onClose} aria-label="Close dialog" className="rounded p-2 text-slate-400 hover:bg-white/10 hover:text-white"><X size={18} /></button>
                </header>

                <form onSubmit={handleSubmit} className="space-y-5 px-6 py-5">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <label>
                            <span className={labelClass}>Day</span>
                            <select required value={day} onChange={(event) => setDay(event.target.value)} className={fieldClass}>
                                {days.map((item) => <option key={item} value={item}>{item}</option>)}
                            </select>
                        </label>
                        <label>
                            <span className={labelClass}>Period</span>
                            <input required min={1} max={20} type="number" value={period} onChange={(event) => setPeriod(Number(event.target.value))} className={fieldClass} />
                        </label>
                        <label>
                            <span className={labelClass}>Subject</span>
                            <input required maxLength={100} value={subject} onChange={(event) => setSubject(event.target.value)} className={fieldClass} />
                        </label>
                        <label>
                            <span className={labelClass}>Teacher</span>
                            <select required value={teacher || ""} onChange={(event) => setTeacher(Number(event.target.value))} className={fieldClass}>
                                {teachers.length === 0 ? <option value="">No school teachers available</option> : teachers.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.subject}</option>)}
                            </select>
                        </label>
                        <label>
                            <span className={labelClass}>Starts at</span>
                            <input type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} className={fieldClass} />
                        </label>
                        <label>
                            <span className={labelClass}>Ends at</span>
                            <input type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} className={fieldClass} />
                        </label>
                        <label>
                            <span className={labelClass}>Room</span>
                            <input maxLength={60} value={room} onChange={(event) => setRoom(event.target.value)} className={fieldClass} />
                        </label>
                        <label>
                            <span className={labelClass}>Class</span>
                            <input readOnly value={`Grade ${selectedClass.grade} · Section ${selectedClass.section}`} className={`${fieldClass} text-slate-400`} />
                        </label>
                    </div>
                    <label className="block">
                        <span className={labelClass}>Period notes</span>
                        <textarea rows={2} maxLength={300} value={notes} onChange={(event) => setNotes(event.target.value)} className={fieldClass} placeholder="Lesson focus, equipment, or reminders" />
                    </label>

                    {error && <p role="alert" className="rounded border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-sm text-rose-200">{error}</p>}

                    <footer className="flex justify-end gap-3 border-t border-white/10 pt-4">
                        <button type="button" onClick={onClose} className="rounded border border-white/15 px-4 py-2 text-sm text-slate-200 hover:bg-white/5">Cancel</button>
                        <button disabled={saving || teachers.length === 0} type="submit" className="rounded bg-emerald-400 px-4 py-2 text-sm font-semibold text-[#10201b] hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60">{saving ? "Saving..." : entry ? "Save changes" : "Add to timetable"}</button>
                    </footer>
                </form>
            </section>
        </div>
    );
}
