from datetime import datetime, date
from typing import List
from sqlalchemy import String, Integer, Float, DateTime, Date, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base

class Driver(Base):
    __tablename__ = "drivers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    license_number: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    license_category: Mapped[str] = mapped_column(String(20), nullable=False)
    license_expiry_date: Mapped[date] = mapped_column(Date, nullable=False)
    contact_number: Mapped[str] = mapped_column(String(50), nullable=False)
    safety_score: Mapped[float] = mapped_column(Float, default=5.0, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="Available", nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    # Relationships
    trips: Mapped[List["Trip"]] = relationship("Trip", back_populates="driver")

# Partial indexes for fast queries on available drivers
Index("idx_driver_status_available", Driver.status, postgresql_where=(Driver.status == "Available"))
