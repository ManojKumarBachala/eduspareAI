export interface Student {
    id: number;
    admission_no: string;
    name: string;
    username: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    grade: string;
    section: string;
    date_of_birth: string;
}

export interface StudentPayload {
    admission_no: string;
    username: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    password?: string;
    grade: string;
    section: string;
    date_of_birth: string;
}