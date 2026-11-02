"use client";

import { FormEvent, useState } from "react";
import { X } from "lucide-react";

import { Fee, FeePaymentPayload, PaymentMethod } from "../../types/fee";

interface Props {
    fee: Fee;
    saving: boolean;
    error: string;
    onClose: () => void;
    onSubmit: (payload: FeePaymentPayload) => void;
}

const methods: { value: PaymentMethod; label: string }[] = [
    { value: "CASH", label: "Cash" },
    { value: "UPI", label: "UPI" },
    { value: "BANK", label: "Bank transfer" },
    { value: "CARD", label: "Card" },
    { value: "CHEQUE", label: "Cheque" },
    { value: "OTHER", label: "Other" },
];
const inputClass = "w-full rounded border border-white/15 bg-[#18201f] px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-400";
const labelClass = "mb-1.5 block text-xs font-medium text-slate-300";

export default function PaymentDialog({ fee, saving, error, onClose, onSubmit }: Props) {
    const [amount, setAmount] = useState(Number(fee.balance).toFixed(2));
    const [method, setMethod] = useState<PaymentMethod>("UPI");
    const [reference, setReference] = useState("");
    const [notes, setNotes] = useState("");

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        onSubmit({ amount, method, reference: reference.trim(), notes: notes.trim() });
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <section aria-labelledby="payment-dialog-title" aria-modal="true" className="w-full max-w-lg rounded-lg border border-white/10 bg-[#111918] shadow-2xl" role="dialog">
                <header className="flex items-start justify-between border-b border-white/10 px-6 py-5">
                    <div><p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Payment collection</p><h2 id="payment-dialog-title" className="mt-1 text-xl font-semibold text-white">Record payment</h2></div>
                    <button type="button" onClick={onClose} aria-label="Close dialog" className="rounded p-2 text-slate-400 hover:bg-white/10 hover:text-white"><X size={18} /></button>
                </header>
                <form onSubmit={handleSubmit} className="space-y-5 px-6 py-5">
                    <div className="grid grid-cols-2 gap-3 rounded border border-white/10 bg-white/[0.03] p-3 text-sm">
                        <div><p className="text-xs text-slate-500">Student</p><p className="mt-1 font-medium text-white">{fee.student_name}</p></div>
                        <div><p className="text-xs text-slate-500">Charge</p><p className="mt-1 font-medium text-white">{fee.title}</p></div>
                        <div><p className="text-xs text-slate-500">Outstanding</p><p className="mt-1 font-semibold text-amber-200">₹{Number(fee.balance).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p></div>
                        <div><p className="text-xs text-slate-500">Due date</p><p className="mt-1 text-slate-200">{fee.due_date}</p></div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <label><span className={labelClass}>Payment amount</span><input required min="0.01" max={fee.balance} step="0.01" type="number" value={amount} onChange={(event) => setAmount(event.target.value)} className={inputClass} /></label>
                        <label><span className={labelClass}>Method</span><select value={method} onChange={(event) => setMethod(event.target.value as PaymentMethod)} className={inputClass}>{methods.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
                        <label className="sm:col-span-2"><span className={labelClass}>Transaction reference</span><input maxLength={100} value={reference} onChange={(event) => setReference(event.target.value)} placeholder="Optional receipt, UPI, or cheque number" className={inputClass} /></label>
                        <label className="sm:col-span-2"><span className={labelClass}>Notes</span><textarea rows={2} maxLength={300} value={notes} onChange={(event) => setNotes(event.target.value)} className={inputClass} /></label>
                    </div>
                    {error && <p role="alert" className="rounded border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-sm text-rose-200">{error}</p>}
                    <footer className="flex justify-end gap-3 border-t border-white/10 pt-4">
                        <button type="button" onClick={onClose} className="rounded border border-white/15 px-4 py-2 text-sm text-slate-200 hover:bg-white/5">Cancel</button>
                        <button disabled={saving} type="submit" className="rounded bg-emerald-400 px-4 py-2 text-sm font-semibold text-[#10201b] hover:bg-emerald-300 disabled:opacity-50">{saving ? "Saving..." : "Record and issue receipt"}</button>
                    </footer>
                </form>
            </section>
        </div>
    );
}
