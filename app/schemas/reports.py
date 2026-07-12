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

class SmartInsight(BaseModel):
    label: str
    value: str
    subtext: str
    trend: str = None

class ChartDataPoint(BaseModel):
    name: str
    value: float
    fill: str = None

class DashboardAnalyticsOut(BaseModel):
    insights: list[SmartInsight]
    vehicleStatusDistribution: list[ChartDataPoint]
    driverStatusDistribution: list[ChartDataPoint]
    tripStatusDistribution: list[ChartDataPoint]
    monthlyFuelExpenses: list[ChartDataPoint]
    monthlyMaintenanceExpenses: list[ChartDataPoint]
    operationalCostPerVehicle: list[ChartDataPoint]
