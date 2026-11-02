interface Props {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

export default function SearchInput({
    value,
    onChange,
    placeholder = "Search...",
}: Props) {
    return (
        <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="
        w-full
        rounded-xl
        bg-white/10
        border
        border-white/10
        p-3
        text-white
        placeholder:text-slate-400
        focus:outline-none
        focus:ring-2
        focus:ring-blue-500
      "
        />
    );
}