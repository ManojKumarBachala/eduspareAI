import api from "./api";
import { Fee, FeeCategory, FeePayment, FeePaymentPayload, FeePayload, FeeStudent, FeeSummary } from "../types/fee";

const FEES_URL = "/fees/";

export async function getFees(filters: { status: string; grade: string; category: FeeCategory | "all"; q: string }) {
    const response = await api.get<Fee[]>(FEES_URL, {
        params: {
            ...(filters.status === "all" ? {} : { status: filters.status }),
            ...(filters.grade === "all" ? {} : { grade: filters.grade }),
            ...(filters.category === "all" ? {} : { category: filters.category }),
            ...(filters.q ? { q: filters.q } : {}),
        },
    });
    return response.data;
}

export async function getFeeSummary() {
    const response = await api.get<FeeSummary>(`${FEES_URL}summary/`);
    return response.data;
}

export async function getFeeStudents() {
    const response = await api.get<FeeStudent[]>(`${FEES_URL}students/`);
    return response.data;
}

export async function createFee(payload: FeePayload) {
    const response = await api.post<Fee>(FEES_URL, payload);
    return response.data;
}

export async function recordFeePayment(feeId: number, payload: FeePaymentPayload) {
    const response = await api.post<FeePayment>(`${FEES_URL}${feeId}/payments/`, payload);
    return response.data;
}

export async function deleteFee(feeId: number) {
    await api.delete(`${FEES_URL}${feeId}/`);
}
