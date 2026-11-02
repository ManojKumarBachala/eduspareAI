interface Props {
    message: string;
}

export default function EmptyState({
    message,
}: Props) {
    return (
        <div className="text-center py-16 text-slate-400">
            <div className="text-6xl mb-4">📂</div>

            <h2 className="text-xl">{message}</h2>
        </div>
    );
}