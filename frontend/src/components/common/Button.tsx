interface ButtonProps {
    children: React.ReactNode;
    onClick?: () => void;
    className?: string;
    type?: "button" | "submit";
}

export default function Button({
    children,
    onClick,
    className = "",
    type = "button",
}: ButtonProps) {
    return (
        <button
            type={type}
            onClick={onClick}
            className={`
        px-5
        py-3
        rounded-xl
        bg-blue-600
        hover:bg-blue-700
        text-white
        font-semibold
        transition
        ${className}
      `}
        >
            {children}
        </button>
    );
}