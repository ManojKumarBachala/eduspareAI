import api from "./api";
import {
    FleetSummary,
    Route,
    StudentTransportAssignment,
    TransportStudent,
    Vehicle,
    VehicleMaintenance,
} from "../types/transport";

const VEHICLES_URL = "/vehicles/";
const ROUTES_URL = "/routes/";
const ASSIGNMENTS_URL = "/student-assignments/";
const MAINTENANCE_URL = "/maintenance/";

export async function getFleetSummary() {
    const response = await api.get<FleetSummary>(`${VEHICLES_URL}summary/`);
    return response.data;
}

export async function getVehicles() {
    const response = await api.get<Vehicle[]>(VEHICLES_URL);
    return response.data;
}

export async function saveVehicle(payload: Partial<Vehicle>) {
    const response = payload.id
        ? await api.patch<Vehicle>(`${VEHICLES_URL}${payload.id}/`, payload)
        : await api.post<Vehicle>(VEHICLES_URL, payload);
    return response.data;
}

export async function getRoutes() {
    const response = await api.get<Route[]>(ROUTES_URL);
    return response.data;
}

export async function saveRoute(payload: Partial<Route>) {
    const response = payload.id
        ? await api.patch<Route>(`${ROUTES_URL}${payload.id}/`, payload)
        : await api.post<Route>(ROUTES_URL, payload);
    return response.data;
}

export async function getTransportAssignments() {
    const response = await api.get<StudentTransportAssignment[]>(ASSIGNMENTS_URL);
    return response.data;
}

export async function getTransportStudents() {
    const response = await api.get<TransportStudent[]>(`${ASSIGNMENTS_URL}student-options/`);
    return response.data;
}

export async function saveTransportAssignment(payload: Partial<StudentTransportAssignment>) {
    const response = payload.id
        ? await api.patch<StudentTransportAssignment>(`${ASSIGNMENTS_URL}${payload.id}/`, payload)
        : await api.post<StudentTransportAssignment>(ASSIGNMENTS_URL, payload);
    return response.data;
}

export async function endTransportAssignment(id: number) {
    await api.patch(`${ASSIGNMENTS_URL}${id}/`, { is_active: false, end_date: new Date().toISOString().slice(0, 10) });
}

export async function getMaintenance(vehicle?: number) {
    const response = await api.get<VehicleMaintenance[]>(MAINTENANCE_URL, { params: vehicle ? { vehicle } : {} });
    return response.data;
}

export async function createMaintenance(payload: Partial<VehicleMaintenance>) {
    const response = await api.post<VehicleMaintenance>(MAINTENANCE_URL, payload);
    return response.data;
}
