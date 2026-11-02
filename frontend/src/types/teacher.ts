export interface Teacher {
    id: number;
    name: string;
    subject: string;
    email: string;
    has_account: boolean;
}

export interface TeacherPayload {
    name: string;
    subject: string;
    email: string;
}
