export type VehicleType = "BUS" | "MINIBUS" | "VAN" | "CAR" | "OTHER";
export type VehicleStatus = "ACTIVE" | "SERVICE" | "RETIRED";
export type FuelType = "DIESEL" | "PETROL" | "CNG" | "ELECTRIC" | "OTHER";
export type ComplianceStatus = "CURRENT" | "DUE_SOON" | "OVERDUE";
export type MaintenanceKind = "SERVICE" | "REPAIR" | "INSPECTION" | "TYRES" | "OTHER";

export interface Vehicle {
    id: number;
    vehicle_no: string;
    driver_name: string;
    driver_phone: string;
    vehicle_type: VehicleType;
    status: VehicleStatus;
    fuel_type: FuelType;
    make: string;
    model: string;
    year: number | null;
    capacity: number;
    odometer_km: number;
    insurance_expiry: string | null;
    fitness_expiry: string | null;
    permit_expiry: string | null;
    next_service_due: string | null;
    notes: string;
    compliance_status: ComplianceStatus;
    active_routes: number;
}

export type VehiclePayload = Omit<Vehicle, "id" | "compliance_status" | "active_routes">;

export interface Route {
    id: number;
    route_name: string;
    start_point: string;
    end_point: string;
    stops: string[];
    distance_km: string;
    estimated_minutes: number;
    pickup_time: string | null;
    dropoff_time: string | null;
    assigned_vehicle: number | null;
    vehicle_no: string;
    driver_name: string;
    is_active: boolean;
    assigned_students: number;
}

export type RoutePayload = Omit<Route, "id" | "vehicle_no" | "driver_name" | "assigned_students">;

export interface TransportStudent {
    id: number;
    name: string;
    admission_no: string;
    grade: string;
    section: string;
    assigned: boolean;
}

export interface StudentTransportAssignment {
    id: number;
    student: number;
    student_name: string;
    admission_no: string;
    grade: string;
    section: string;
    route: number;
    route_name: string;
    pickup_stop: string;
    dropoff_stop: string;
    start_date: string;
    end_date: string | null;
    is_active: boolean;
    notes: string;
}

export type StudentTransportAssignmentPayload = Omit<StudentTransportAssignment, "id" | "student_name" | "admission_no" | "grade" | "section" | "route_name">;

export interface VehicleMaintenance {
    id: number;
    vehicle: number;
    vehicle_no: string;
    kind: MaintenanceKind;
    description: string;
    service_date: string;
    odometer_km: number;
    cost: string;
    vendor: string;
    next_service_due: string | null;
    notes: string;
}

export type VehicleMaintenancePayload = Omit<VehicleMaintenance, "id" | "vehicle_no">;

export interface FleetSummary {
    can_manage: boolean;
    vehicle_count: number;
    active_vehicles: number;
    in_service: number;
    retired: number;
    compliance_due: number;
    active_routes: number;
    assigned_students: number;
    maintenance_due: number;
}
