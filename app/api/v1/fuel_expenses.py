from typing import List, Optional
from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

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
    current_user: User = Depends(require_role(["fleet_manager", "safety_officer", "financial_analyst", "driver"]))
):
    """List fuel logs. Can filter by vehicle_id."""
    query = select(FuelLog)
    if vehicle_id:
        query = query.where(FuelLog.vehicle_id == vehicle_id)
        
    result = await db.execute(query)
    return result.scalars().all()

@router.post("/fuel-logs", response_model=FuelLogOut, status_code=status.HTTP_201_CREATED)
async def create_fuel_log(
    payload: FuelLogCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["fleet_manager", "driver"]))
):
    """Create a new fuel log."""
    log = FuelLog(**payload.model_dump())
    db.add(log)
    await db.commit()
    await db.refresh(log)
    return log

@router.get("/expenses", response_model=List[ExpenseOut])
async def list_expenses(
    vehicle_id: Optional[int] = Query(None),
    type: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["fleet_manager", "financial_analyst"]))
):
    """List expenses. Can filter by vehicle_id and type."""
    query = select(Expense)
    if vehicle_id:
        query = query.where(Expense.vehicle_id == vehicle_id)
    if type:
        query = query.where(Expense.type == type)
        
    result = await db.execute(query)
    return result.scalars().all()

@router.post("/expenses", response_model=ExpenseOut, status_code=status.HTTP_201_CREATED)
async def create_expense(
    payload: ExpenseCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["fleet_manager", "financial_analyst"]))
):
    """Create a new expense."""
    expense = Expense(**payload.model_dump())
    db.add(expense)
    await db.commit()
    await db.refresh(expense)
    return expense
