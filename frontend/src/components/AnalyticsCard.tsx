interface Props {
    title: string;
    value: number | string;
}

export default function AnalyticsCard({
    title,
    value,
}: Props) {
    return (
        <div
            className="
      bg-white/10
      backdrop-blur-xl
      border border-white/10
      rounded-3xl
      p-6
      text-white
      shadow-lg
    "
        >
            <h3 className="text-slate-300 text-lg">
                {title}
            </h3>

            <h2 className="text-4xl font-bold mt-2">
                {value}
            </h2>
        </div>
    );
}