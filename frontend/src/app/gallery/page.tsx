import Image from "next/image";

const moments = [
    ["Learning spaces", "Bright rooms designed for curiosity", "object-[center_20%]"],
    ["Our campus", "A welcoming place to learn and belong", "object-[center_45%]"],
    ["Student life", "Friendships, clubs, and shared moments", "object-[center_65%]"],
    ["Beyond the classroom", "Experiences that turn lessons into memories", "object-[center_80%]"],
    ["Community", "Families and teachers growing together", "object-center"],
    ["The next chapter", "Every day starts with possibility", "object-[center_35%]"],
];

export default function GalleryPage() {
    return (
        <main className="min-h-screen bg-transparent px-4 py-10 text-white sm:px-8">
            <div className="mx-auto max-w-7xl">
                <header className="mb-10 max-w-2xl"><p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">New Little Flower EM School · Wyra</p><h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">A school full of moments worth remembering.</h1><p className="mt-4 text-base leading-7 text-slate-400">Celebrating learning, joy, and togetherness across our Wyra school community.</p></header>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{moments.map(([title, caption, position], index) => <article key={title} className={`group relative min-h-72 overflow-hidden rounded-3xl border border-white/10 bg-slate-900 ${index === 0 || index === 3 ? "lg:row-span-2 lg:min-h-[590px]" : ""}`}><Image src="/images/school-bg.jpg" alt={title} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className={`object-cover transition duration-700 group-hover:scale-105 ${position}`} /><div className="absolute inset-0 bg-gradient-to-t from-[#061117] via-[#061117]/25 to-transparent" /><div className="absolute inset-x-0 bottom-0 p-6"><p className="text-xs font-semibold uppercase tracking-wider text-emerald-300">0{index + 1}</p><h2 className="mt-2 text-xl font-semibold text-white">{title}</h2><p className="mt-1 text-sm text-slate-300">{caption}</p></div></article>)}</div>
            </div>
        </main>
    );
}
