import api from "./api";
import { TimetableEntry, TimetableOptions, TimetablePayload } from "../types/timetable";

const TIMETABLE_URL = "/timetable/";

export async function getTimetableOptions() {
    const response = await api.get<TimetableOptions>(`${TIMETABLE_URL}class-options/`);
    return response.data;
}

export async function getTimetable(grade: string, section: string) {
    const response = await api.get<TimetableEntry[]>(TIMETABLE_URL, { params: { grade, section } });
    return response.data;
}

export async function createTimetableEntry(entry: TimetablePayload) {
    const response = await api.post<TimetableEntry>(TIMETABLE_URL, entry);
    return response.data;
}

export async function updateTimetableEntry(id: number, entry: TimetablePayload) {
    const response = await api.patch<TimetableEntry>(`${TIMETABLE_URL}${id}/`, entry);
    return response.data;
}

export async function deleteTimetableEntry(id: number) {
    await api.delete(`${TIMETABLE_URL}${id}/`);
}
