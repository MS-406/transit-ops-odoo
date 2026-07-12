from pydantic import BaseModel

class DashboardKPIsOut(BaseModel):
    totalVehicles: int
    activeVehicles: int
    availableVehicles: int
    inMaintenance: int
    retiredVehicles: int
    activeTrips: int
    pendingTrips: int
    driversOnDuty: int
    utilizationRate: float

class FuelEfficiencyOut(BaseModel):
    name: str
    efficiency: float
    model: str

class UtilizationOut(BaseModel):
    date: str
    rate: float

class CostReportOut(BaseModel):
    name: str
    cost: float

class ROIReportOut(BaseModel):
    category: str
    cost: float
    revenue: float
