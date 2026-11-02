interface Props {
    title: string;
    value: string | number;
}

export default function DashboardCard({
    title,
    value,
}: Props) {
    return (
        <div className="
      bg-white/10
      backdrop-blur-xl
      border
      border-white/10
      rounded-3xl
      p-6
      shadow-xl
      hover:scale-105
      transition
    ">

            <h3 className="text-slate-300">
                {title}
            </h3>

            <h2 className="
        text-4xl
        font-bold
        text-white
        mt-3
      ">
                {value}
            </h2>

        </div>
    );
}