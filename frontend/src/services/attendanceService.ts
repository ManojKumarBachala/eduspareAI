import api from "./api";
import { AttendanceEntry, AttendanceReport, AttendanceStatus } from "../types/attendance";

const ATTENDANCE_URL = "/attendance/";

export async function getAttendanceRoster(date: string, grade: string, section: string) {
    const response = await api.get<AttendanceEntry[]>(`${ATTENDANCE_URL}roster/`, {
        params: {
            date,
            ...(grade === "all" ? {} : { grade }),
            ...(section === "all" ? {} : { section }),
        },
    });
    return response.data;
}

export async function saveAttendance(
    date: string,
    records: { student_id: number; status: AttendanceStatus | null; note: string }[],
) {
    const response = await api.put<unknown>(`${ATTENDANCE_URL}bulk/`, { date, records });
    return response.data;
}

export async function getAttendanceReport(
    startDate: string,
    endDate: string,
    grade: string,
    section: string,
    riskThreshold: number,
) {
    const response = await api.get<AttendanceReport>(`${ATTENDANCE_URL}report/`, {
        params: {
            start_date: startDate,
            end_date: endDate,
            ...(grade === "all" ? {} : { grade }),
            ...(section === "all" ? {} : { section }),
            risk_threshold: riskThreshold,
        },
    });
    return response.data;
}
