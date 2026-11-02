import Sidebar from "./SidebarTemp";

export default function Layout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen">
            <Sidebar />

            <main className="flex-1 bg-gray-100 p-8">
                {children}
            </main>
        </div>
    );
}