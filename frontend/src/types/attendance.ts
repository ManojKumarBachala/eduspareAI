export type AttendanceStatus = "Present" | "Absent" | "Late" | "Excused" | "Half Day";

export interface AttendanceEntry {
    student_id: number;
    name: string;
    admission_no: string;
    grade: string;
    section: string;
    status: AttendanceStatus | null;
    note: string;
}

export interface AttendanceReportStudent {
    student_id: number;
    name: string;
    admission_no: string;
    grade: string;
    section: string;
    present: number;
    absent: number;
    late: number;
    excused: number;
    half_day: number;
    attendance_rate: number | null;
    absence_streak: number;
    at_risk: boolean;
}

export interface AttendanceReportDay {
    date: string;
    present: number;
    absent: number;
    late: number;
    excused: number;
    half_day: number;
}

export interface AttendanceReport {
    start_date: string;
    end_date: string;
    risk_threshold: number;
    summary: {
        total_students: number;
        at_risk_students: number;
        present: number;
        absent: number;
        late: number;
        excused: number;
        half_day: number;
        attendance_rate: number | null;
    };
    daily_trend: AttendanceReportDay[];
    students: AttendanceReportStudent[];
}
