"use client";
/* The effects below synchronize async API requests with view state. */
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState } from "react";
import axios from "axios";
import { CalendarDays, ChevronDown, ChevronRight, CircleDollarSign, FilePlus2, ReceiptText, Search, WalletCards } from "lucide-react";

import FeeDialog from "../../components/fees/FeeDialog";
import PaymentDialog from "../../components/fees/PaymentDialog";
import { createFee, getFeeStudents, getFeeSummary, getFees, recordFeePayment } from "../../services/feeService";
import { Fee, FeeCategory, FeePayment, FeePaymentPayload, FeePayload, FeeStatus, FeeStudent, FeeSummary } from "../../types/fee";

const categoryLabels: Record<FeeCategory, string> = {
    TUITION: "Tuition",
    ADMISSION: "Admission",
    TRANSPORT: "Transport",
    EXAM: "Examination",
    BOOKS: "Books & supplies",
    OTHER: "Other",
};
const statusLabels: Record<FeeStatus, string> = {
    pending: "Pending",
    partial: "Partial",
    overdue: "Overdue",
    paid: "Paid",
};

function money(value: string | number) {
    return `₹${Number(value).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function dateLabel(value: string) {
    return new Date(`${value}T12:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function firstApiError(error: unknown, fallback: string) {
    if (!axios.isAxiosError(error)) return fallback;
    const data = error.response?.data;
    if (data && typeof data === "object") {
        const message = Object.values(data).flat().find((item) => typeof item === "string");
        if (typeof message === "string") return message;
    }
    return fallback;
}

function csvCell(value: string | number) {
    return `"${String(value).replaceAll('"', '""')}"`;
}

export default function FeesPage() {
    const [fees, setFees] = useState<Fee[]>([]);
    const [students, setStudents] = useState<FeeStudent[]>([]);
    const [summary, setSummary] = useState<FeeSummary | null>(null);
    const [status, setStatus] = useState<FeeStatus | "all">("all");
    const [grade, setGrade] = useState("all");
    const [category, setCategory] = useState<FeeCategory | "all">("all");
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [dialogError, setDialogError] = useState("");
    const [chargeDialogOpen, setChargeDialogOpen] = useState(false);
    const [paymentFee, setPaymentFee] = useState<Fee | null>(null);
    const [expandedFeeId, setExpandedFeeId] = useState<number | null>(null);
    const [lastReceipt, setLastReceipt] = useState<FeePayment | null>(null);
    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        let active = true;
        getFeeStudents()
            .then((data) => { if (active) setStudents(data); })
            .catch(() => { if (active) setError("Student list could not be loaded."); });
        return () => { active = false; };
    }, []);

    useEffect(() => {
        let active = true;
        setLoading(true);
        setError("");
        Promise.all([
            getFees({ status, grade, category, q: query.trim() }),
            getFeeSummary(),
        ])
            .then(([feeRows, totals]) => {
                if (!active) return;
                setFees(feeRows);
                setSummary(totals);
            })
            .catch(() => {
                if (active) setError("Fee data could not be loaded. Check the school connection and try again.");
            })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [status, grade, category, query, reloadKey]);

    const grades = Array.from(new Set(students.map((student) => student.grade)))
        .sort((left, right) => left.localeCompare(right, undefined, { numeric: true }));

    async function handleCreate(payload: FeePayload) {
        setSaving(true);
        setDialogError("");
        try {
            await createFee(payload);
            setChargeDialogOpen(false);
            setReloadKey((key) => key + 1);
        } catch (saveError) {
            setDialogError(firstApiError(saveError, "The fee charge could not be created."));
        } finally {
            setSaving(false);
        }
    }

    async function handlePayment(payload: FeePaymentPayload) {
        if (!paymentFee) return;
        setSaving(true);
        setDialogError("");
        try {
            const payment = await recordFeePayment(paymentFee.id, payload);
            setLastReceipt(payment);
            setExpandedFeeId(paymentFee.id);
            setPaymentFee(null);
            setReloadKey((key) => key + 1);
        } catch (saveError) {
            setDialogError(firstApiError(saveError, "Payment could not be recorded."));
        } finally {
            setSaving(false);
        }
    }

    function downloadCsv() {
        const rows = [
            ["Student", "Admission no.", "Grade", "Section", "Charge", "Category", "Academic year", "Amount", "Paid", "Balance", "Status", "Due date"],
            ...fees.map((fee) => [
                fee.student_name,
                fee.admission_no,
                fee.grade,
                fee.section,
                fee.title,
                categoryLabels[fee.category],
                fee.academic_year,
                fee.amount,
                fee.paid_amount,
                fee.balance,
                statusLabels[fee.status],
                fee.due_date,
            ]),
        ];
        const content = rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
        const url = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8" }));
        const link = document.createElement("a");
        link.href = url;
        link.download = "school-fees.csv";
        link.click();
        URL.revokeObjectURL(url);
    }

    function downloadReceipt(payment: FeePayment, fee: Fee) {
        const content = [
            "New Little Flower EM School - Fee Receipt",
            `Receipt: ${payment.receipt_no}`,
            `Received: ${new Date(payment.paid_at).toLocaleString("en-IN")}`,
            `Student: ${fee.student_name} (${fee.admission_no})`,
            `Class: ${fee.grade}-${fee.section}`,
            `Charge: ${fee.title}`,
            `Amount: ${money(payment.amount)}`,
            `Method: ${payment.method}`,
            `Reference: ${payment.reference || "-"}`,
            `Received by: ${payment.received_by_name || "School office"}`,
            `Notes: ${payment.notes || "-"}`,
        ].join("\r\n");
        const url = URL.createObjectURL(new Blob([content], { type: "text/plain;charset=utf-8" }));
        const link = document.createElement("a");
        link.href = url;
        link.download = `${payment.receipt_no}.txt`;
        link.click();
        URL.revokeObjectURL(url);
    }

    return (
        <main className="min-h-screen bg-transparent px-4 py-7 text-white sm:px-8">
            <div className="mx-auto max-w-7xl">
                <header className="mb-7 flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">Accounts receivable</p>
                        <h1 className="text-3xl font-semibold">Fees</h1>
                        <p className="mt-1 text-sm text-slate-400">Charges, collections, balances, and receipts</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={downloadCsv} disabled={!fees.length} className="inline-flex items-center gap-2 rounded border border-white/15 px-3 py-2.5 text-sm text-slate-200 hover:bg-white/5 disabled:opacity-40"><ReceiptText size={16} /> Export CSV</button>
                        <button type="button" onClick={() => { setDialogError(""); setChargeDialogOpen(true); }} className="inline-flex items-center gap-2 rounded bg-emerald-400 px-4 py-2.5 text-sm font-semibold text-[#10201b] hover:bg-emerald-300"><FilePlus2 size={16} /> Create charge</button>
                    </div>
                </header>

                <section aria-label="Fee collection summary" className="grid grid-cols-2 gap-4 border-y border-white/10 py-5 md:grid-cols-3 xl:grid-cols-5">
                    <Metric label="Total charges" value={money(summary?.total_charges ?? 0)} detail={`${summary?.fee_count ?? 0} fee items`} icon={<CircleDollarSign size={18} />} />
                    <Metric label="Collected" value={money(summary?.collected ?? 0)} detail={`${summary?.collection_rate ?? 0}% collection rate`} color="text-emerald-300" icon={<WalletCards size={18} />} />
                    <Metric label="Outstanding" value={money(summary?.outstanding ?? 0)} detail="Across all fee items" color="text-amber-200" icon={<CircleDollarSign size={18} />} />
                    <Metric label="Overdue" value={money(summary?.overdue_balance ?? 0)} detail={`${summary?.overdue_count ?? 0} overdue items`} color="text-rose-300" icon={<CalendarDays size={18} />} />
                    <div className="col-span-2 flex flex-col justify-center gap-2 border-white/10 md:col-span-3 md:flex-row md:items-center md:justify-between xl:col-span-1 xl:border-l xl:pl-5">
                        <div><p className="text-xs font-medium uppercase tracking-wider text-slate-500">Collection progress</p><p className="mt-1 text-sm text-slate-300">{summary?.collection_rate ?? 0}% collected</p></div>
                        <div className="h-2 w-full overflow-hidden rounded bg-white/10 md:max-w-48 xl:w-24">
                            <div className="h-full rounded bg-emerald-400" style={{ width: `${Math.min(100, summary?.collection_rate ?? 0)}%` }} />
                        </div>
                    </div>
                </section>

                {lastReceipt && <section role="status" className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded border border-emerald-300/25 bg-emerald-300/[0.06] px-4 py-3">
                    <div><p className="text-sm font-medium text-emerald-100">Payment recorded · {lastReceipt.receipt_no}</p><p className="mt-0.5 text-xs text-slate-400">Receipt amount {money(lastReceipt.amount)}</p></div>
                    <div className="flex gap-2"><button type="button" onClick={() => { const fee = fees.find((item) => item.payments.some((payment) => payment.id === lastReceipt.id)); if (fee) downloadReceipt(lastReceipt, fee); }} className="rounded border border-emerald-300/30 px-3 py-2 text-xs text-emerald-100 hover:bg-emerald-300/10">Download receipt</button><button type="button" onClick={() => setLastReceipt(null)} aria-label="Dismiss receipt notice" className="rounded px-2 text-slate-400 hover:text-white">×</button></div>
                </section>}

                <section aria-label="Fee ledger" className="mt-6 overflow-hidden rounded-lg border border-white/10 bg-white/[0.02]">
                    <div className="flex flex-col gap-4 border-b border-white/10 p-4 lg:flex-row lg:items-center lg:justify-between">
                        <div><h2 className="font-medium">Fee ledger</h2><p className="mt-0.5 text-xs text-slate-500">{fees.length} matching charge{fees.length === 1 ? "" : "s"}</p></div>
                        <div className="flex flex-wrap gap-2">
                            <label className="flex min-w-0 items-center gap-2 rounded border border-white/15 bg-white/[0.03] px-3 text-slate-400 focus-within:border-emerald-400 sm:w-64"><Search aria-hidden="true" size={16} /><input aria-label="Search fee ledger" type="search" placeholder="Student, admission, charge" value={query} onChange={(event) => setQuery(event.target.value)} className="min-w-0 flex-1 bg-transparent py-2.5 text-sm text-white outline-none placeholder:text-slate-500" /></label>
                            <label className="sr-only" htmlFor="fee-grade-filter">Filter by grade</label>
                            <select id="fee-grade-filter" value={grade} onChange={(event) => setGrade(event.target.value)} className="rounded border border-white/15 bg-[#18201f] px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-400"><option value="all">All grades</option>{grades.map((item) => <option key={item} value={item}>Grade {item}</option>)}</select>
                            <label className="sr-only" htmlFor="fee-category-filter">Filter by category</label>
                            <select id="fee-category-filter" value={category} onChange={(event) => setCategory(event.target.value as FeeCategory | "all")} className="rounded border border-white/15 bg-[#18201f] px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-400"><option value="all">All categories</option>{Object.entries(categoryLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select>
                        </div>
                    </div>
                    <div className="flex gap-1 overflow-x-auto border-b border-white/10 px-4 pt-3">
                        {(["all", "pending", "partial", "overdue", "paid"] as const).map((value) => <button key={value} type="button" onClick={() => setStatus(value)} className={`whitespace-nowrap border-b-2 px-3 pb-3 text-sm ${status === value ? "border-emerald-400 text-white" : "border-transparent text-slate-500 hover:text-slate-200"}`}>{value === "all" ? "All charges" : statusLabels[value]}</button>)}
                    </div>

                    {error && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 border-b border-rose-400/20 bg-rose-400/5 px-4 py-3 text-sm text-rose-200"><span>{error}</span><button type="button" onClick={() => setReloadKey((key) => key + 1)} className="font-medium underline underline-offset-2">Retry</button></div>}
                    {loading ? <p className="px-4 py-14 text-center text-sm text-slate-400">Loading fee ledger...</p> : (
                        <div className="overflow-x-auto">
                            <table className="min-w-[1050px] w-full text-left text-sm text-slate-200">
                                <thead className="border-b border-white/10 text-xs uppercase tracking-wider text-slate-500"><tr><th className="px-4 py-3 font-medium">Student / charge</th><th className="px-4 py-3 font-medium">Class</th><th className="px-4 py-3 font-medium">Due date</th><th className="px-4 py-3 font-medium">Charge</th><th className="px-4 py-3 font-medium">Collected</th><th className="px-4 py-3 font-medium">Balance</th><th className="px-4 py-3 font-medium">Status</th><th className="px-4 py-3 text-right font-medium">Actions</th></tr></thead>
                                <tbody>
                                    {fees.length === 0 ? <tr><td colSpan={8} className="px-4 py-14 text-center text-slate-500">No fee charges match these filters.</td></tr> : fees.map((fee) => {
                                        const expanded = expandedFeeId === fee.id;
                                        return <FeeLedgerRows key={fee.id} fee={fee} expanded={expanded} onToggle={() => setExpandedFeeId(expanded ? null : fee.id)} onPay={() => { setDialogError(""); setPaymentFee(fee); }} onReceipt={downloadReceipt} />;
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </div>
            {chargeDialogOpen && <FeeDialog students={students} saving={saving} error={dialogError} onClose={() => setChargeDialogOpen(false)} onSubmit={(payload) => void handleCreate(payload)} />}
            {paymentFee && <PaymentDialog fee={paymentFee} saving={saving} error={dialogError} onClose={() => setPaymentFee(null)} onSubmit={(payload) => void handlePayment(payload)} />}
        </main>
    );
}

function Metric({ label, value, detail, color = "text-white", icon }: { label: string; value: string; detail: string; color?: string; icon: React.ReactNode }) {
    return <div className="flex min-w-0 items-start gap-3"><span className="mt-0.5 text-slate-500">{icon}</span><div className="min-w-0"><p className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</p><p className={`mt-1 truncate text-xl font-semibold tabular-nums ${color}`}>{value}</p><p className="mt-1 text-xs text-slate-500">{detail}</p></div></div>;
}

function FeeLedgerRows({ fee, expanded, onToggle, onPay, onReceipt }: { fee: Fee; expanded: boolean; onToggle: () => void; onPay: () => void; onReceipt: (payment: FeePayment, fee: Fee) => void }) {
    const statusStyle: Record<FeeStatus, string> = {
        paid: "bg-emerald-300/10 text-emerald-200",
        partial: "bg-sky-300/10 text-sky-200",
        overdue: "bg-rose-300/10 text-rose-200",
        pending: "bg-amber-300/10 text-amber-100",
    };
    return <>
        <tr className="border-b border-white/[0.07] hover:bg-white/[0.025]">
            <td className="px-4 py-3.5"><div className="flex items-start gap-2"><button type="button" onClick={onToggle} aria-label={`${expanded ? "Hide" : "Show"} payments for ${fee.student_name}`} className="mt-0.5 rounded p-1 text-slate-500 hover:bg-white/10 hover:text-white">{expanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}</button><div><p className="font-medium text-white">{fee.student_name}</p><p className="mt-0.5 font-mono text-xs text-slate-500">{fee.admission_no} · {fee.title}</p><p className="mt-1 text-xs text-slate-500">{categoryLabels[fee.category]}{fee.academic_year ? ` · ${fee.academic_year}` : ""}</p></div></div></td>
            <td className="whitespace-nowrap px-4 py-3.5 text-slate-400">{fee.grade} · {fee.section}</td>
            <td className="whitespace-nowrap px-4 py-3.5 text-slate-400">{dateLabel(fee.due_date)}</td>
            <td className="whitespace-nowrap px-4 py-3.5 tabular-nums">{money(fee.amount)}</td>
            <td className="whitespace-nowrap px-4 py-3.5 tabular-nums text-emerald-200">{money(fee.paid_amount)}</td>
            <td className="whitespace-nowrap px-4 py-3.5 tabular-nums font-medium">{money(fee.balance)}</td>
            <td className="px-4 py-3.5"><span className={`rounded px-2 py-1 text-xs font-medium ${statusStyle[fee.status]}`}>{statusLabels[fee.status]}</span></td>
            <td className="px-4 py-3.5 text-right">{fee.balance !== "0.00" && Number(fee.balance) > 0 ? <button type="button" onClick={onPay} className="inline-flex items-center gap-1.5 rounded border border-emerald-300/25 px-3 py-2 text-xs font-medium text-emerald-200 hover:bg-emerald-300/10"><CircleDollarSign size={14} /> Record payment</button> : <span className="text-xs text-emerald-300">Settled</span>}</td>
        </tr>
        {expanded && <tr className="border-b border-white/10 bg-black/10"><td colSpan={8} className="px-5 py-4">
            <div className="mb-3 flex items-center justify-between"><div><h3 className="text-sm font-medium text-white">Payment history</h3><p className="mt-0.5 text-xs text-slate-500">{fee.payments.length} recorded transaction{fee.payments.length === 1 ? "" : "s"}</p></div>{fee.balance !== "0.00" && Number(fee.balance) > 0 && <button type="button" onClick={onPay} className="text-xs font-medium text-emerald-200 hover:text-emerald-100">Record payment</button>}</div>
            {fee.payments.length === 0 ? <p className="rounded border border-white/[0.07] px-3 py-4 text-center text-xs text-slate-500">No payments recorded for this charge.</p> : <div className="space-y-2">{fee.payments.map((payment) => <div key={payment.id} className="flex flex-wrap items-center justify-between gap-3 rounded border border-white/[0.07] px-3 py-2.5"><div><p className="text-sm font-medium text-emerald-100">{money(payment.amount)} · {payment.method}</p><p className="mt-0.5 text-xs text-slate-500">{payment.receipt_no} · {new Date(payment.paid_at).toLocaleString("en-IN")}{payment.reference ? ` · Ref ${payment.reference}` : ""}</p>{payment.notes && <p className="mt-1 text-xs text-slate-400">{payment.notes}</p>}</div><button type="button" onClick={() => onReceipt(payment, fee)} className="rounded border border-white/10 px-3 py-2 text-xs text-slate-300 hover:bg-white/5">Download receipt</button></div>)}</div>}
        </td></tr>}
    </>;
}
