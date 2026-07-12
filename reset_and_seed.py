import asyncio
import random
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy import select, delete

from app.core.config import settings
import app.db.base
from app.models.user import User, Role
from app.models.vehicle import Vehicle
from app.models.driver import Driver
from app.models.trip import Trip
from app.models.fuel import FuelLog
from app.models.maintenance import MaintenanceLog
from app.models.expense import Expense
from app.models.bonus import AuditLog, Notification
from app.core.security import get_password_hash

async def reset_and_seed():
    print("Connecting to database...")
    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    async_session = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        # Get the first admin user to be the creator of things
        res = await session.execute(select(User).where(User.email == "admin@transitops.com"))
        admin = res.scalars().first()
        if not admin:
            print("Admin user not found, please run seed.py first.")
            return

        print("Clearing tables...")
        # Delete order matters due to foreign keys
        await session.execute(delete(Expense))
        await session.execute(delete(FuelLog))
        await session.execute(delete(MaintenanceLog))
        await session.execute(delete(AuditLog))
        await session.execute(delete(Notification))
        await session.execute(delete(Trip))
        await session.execute(delete(Vehicle))
        await session.execute(delete(Driver))
        
        await session.commit()
        print("Tables cleared. Inserting meaningful data...")

        # 1. Seed Vehicles
        vehicles_data = [
            {"registration_number": "MH-12-AB-1234", "type": "Truck", "max_load_capacity": 10.0, "acquisition_cost": 25000.0, "name_model": "Tata Prima", "status": "Available", "region": "Pune"},
            {"registration_number": "MH-01-CD-5678", "type": "Bus", "max_load_capacity": 5.0, "acquisition_cost": 35000.0, "name_model": "Volvo B11R", "status": "Available", "region": "Mumbai"},
            {"registration_number": "KA-01-EF-9012", "type": "LCV", "max_load_capacity": 3.5, "acquisition_cost": 15000.0, "name_model": "Ashok Leyland Dost", "status": "Available", "region": "Bangalore"},
            {"registration_number": "TN-02-GH-3456", "type": "Truck", "max_load_capacity": 15.0, "acquisition_cost": 30000.0, "name_model": "Mahindra Blazo", "status": "In Shop", "region": "Chennai"},
            {"registration_number": "DL-03-IJ-7890", "type": "Mini Bus", "max_load_capacity": 2.5, "acquisition_cost": 12000.0, "name_model": "Force Traveller", "status": "Available", "region": "Delhi"},
            {"registration_number": "MH-14-KL-1234", "type": "Truck", "max_load_capacity": 12.0, "acquisition_cost": 28000.0, "name_model": "Tata Signa", "status": "On Trip", "region": "Pune"},
            {"registration_number": "GJ-01-MN-5678", "type": "Bus", "max_load_capacity": 6.0, "acquisition_cost": 40000.0, "name_model": "Scania Metrolink", "status": "Available", "region": "Ahmedabad"},
            {"registration_number": "RJ-14-OP-9012", "type": "LCV", "max_load_capacity": 4.0, "acquisition_cost": 18000.0, "name_model": "Eicher Pro", "status": "Available", "region": "Jaipur"},
            {"registration_number": "DL-04-QR-3456", "type": "Truck", "max_load_capacity": 20.0, "acquisition_cost": 45000.0, "name_model": "BharatBenz", "status": "Retired", "region": "Delhi"},
            {"registration_number": "MH-02-ST-7890", "type": "Bus", "max_load_capacity": 5.5, "acquisition_cost": 38000.0, "name_model": "Volvo 9400", "status": "Available", "region": "Mumbai"}
        ]
        
        vehicles = []
        for v in vehicles_data:
            vehicle = Vehicle(**v)
            session.add(vehicle)
            vehicles.append(vehicle)
            
        # 2. Seed Drivers
        from datetime import date
        
        # Get driver role and clear old driver accounts
        driver_role_res = await session.execute(select(Role).where(Role.name == "driver"))
        driver_role = driver_role_res.scalars().first()
        if driver_role:
            await session.execute(delete(User).where(User.role_id == driver_role.id))
            
        drivers_data = [
            {"name": "Ramesh Kumar", "license_number": "DL-123456789", "license_category": "Heavy Commercial", "contact_number": "+91 9876543210", "status": "Available", "license_expiry_date": date(2028, 5, 12), "safety_score": round(random.uniform(3.5, 5.0), 1)},
            {"name": "Suresh Singh", "license_number": "MH-987654321", "license_category": "Passenger Commercial", "contact_number": "+91 9988776655", "status": "Available", "license_expiry_date": date(2027, 3, 10), "safety_score": round(random.uniform(3.5, 5.0), 1)},
            {"name": "Abdul Rahman", "license_number": "KA-456789123", "license_category": "Light Commercial", "contact_number": "+91 9123456789", "status": "Available", "license_expiry_date": date(2029, 1, 20), "safety_score": round(random.uniform(3.5, 5.0), 1)},
            {"name": "Prakash Patil", "license_number": "TN-321654987", "license_category": "Heavy Commercial", "contact_number": "+91 9876512345", "status": "Available", "license_expiry_date": date(2026, 12, 1), "safety_score": round(random.uniform(3.5, 5.0), 1)},
            {"name": "Gurpreet Singh", "license_number": "DL-789123456", "license_category": "Passenger Commercial", "contact_number": "+91 9988112233", "status": "Available", "license_expiry_date": date(2030, 4, 15), "safety_score": round(random.uniform(3.5, 5.0), 1)},
            {"name": "Manoj Tiwari", "license_number": "MH-147258369", "license_category": "Heavy Commercial", "contact_number": "+91 9123498765", "status": "On Trip", "license_expiry_date": date(2027, 8, 22), "safety_score": round(random.uniform(3.5, 5.0), 1)},
            {"name": "Rajesh Sharma", "license_number": "GJ-963852741", "license_category": "Passenger Commercial", "contact_number": "+91 9876501234", "status": "Available", "license_expiry_date": date(2026, 11, 30), "safety_score": round(random.uniform(3.5, 5.0), 1)},
            {"name": "Vikram Singh", "license_number": "RJ-852963741", "license_category": "Light Commercial", "contact_number": "+91 9988445566", "status": "Off Duty", "license_expiry_date": date(2028, 6, 18), "safety_score": round(random.uniform(3.5, 5.0), 1)},
            {"name": "Anil Deshmukh", "license_number": "DL-159753486", "license_category": "Heavy Commercial", "contact_number": "+91 9123409876", "status": "Available", "license_expiry_date": date(2027, 2, 25), "safety_score": round(random.uniform(3.5, 5.0), 1)},
            {"name": "Sanjay Jadhav", "license_number": "MH-753159842", "license_category": "Passenger Commercial", "contact_number": "+91 9876554321", "status": "Available", "license_expiry_date": date(2029, 9, 5), "safety_score": round(random.uniform(3.5, 5.0), 1)}
        ]
        
        drivers = []
        for d in drivers_data:
            driver = Driver(**d)
            session.add(driver)
            drivers.append(driver)
            
            if driver_role:
                email = d["name"].lower().replace(" ", ".") + "@transitops.com"
                user = User(
                    email=email,
                    full_name=d["name"],
                    password_hash=get_password_hash("password123"),
                    role_id=driver_role.id,
                    is_active=True
                )
                session.add(user)
            
        await session.commit()
        
        # Reload to get IDs
        for v in vehicles: await session.refresh(v)
        for d in drivers: await session.refresh(d)
            
        # 3. Seed Trips
        # Past 7 days trips to populate the utilization and cost charts
        now = datetime.utcnow()
        trips_data = []
        
        for i in range(1, 8):
            dt = now - timedelta(days=i)
            # Create 2 completed trips per day
            for j in range(2):
                v = random.choice([veh for veh in vehicles if veh.status != "Retired" and veh.id != vehicles[5].id])
                d = random.choice([drv for drv in drivers if drv.status != "On Trip"])
                planned_dist = random.uniform(100, 500)
                trip = Trip(
                    source=f"City A-{i}-{j}",
                    destination=f"City B-{i}-{j}",
                    vehicle_id=v.id,
                    driver_id=d.id,
                    cargo_weight=random.uniform(1.0, v.max_load_capacity),
                    planned_distance=planned_dist,
                    actual_distance=planned_dist * random.uniform(0.9, 1.1),
                    final_odometer=random.uniform(10000, 50000),
                    fuel_consumed=planned_dist / random.uniform(3, 8),
                    status="Completed",
                    created_by=admin.id,
                    dispatched_at=dt,
                    completed_at=dt + timedelta(hours=random.uniform(2, 10)),
                    created_at=dt - timedelta(hours=1)
                )
                session.add(trip)
                trips_data.append(trip)
                
        # Add one Active Trip (On Trip)
        active_trip = Trip(
            source="Pune Central",
            destination="Mumbai Port",
            vehicle_id=vehicles[5].id, # The On Trip vehicle
            driver_id=drivers[5].id,   # The On Trip driver
            cargo_weight=10.0,
            planned_distance=150.0,
            status="Dispatched",
            created_by=admin.id,
            dispatched_at=now - timedelta(hours=2),
            created_at=now - timedelta(hours=3)
        )
        session.add(active_trip)
        
        # Add one Draft Trip
        draft_trip = Trip(
            source="Delhi Hub",
            destination="Jaipur Terminal",
            vehicle_id=vehicles[4].id,
            driver_id=drivers[4].id,
            cargo_weight=2.0,
            planned_distance=280.0,
            status="Draft",
            created_by=admin.id,
            created_at=now
        )
        session.add(draft_trip)
        
        await session.commit()
        
        # 4. Seed Fuel Logs & Maintenance
        for t in trips_data:
            fuel = FuelLog(
                vehicle_id=t.vehicle_id,
                trip_id=t.id,
                liters=t.fuel_consumed,
                cost=t.fuel_consumed * 90.5,
                log_date=t.completed_at
            )
            session.add(fuel)
            
            # Random Toll Expense
            if random.choice([True, False]):
                expense = Expense(
                    vehicle_id=t.vehicle_id,
                    type="Tolls",
                    amount=random.uniform(50, 500),
                    description="Highway Toll",
                    log_date=t.completed_at
                )
                session.add(expense)

        # Maintenance for In Shop vehicle
        maint = MaintenanceLog(
            vehicle_id=vehicles[3].id,
            description="Engine overhaul and oil change",
            cost=15000.0,
            is_active=True,
            opened_at=now - timedelta(days=2)
        )
        session.add(maint)
        
        # Past Maintenance
        past_maint = MaintenanceLog(
            vehicle_id=vehicles[1].id,
            description="Tire replacement",
            cost=12000.0,
            is_active=False,
            opened_at=now - timedelta(days=10),
            closed_at=now - timedelta(days=9)
        )
        session.add(past_maint)
        
        await session.commit()

        print("Data seeded successfully! Enjoy the realistic analytics!")

    await engine.dispose()

if __name__ == '__main__':
    asyncio.run(reset_and_seed())
