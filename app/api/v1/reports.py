from typing import List
import csv
import io
from fastapi import APIRouter, Depends, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.db.session import get_db
from app.models.vehicle import Vehicle
from app.models.trip import Trip
from app.models.fuel import FuelLog
from app.models.maintenance import MaintenanceLog
from app.models.expense import Expense
from app.models.user import User
from app.schemas.reports import FuelEfficiencyOut, UtilizationOut, CostReportOut, ROIReportOut
from app.core.deps import require_role

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.get("/fuel-efficiency", response_model=List[FuelEfficiencyOut])
async def get_fuel_efficiency(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["fleet_manager", "financial_analyst"]))
):
    """Get fuel efficiency report per vehicle."""
    v_res = await db.execute(select(Vehicle).where(Vehicle.status != "Retired"))
    vehicles = v_res.scalars().all()
    
    results = []
    for v in vehicles:
        f_res = await db.execute(select(func.sum(FuelLog.liters)).where(FuelLog.vehicle_id == v.id))
        total_fuel = f_res.scalar() or 0.0
        
        t_res = await db.execute(select(func.sum(Trip.actual_distance)).where(Trip.vehicle_id == v.id).where(Trip.status == "Completed"))
        total_dist = t_res.scalar() or 0.0
        
        eff = (total_dist / total_fuel) if total_fuel > 0 else 0.0
        results.append(FuelEfficiencyOut(
            vehicle_id=v.id,
            registration_number=v.registration_number,
            total_distance=total_dist,
            total_fuel=total_fuel,
            efficiency_km_per_l=eff
        ))
    return results

@router.get("/utilization", response_model=List[UtilizationOut])
async def get_utilization(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["fleet_manager", "financial_analyst"]))
):
    """Get utilization report per vehicle."""
    v_res = await db.execute(select(Vehicle).where(Vehicle.status != "Retired"))
    vehicles = v_res.scalars().all()
    
    results = []
    for v in vehicles:
        t_res = await db.execute(select(Trip).where(Trip.vehicle_id == v.id).where(Trip.status.in_(["Dispatched", "Completed"])))
        trips = t_res.scalars().all()
        
        total_trips = len(trips)
        total_dist = sum([t.actual_distance or 0.0 for t in trips])
        
        results.append(UtilizationOut(
            vehicle_id=v.id,
            registration_number=v.registration_number,
            total_trips=total_trips,
            total_distance=total_dist
        ))
    return results

@router.get("/cost", response_model=List[CostReportOut])
async def get_cost_report(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["fleet_manager", "financial_analyst"]))
):
    """Get total cost report per vehicle."""
    v_res = await db.execute(select(Vehicle).where(Vehicle.status != "Retired"))
    vehicles = v_res.scalars().all()
    
    results = []
    for v in vehicles:
        f_res = await db.execute(select(func.sum(FuelLog.cost)).where(FuelLog.vehicle_id == v.id))
        total_fuel = f_res.scalar() or 0.0
        
        m_res = await db.execute(select(func.sum(MaintenanceLog.cost)).where(MaintenanceLog.vehicle_id == v.id))
        total_maint = m_res.scalar() or 0.0
        
        e_res = await db.execute(select(func.sum(Expense.amount)).where(Expense.vehicle_id == v.id))
        total_exp = e_res.scalar() or 0.0
        
        total = total_fuel + total_maint + total_exp
        results.append(CostReportOut(
            vehicle_id=v.id,
            registration_number=v.registration_number,
            maintenance_cost=total_maint,
            fuel_cost=total_fuel,
            expense_cost=total_exp,
            total_cost=total
        ))
    return results

@router.get("/roi", response_model=List[ROIReportOut])
async def get_roi_report(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["fleet_manager", "financial_analyst"]))
):
    """Get ROI report per vehicle."""
    v_res = await db.execute(select(Vehicle).where(Vehicle.status != "Retired"))
    vehicles = v_res.scalars().all()
    
    results = []
    for v in vehicles:
        f_res = await db.execute(select(func.sum(FuelLog.cost)).where(FuelLog.vehicle_id == v.id))
        total_fuel = f_res.scalar() or 0.0
        
        m_res = await db.execute(select(func.sum(MaintenanceLog.cost)).where(MaintenanceLog.vehicle_id == v.id))
        total_maint = m_res.scalar() or 0.0
        
        # Calculate dynamic revenue (Option B proxy: $5 per km of completed actual distance)
        t_res = await db.execute(select(func.sum(Trip.actual_distance)).where(Trip.vehicle_id == v.id).where(Trip.status == "Completed"))
        total_dist = t_res.scalar() or 0.0
        total_revenue = total_dist * 5.0
        
        total_maint_fuel = total_maint + total_fuel
        
        acq_cost = v.acquisition_cost or 1.0 # prevent div by zero
        roi_pct = ((total_revenue - total_maint_fuel) / acq_cost) * 100
        
        results.append(ROIReportOut(
            vehicle_id=v.id,
            registration_number=v.registration_number,
            acquisition_cost=v.acquisition_cost,
            total_revenue=total_revenue,
            total_maintenance_and_fuel=total_maint_fuel,
            roi_pct=roi_pct
        ))
    return results

@router.get("/export.csv")
async def export_csv(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["fleet_manager", "financial_analyst"]))
):
    """Export ROI report as CSV."""
    # Re-use the ROI logic
    v_res = await db.execute(select(Vehicle).where(Vehicle.status != "Retired"))
    vehicles = v_res.scalars().all()
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Vehicle ID", "Registration Number", "Acquisition Cost", "Total Revenue", "Total Maintenance & Fuel", "ROI %"])
    
    for v in vehicles:
        f_res = await db.execute(select(func.sum(FuelLog.cost)).where(FuelLog.vehicle_id == v.id))
        total_fuel = f_res.scalar() or 0.0
        
        m_res = await db.execute(select(func.sum(MaintenanceLog.cost)).where(MaintenanceLog.vehicle_id == v.id))
        total_maint = m_res.scalar() or 0.0
        
        t_res = await db.execute(select(func.sum(Trip.actual_distance)).where(Trip.vehicle_id == v.id).where(Trip.status == "Completed"))
        total_dist = t_res.scalar() or 0.0
        total_revenue = total_dist * 5.0
        
        total_maint_fuel = total_maint + total_fuel
        
        acq_cost = v.acquisition_cost or 1.0
        roi_pct = ((total_revenue - total_maint_fuel) / acq_cost) * 100
        
        writer.writerow([v.id, v.registration_number, v.acquisition_cost, total_revenue, total_maint_fuel, round(roi_pct, 2)])
        
    output.seek(0)
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=roi_report.csv"}
    )
