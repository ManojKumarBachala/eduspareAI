"use client";

export default function SearchBar() {
    return (
        <input
            type="text"
            placeholder="Search students, teachers..."
            className="
        w-full
        p-3
        rounded-xl
        bg-white/10
        text-white
        border
        border-white/20
      "
        />
    );
}