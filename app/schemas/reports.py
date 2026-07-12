from pydantic import BaseModel

class DashboardKPIsOut(BaseModel):
    active_vehicles: int
    available_vehicles: int
    in_maintenance: int
    active_trips: int
    pending_trips: int
    drivers_on_duty: int
    fleet_utilization_pct: float

class FuelEfficiencyOut(BaseModel):
    vehicle_id: int
    registration_number: str
    total_distance: float
    total_fuel: float
    efficiency_km_per_l: float

class UtilizationOut(BaseModel):
    vehicle_id: int
    registration_number: str
    total_trips: int
    total_distance: float

class CostReportOut(BaseModel):
    vehicle_id: int
    registration_number: str
    maintenance_cost: float
    fuel_cost: float
    expense_cost: float
    total_cost: float

class ROIReportOut(BaseModel):
    vehicle_id: int
    registration_number: str
    acquisition_cost: float
    total_revenue: float
    total_maintenance_and_fuel: float
    roi_pct: float
