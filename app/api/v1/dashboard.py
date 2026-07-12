from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.db.session import get_db
from app.models.vehicle import Vehicle
from app.models.trip import Trip
from app.models.driver import Driver
from app.models.user import User
from app.models.fuel import FuelLog
from app.models.expense import Expense
from app.models.maintenance import MaintenanceLog
from app.schemas.reports import DashboardKPIsOut, DashboardAnalyticsOut, SmartInsight, ChartDataPoint
from app.core.deps import require_role

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/kpis", response_model=DashboardKPIsOut)
async def get_kpis(
    vehicle_type: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    region: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["fleet_manager", "financial_analyst", "admin"]))
):
    """Get fleet KPIs with optional filtering."""
    
    # Vehicle queries
    veh_query = select(Vehicle)
    if vehicle_type:
        veh_query = veh_query.where(Vehicle.type == vehicle_type)
    if region:
        veh_query = veh_query.where(Vehicle.region == region)
        
    v_res = await db.execute(veh_query)
    vehicles = v_res.scalars().all()
    
    # Active vehicles (not retired)
    if status:
        active_vehicles = [v for v in vehicles if v.status != "Retired" and v.status == status]
    else:
        active_vehicles = [v for v in vehicles if v.status != "Retired"]
        
    num_active = len(active_vehicles)
    num_available = len([v for v in active_vehicles if v.status == "Available"])
    num_in_maintenance = len([v for v in active_vehicles if v.status == "In Shop"])
    num_on_trip = len([v for v in active_vehicles if v.status == "On Trip"])
    
    # Trip queries
    trip_query = select(Trip)
    # Could join to vehicles to filter by region/type if strictly necessary, but simple for now
    t_res = await db.execute(trip_query)
    trips = t_res.scalars().all()
    
    num_active_trips = len([t for t in trips if t.status == "Dispatched"])
    num_pending_trips = len([t for t in trips if t.status == "Draft"])
    
    # Driver queries
    drv_query = select(Driver)
    d_res = await db.execute(drv_query)
    drivers = d_res.scalars().all()
    
    num_drivers_on_duty = len([d for d in drivers if d.status == "On Trip"])
    
    utilization_pct = (num_on_trip / num_active * 100) if num_active > 0 else 0.0
    
    return DashboardKPIsOut(
        totalVehicles=len(vehicles),
        activeVehicles=num_active,
        availableVehicles=num_available,
        inMaintenance=num_in_maintenance,
        retiredVehicles=len([v for v in vehicles if v.status == "Retired"]),
        activeTrips=num_active_trips,
        pendingTrips=num_pending_trips,
        driversOnDuty=num_drivers_on_duty,
        utilizationRate=utilization_pct
    )

@router.get("/analytics", response_model=DashboardAnalyticsOut)
async def get_analytics(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["fleet_manager", "financial_analyst", "admin"]))
):
    """Get advanced operational insights and chart data."""
    
    # 1. Fetch raw data to process (for a hackathon this is fine, otherwise do pure SQL agg)
    v_res = await db.execute(select(Vehicle))
    vehicles = v_res.scalars().all()
    
    t_res = await db.execute(select(Trip))
    trips = t_res.scalars().all()
    
    d_res = await db.execute(select(Driver))
    drivers = d_res.scalars().all()
    
    f_res = await db.execute(select(FuelLog))
    fuel_logs = f_res.scalars().all()
    
    m_res = await db.execute(select(MaintenanceLog))
    maint_logs = m_res.scalars().all()
    
    e_res = await db.execute(select(Expense))
    expenses = e_res.scalars().all()

    # Smart Insights Processing
    insights = []
    
    # Highest completed trips (Vehicle)
    vehicle_trip_counts = {}
    for t in trips:
        if t.status == "Completed":
            vehicle_trip_counts[t.vehicle_id] = vehicle_trip_counts.get(t.vehicle_id, 0) + 1
    
    if vehicle_trip_counts:
        top_v_id = max(vehicle_trip_counts, key=vehicle_trip_counts.get)
        top_v = next((v for v in vehicles if v.id == top_v_id), None)
        if top_v:
            insights.append(SmartInsight(
                label="Top Performing Vehicle",
                value=top_v.registration_number,
                subtext=f"{vehicle_trip_counts[top_v_id]} completed trips",
                trend="↑ High"
            ))

    # Highest completed trips (Driver)
    driver_trip_counts = {}
    for t in trips:
        if t.status == "Completed":
            driver_trip_counts[t.driver_id] = driver_trip_counts.get(t.driver_id, 0) + 1
            
    if driver_trip_counts:
        top_d_id = max(driver_trip_counts, key=driver_trip_counts.get)
        top_d = next((d for d in drivers if d.id == top_d_id), None)
        if top_d:
            insights.append(SmartInsight(
                label="Top Driver",
                value=top_d.name,
                subtext=f"{driver_trip_counts[top_d_id]} completed trips",
                trend="↑ High"
            ))
            
    # Vehicle under maintenance
    in_shop = [v for v in vehicles if v.status == "In Shop"]
    if in_shop:
        insights.append(SmartInsight(
            label="In Maintenance",
            value=in_shop[0].registration_number,
            subtext=f"Out of service",
            trend="Needs repair"
        ))

    # Total Fuel Consumed
    total_fuel = sum(f.liters for f in fuel_logs)
    if total_fuel > 0:
        insights.append(SmartInsight(
            label="Total Fuel Consumed",
            value=f"{total_fuel:.1f} L",
            subtext="Fleet wide",
            trend="Stable"
        ))

    # Utilization
    active_vehicles = [v for v in vehicles if v.status != "Retired"]
    if active_vehicles:
        on_trip = len([v for v in active_vehicles if v.status == "On Trip"])
        util_pct = (on_trip / len(active_vehicles)) * 100
        insights.append(SmartInsight(
            label="Fleet Utilization",
            value=f"{util_pct:.1f}%",
            subtext="Currently deployed",
            trend="↑ Active"
        ))

    # Charts Data Processing
    # Vehicle Status
    v_status_counts = {}
    for v in vehicles:
        v_status_counts[v.status] = v_status_counts.get(v.status, 0) + 1
    vehicle_status_chart = [ChartDataPoint(name=k, value=v, fill="#06C167" if k=="Available" else "#FFC043" if k=="In Shop" else "#276EF1") for k, v in v_status_counts.items()]

    # Driver Status
    d_status_counts = {}
    for d in drivers:
        d_status_counts[d.status] = d_status_counts.get(d.status, 0) + 1
    driver_status_chart = [ChartDataPoint(name=k, value=v, fill="#276EF1" if k=="Available" else "#FFC043") for k, v in d_status_counts.items()]

    # Trip Status
    t_status_counts = {}
    for t in trips:
        t_status_counts[t.status] = t_status_counts.get(t.status, 0) + 1
    trip_status_chart = [ChartDataPoint(name=k, value=v, fill="#06C167" if k=="Completed" else "#374151") for k, v in t_status_counts.items()]

    # Mock Monthly for fuel and maintenance (because we don't have enough generated data spanning months)
    # But since rule says no mock data, we aggregate the actual logs by YYYY-MM
    monthly_fuel = {}
    for f in fuel_logs:
        ym = f.log_date.strftime("%Y-%m")
        monthly_fuel[ym] = monthly_fuel.get(ym, 0) + f.cost
    fuel_chart = [ChartDataPoint(name=k, value=v) for k, v in sorted(monthly_fuel.items())]
    if not fuel_chart:
        fuel_chart = [ChartDataPoint(name="No Data", value=0)]

    monthly_maint = {}
    for m in maint_logs:
        ym = m.opened_at.strftime("%Y-%m")
        monthly_maint[ym] = monthly_maint.get(ym, 0) + m.cost
    maint_chart = [ChartDataPoint(name=k, value=v) for k, v in sorted(monthly_maint.items())]
    if not maint_chart:
        maint_chart = [ChartDataPoint(name="No Data", value=0)]

    op_costs = {}
    for e in expenses:
        if e.vehicle_id:
            op_costs[e.vehicle_id] = op_costs.get(e.vehicle_id, 0) + e.amount
    op_cost_chart = []
    for vid, cost in op_costs.items():
        v = next((x for x in vehicles if x.id == vid), None)
        if v:
            op_cost_chart.append(ChartDataPoint(name=v.registration_number, value=cost))
    if not op_cost_chart:
        op_cost_chart = [ChartDataPoint(name="No Data", value=0)]

    return DashboardAnalyticsOut(
        insights=insights,
        vehicleStatusDistribution=vehicle_status_chart,
        driverStatusDistribution=driver_status_chart,
        tripStatusDistribution=trip_status_chart,
        monthlyFuelExpenses=fuel_chart,
        monthlyMaintenanceExpenses=maint_chart,
        operationalCostPerVehicle=op_cost_chart
    )
