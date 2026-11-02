import { ReactNode } from "react";

interface CardProps {
    children: ReactNode;
    className?: string;
}

export default function Card({
    children,
    className = "",
}: CardProps) {
    return (
        <div
            className={`
        bg-white/10
        backdrop-blur-xl
        border border-white/10
        rounded-3xl
        shadow-xl
        p-6
        transition-all
        duration-300
        hover:shadow-2xl
        hover:scale-[1.01]
        ${className}
      `}
        >
            {children}
        </div>
    );
}