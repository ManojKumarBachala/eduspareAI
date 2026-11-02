import { ReactNode } from "react";

interface Props {
    open: boolean;
    onClose: () => void;
    children: ReactNode;
}

export default function Modal({
    open,
    onClose,
    children,
}: Props) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50">
            <div className="bg-slate-900 rounded-3xl p-8 w-full max-w-2xl relative">

                <button
                    onClick={onClose}
                    className="absolute top-4 right-5 text-white text-xl"
                >
                    ✕
                </button>

                {children}

            </div>
        </div>
    );
}