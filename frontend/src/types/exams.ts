export type ExamTerm = "TERM_1" | "TERM_2" | "TERM_3" | "MIDTERM" | "FINAL" | "OTHER";
export type ExamStatus = "DRAFT" | "SCHEDULED" | "PUBLISHED";

export interface ExamClass {
    grade: string;
    section: string;
}

export interface Exam {
    id: number;
    name: string;
    exam_date: string;
    grade: string;
    section: string;
    academic_year: string;
    term: ExamTerm;
    total_marks: number;
    passing_marks: number;
    status: ExamStatus;
    notes: string;
    result_count: number;
}

export interface ExamPayload {
    name: string;
    exam_date: string;
    grade: string;
    section: string;
    academic_year: string;
    term: ExamTerm;
    total_marks: number;
    passing_marks: number;
    status: ExamStatus;
    notes: string;
}

export interface ExamSummary {
    exam_count: number;
    draft_count: number;
    scheduled_count: number;
    published_count: number;
    result_count: number;
}

export interface ExamResult {
    id: number;
    student: number;
    student_name: string;
    student_admission_no: string;
    exam: number;
    exam_name: string;
    subject: string;
    marks: number;
    total_marks: number;
    percentage: number;
    grade: string;
    remarks: string;
}

export interface ExamRosterStudent {
    student: number;
    student_name: string;
    admission_no: string;
    grade: string;
    section: string;
    results: ExamResult[];
}

export interface ExamRoster {
    exam: Exam;
    students: ExamRosterStudent[];
}

export interface ExamReport {
    exam: Exam;
    summary: {
        students_assessed: number;
        results_entered: number;
        average_marks: number;
        pass_rate: number;
        pass_mark: number;
    };
    subjects: {
        subject: string;
        entries: number;
        average: number;
        highest: number;
        passed: number;
    }[];
    students: {
        student: number;
        student_name: string;
        admission_no: string;
        grade: string;
        section: string;
        total_marks: number;
        maximum_marks: number;
        subjects: number;
        passed_subjects: number;
        rank: number;
        percentage: number;
        overall_grade: string;
    }[];
}
