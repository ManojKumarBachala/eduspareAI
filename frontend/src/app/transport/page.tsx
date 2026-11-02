"use client";
/* The effect below synchronizes async API requests with view state. */
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState } from "react";
import axios from "axios";
import { AlertTriangle, BusFront, MapPinned, Plus, Route as RouteIcon, Search, UsersRound, Wrench } from "lucide-react";

import {
    AssignmentDialog,
    MaintenanceDialog,
    RouteDialog,
    VehicleDialog,
} from "../../components/transport/TransportDialogs";
import {
    createMaintenance,
    endTransportAssignment,
    getFleetSummary,
    getMaintenance,
    getRoutes,
    getTransportAssignments,
    getTransportStudents,
    getVehicles,
    saveRoute,
    saveTransportAssignment,
    saveVehicle,
} from "../../services/transportService";
import {
    FleetSummary,
    Route,
    RoutePayload,
    StudentTransportAssignment,
    StudentTransportAssignmentPayload,
    TransportStudent,
    Vehicle,
    VehicleMaintenance,
    VehicleMaintenancePayload,
    VehiclePayload,
} from "../../types/transport";

const emptySummary: FleetSummary = {
    can_manage: false,
    vehicle_count: 0,
    active_vehicles: 0,
    in_service: 0,
    retired: 0,
    compliance_due: 0,
    active_routes: 0,
    assigned_students: 0,
    maintenance_due: 0,
};

const tabs = [
    { id: "overview", label: "Overview", icon: BusFront },
    { id: "vehicles", label: "Vehicles", icon: BusFront },
    { id: "routes", label: "Routes", icon: MapPinned },
    { id: "students", label: "Student assignments", icon: UsersRound },
    { id: "maintenance", label: "Maintenance", icon: Wrench },
] as const;

type TabId = (typeof tabs)[number]["id"];

function apiError(error: unknown, fallback: string) {
    if (axios.isAxiosError(error)) {
        const data = error.response?.data;
        if (data && typeof data === "object") {
            const message = Object.values(data).flat().find((item) => typeof item === "string");
            if (typeof message === "string") return message;
        }
    }
    return fallback;
}

function dateLabel(value: string | null) {
    if (!value) return "Not set";
    return new Date(`${value}T12:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function money(value: string) {
    return `₹${Number(value).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function TransportPage() {
    const [summary, setSummary] = useState<FleetSummary>(emptySummary);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [routes, setRoutes] = useState<Route[]>([]);
    const [assignments, setAssignments] = useState<StudentTransportAssignment[]>([]);
    const [students, setStudents] = useState<TransportStudent[]>([]);
    const [maintenance, setMaintenance] = useState<VehicleMaintenance[]>([]);
    const [tab, setTab] = useState<TabId>("overview");
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [dialogError, setDialogError] = useState("");
    const [dialog, setDialog] = useState<"vehicle" | "route" | "assignment" | "maintenance" | null>(null);
    const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
    const [editingRoute, setEditingRoute] = useState<Route | null>(null);
    const [reload, setReload] = useState(0);

    useEffect(() => {
        let active = true;
        setLoading(true);
        setError("");
        Promise.all([
            getFleetSummary(),
            getVehicles(),
            getRoutes(),
            getTransportAssignments(),
            getTransportStudents(),
            getMaintenance(),
        ])
            .then(([fleet, vehicleRows, routeRows, assignmentRows, studentRows, maintenanceRows]) => {
                if (!active) return;
                setSummary(fleet);
                setVehicles(vehicleRows);
                setRoutes(routeRows);
                setAssignments(assignmentRows);
                setStudents(studentRows);
                setMaintenance(maintenanceRows);
            })
            .catch(() => {
                if (active) setError("Transport operations could not be loaded. Check your connection and try again.");
            })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [reload]);

    const filteredVehicles = vehicles.filter((vehicle) =>
        `${vehicle.vehicle_no} ${vehicle.driver_name} ${vehicle.make} ${vehicle.model}`.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()),
    );
    const filteredRoutes = routes.filter((route) =>
        `${route.route_name} ${route.start_point} ${route.end_point} ${route.vehicle_no}`.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()),
    );
    const complianceVehicles = vehicles.filter((vehicle) => vehicle.compliance_status !== "CURRENT");

    function openDialog(next: typeof dialog) {
        setDialogError("");
        setDialog(next);
    }

    async function handleVehicleSave(payload: VehiclePayload) {
        setSaving(true);
        setDialogError("");
        try {
            await saveVehicle(editingVehicle ? { ...payload, id: editingVehicle.id } : payload);
            setDialog(null);
            setEditingVehicle(null);
            setReload((value) => value + 1);
        } catch (saveError) {
            setDialogError(apiError(saveError, "Vehicle could not be saved."));
        } finally { setSaving(false); }
    }

    async function handleRouteSave(payload: RoutePayload) {
        setSaving(true);
        setDialogError("");
        try {
            await saveRoute(editingRoute ? { ...payload, id: editingRoute.id } : payload);
            setDialog(null);
            setEditingRoute(null);
            setReload((value) => value + 1);
        } catch (saveError) {
            setDialogError(apiError(saveError, "Route could not be saved."));
        } finally { setSaving(false); }
    }

    async function handleAssignmentSave(payload: StudentTransportAssignmentPayload) {
        setSaving(true);
        setDialogError("");
        try {
            await saveTransportAssignment(payload);
            setDialog(null);
            setReload((value) => value + 1);
        } catch (saveError) {
            setDialogError(apiError(saveError, "Student could not be assigned. Check route capacity."));
        } finally { setSaving(false); }
    }

    async function handleMaintenanceSave(payload: VehicleMaintenancePayload) {
        setSaving(true);
        setDialogError("");
        try {
            await createMaintenance(payload);
            setDialog(null);
            setReload((value) => value + 1);
        } catch (saveError) {
            setDialogError(apiError(saveError, "Maintenance entry could not be saved."));
        } finally { setSaving(false); }
    }

    async function handleEndAssignment(assignment: StudentTransportAssignment) {
        if (!window.confirm(`End ${assignment.student_name}'s assignment to ${assignment.route_name}?`)) return;
        try {
            await endTransportAssignment(assignment.id);
            setReload((value) => value + 1);
        } catch (requestError) {
            setError(apiError(requestError, "The route assignment could not be ended."));
        }
    }

    return (
        <main className="min-h-screen bg-transparent px-4 py-7 text-white sm:px-8">
            <div className="mx-auto max-w-7xl">
                <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">Fleet operations</p>
                        <h1 className="text-3xl font-semibold">Transport</h1>
                        <p className="mt-1 text-sm text-slate-400">Vehicles, routes, student loads, and service readiness</p>
                    </div>
                    {summary.can_manage && <div className="flex flex-wrap gap-2">
                        {tab === "vehicles" && <button type="button" onClick={() => { setEditingVehicle(null); openDialog("vehicle"); }} className="inline-flex items-center gap-2 rounded bg-emerald-400 px-4 py-2.5 text-sm font-semibold text-[#10201b] hover:bg-emerald-300"><Plus size={16} /> Add vehicle</button>}
                        {tab === "routes" && <button type="button" onClick={() => { setEditingRoute(null); openDialog("route"); }} className="inline-flex items-center gap-2 rounded bg-emerald-400 px-4 py-2.5 text-sm font-semibold text-[#10201b] hover:bg-emerald-300"><Plus size={16} /> Add route</button>}
                        {tab === "students" && <button type="button" onClick={() => openDialog("assignment")} className="inline-flex items-center gap-2 rounded bg-emerald-400 px-4 py-2.5 text-sm font-semibold text-[#10201b] hover:bg-emerald-300"><Plus size={16} /> Assign student</button>}
                        {tab === "maintenance" && <button type="button" onClick={() => openDialog("maintenance")} disabled={!vehicles.length} className="inline-flex items-center gap-2 rounded bg-emerald-400 px-4 py-2.5 text-sm font-semibold text-[#10201b] hover:bg-emerald-300 disabled:opacity-50"><Plus size={16} /> Log maintenance</button>}
                    </div>}
                </header>

                {error && <div role="alert" className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded border border-rose-400/20 bg-rose-400/5 px-4 py-3 text-sm text-rose-200"><span>{error}</span><button type="button" onClick={() => setReload((value) => value + 1)} className="font-medium underline underline-offset-2">Retry</button></div>}

                <nav aria-label="Transport sections" className="mb-5 flex gap-1 overflow-x-auto border-b border-white/10">
                    {tabs.map((item) => { const Icon = item.icon; return <button key={item.id} type="button" onClick={() => { setTab(item.id); setSearch(""); }} className={`inline-flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-sm ${tab === item.id ? "border-emerald-400 text-white" : "border-transparent text-slate-500 hover:text-slate-200"}`}><Icon size={16} />{item.label}</button>; })}
                </nav>

                {loading ? <p className="py-16 text-center text-sm text-slate-400">Loading fleet operations...</p> : <>
                    {tab === "overview" && <Overview summary={summary} vehicles={vehicles} routes={routes} complianceVehicles={complianceVehicles} onTab={setTab} />}
                    {tab === "vehicles" && <VehicleList vehicles={filteredVehicles} search={search} setSearch={setSearch} canManage={summary.can_manage} onEdit={(vehicle) => { setEditingVehicle(vehicle); openDialog("vehicle"); }} />}
                    {tab === "routes" && <RouteList routes={filteredRoutes} vehicles={vehicles} search={search} setSearch={setSearch} canManage={summary.can_manage} onEdit={(route) => { setEditingRoute(route); openDialog("route"); }} />}
                    {tab === "students" && <AssignmentList assignments={assignments} onEnd={(assignment) => void handleEndAssignment(assignment)} />}
                    {tab === "maintenance" && <MaintenanceList maintenance={maintenance} />}
                </>}
            </div>

            {dialog === "vehicle" && summary.can_manage && <VehicleDialog vehicle={editingVehicle} saving={saving} error={dialogError} onClose={() => setDialog(null)} onSubmit={(payload) => void handleVehicleSave(payload)} />}
            {dialog === "route" && summary.can_manage && <RouteDialog route={editingRoute} vehicles={vehicles} saving={saving} error={dialogError} onClose={() => setDialog(null)} onSubmit={(payload) => void handleRouteSave(payload)} />}
            {dialog === "assignment" && summary.can_manage && <AssignmentDialog students={students} routes={routes} saving={saving} error={dialogError} onClose={() => setDialog(null)} onSubmit={(payload) => void handleAssignmentSave(payload)} />}
            {dialog === "maintenance" && summary.can_manage && <MaintenanceDialog vehicles={vehicles} saving={saving} error={dialogError} onClose={() => setDialog(null)} onSubmit={(payload) => void handleMaintenanceSave(payload)} />}
        </main>
    );
}

function Overview({ summary, vehicles, routes, complianceVehicles, onTab }: {
    summary: FleetSummary;
    vehicles: Vehicle[];
    routes: Route[];
    complianceVehicles: Vehicle[];
    onTab: (tab: TabId) => void;
}) {
    return <div className="space-y-6">
        <section aria-label="Fleet summary" className="grid grid-cols-2 gap-4 border-y border-white/10 py-5 sm:grid-cols-4">
            <Metric icon={<BusFront size={18} />} label="Fleet vehicles" value={summary.vehicle_count} detail={`${summary.active_vehicles} active · ${summary.in_service} in service`} />
            <Metric icon={<RouteIcon size={18} />} label="Active routes" value={summary.active_routes} detail={`${routes.filter((route) => route.assigned_vehicle).length} with a vehicle assigned`} />
            <Metric icon={<UsersRound size={18} />} label="Riders assigned" value={summary.assigned_students} detail="Active student route assignments" />
            <Metric icon={<Wrench size={18} />} label="Due soon" value={summary.compliance_due} detail={`${summary.maintenance_due} service checks due`} color={summary.compliance_due ? "text-amber-200" : "text-white"} />
        </section>
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <section className="overflow-hidden rounded-lg border border-white/10 bg-white/[0.02]">
                <header className="flex items-center justify-between border-b border-white/10 px-4 py-3"><div><h2 className="font-medium">Compliance watch</h2><p className="mt-0.5 text-xs text-slate-500">Insurance, fitness, permits, and service dates</p></div><button type="button" onClick={() => onTab("vehicles")} className="text-xs text-emerald-200 hover:text-white">View fleet</button></header>
                {complianceVehicles.length === 0 ? <p className="px-4 py-10 text-center text-sm text-slate-500">No vehicle checks due in the next 30 days.</p> : <div className="divide-y divide-white/[0.07]">{complianceVehicles.map((vehicle) => <div key={vehicle.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"><div className="flex items-center gap-3"><AlertTriangle className={vehicle.compliance_status === "OVERDUE" ? "text-rose-300" : "text-amber-200"} size={17} /><div><p className="text-sm font-medium text-white">{vehicle.vehicle_no} · {vehicle.driver_name}</p><p className="mt-0.5 text-xs text-slate-500">{vehicleStatusDescription(vehicle)}</p></div></div><StatusBadge label={vehicle.compliance_status === "OVERDUE" ? "Overdue" : "Due soon"} danger={vehicle.compliance_status === "OVERDUE"} /></div>)}</div>}
            </section>
            <section className="overflow-hidden rounded-lg border border-white/10 bg-white/[0.02]">
                <header className="flex items-center justify-between border-b border-white/10 px-4 py-3"><div><h2 className="font-medium">Route loads</h2><p className="mt-0.5 text-xs text-slate-500">Current riders versus vehicle capacity</p></div><button type="button" onClick={() => onTab("routes")} className="text-xs text-emerald-200 hover:text-white">View routes</button></header>
                {routes.filter((route) => route.is_active).length === 0 ? <p className="px-4 py-10 text-center text-sm text-slate-500">No active routes configured.</p> : <div className="space-y-4 p-4">{routes.filter((route) => route.is_active).slice(0, 6).map((route) => { const vehicle = vehicles.find((item) => item.id === route.assigned_vehicle); const load = vehicle ? Math.min(100, route.assigned_students / vehicle.capacity * 100) : 0; return <div key={route.id}><div className="mb-1.5 flex items-center justify-between gap-2"><div><p className="text-sm font-medium text-white">{route.route_name}</p><p className="text-xs text-slate-500">{route.vehicle_no || "No vehicle assigned"}</p></div><span className="text-xs tabular-nums text-slate-400">{route.assigned_students}{vehicle ? ` / ${vehicle.capacity}` : " riders"}</span></div><div className="h-1.5 overflow-hidden rounded bg-white/10"><div className={`h-full rounded ${load >= 90 ? "bg-amber-300" : "bg-emerald-400"}`} style={{ width: `${load}%` }} /></div></div>; })}</div>}
            </section>
        </div>
        <div className="flex flex-wrap gap-2">{summary.can_manage && <button type="button" onClick={() => onTab("vehicles")} className="rounded border border-white/15 px-3 py-2 text-sm text-slate-200 hover:bg-white/5">Manage vehicles</button>}<button type="button" onClick={() => onTab("students")} className="rounded border border-white/15 px-3 py-2 text-sm text-slate-200 hover:bg-white/5">Student assignments</button><button type="button" onClick={() => onTab("maintenance")} className="rounded border border-white/15 px-3 py-2 text-sm text-slate-200 hover:bg-white/5">Maintenance history</button></div>
    </div>;
}

function VehicleList({ vehicles, search, setSearch, canManage, onEdit }: { vehicles: Vehicle[]; search: string; setSearch: (value: string) => void; canManage: boolean; onEdit: (vehicle: Vehicle) => void }) {
    return <section className="overflow-hidden rounded-lg border border-white/10 bg-white/[0.02]">
        <ListHeader title="Vehicle register" count={vehicles.length} search={search} setSearch={setSearch} placeholder="Registration, driver, make" />
        <div className="overflow-x-auto"><table className="min-w-[1000px] w-full text-left text-sm text-slate-200"><thead className="border-b border-white/10 text-xs uppercase tracking-wider text-slate-500"><tr><th className="px-4 py-3">Vehicle</th><th className="px-4 py-3">Driver</th><th className="px-4 py-3">Capacity</th><th className="px-4 py-3">Odometer</th><th className="px-4 py-3">Next service</th><th className="px-4 py-3">Compliance</th><th className="px-4 py-3">Status</th>{canManage && <th className="px-4 py-3 text-right">Action</th>}</tr></thead><tbody>
            {vehicles.length === 0 ? <tr><td colSpan={canManage ? 8 : 7} className="px-4 py-12 text-center text-slate-500">No vehicles match this search.</td></tr> : vehicles.map((vehicle) => <tr key={vehicle.id} className="border-b border-white/[0.07]"><td className="px-4 py-3.5"><p className="font-medium text-white">{vehicle.vehicle_no}</p><p className="mt-0.5 text-xs text-slate-500">{[vehicle.make, vehicle.model, vehicle.year].filter(Boolean).join(" ") || vehicle.vehicle_type}</p></td><td className="px-4 py-3.5">{vehicle.driver_name}<p className="mt-0.5 text-xs text-slate-500">{vehicle.driver_phone || "No phone recorded"}</p></td><td className="px-4 py-3.5">{vehicle.capacity} seats</td><td className="px-4 py-3.5">{vehicle.odometer_km.toLocaleString()} km</td><td className="px-4 py-3.5">{dateLabel(vehicle.next_service_due)}</td><td className="px-4 py-3.5"><StatusBadge label={vehicle.compliance_status === "CURRENT" ? "Current" : vehicle.compliance_status === "OVERDUE" ? "Overdue" : "Due soon"} danger={vehicle.compliance_status === "OVERDUE"} /></td><td className="px-4 py-3.5"><StatusBadge label={vehicle.status === "ACTIVE" ? "Active" : vehicle.status === "SERVICE" ? "In service" : "Retired"} /></td>{canManage && <td className="px-4 py-3.5 text-right"><button type="button" onClick={() => onEdit(vehicle)} className="rounded border border-white/10 px-3 py-2 text-xs text-slate-300 hover:bg-white/5">Edit</button></td>}</tr>)}
        </tbody></table></div>
    </section>;
}

function RouteList({ routes, vehicles, search, setSearch, canManage, onEdit }: { routes: Route[]; vehicles: Vehicle[]; search: string; setSearch: (value: string) => void; canManage: boolean; onEdit: (route: Route) => void }) {
    return <section className="overflow-hidden rounded-lg border border-white/10 bg-white/[0.02]">
        <ListHeader title="Route planner" count={routes.length} search={search} setSearch={setSearch} placeholder="Route, point, vehicle" />
        {routes.length === 0 ? <p className="px-4 py-12 text-center text-sm text-slate-500">No routes match this search.</p> : <div className="divide-y divide-white/[0.07]">{routes.map((route) => { const vehicle = vehicles.find((item) => item.id === route.assigned_vehicle); const stops = [route.start_point, ...route.stops, route.end_point]; const utilization = vehicle ? route.assigned_students / vehicle.capacity : 0; return <article key={route.id} className="grid gap-4 p-4 lg:grid-cols-[1fr_1.2fr_0.8fr_auto] lg:items-center"><div><div className="flex items-center gap-2"><h3 className="font-medium text-white">{route.route_name}</h3><StatusBadge label={route.is_active ? "Active" : "Inactive"} /></div><p className="mt-1 text-xs text-slate-500">{route.start_point} to {route.end_point}</p><p className="mt-1 text-xs text-slate-500">{route.distance_km} km · {route.estimated_minutes || "--"} min</p></div><div><p className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-500">Stops</p><div className="flex flex-wrap items-center gap-1.5">{stops.map((stop, index) => <span key={`${stop}-${index}`} className="text-xs text-slate-300"><span className="rounded bg-white/[0.06] px-2 py-1">{stop}</span>{index < stops.length - 1 && <span className="mx-1 text-slate-600">›</span>}</span>)}</div></div><div><p className="text-sm text-slate-200">{route.vehicle_no || "Vehicle unassigned"}</p><p className="mt-0.5 text-xs text-slate-500">{route.driver_name || "Driver unassigned"}</p><p className="mt-1 text-xs text-slate-400">{route.assigned_students}{vehicle ? ` / ${vehicle.capacity} seats` : " students"}</p>{vehicle && <div className="mt-1 h-1 overflow-hidden rounded bg-white/10"><div className={`h-full ${utilization >= 0.9 ? "bg-amber-300" : "bg-emerald-400"}`} style={{ width: `${Math.min(utilization * 100, 100)}%` }} /></div>}</div>{canManage && <button type="button" onClick={() => onEdit(route)} className="rounded border border-white/10 px-3 py-2 text-xs text-slate-300 hover:bg-white/5">Edit route</button>}</article>; })}</div>}
    </section>;
}

function AssignmentList({ assignments, onEnd }: { assignments: StudentTransportAssignment[]; onEnd: (assignment: StudentTransportAssignment) => void }) {
    return <section className="overflow-hidden rounded-lg border border-white/10 bg-white/[0.02]"><header className="border-b border-white/10 px-4 py-3"><h2 className="font-medium">Student route assignments</h2><p className="mt-0.5 text-xs text-slate-500">{assignments.filter((item) => item.is_active).length} active assignments</p></header><div className="overflow-x-auto"><table className="min-w-[950px] w-full text-left text-sm text-slate-200"><thead className="border-b border-white/10 text-xs uppercase tracking-wider text-slate-500"><tr><th className="px-4 py-3">Student</th><th className="px-4 py-3">Route</th><th className="px-4 py-3">Pickup</th><th className="px-4 py-3">Drop-off</th><th className="px-4 py-3">Start date</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Action</th></tr></thead><tbody>{assignments.length === 0 ? <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-500">No student route assignments yet.</td></tr> : assignments.map((item) => <tr key={item.id} className="border-b border-white/[0.07]"><td className="px-4 py-3.5"><p className="font-medium text-white">{item.student_name}</p><p className="mt-0.5 text-xs text-slate-500">{item.admission_no} · Grade {item.grade}-{item.section}</p></td><td className="px-4 py-3.5">{item.route_name}</td><td className="px-4 py-3.5">{item.pickup_stop}</td><td className="px-4 py-3.5">{item.dropoff_stop}</td><td className="px-4 py-3.5">{dateLabel(item.start_date)}</td><td className="px-4 py-3.5"><StatusBadge label={item.is_active ? "Active" : "Ended"} /></td><td className="px-4 py-3.5 text-right">{item.is_active && <button type="button" onClick={() => onEnd(item)} className="rounded border border-rose-300/20 px-3 py-2 text-xs text-rose-200 hover:bg-rose-300/10">End assignment</button>}</td></tr>)}</tbody></table></div></section>;
}

function MaintenanceList({ maintenance }: { maintenance: VehicleMaintenance[] }) {
    return <section className="overflow-hidden rounded-lg border border-white/10 bg-white/[0.02]"><header className="border-b border-white/10 px-4 py-3"><h2 className="font-medium">Maintenance and inspections</h2><p className="mt-0.5 text-xs text-slate-500">Service history, costs, and next service dates</p></header><div className="overflow-x-auto"><table className="min-w-[900px] w-full text-left text-sm text-slate-200"><thead className="border-b border-white/10 text-xs uppercase tracking-wider text-slate-500"><tr><th className="px-4 py-3">Vehicle</th><th className="px-4 py-3">Work</th><th className="px-4 py-3">Date</th><th className="px-4 py-3">Odometer</th><th className="px-4 py-3">Cost</th><th className="px-4 py-3">Vendor</th><th className="px-4 py-3">Next due</th></tr></thead><tbody>{maintenance.length === 0 ? <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-500">No service history recorded.</td></tr> : maintenance.map((item) => <tr key={item.id} className="border-b border-white/[0.07]"><td className="px-4 py-3.5 font-medium text-white">{item.vehicle_no}</td><td className="px-4 py-3.5"><p>{item.description}</p><p className="mt-0.5 text-xs text-slate-500">{item.kind}</p></td><td className="px-4 py-3.5">{dateLabel(item.service_date)}</td><td className="px-4 py-3.5">{item.odometer_km.toLocaleString()} km</td><td className="px-4 py-3.5">{money(item.cost)}</td><td className="px-4 py-3.5">{item.vendor || "—"}</td><td className="px-4 py-3.5">{dateLabel(item.next_service_due)}</td></tr>)}</tbody></table></div></section>;
}

function ListHeader({ title, count, search, setSearch, placeholder }: { title: string; count: number; search: string; setSearch: (value: string) => void; placeholder: string }) {
    return <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 p-4"><div><h2 className="font-medium">{title}</h2><p className="mt-0.5 text-xs text-slate-500">{count} records</p></div><label className="flex min-w-0 items-center gap-2 rounded border border-white/15 bg-white/[0.03] px-3 text-slate-400 focus-within:border-emerald-400 sm:w-72"><Search size={16} /><input aria-label={`Search ${title.toLowerCase()}`} type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={placeholder} className="min-w-0 flex-1 bg-transparent py-2.5 text-sm text-white outline-none placeholder:text-slate-500" /></label></header>;
}

function Metric({ icon, label, value, detail, color = "text-white" }: { icon: React.ReactNode; label: string; value: number; detail: string; color?: string }) {
    return <div className="flex items-start gap-3"><span className="mt-0.5 text-slate-500">{icon}</span><div><p className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</p><p className={`mt-1 text-2xl font-semibold tabular-nums ${color}`}>{value}</p><p className="mt-1 text-xs text-slate-500">{detail}</p></div></div>;
}

function StatusBadge({ label, danger = false }: { label: string; danger?: boolean }) {
    return <span className={`rounded px-2 py-1 text-xs font-medium ${danger ? "bg-rose-300/10 text-rose-200" : "bg-emerald-300/10 text-emerald-200"}`}>{label}</span>;
}

function vehicleStatusDescription(vehicle: Vehicle) {
    const dates = [
        ["Insurance", vehicle.insurance_expiry],
        ["Fitness", vehicle.fitness_expiry],
        ["Permit", vehicle.permit_expiry],
        ["Service", vehicle.next_service_due],
    ] as const;
    const due = dates.filter((item) => item[1]).sort((left, right) => left[1]!.localeCompare(right[1]!))[0];
    return due ? `${due[0]} · ${dateLabel(due[1])}` : "Compliance check required";
}
