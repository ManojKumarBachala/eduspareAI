export interface TimetableClass {
    grade: string;
    section: string;
}

export interface TimetableTeacher {
    id: number;
    name: string;
    subject: string;
}

export interface TimetableOptions {
    classes: TimetableClass[];
    teachers: TimetableTeacher[];
    can_manage: boolean;
}

export interface TimetableEntry {
    id: number;
    day: string;
    period: number;
    subject: string;
    teacher: number;
    teacher_name: string;
    teacher_subject: string;
    grade: string;
    section: string;
    start_time: string | null;
    end_time: string | null;
    room: string;
    notes: string;
}

export type TimetablePayload = Omit<TimetableEntry, "id" | "teacher_name" | "teacher_subject">;
