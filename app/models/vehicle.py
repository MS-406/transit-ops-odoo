from datetime import datetime
from typing import List
from sqlalchemy import String, Integer, Float, DateTime, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base

class Vehicle(Base):
    __tablename__ = "vehicles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    registration_number: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    name_model: Mapped[str] = mapped_column(String(100), nullable=False)
    type: Mapped[str] = mapped_column(String(50), nullable=False)
    max_load_capacity: Mapped[float] = mapped_column(Float, nullable=False)
    odometer: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    acquisition_cost: Mapped[float] = mapped_column(Float, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="Available", nullable=False, index=True)
    region: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    # Relationships
    trips: Mapped[List["Trip"]] = relationship("Trip", back_populates="vehicle")
    maintenance_logs: Mapped[List["MaintenanceLog"]] = relationship("MaintenanceLog", back_populates="vehicle")
    fuel_logs: Mapped[List["FuelLog"]] = relationship("FuelLog", back_populates="vehicle")
    expenses: Mapped[List["Expense"]] = relationship("Expense", back_populates="vehicle")

# Partial indexes for fast queries on available vehicles
Index("idx_vehicle_status_available", Vehicle.status, postgresql_where=(Vehicle.status == "Available"))
Index("idx_vehicle_status_in_shop", Vehicle.status, postgresql_where=(Vehicle.status == "In Shop"))
