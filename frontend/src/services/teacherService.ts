import api from "./api";
import { Teacher, TeacherPayload } from "../types/teacher";

const TEACHERS_URL = "/teachers/";

export async function getTeachers() {
    const response = await api.get<Teacher[]>(TEACHERS_URL);
    return response.data;
}

export async function createTeacher(teacher: TeacherPayload) {
    const response = await api.post<Teacher>(TEACHERS_URL, teacher);
    return response.data;
}

export async function updateTeacher(id: number, teacher: TeacherPayload) {
    const response = await api.patch<Teacher>(`${TEACHERS_URL}${id}/`, teacher);
    return response.data;
}

export async function removeTeacher(id: number) {
    await api.delete(`${TEACHERS_URL}${id}/`);
}
