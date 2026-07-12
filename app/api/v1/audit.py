from typing import List
from datetime import datetime
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db
from app.models.bonus import AuditLog
from app.models.user import User
from app.schemas.audit import AuditLogCreate, AuditLogOut
from app.core.deps import get_current_user, require_role
from sqlalchemy.orm import selectinload

router = APIRouter(prefix="/audit", tags=["Audit Logs"])

@router.get("", response_model=List[AuditLogOut])
async def get_audit_logs(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "fleet_manager", "safety_officer"]))
):
    """Retrieve audit logs, ordered by newest first."""
    query = select(AuditLog).options(selectinload(AuditLog.user)).order_by(AuditLog.created_at.desc())
    result = await db.execute(query)
    logs = result.scalars().all()
    
    out = []
    for log in logs:
        details = ""
        if log.metadata_json and "details" in log.metadata_json:
            details = log.metadata_json["details"]
            
        out.append(AuditLogOut(
            id=log.id,
            action=log.action,
            details=details,
            user=log.user.full_name if log.user else "System",
            timestamp=log.created_at
        ))
    return out

@router.post("", response_model=AuditLogOut, status_code=status.HTTP_201_CREATED)
async def create_audit_log(
    payload: AuditLogCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new audit log entry."""
    new_log = AuditLog(
        user_id=current_user.id,
        action=payload.action,
        entity_type="System",
        entity_id=0,
        metadata_json={"details": payload.details},
        created_at=datetime.utcnow()
    )
    
    db.add(new_log)
    await db.commit()
    await db.refresh(new_log)
    
    return AuditLogOut(
        id=new_log.id,
        action=new_log.action,
        details=payload.details,
        user=current_user.full_name,
        timestamp=new_log.created_at
    )
