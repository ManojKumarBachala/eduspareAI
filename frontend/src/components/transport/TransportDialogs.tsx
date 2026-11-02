"use client";

import { FormEvent, ReactNode, useState } from "react";
import { X } from "lucide-react";

import {
    MaintenanceKind,
    Route,
    RoutePayload,
    StudentTransportAssignmentPayload,
    TransportStudent,
    Vehicle,
    VehicleMaintenancePayload,
    VehiclePayload,
} from "../../types/transport";

const inputClass = "w-full rounded border border-white/15 bg-[#18201f] px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-400";
const labelClass = "mb-1.5 block text-xs font-medium text-slate-300";

function DialogShell({ title, eyebrow, error, saving, onClose, onSubmit, children }: {
    title: string;
    eyebrow: string;
    error: string;
    saving: boolean;
    onClose: () => void;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
    children: ReactNode;
}) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <section aria-modal="true" aria-labelledby="transport-dialog-title" role="dialog" className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-white/10 bg-[#111918] shadow-2xl">
                <header className="flex items-start justify-between border-b border-white/10 px-6 py-5">
                    <div><p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">{eyebrow}</p><h2 id="transport-dialog-title" className="mt-1 text-xl font-semibold text-white">{title}</h2></div>
                    <button type="button" onClick={onClose} aria-label="Close dialog" className="rounded p-2 text-slate-400 hover:bg-white/10 hover:text-white"><X size={18} /></button>
                </header>
                <form onSubmit={onSubmit} className="space-y-5 px-6 py-5">
                    {children}
                    {error && <p role="alert" className="rounded border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-sm text-rose-200">{error}</p>}
                    <footer className="flex justify-end gap-3 border-t border-white/10 pt-4">
                        <button type="button" onClick={onClose} className="rounded border border-white/15 px-4 py-2 text-sm text-slate-200 hover:bg-white/5">Cancel</button>
                        <button disabled={saving} type="submit" className="rounded bg-emerald-400 px-4 py-2 text-sm font-semibold text-[#10201b] hover:bg-emerald-300 disabled:opacity-50">{saving ? "Saving..." : "Save"}</button>
                    </footer>
                </form>
            </section>
        </div>
    );
}

export function VehicleDialog({ vehicle, saving, error, onClose, onSubmit }: {
    vehicle: Vehicle | null;
    saving: boolean;
    error: string;
    onClose: () => void;
    onSubmit: (payload: VehiclePayload) => void;
}) {
    const [vehicleNo, setVehicleNo] = useState(vehicle?.vehicle_no ?? "");
    const [driverName, setDriverName] = useState(vehicle?.driver_name ?? "");
    const [driverPhone, setDriverPhone] = useState(vehicle?.driver_phone ?? "");
    const [vehicleType, setVehicleType] = useState(vehicle?.vehicle_type ?? "BUS");
    const [status, setStatus] = useState(vehicle?.status ?? "ACTIVE");
    const [fuelType, setFuelType] = useState(vehicle?.fuel_type ?? "DIESEL");
    const [make, setMake] = useState(vehicle?.make ?? "");
    const [model, setModel] = useState(vehicle?.model ?? "");
    const [year, setYear] = useState(vehicle?.year?.toString() ?? "");
    const [capacity, setCapacity] = useState(vehicle?.capacity ?? 30);
    const [odometer, setOdometer] = useState(vehicle?.odometer_km ?? 0);
    const [insurance, setInsurance] = useState(vehicle?.insurance_expiry ?? "");
    const [fitness, setFitness] = useState(vehicle?.fitness_expiry ?? "");
    const [permit, setPermit] = useState(vehicle?.permit_expiry ?? "");
    const [serviceDue, setServiceDue] = useState(vehicle?.next_service_due ?? "");
    const [notes, setNotes] = useState(vehicle?.notes ?? "");

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        onSubmit({
            vehicle_no: vehicleNo.trim(),
            driver_name: driverName.trim(),
            driver_phone: driverPhone.trim(),
            vehicle_type: vehicleType as Vehicle["vehicle_type"],
            status: status as Vehicle["status"],
            fuel_type: fuelType as Vehicle["fuel_type"],
            make: make.trim(),
            model: model.trim(),
            year: year ? Number(year) : null,
            capacity,
            odometer_km: odometer,
            insurance_expiry: insurance || null,
            fitness_expiry: fitness || null,
            permit_expiry: permit || null,
            next_service_due: serviceDue || null,
            notes: notes.trim(),
        });
    }

    return <DialogShell title={vehicle ? "Edit vehicle" : "Add vehicle"} eyebrow="Fleet register" error={error} saving={saving} onClose={onClose} onSubmit={submit}>
        <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Registration number"><input required maxLength={50} value={vehicleNo} onChange={(event) => setVehicleNo(event.target.value)} className={inputClass} /></Field>
            <Field label="Vehicle type"><select value={vehicleType} onChange={(event) => setVehicleType(event.target.value as Vehicle["vehicle_type"])} className={inputClass}><option value="BUS">Bus</option><option value="MINIBUS">Minibus</option><option value="VAN">Van</option><option value="CAR">Car</option><option value="OTHER">Other</option></select></Field>
            <Field label="Driver"><input required maxLength={100} value={driverName} onChange={(event) => setDriverName(event.target.value)} className={inputClass} /></Field>
            <Field label="Driver phone"><input type="tel" maxLength={20} value={driverPhone} onChange={(event) => setDriverPhone(event.target.value)} className={inputClass} /></Field>
            <Field label="Status"><select value={status} onChange={(event) => setStatus(event.target.value as Vehicle["status"])} className={inputClass}><option value="ACTIVE">Active</option><option value="SERVICE">In service</option><option value="RETIRED">Retired</option></select></Field>
            <Field label="Fuel type"><select value={fuelType} onChange={(event) => setFuelType(event.target.value as Vehicle["fuel_type"])} className={inputClass}><option value="DIESEL">Diesel</option><option value="PETROL">Petrol</option><option value="CNG">CNG</option><option value="ELECTRIC">Electric</option><option value="OTHER">Other</option></select></Field>
            <Field label="Make"><input maxLength={60} value={make} onChange={(event) => setMake(event.target.value)} className={inputClass} /></Field>
            <Field label="Model"><input maxLength={60} value={model} onChange={(event) => setModel(event.target.value)} className={inputClass} /></Field>
            <Field label="Year"><input type="number" min={1980} max={2100} value={year} onChange={(event) => setYear(event.target.value)} className={inputClass} /></Field>
            <Field label="Passenger capacity"><input required type="number" min={1} value={capacity} onChange={(event) => setCapacity(Number(event.target.value))} className={inputClass} /></Field>
            <Field label="Odometer (km)"><input type="number" min={0} value={odometer} onChange={(event) => setOdometer(Number(event.target.value))} className={inputClass} /></Field>
            <Field label="Next service due"><input type="date" value={serviceDue} onChange={(event) => setServiceDue(event.target.value)} className={inputClass} /></Field>
            <Field label="Insurance expiry"><input type="date" value={insurance} onChange={(event) => setInsurance(event.target.value)} className={inputClass} /></Field>
            <Field label="Fitness expiry"><input type="date" value={fitness} onChange={(event) => setFitness(event.target.value)} className={inputClass} /></Field>
            <Field label="Permit expiry"><input type="date" value={permit} onChange={(event) => setPermit(event.target.value)} className={inputClass} /></Field>
        </div>
        <Field label="Fleet notes"><textarea rows={2} maxLength={300} value={notes} onChange={(event) => setNotes(event.target.value)} className={inputClass} /></Field>
    </DialogShell>;
}

export function RouteDialog({ route, vehicles, saving, error, onClose, onSubmit }: {
    route: Route | null;
    vehicles: Vehicle[];
    saving: boolean;
    error: string;
    onClose: () => void;
    onSubmit: (payload: RoutePayload) => void;
}) {
    const [name, setName] = useState(route?.route_name ?? "");
    const [start, setStart] = useState(route?.start_point ?? "");
    const [end, setEnd] = useState(route?.end_point ?? "");
    const [stops, setStops] = useState(route?.stops.join("\n") ?? "");
    const [distance, setDistance] = useState(route?.distance_km ?? "0.00");
    const [minutes, setMinutes] = useState(route?.estimated_minutes ?? 0);
    const [pickup, setPickup] = useState(route?.pickup_time?.slice(0, 5) ?? "");
    const [dropoff, setDropoff] = useState(route?.dropoff_time?.slice(0, 5) ?? "");
    const [vehicle, setVehicle] = useState(route?.assigned_vehicle ?? 0);
    const [active, setActive] = useState(route?.is_active ?? true);

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        onSubmit({
            route_name: name.trim(), start_point: start.trim(), end_point: end.trim(),
            stops: stops.split("\n").map((item) => item.trim()).filter(Boolean),
            distance_km: distance, estimated_minutes: minutes,
            pickup_time: pickup || null, dropoff_time: dropoff || null,
            assigned_vehicle: vehicle || null, is_active: active,
        });
    }

    return <DialogShell title={route ? "Edit route" : "Create route"} eyebrow="Route planning" error={error} saving={saving} onClose={onClose} onSubmit={submit}>
        <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Route name"><input required maxLength={100} value={name} onChange={(event) => setName(event.target.value)} className={inputClass} /></Field>
            <Field label="Assigned vehicle"><select value={vehicle || ""} onChange={(event) => setVehicle(Number(event.target.value))} className={inputClass}><option value="">Unassigned</option>{vehicles.filter((item) => item.status === "ACTIVE").map((item) => <option key={item.id} value={item.id}>{item.vehicle_no} · {item.capacity} seats</option>)}</select></Field>
            <Field label="Start point"><input required maxLength={100} value={start} onChange={(event) => setStart(event.target.value)} className={inputClass} /></Field>
            <Field label="End point"><input required maxLength={100} value={end} onChange={(event) => setEnd(event.target.value)} className={inputClass} /></Field>
            <Field label="Pickup time"><input type="time" value={pickup} onChange={(event) => setPickup(event.target.value)} className={inputClass} /></Field>
            <Field label="Return time"><input type="time" value={dropoff} onChange={(event) => setDropoff(event.target.value)} className={inputClass} /></Field>
            <Field label="Distance (km)"><input type="number" min={0} step="0.01" value={distance} onChange={(event) => setDistance(event.target.value)} className={inputClass} /></Field>
            <Field label="Estimated duration (min)"><input type="number" min={0} value={minutes} onChange={(event) => setMinutes(Number(event.target.value))} className={inputClass} /></Field>
            <Field label="Route status"><select value={active ? "active" : "inactive"} onChange={(event) => setActive(event.target.value === "active")} className={inputClass}><option value="active">Active</option><option value="inactive">Inactive</option></select></Field>
        </div>
        <Field label="Stops, in order"><textarea required rows={4} value={stops} onChange={(event) => setStops(event.target.value)} placeholder="One stop per line" className={inputClass} /></Field>
    </DialogShell>;
}

export function AssignmentDialog({ students, routes, saving, error, onClose, onSubmit }: {
    students: TransportStudent[];
    routes: Route[];
    saving: boolean;
    error: string;
    onClose: () => void;
    onSubmit: (payload: StudentTransportAssignmentPayload) => void;
}) {
    const availableStudents = students.filter((student) => !student.assigned);
    const activeRoutes = routes.filter((route) => route.is_active);
    const [student, setStudent] = useState(availableStudents[0]?.id ?? 0);
    const [route, setRoute] = useState(activeRoutes[0]?.id ?? 0);
    const [pickup, setPickup] = useState("");
    const [dropoff, setDropoff] = useState("");
    const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
    const [notes, setNotes] = useState("");

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        onSubmit({ student, route, pickup_stop: pickup.trim(), dropoff_stop: dropoff.trim(), start_date: startDate, end_date: null, is_active: true, notes: notes.trim() });
    }

    return <DialogShell title="Assign student to route" eyebrow="Student transport" error={error} saving={saving} onClose={onClose} onSubmit={submit}>
        <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Student"><select required value={student || ""} onChange={(event) => setStudent(Number(event.target.value))} className={inputClass}>{availableStudents.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.admission_no} · {item.grade}-{item.section}</option>)}</select></Field>
            <Field label="Route"><select required value={route || ""} onChange={(event) => setRoute(Number(event.target.value))} className={inputClass}>{activeRoutes.map((item) => <option key={item.id} value={item.id}>{item.route_name} · {item.vehicle_no || "No vehicle"}</option>)}</select></Field>
            <Field label="Pickup stop"><input required maxLength={100} value={pickup} onChange={(event) => setPickup(event.target.value)} className={inputClass} /></Field>
            <Field label="Drop-off stop"><input required maxLength={100} value={dropoff} onChange={(event) => setDropoff(event.target.value)} className={inputClass} /></Field>
            <Field label="Start date"><input required type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className={inputClass} /></Field>
            <Field label="Notes"><input maxLength={300} value={notes} onChange={(event) => setNotes(event.target.value)} className={inputClass} /></Field>
        </div>
        {!availableStudents.length && <p className="text-sm text-amber-200">Every student already has an active transport assignment.</p>}
        {!activeRoutes.length && <p className="text-sm text-amber-200">Create an active route before assigning students.</p>}
    </DialogShell>;
}

export function MaintenanceDialog({ vehicles, saving, error, onClose, onSubmit }: {
    vehicles: Vehicle[];
    saving: boolean;
    error: string;
    onClose: () => void;
    onSubmit: (payload: VehicleMaintenancePayload) => void;
}) {
    const [vehicle, setVehicle] = useState(vehicles[0]?.id ?? 0);
    const selected = vehicles.find((item) => item.id === vehicle);
    const [kind, setKind] = useState<MaintenanceKind>("SERVICE");
    const [description, setDescription] = useState("");
    const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
    const [odometer, setOdometer] = useState(selected?.odometer_km ?? 0);
    const [cost, setCost] = useState("0.00");
    const [vendor, setVendor] = useState("");
    const [nextDue, setNextDue] = useState("");
    const [notes, setNotes] = useState("");

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        onSubmit({ vehicle, kind, description: description.trim(), service_date: date, odometer_km: odometer, cost, vendor: vendor.trim(), next_service_due: nextDue || null, notes: notes.trim() });
    }

    return <DialogShell title="Log maintenance" eyebrow="Vehicle service" error={error} saving={saving} onClose={onClose} onSubmit={submit}>
        <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Vehicle"><select required value={vehicle || ""} onChange={(event) => { const id = Number(event.target.value); setVehicle(id); setOdometer(vehicles.find((item) => item.id === id)?.odometer_km ?? 0); }} className={inputClass}>{vehicles.filter((item) => item.status !== "RETIRED").map((item) => <option key={item.id} value={item.id}>{item.vehicle_no} · {item.driver_name}</option>)}</select></Field>
            <Field label="Maintenance type"><select value={kind} onChange={(event) => setKind(event.target.value as MaintenanceKind)} className={inputClass}><option value="SERVICE">Service</option><option value="REPAIR">Repair</option><option value="INSPECTION">Inspection</option><option value="TYRES">Tyres</option><option value="OTHER">Other</option></select></Field>
            <Field label="Description"><input required maxLength={200} value={description} onChange={(event) => setDescription(event.target.value)} className={inputClass} /></Field>
            <Field label="Service date"><input required type="date" value={date} onChange={(event) => setDate(event.target.value)} className={inputClass} /></Field>
            <Field label="Odometer (km)"><input required type="number" min={selected?.odometer_km ?? 0} value={odometer} onChange={(event) => setOdometer(Number(event.target.value))} className={inputClass} /></Field>
            <Field label="Cost"><input type="number" min={0} step="0.01" value={cost} onChange={(event) => setCost(event.target.value)} className={inputClass} /></Field>
            <Field label="Vendor"><input maxLength={100} value={vendor} onChange={(event) => setVendor(event.target.value)} className={inputClass} /></Field>
            <Field label="Next service due"><input type="date" value={nextDue} onChange={(event) => setNextDue(event.target.value)} className={inputClass} /></Field>
            <Field label="Notes"><input maxLength={300} value={notes} onChange={(event) => setNotes(event.target.value)} className={inputClass} /></Field>
        </div>
    </DialogShell>;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
    return <label className="block"><span className={labelClass}>{label}</span>{children}</label>;
}
