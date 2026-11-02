import api from "./api";
import { Student, StudentPayload } from "../types/student";

const STUDENTS_URL = "/students/";

export async function getStudents() {
    const response = await api.get<Student[]>(STUDENTS_URL);
    return response.data;
}

export async function createStudent(student: StudentPayload) {
    const response = await api.post<Student>(STUDENTS_URL, student);
    return response.data;
}

export async function updateStudent(id: number, student: StudentPayload) {
    const response = await api.patch<Student>(`${STUDENTS_URL}${id}/`, student);
    return response.data;
}

export async function removeStudent(id: number) {
    await api.delete(`${STUDENTS_URL}${id}/`);
}