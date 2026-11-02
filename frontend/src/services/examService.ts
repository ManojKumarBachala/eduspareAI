import api from "./api";
import { Exam, ExamClass, ExamPayload, ExamReport, ExamResult, ExamRoster, ExamSummary } from "../types/exams";

const EXAMS_URL = "/exams/";
const RESULTS_URL = "/results/";

export async function getExams(filters: { q?: string; grade?: string; status?: string } = {}) {
    const response = await api.get<Exam[]>(EXAMS_URL, { params: filters });
    return response.data;
}

export async function getExamSummary(filters: { grade?: string; status?: string } = {}) {
    const response = await api.get<ExamSummary>(`${EXAMS_URL}summary/`, { params: filters });
    return response.data;
}

export async function getExamClasses() {
    const response = await api.get<{ classes: ExamClass[]; academic_years: string[] }>(`${EXAMS_URL}class-options/`);
    return response.data;
}

export async function saveExam(payload: ExamPayload, id?: number) {
    const response = id
        ? await api.patch<Exam>(`${EXAMS_URL}${id}/`, payload)
        : await api.post<Exam>(EXAMS_URL, payload);
    return response.data;
}

export async function getExamRoster(examId: number) {
    const response = await api.get<ExamRoster>(`${EXAMS_URL}${examId}/roster/`);
    return response.data;
}

export async function saveExamMarks(examId: number, records: { student: number; subject: string; marks: number; remarks: string }[]) {
    const response = await api.post<ExamResult[]>(`${EXAMS_URL}${examId}/marks/`, { records });
    return response.data;
}

export async function publishExam(examId: number) {
    const response = await api.post<{ exam: Exam; result_count: number }>(`${EXAMS_URL}${examId}/publish/`);
    return response.data;
}

export async function getResults(filters: { exam?: number | string; grade?: string; section?: string; q?: string; subject?: string } = {}) {
    const response = await api.get<ExamResult[]>(RESULTS_URL, { params: filters });
    return response.data;
}

export async function getExamReport(examId: number, grade?: string) {
    const response = await api.get<ExamReport>(`${RESULTS_URL}report/`, {
        params: { exam: examId, ...(grade ? { grade } : {}) },
    });
    return response.data;
}
