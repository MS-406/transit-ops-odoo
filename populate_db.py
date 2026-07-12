import asyncio
from datetime import datetime, date, timedelta
import random
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy import select

from app.core.config import settings
import app.db.base
from app.models.vehicle import Vehicle
from app.models.driver import Driver
from app.models.trip import Trip
from app.models.fuel import FuelLog
from app.models.expense import Expense
from app.models.maintenance import MaintenanceLog
from app.models.user import User

async def populate_data():
    print("Connecting to database...")
    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    async_session = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        # Get admin user ID
        result = await session.execute(select(User).where(User.email == "admin@transitops.com"))
        admin = result.scalars().first()
        if not admin:
            print("Please run python seed.py first to create the admin user.")
            return

        print("Generating Vehicles...")
        vehicles = []
        for i in range(15):
            v = Vehicle(
                registration_number=f"MH-{random.randint(10, 99)}-AB-{random.randint(1000, 9999)}",
                name_model=random.choice(["Volvo FM", "Tata Signa", "Ashok Leyland", "Scania R", "Mahindra Blazo"]),
                type=random.choice(["Truck", "Bus", "Mini Bus", "LCV"]),
                max_load_capacity=random.uniform(5.0, 40.0),
                odometer=random.uniform(10000.0, 150000.0),
                acquisition_cost=random.uniform(20000.0, 150000.0),
                status=random.choice(["Available", "Available", "Available", "In Shop", "On Trip"]),
                region=random.choice(["Pune", "Mumbai", "Bangalore", "Delhi", "Chennai", "Jaipur"])
            )
            session.add(v)
            vehicles.append(v)
        
        await session.commit()

        print("Generating Drivers...")
        drivers = []
        for i in range(15):
            days_offset = random.randint(-40, 365) # some expired, some valid
            d = Driver(
                name=random.choice(["Amit Singh", "Rajesh Kumar", "Suresh Patil", "John Doe", "Mohammed Ali", "Vikram Rathore", "Kishore Kumar", "Abdul Rehman", "Sanjay Dutt", "Arun Sharma"]),
                license_number=f"DL-{random.randint(1000000, 9999999)}",
                license_category=random.choice(["Class A", "Class B", "CE", "D"]),
                license_expiry_date=date.today() + timedelta(days=days_offset),
                contact_number=f"+91 {random.randint(7000000000, 9999999999)}",
                safety_score=random.uniform(60.0, 100.0),
                status=random.choice(["Available", "Available", "Available", "On Trip", "Suspended"])
            )
            session.add(d)
            drivers.append(d)
        
        await session.commit()

        print("Generating Trips...")
        for i in range(30):
            status = random.choice(["Draft", "Dispatched", "Completed", "Completed", "Completed"])
            v = random.choice(vehicles)
            d = random.choice(drivers)
            
            dispatched_at = None
            completed_at = None
            if status in ["Dispatched", "Completed"]:
                dispatched_at = datetime.utcnow() - timedelta(days=random.randint(1, 30))
            if status == "Completed":
                completed_at = dispatched_at + timedelta(days=random.randint(1, 3))

            t = Trip(
                source=random.choice(["Pune", "Mumbai", "Delhi", "Bangalore"]),
                destination=random.choice(["Chennai", "Jaipur", "Ahmedabad", "Hyderabad"]),
                vehicle_id=v.id,
                driver_id=d.id,
                cargo_weight=random.uniform(1.0, v.max_load_capacity),
                planned_distance=random.uniform(200.0, 1500.0),
                actual_distance=random.uniform(200.0, 1600.0) if status == "Completed" else None,
                final_odometer=v.odometer + random.uniform(200.0, 1600.0) if status == "Completed" else None,
                fuel_consumed=random.uniform(50.0, 300.0) if status == "Completed" else None,
                status=status,
                created_by=admin.id,
                dispatched_at=dispatched_at,
                completed_at=completed_at
            )
            session.add(t)
        
        await session.commit()

        print("Generating Fuel Logs & Expenses...")
        for i in range(40):
            v = random.choice(vehicles)
            f = FuelLog(
                vehicle_id=v.id,
                trip_id=None,
                liters=random.uniform(30.0, 150.0),
                cost=random.uniform(100.0, 500.0),
                log_date=datetime.utcnow() - timedelta(days=random.randint(1, 60))
            )
            session.add(f)
            
            e = Expense(
                vehicle_id=v.id,
                type=random.choice(["toll", "maintenance", "other"]),
                amount=random.uniform(20.0, 200.0),
                description="Routine expense",
                log_date=datetime.utcnow() - timedelta(days=random.randint(1, 60))
            )
            session.add(e)
            
        await session.commit()

        print("Generating Maintenance Logs...")
        for i in range(15):
            v = random.choice(vehicles)
            is_active = random.choice([True, False])
            m = MaintenanceLog(
                vehicle_id=v.id,
                description=random.choice(["Oil Change", "Brake Pad Replacement", "Engine Tuning", "Tire Rotation", "AC Repair"]),
                cost=random.uniform(50.0, 1000.0) if not is_active else 0.0,
                is_active=is_active,
                opened_at=datetime.utcnow() - timedelta(days=random.randint(5, 60)),
                closed_at=datetime.utcnow() - timedelta(days=random.randint(1, 4)) if not is_active else None
            )
            session.add(m)
            
        await session.commit()
        print("Database populated successfully with realistic mock data!")

    await engine.dispose()

if __name__ == '__main__':
    asyncio.run(populate_data())
