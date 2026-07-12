from typing import List, Optional
from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.db.session import get_db
from app.models.fuel import FuelLog
from app.models.expense import Expense
from app.models.user import User
from app.schemas.fuel_expenses import FuelLogCreate, FuelLogOut, ExpenseCreate, ExpenseOut
from app.core.deps import get_current_user, require_role
from app.core.exceptions import APIException

router = APIRouter(tags=["Fuel & Expenses"])

@router.get("/fuel-logs", response_model=List[FuelLogOut])
async def list_fuel_logs(
    vehicle_id: Optional[int] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["financial_analyst", "admin"]))
):
    """List fuel logs. Can filter by vehicle_id."""
    query = select(FuelLog).options(selectinload(FuelLog.vehicle))
    if vehicle_id:
        query = query.where(FuelLog.vehicle_id == vehicle_id)
        
    result = await db.execute(query)
    logs = result.scalars().all()
    
    out = []
    for log in logs:
        out.append(FuelLogOut(
            id=log.id,
            vehicle_id=log.vehicle_id,
            vehicle_reg=log.vehicle.registration_number if log.vehicle else "N/A",
            vehicle_model=log.vehicle.name_model if log.vehicle else "Unknown",
            liters=log.liters,
            cost=log.cost,
            date=log.log_date.date() if hasattr(log.log_date, 'date') else log.log_date
        ))
    return out

@router.post("/fuel-logs", response_model=FuelLogOut, status_code=status.HTTP_201_CREATED)
async def create_fuel_log(
    payload: FuelLogCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["financial_analyst", "driver", "admin"]))
):
    """Create a new fuel log."""
    log = FuelLog(**payload.model_dump())
    db.add(log)
    await db.commit()
    
    res = await db.execute(select(FuelLog).options(selectinload(FuelLog.vehicle)).where(FuelLog.id == log.id))
    log = res.scalars().first()
    
    return FuelLogOut(
        id=log.id,
        vehicle_id=log.vehicle_id,
        vehicle_reg=log.vehicle.registration_number if log.vehicle else "N/A",
        vehicle_model=log.vehicle.name_model if log.vehicle else "Unknown",
        liters=log.liters,
        cost=log.cost,
        date=log.log_date.date() if hasattr(log.log_date, 'date') else log.log_date
    )

@router.get("/expenses", response_model=List[ExpenseOut])
async def list_expenses(
    vehicle_id: Optional[int] = Query(None),
    type: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["financial_analyst", "admin"]))
):
    """List expenses. Can filter by vehicle_id and type."""
    query = select(Expense).options(selectinload(Expense.vehicle))
    if vehicle_id:
        query = query.where(Expense.vehicle_id == vehicle_id)
    if type:
        query = query.where(Expense.type == type)
        
    result = await db.execute(query)
    expenses = result.scalars().all()
    
    out = []
    for exp in expenses:
        out.append(ExpenseOut(
            id=exp.id,
            date=exp.log_date.date() if hasattr(exp.log_date, 'date') else exp.log_date,
            category=exp.type,
            cost=exp.amount,
            vehicle_id=exp.vehicle_id,
            vehicle_reg=exp.vehicle.registration_number if exp.vehicle else "N/A",
            description=exp.description
        ))
    return out

@router.post("/expenses", response_model=ExpenseOut, status_code=status.HTTP_201_CREATED)
async def create_expense(
    payload: ExpenseCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["financial_analyst", "admin"]))
):
    """Create a new expense."""
    expense = Expense(**payload.model_dump(by_alias=True))
    db.add(expense)
    await db.commit()
    
    res = await db.execute(select(Expense).options(selectinload(Expense.vehicle)).where(Expense.id == expense.id))
    exp = res.scalars().first()
    
    return ExpenseOut(
        id=exp.id,
        date=exp.log_date.date() if hasattr(exp.log_date, 'date') else exp.log_date,
        category=exp.type,
        cost=exp.amount,
        vehicle_id=exp.vehicle_id,
        vehicle_reg=exp.vehicle.registration_number if exp.vehicle else "N/A",
        description=exp.description
    )
