export type FeeCategory = "TUITION" | "ADMISSION" | "TRANSPORT" | "EXAM" | "BOOKS" | "OTHER";
export type FeeStatus = "pending" | "partial" | "overdue" | "paid";
export type PaymentMethod = "CASH" | "BANK" | "CARD" | "UPI" | "CHEQUE" | "OTHER";

export interface FeePayment {
    id: number;
    amount: string;
    method: PaymentMethod;
    reference: string;
    notes: string;
    receipt_no: string;
    paid_at: string;
    received_by_name: string;
}

export interface Fee {
    id: number;
    student: number;
    student_name: string;
    admission_no: string;
    grade: string;
    section: string;
    title: string;
    category: FeeCategory;
    academic_year: string;
    amount: string;
    paid_amount: string;
    balance: string;
    status: FeeStatus;
    due_date: string;
    created_at: string;
    payments: FeePayment[];
}

export interface FeeStudent {
    id: number;
    name: string;
    admission_no: string;
    grade: string;
    section: string;
}

export interface FeePayload {
    student: number;
    title: string;
    category: FeeCategory;
    academic_year: string;
    amount: string;
    due_date: string;
}

export interface FeePaymentPayload {
    amount: string;
    method: PaymentMethod;
    reference: string;
    notes: string;
}

export interface FeeSummary {
    fee_count: number;
    total_charges: string;
    collected: string;
    outstanding: string;
    overdue_balance: string;
    overdue_count: number;
    collection_rate: number;
}
